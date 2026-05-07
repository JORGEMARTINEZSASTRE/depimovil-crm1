const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS maquinas (
      id           SERIAL PRIMARY KEY,
      codigo       VARCHAR(50)  NOT NULL UNIQUE,
      nombre       VARCHAR(200) NOT NULL,
      categoria    VARCHAR(100) DEFAULT 'Láser Depilación',
      ubicacion    VARCHAR(200),
      estado       VARCHAR(50)  NOT NULL DEFAULT 'disponible'
                   CHECK (estado IN ('disponible','reservada','mantenimiento','fuera_servicio','en_viaje')),
      serial_num   VARCHAR(100),
      marca        VARCHAR(100),
      modelo       VARCHAR(100),
      dept_base    VARCHAR(100) DEFAULT 'Uruguay',
      ult_mant     DATE,
      prox_mant    DATE,
      obs          TEXT,
      created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);
}

// ─────────────────────────────────────────────
// GET /api/maquinas — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, codigo, nombre, categoria, ubicacion, estado,
             serial_num, marca, modelo, dept_base,
             ult_mant, prox_mant, obs, created_at, updated_at
      FROM maquinas
      ORDER BY codigo
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/maquinas error:', err);
    res.status(500).json({ error: 'Error al obtener máquinas' });
  }
});

// ─────────────────────────────────────────────
// GET /api/maquinas/:id — obtener una
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM maquinas WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/maquinas/:id error:', err);
    res.status(500).json({ error: 'Error al obtener máquina' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas — crear nueva
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    codigo, nombre, categoria, ubicacion, estado,
    serial_num, marca, modelo, dept_base, ult_mant, prox_mant, obs
  } = req.body;

  if (!codigo || !nombre) {
    return res.status(400).json({ error: 'Código y nombre son obligatorios' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO maquinas (codigo, nombre, categoria, ubicacion, estado, serial_num, marca, modelo, dept_base, ult_mant, prox_mant, obs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [
      codigo.trim(), nombre.trim(), categoria || 'Láser Depilación',
      ubicacion || null, estado || 'disponible',
      serial_num || null, marca || null, modelo || null,
      dept_base || 'Uruguay',
      ult_mant || null, prox_mant || null, obs || null
    ]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'maquina', rows[0].id, `${codigo} — ${nombre}`]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/maquinas error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: `Ya existe una máquina con el código ${codigo}` });
    }
    res.status(500).json({ error: 'Error al crear máquina' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/maquinas/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    codigo, nombre, categoria, ubicacion, estado,
    serial_num, marca, modelo, dept_base, ult_mant, prox_mant, obs
  } = req.body;

  if (!codigo || !nombre) {
    return res.status(400).json({ error: 'Código y nombre son obligatorios' });
  }

  try {
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        codigo=$1, nombre=$2, categoria=$3, ubicacion=$4, estado=$5,
        serial_num=$6, marca=$7, modelo=$8, dept_base=$9,
        ult_mant=$10, prox_mant=$11, obs=$12, updated_at=NOW()
      WHERE id=$13
      RETURNING *
    `, [
      codigo.trim(), nombre.trim(), categoria || 'Láser Depilación',
      ubicacion || null, estado || 'disponible',
      serial_num || null, marca || null, modelo || null,
      dept_base || 'Uruguay',
      ult_mant || null, prox_mant || null, obs || null,
      req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'UPDATE', 'maquina', req.params.id, `${codigo} — ${nombre}`]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/maquinas/:id error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: `Ya existe una máquina con ese código` });
    }
    res.status(500).json({ error: 'Error al actualizar máquina' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/maquinas/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM maquinas WHERE id=$1 RETURNING id, codigo, nombre',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'maquina', req.params.id, `${rows[0].codigo} — ${rows[0].nombre}`]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/maquinas/:id error:', err);
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: la máquina tiene reservas asociadas' });
    }
    res.status(500).json({ error: 'Error al eliminar máquina' });
  }
});

module.exports = router;
