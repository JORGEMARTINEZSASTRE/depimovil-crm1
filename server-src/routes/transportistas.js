const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transportistas (
      id                   SERIAL PRIMARY KEY,
      tipo                 VARCHAR(50)  NOT NULL DEFAULT 'empresa'
                           CHECK (tipo IN ('empresa','persona_fisica')),
      nombre               VARCHAR(200) NOT NULL,
      telefono             VARCHAR(50),
      whatsapp             VARCHAR(50),
      direccion            TEXT,
      ciclo_pago           VARCHAR(20)  DEFAULT 'mensual',
      departamentos        TEXT[]       DEFAULT '{}',
      tarifa_envio_chica   NUMERIC(10,2) DEFAULT 0,
      tarifa_envio_grande  NUMERIC(10,2) DEFAULT 0,
      tarifa_limpieza_chica  NUMERIC(10,2) DEFAULT 0,
      tarifa_limpieza_grande NUMERIC(10,2) DEFAULT 0,
      sin_rastreo_siempre  BOOLEAN DEFAULT false,
      estado               VARCHAR(20)  DEFAULT 'activo',
      notas                TEXT,
      created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transportistas_incidentes (
      id                SERIAL PRIMARY KEY,
      transportista_id  INTEGER REFERENCES transportistas(id) ON DELETE CASCADE,
      fecha             DATE NOT NULL,
      descripcion       TEXT NOT NULL,
      resuelto          BOOLEAN DEFAULT false,
      created_at        TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transportistas_pagos (
      id                SERIAL PRIMARY KEY,
      transportista_id  INTEGER REFERENCES transportistas(id) ON DELETE CASCADE,
      periodo_desde     DATE,
      periodo_hasta     DATE,
      total_envios      INTEGER DEFAULT 0,
      total_limpiezas   INTEGER DEFAULT 0,
      monto_envios      NUMERIC(10,2) DEFAULT 0,
      monto_limpiezas   NUMERIC(10,2) DEFAULT 0,
      monto_total       NUMERIC(10,2) DEFAULT 0,
      estado            VARCHAR(20) DEFAULT 'pendiente',
      fecha_pago        DATE,
      notas             TEXT,
      created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTables().catch(err => console.error('Error creando tablas transportistas:', err.message));

// ─────────────────────────────────────────────
// GET /api/transportistas — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const params = ['eliminado'];
    let query = 'SELECT * FROM transportistas WHERE estado != $1';
    if (req.user.rol === 'transportista') {
      if (!req.user.transportista_id) return res.json([]);
      params.push(req.user.transportista_id);
      query += ` AND id = $${params.length}`;
    }
    query += ' ORDER BY nombre';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/transportistas error:', err);
    res.status(500).json({ error: 'Error al obtener transportistas' });
  }
});

// ─────────────────────────────────────────────
// GET /api/transportistas/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && parseInt(req.params.id) !== parseInt(req.user.transportista_id)) {
      return res.status(403).json({ error: 'Sin permisos para este transportista' });
    }
    const { rows } = await pool.query('SELECT * FROM transportistas WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Transportista no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/transportistas/:id error:', err);
    res.status(500).json({ error: 'Error al obtener transportista' });
  }
});

// ─────────────────────────────────────────────
// POST /api/transportistas — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    tipo, nombre, telefono, whatsapp, direccion, ciclo_pago, departamentos,
    tarifa_envio_chica, tarifa_envio_grande,
    tarifa_limpieza_chica, tarifa_limpieza_grande,
    sin_rastreo_siempre, notas
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });

  try {
    const { rows } = await pool.query(`
      INSERT INTO transportistas (
        tipo, nombre, telefono, whatsapp, direccion, ciclo_pago, departamentos,
        tarifa_envio_chica, tarifa_envio_grande,
        tarifa_limpieza_chica, tarifa_limpieza_grande,
        sin_rastreo_siempre, notas
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      tipo || 'empresa', nombre.trim(),
      telefono || null, whatsapp || null, direccion || null,
      ciclo_pago || 'mensual',
      departamentos || [],
      parseFloat(tarifa_envio_chica) || 0,
      parseFloat(tarifa_envio_grande) || 0,
      parseFloat(tarifa_limpieza_chica) || 0,
      parseFloat(tarifa_limpieza_grande) || 0,
      sin_rastreo_siempre || false,
      notas || null
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/transportistas error:', err);
    res.status(500).json({ error: 'Error al crear transportista' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/transportistas/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    tipo, nombre, telefono, whatsapp, direccion, ciclo_pago, departamentos,
    tarifa_envio_chica, tarifa_envio_grande,
    tarifa_limpieza_chica, tarifa_limpieza_grande,
    sin_rastreo_siempre, notas
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });

  try {
    const { rows } = await pool.query(`
      UPDATE transportistas SET
        tipo=$1, nombre=$2, telefono=$3, whatsapp=$4, direccion=$5, ciclo_pago=$6,
        departamentos=$7, tarifa_envio_chica=$8, tarifa_envio_grande=$9,
        tarifa_limpieza_chica=$10, tarifa_limpieza_grande=$11,
        sin_rastreo_siempre=$12, notas=$13, updated_at=NOW()
      WHERE id=$14
      RETURNING *
    `, [
      tipo || 'empresa', nombre.trim(),
      telefono || null, whatsapp || null, direccion || null,
      ciclo_pago || 'mensual',
      departamentos || [],
      parseFloat(tarifa_envio_chica) || 0,
      parseFloat(tarifa_envio_grande) || 0,
      parseFloat(tarifa_limpieza_chica) || 0,
      parseFloat(tarifa_limpieza_grande) || 0,
      sin_rastreo_siempre || false,
      notas || null,
      req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Transportista no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/transportistas/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar transportista' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/transportistas/:id — eliminar (soft delete)
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE transportistas SET estado=$1, updated_at=NOW() WHERE id=$2 RETURNING id',
      ['eliminado', req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Transportista no encontrado' });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/transportistas/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar transportista' });
  }
});

// ─────────────────────────────────────────────
// GET /api/transportistas/:id/envios — envíos del transportista
// ─────────────────────────────────────────────
router.get('/:id/envios', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && parseInt(req.params.id) !== parseInt(req.user.transportista_id)) {
      return res.status(403).json({ error: 'Sin permisos para este transportista' });
    }
    const { rows } = await pool.query(`
      SELECT e.*,
             m.nombre AS maquina_nombre, m.categoria AS tipo_maquina,
             o.nombre AS operadora_nombre,
             CASE WHEN e.fecha_envio_real IS NOT NULL AND e.fecha_salida IS NOT NULL
               THEN DATE_PART('day', e.fecha_envio_real::timestamp - e.fecha_salida::timestamp)::integer
               ELSE NULL END AS tiempo_entrega_dias
      FROM envios e
      LEFT JOIN maquinas m ON m.id = e.maquina_id
      LEFT JOIN operadoras o ON o.id = e.operadora_id
      WHERE e.transportista_id = $1
      ORDER BY e.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/transportistas/:id/envios error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// GET /api/transportistas/:id/incidentes — incidentes
// ─────────────────────────────────────────────
router.get('/:id/incidentes', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && parseInt(req.params.id) !== parseInt(req.user.transportista_id)) {
      return res.status(403).json({ error: 'Sin permisos para este transportista' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM transportistas_incidentes WHERE transportista_id=$1 ORDER BY fecha DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/transportistas/:id/incidentes error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /api/transportistas/:id/incidentes — registrar incidente
// ─────────────────────────────────────────────
router.post('/:id/incidentes', auth, requireRole('superadmin', 'operaciones', 'transportista'), async (req, res) => {
  if (req.user.rol === 'transportista' && parseInt(req.params.id) !== parseInt(req.user.transportista_id)) {
    return res.status(403).json({ error: 'Sin permisos para este transportista' });
  }
  const { fecha, descripcion } = req.body;
  if (!descripcion) return res.status(400).json({ error: 'descripcion es requerida' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO transportistas_incidentes (transportista_id, fecha, descripcion)
      VALUES ($1,$2,$3) RETURNING *
    `, [req.params.id, fecha || new Date().toISOString().split('T')[0], descripcion]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/transportistas/:id/incidentes error:', err);
    res.status(500).json({ error: 'Error al registrar incidente' });
  }
});

// ─────────────────────────────────────────────
// GET /api/transportistas/:id/pagos — honorarios
// ─────────────────────────────────────────────
router.get('/:id/pagos', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && parseInt(req.params.id) !== parseInt(req.user.transportista_id)) {
      return res.status(403).json({ error: 'Sin permisos para este transportista' });
    }
    const { rows } = await pool.query(
      'SELECT * FROM transportistas_pagos WHERE transportista_id=$1 ORDER BY periodo_desde DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/transportistas/:id/pagos error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /api/transportistas/:id/pagos — crear liquidación
// ─────────────────────────────────────────────
router.post('/:id/pagos', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    periodo_desde, periodo_hasta, total_envios, total_limpiezas,
    monto_envios, monto_limpiezas, notas
  } = req.body;
  try {
    const montoEnvios = parseFloat(monto_envios) || 0;
    const montoLimp = parseFloat(monto_limpiezas) || 0;
    const { rows } = await pool.query(`
      INSERT INTO transportistas_pagos (
        transportista_id, periodo_desde, periodo_hasta,
        total_envios, total_limpiezas, monto_envios, monto_limpiezas, monto_total, notas
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      req.params.id,
      periodo_desde || null, periodo_hasta || null,
      parseInt(total_envios) || 0, parseInt(total_limpiezas) || 0,
      montoEnvios, montoLimp, montoEnvios + montoLimp,
      notas || null
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/transportistas/:id/pagos error:', err);
    res.status(500).json({ error: 'Error al crear liquidación' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/transportistas/pagos/:pagoId — actualizar estado de pago
// ─────────────────────────────────────────────
router.put('/pagos/:pagoId', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const { estado, fecha_pago } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE transportistas_pagos SET estado=$1, fecha_pago=$2, updated_at=NOW()
      WHERE id=$3 RETURNING *
    `, [estado || 'pagado', fecha_pago || new Date().toISOString().split('T')[0], req.params.pagoId]);
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/transportistas/pagos/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar pago' });
  }
});

module.exports = router;
