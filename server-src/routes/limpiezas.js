const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const TAMANOS = ['chica', 'grande'];
const ROLES_REGISTRO = ['superadmin', 'operaciones', 'coordinadora'];
const ROLES_LIQUIDACION = ['superadmin', 'operaciones'];

// transportista_id, envio_id y pago_id son enteros sin FK: esas tablas se crean en su propio
// arranque y no queremos depender del orden. La existencia se valida en cada handler.
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS limpiezas (
      id               SERIAL PRIMARY KEY,
      maquina_id       INTEGER NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
      transportista_id INTEGER,
      tamano           VARCHAR(10) NOT NULL CHECK (tamano IN ('chica','grande')),
      fecha            DATE NOT NULL,
      envio_id         INTEGER,
      obs              TEXT,
      estado           VARCHAR(20) NOT NULL DEFAULT 'registrada' CHECK (estado IN ('registrada','liquidada')),
      pago_id          INTEGER,
      created_by       INTEGER,
      created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_limpiezas_fecha ON limpiezas (fecha DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_limpiezas_transportista ON limpiezas (transportista_id, estado, fecha)');
}

ensureTable().catch(err => console.error('Error preparando tabla limpiezas:', err.message));

async function audit(accion, id, detalle, user) {
  try {
    await pool.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id) VALUES ($1,$2,$3,$4,$5)',
      [accion, 'limpieza', id, detalle, user.id]
    );
  } catch (err) {
    console.warn('[limpiezas] no se pudo registrar auditoría:', err.message);
  }
}

const SELECT_LIMPIEZA = `
  SELECT l.id, l.maquina_id, l.transportista_id, l.tamano, to_char(l.fecha, 'YYYY-MM-DD') AS fecha,
         l.envio_id, l.obs, l.estado, l.created_at,
         m.codigo AS maquina_codigo, m.nombre AS maquina_nombre,
         t.nombre AS transportista_nombre
  FROM limpiezas l
  JOIN maquinas m ON m.id = l.maquina_id
  LEFT JOIN transportistas t ON t.id = l.transportista_id
`;

function parseFecha(value) {
  const s = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

async function validarReferencias({ maquina_id, transportista_id }) {
  const { rows: maq } = await pool.query('SELECT id FROM maquinas WHERE id=$1', [maquina_id]);
  if (!maq.length) return 'Máquina no encontrada';
  if (transportista_id) {
    const { rows: tr } = await pool.query('SELECT id FROM transportistas WHERE id=$1', [transportista_id]);
    if (!tr.length) return 'Transportista no encontrado';
  }
  return null;
}

// ─────────────────────────────────────────────
// GET /api/limpiezas — listado con filtros (desde, hasta, maquina_id, transportista_id, estado)
// ─────────────────────────────────────────────
router.get('/', auth, requireRole(...ROLES_REGISTRO), async (req, res) => {
  try {
    const where = [];
    const params = [];
    const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };
    const desde = parseFecha(req.query.desde);
    const hasta = parseFecha(req.query.hasta);
    if (desde) add('l.fecha >= ?', desde);
    if (hasta) add('l.fecha <= ?', hasta);
    if (parseInt(req.query.maquina_id, 10)) add('l.maquina_id = ?', parseInt(req.query.maquina_id, 10));
    if (parseInt(req.query.transportista_id, 10)) add('l.transportista_id = ?', parseInt(req.query.transportista_id, 10));
    if (['registrada', 'liquidada'].includes(req.query.estado)) add('l.estado = ?', req.query.estado);
    const { rows } = await pool.query(
      `${SELECT_LIMPIEZA} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY l.fecha DESC, l.id DESC LIMIT 1000`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/limpiezas error:', err);
    res.status(500).json({ error: 'Error al obtener limpiezas' });
  }
});

// ─────────────────────────────────────────────
// POST /api/limpiezas — registrar una limpieza
// ─────────────────────────────────────────────
router.post('/', auth, requireRole(...ROLES_REGISTRO), async (req, res) => {
  const maquinaId = parseInt(req.body.maquina_id, 10);
  const transportistaId = parseInt(req.body.transportista_id, 10) || null;
  const envioId = parseInt(req.body.envio_id, 10) || null;
  const tamano = String(req.body.tamano || '');
  const fecha = parseFecha(req.body.fecha) || new Date().toISOString().slice(0, 10);
  const obs = String(req.body.obs || '').trim().slice(0, 1000) || null;
  if (!maquinaId) return res.status(400).json({ error: 'La máquina es obligatoria' });
  if (!TAMANOS.includes(tamano)) return res.status(400).json({ error: 'El tamaño debe ser chica o grande' });
  try {
    const error = await validarReferencias({ maquina_id: maquinaId, transportista_id: transportistaId });
    if (error) return res.status(400).json({ error });
    const { rows } = await pool.query(`
      INSERT INTO limpiezas (maquina_id, transportista_id, tamano, fecha, envio_id, obs, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
    `, [maquinaId, transportistaId, tamano, fecha, envioId, obs, req.user.id]);
    await audit('CREATE', rows[0].id, `Limpieza ${tamano} de máquina ${maquinaId} (${fecha})`, req.user);
    const { rows: full } = await pool.query(`${SELECT_LIMPIEZA} WHERE l.id = $1`, [rows[0].id]);
    res.status(201).json(full[0]);
  } catch (err) {
    console.error('POST /api/limpiezas error:', err);
    res.status(500).json({ error: 'Error al registrar la limpieza' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/limpiezas/:id — editar (solo si todavía no fue liquidada)
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole(...ROLES_REGISTRO), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const maquinaId = parseInt(req.body.maquina_id, 10);
  const transportistaId = parseInt(req.body.transportista_id, 10) || null;
  const envioId = parseInt(req.body.envio_id, 10) || null;
  const tamano = String(req.body.tamano || '');
  const fecha = parseFecha(req.body.fecha);
  const obs = String(req.body.obs || '').trim().slice(0, 1000) || null;
  if (!maquinaId || !fecha) return res.status(400).json({ error: 'Máquina y fecha son obligatorias' });
  if (!TAMANOS.includes(tamano)) return res.status(400).json({ error: 'El tamaño debe ser chica o grande' });
  try {
    const { rows: current } = await pool.query('SELECT estado FROM limpiezas WHERE id=$1', [id]);
    if (!current.length) return res.status(404).json({ error: 'Limpieza no encontrada' });
    if (current[0].estado === 'liquidada') return res.status(409).json({ error: 'La limpieza ya fue liquidada y no se puede modificar' });
    const error = await validarReferencias({ maquina_id: maquinaId, transportista_id: transportistaId });
    if (error) return res.status(400).json({ error });
    await pool.query(`
      UPDATE limpiezas SET maquina_id=$1, transportista_id=$2, tamano=$3, fecha=$4, envio_id=$5, obs=$6, updated_at=NOW()
      WHERE id=$7
    `, [maquinaId, transportistaId, tamano, fecha, envioId, obs, id]);
    await audit('UPDATE', id, `Limpieza ${tamano} de máquina ${maquinaId} (${fecha})`, req.user);
    const { rows: full } = await pool.query(`${SELECT_LIMPIEZA} WHERE l.id = $1`, [id]);
    res.json(full[0]);
  } catch (err) {
    console.error('PUT /api/limpiezas/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar la limpieza' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/limpiezas/:id — borrar (solo si todavía no fue liquidada)
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole(...ROLES_REGISTRO), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rows } = await pool.query('SELECT estado FROM limpiezas WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Limpieza no encontrada' });
    if (rows[0].estado === 'liquidada') return res.status(409).json({ error: 'La limpieza ya fue liquidada y no se puede borrar' });
    await pool.query('DELETE FROM limpiezas WHERE id=$1', [id]);
    await audit('DELETE', id, 'Limpieza eliminada', req.user);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/limpiezas/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar la limpieza' });
  }
});

// ─────────────────────────────────────────────
// Liquidación (solo administración: incluye tarifas y montos)
// ─────────────────────────────────────────────
async function calcularLiquidacion(db, transportistaId, desde, hasta) {
  const { rows: tr } = await db.query(
    'SELECT id, nombre, tarifa_limpieza_chica, tarifa_limpieza_grande FROM transportistas WHERE id=$1',
    [transportistaId]
  );
  if (!tr.length) return { error: 'Transportista no encontrado' };
  const { rows } = await db.query(`
    SELECT tamano, COUNT(*)::int AS cantidad FROM limpiezas
    WHERE transportista_id=$1 AND estado='registrada' AND fecha >= $2 AND fecha <= $3
    GROUP BY tamano
  `, [transportistaId, desde, hasta]);
  const cant = { chica: 0, grande: 0 };
  rows.forEach(r => { cant[r.tamano] = r.cantidad; });
  const tarifaChica = parseFloat(tr[0].tarifa_limpieza_chica) || 0;
  const tarifaGrande = parseFloat(tr[0].tarifa_limpieza_grande) || 0;
  return {
    transportista_id: tr[0].id,
    transportista_nombre: tr[0].nombre,
    desde, hasta,
    chicas: cant.chica, grandes: cant.grande,
    tarifa_chica: tarifaChica, tarifa_grande: tarifaGrande,
    total_limpiezas: cant.chica + cant.grande,
    monto_limpiezas: cant.chica * tarifaChica + cant.grande * tarifaGrande,
  };
}

// GET /api/limpiezas/resumen?transportista_id&desde&hasta
router.get('/resumen', auth, requireRole(...ROLES_LIQUIDACION), async (req, res) => {
  const transportistaId = parseInt(req.query.transportista_id, 10);
  const desde = parseFecha(req.query.desde);
  const hasta = parseFecha(req.query.hasta);
  if (!transportistaId || !desde || !hasta) return res.status(400).json({ error: 'Transportista, desde y hasta son obligatorios' });
  try {
    const resumen = await calcularLiquidacion(pool, transportistaId, desde, hasta);
    if (resumen.error) return res.status(404).json({ error: resumen.error });
    res.json(resumen);
  } catch (err) {
    console.error('GET /api/limpiezas/resumen error:', err);
    res.status(500).json({ error: 'Error al calcular el resumen' });
  }
});

// POST /api/limpiezas/liquidar — crea la liquidación en transportistas_pagos y marca las limpiezas
router.post('/liquidar', auth, requireRole(...ROLES_LIQUIDACION), async (req, res) => {
  const transportistaId = parseInt(req.body.transportista_id, 10);
  const desde = parseFecha(req.body.desde);
  const hasta = parseFecha(req.body.hasta);
  if (!transportistaId || !desde || !hasta) return res.status(400).json({ error: 'Transportista, desde y hasta son obligatorios' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT id FROM limpiezas WHERE transportista_id=$1 AND estado='registrada' AND fecha >= $2 AND fecha <= $3 FOR UPDATE`,
      [transportistaId, desde, hasta]
    );
    const resumen = await calcularLiquidacion(client, transportistaId, desde, hasta);
    if (resumen.error) { await client.query('ROLLBACK'); return res.status(404).json({ error: resumen.error }); }
    if (!resumen.total_limpiezas) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No hay limpiezas registradas para liquidar en ese período' }); }
    const { rows: pago } = await client.query(`
      INSERT INTO transportistas_pagos
        (transportista_id, periodo_desde, periodo_hasta, total_envios, total_limpiezas,
         monto_envios, monto_limpiezas, monto_total, estado, notas)
      VALUES ($1,$2,$3,0,$4,0,$5,$5,'pendiente',$6) RETURNING *
    `, [transportistaId, desde, hasta, resumen.total_limpiezas, resumen.monto_limpiezas,
        `Liquidación de ${resumen.total_limpiezas} limpieza(s) registradas (${resumen.chicas} chica, ${resumen.grandes} grande)`]);
    await client.query(
      `UPDATE limpiezas SET estado='liquidada', pago_id=$1, updated_at=NOW()
       WHERE transportista_id=$2 AND estado='registrada' AND fecha >= $3 AND fecha <= $4`,
      [pago[0].id, transportistaId, desde, hasta]
    );
    await client.query('COMMIT');
    await audit('ESTADO', pago[0].id, `Liquidación de limpiezas transportista ${transportistaId} (${desde} a ${hasta})`, req.user);
    res.status(201).json({ pago: pago[0], resumen });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('POST /api/limpiezas/liquidar error:', err);
    res.status(500).json({ error: 'Error al liquidar las limpiezas' });
  } finally {
    client.release();
  }
});

module.exports = router;
