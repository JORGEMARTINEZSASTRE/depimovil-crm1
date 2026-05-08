const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');
const { enviarMensaje } = require('../utils/wa_sender');
const { encolar } = require('../utils/wa_queue');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function nextCodigo() {
  // Generado en DB mediante secuencia o conteo
  return null; // se calcula en el INSERT
}

async function generarCodigo(client) {
  const { rows } = await client.query(
    `SELECT COUNT(*) AS cnt FROM reservas`
  );
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `RES-${String(n).padStart(5, '0')}`;
}

const WA_PLANTILLAS = {
  solicitud_recibida: (op, r) =>
    `¡Hola ${op.nombre}! 📥 Recibimos tu solicitud de reserva.\n📌 Equipo: ${r.maquina||'—'}\n📅 Fecha: ${r.fecha}\n🔖 Código: ${r.codigo}\n\nLa revisaremos pronto.`,
  aprobada: (op, r) =>
    `¡Hola ${op.nombre}! ✅ Tu reserva fue aprobada.\n📌 Equipo: ${r.maquina||'—'}\n📅 Fecha: ${r.fecha}\n🔖 Código: ${r.codigo}`,
  confirmada: (op, r) =>
    `¡Hola ${op.nombre}! 🔒 Tu reserva está confirmada.\n📌 Equipo: ${r.maquina||'—'}\n📅 Fecha: ${r.fecha}\n🔖 Código: ${r.codigo}`,
  rechazada: (op, r) =>
    `¡Hola ${op.nombre}! ❌ Tu reserva no pudo ser procesada.\n📌 Equipo: ${r.maquina||'—'}\n🔖 Código: ${r.codigo}\n\nContactanos para más información.`,
  cancelada: (op, r) =>
    `¡Hola ${op.nombre}! 🚫 Tu reserva fue cancelada.\n🔖 Código: ${r.codigo}`,
};

async function notificarWA(reservaId, nuevoEstado, client) {
  try {
    if (!WA_PLANTILLAS[nuevoEstado]) {
      console.log(`📱 notificarWA: sin plantilla para estado "${nuevoEstado}"`);
      return;
    }
    const { rows } = await pool.query(`
      SELECT r.*, o.nombre AS op_nombre, o.apellido AS op_apellido, o.whatsapp AS op_wa,
             m.nombre AS maq_nombre
      FROM reservas r
      LEFT JOIN operadoras o ON o.id = r.operadora_id
      LEFT JOIN maquinas m ON m.id = r.maquina_id
      WHERE r.id = $1
    `, [reservaId]);
    if (!rows.length) {
      console.warn(`📱 notificarWA: reserva ${reservaId} no encontrada`);
      return;
    }
    const row = rows[0];
    if (!row.op_wa) {
      console.warn(`📱 notificarWA: operadora sin WhatsApp (reserva ${reservaId})`);
      return;
    }
    const op = { nombre: row.op_nombre || '' };
    const fecha = row.tipo === 'jornada'
      ? (row.fecha_jornada || '').split('T')[0]
      : (row.fecha_inicio || '').split('T')[0];
    const texto = WA_PLANTILLAS[nuevoEstado](op, {
      maquina: row.maq_nombre,
      fecha,
      codigo: row.codigo,
    });
    console.log(`📱 notificarWA: enviando a ${row.op_wa} — ${nuevoEstado} — ${row.codigo}`);
    const resultado = await enviarMensaje(row.op_wa, texto);
    if (resultado.ok) {
      console.log(`✅ notificarWA: enviado OK a ${row.op_wa}`);
      await pool.query(
        `INSERT INTO audit_log (usuario_email, accion, entidad, entidad_id, detalle)
         VALUES ($1,$2,$3,$4,$5)`,
        ['sistema', 'WA_SEND_AUTO', 'reserva', reservaId, `${nuevoEstado} → ${row.op_wa} — ${row.codigo}`]
      );
    } else {
      console.warn(`⚠️ notificarWA: fallo envío a ${row.op_wa} — ${resultado.error}`);
      await encolar({
        reservaId: reservaId,
        operadoraId: row.operadora_id,
        tipo: `estado_${nuevoEstado}`,
        mensaje: texto,
        telefono: row.op_wa,
      });
    }
  } catch (e) {
    console.error('notificarWA reservas error:', e.message);
  }
}

// ─────────────────────────────────────────────
// GET /api/reservas — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { estado } = req.query;
    let query = `
      SELECT r.*
      FROM reservas r
      ORDER BY COALESCE(r.fecha_jornada, r.fecha_inicio) DESC NULLS LAST
    `;
    const params = [];
    if (estado === 'activa') {
      query = `
        SELECT r.* FROM reservas r
        WHERE r.estado IN ('solicitud_recibida','pendiente_aprobacion','aprobada','confirmada')
        ORDER BY COALESCE(r.fecha_jornada, r.fecha_inicio) DESC NULLS LAST
      `;
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/reservas error:', err);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// ─────────────────────────────────────────────
// GET /api/reservas/:id — obtener una
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM reservas WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/reservas/:id error:', err);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
});

// ─────────────────────────────────────────────
// POST /api/reservas — crear nueva
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  const {
    operadora_id, maquina_id, tipo, estado,
    fecha_jornada, fecha_inicio, fecha_fin,
    dept_logistica, bloque_logistico,
    monto, moneda, notas
  } = req.body;

  if (!operadora_id || !maquina_id) {
    return res.status(400).json({ error: 'operadora_id y maquina_id son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const codigo = await generarCodigo(client);

    const { rows } = await client.query(`
      INSERT INTO reservas (
        codigo, operadora_id, maquina_id, tipo, estado,
        fecha_jornada, fecha_inicio, fecha_fin,
        dept_logistica, bloque_logistico,
        monto, moneda, notas, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
      RETURNING *
    `, [
      codigo,
      parseInt(operadora_id), parseInt(maquina_id),
      tipo || 'jornada', estado || 'solicitud_recibida',
      fecha_jornada || null,
      fecha_inicio || null, fecha_fin || null,
      dept_logistica || null, bloque_logistico || false,
      parseFloat(monto) || 0, moneda || 'UYU', notas || null
    ]);

    const reserva = rows[0];

    await client.query(`
      INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
      VALUES ($1, NULL, $2, 'Creación de reserva', $3, $4)
    `, [reserva.id, reserva.estado, req.user.id, req.user.email]);

    await client.query(`
      INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [req.user.id, req.user.email, 'CREATE', 'reserva', reserva.id, codigo]);

    await client.query('COMMIT');

    // Notificar por WA fuera de la transacción
    notificarWA(reserva.id, reserva.estado, null).catch(() => {});

    res.status(201).json(reserva);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/reservas error:', err);
    res.status(500).json({ error: 'Error al crear reserva' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/reservas/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    operadora_id, maquina_id, tipo, estado,
    fecha_jornada, fecha_inicio, fecha_fin,
    dept_logistica, bloque_logistico,
    monto, moneda, notas
  } = req.body;

  try {
    const { rows: prev } = await pool.query('SELECT estado FROM reservas WHERE id=$1', [req.params.id]);
    if (!prev.length) return res.status(404).json({ error: 'Reserva no encontrada' });
    const estadoPrevio = prev[0].estado;

    const { rows } = await pool.query(`
      UPDATE reservas SET
        operadora_id=$1, maquina_id=$2, tipo=$3, estado=$4,
        fecha_jornada=$5, fecha_inicio=$6, fecha_fin=$7,
        dept_logistica=$8, bloque_logistico=$9,
        monto=$10, moneda=$11, notas=$12, updated_at=NOW()
      WHERE id=$13
      RETURNING *
    `, [
      parseInt(operadora_id), parseInt(maquina_id), tipo || 'jornada', estado || estadoPrevio,
      fecha_jornada || null, fecha_inicio || null, fecha_fin || null,
      dept_logistica || null, bloque_logistico || false,
      parseFloat(monto) || 0, moneda || 'UYU', notas || null,
      req.params.id
    ]);

    if (estado && estado !== estadoPrevio) {
      await pool.query(`
        INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [req.params.id, estadoPrevio, estado, 'Edición de reserva', req.user.id, req.user.email]);
      notificarWA(parseInt(req.params.id), estado, null).catch(() => {});
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/reservas/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/reservas/:id/estado — cambio de estado
// ─────────────────────────────────────────────
router.patch('/:id/estado', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  const { estado, motivo } = req.body;
  if (!estado) return res.status(400).json({ error: 'estado es requerido' });
  if (!motivo) return res.status(400).json({ error: 'motivo es requerido' });

  const ESTADOS_VALIDOS = ['solicitud_recibida', 'pendiente_aprobacion', 'aprobada', 'confirmada', 'rechazada', 'cancelada', 'reprogramada'];
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido: ${estado}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: prev } = await client.query('SELECT * FROM reservas WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!prev.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    const estadoPrevio = prev[0].estado;
    if (estadoPrevio === estado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El estado es igual al actual' });
    }

    const { rows } = await client.query(
      'UPDATE reservas SET estado=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [estado, req.params.id]
    );

    await client.query(`
      INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [req.params.id, estadoPrevio, estado, motivo, req.user.id, req.user.email]);

    await client.query(`
      INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [req.user.id, req.user.email, 'ESTADO', 'reserva', req.params.id, `${estadoPrevio} → ${estado}: ${motivo}`]);

    await client.query('COMMIT');

    notificarWA(parseInt(req.params.id), estado, null).catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /api/reservas/:id/estado error:', err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// DELETE /api/reservas/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM reservas WHERE id=$1 RETURNING id, codigo', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Reserva no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'reserva', req.params.id, rows[0].codigo]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/reservas/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

module.exports = router;
