const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS mantenimientos (
      id SERIAL PRIMARY KEY,
      maquina_id INTEGER NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('cambio_agua','cambio_filtros')),
      fecha_realizado DATE NOT NULL,
      proximo_vencimiento DATE NOT NULL,
      estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','vencido','próximo')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function refreshEstados() {
  await pool.query(`
    UPDATE mantenimientos
    SET estado = CASE
      WHEN proximo_vencimiento < CURRENT_DATE THEN 'vencido'
      WHEN proximo_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'próximo'
      ELSE 'vigente'
    END,
    updated_at = NOW()
  `);
}

ensureTable(pool).catch(err => console.error('Error preparando tabla mantenimientos:', err.message));

router.get('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    await refreshEstados();
    const { rows } = await pool.query(`
      SELECT mt.id, mt.maquina_id, mt.tipo, mt.fecha_realizado,
             mt.proximo_vencimiento, mt.estado, mt.created_at, mt.updated_at,
             m.codigo AS maquina_codigo, m.nombre AS maquina_nombre
      FROM mantenimientos mt
      JOIN maquinas m ON m.id = mt.maquina_id
      ORDER BY mt.proximo_vencimiento ASC, mt.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/mantenimientos error:', err);
    res.status(500).json({ error: 'Error al obtener mantenimientos' });
  }
});

router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const { maquina_id, tipo, fecha_realizado } = req.body;
  if (!maquina_id || !tipo || !fecha_realizado) {
    return res.status(400).json({ error: 'Máquina, tipo y fecha son obligatorios' });
  }
  if (!['cambio_agua', 'cambio_filtros'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de mantenimiento inválido' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO mantenimientos (maquina_id, tipo, fecha_realizado, proximo_vencimiento, estado)
      VALUES (
        $1, $2, $3,
        ($3::date + INTERVAL '9 months')::date,
        CASE
          WHEN ($3::date + INTERVAL '9 months')::date < CURRENT_DATE THEN 'vencido'
          WHEN ($3::date + INTERVAL '9 months')::date <= CURRENT_DATE + INTERVAL '30 days' THEN 'próximo'
          ELSE 'vigente'
        END
      )
      RETURNING *
    `, [maquina_id, tipo, fecha_realizado]);

    await pool.query(`
      UPDATE maquinas
      SET ult_mant = $1, prox_mant = ($1::date + INTERVAL '9 months')::date, updated_at = NOW()
      WHERE id = $2
    `, [fecha_realizado, maquina_id]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'mantenimiento', rows[0].id, `${tipo} máquina ${maquina_id}`]
    ).catch(() => {});

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/mantenimientos error:', err);
    if (err.code === '23503') return res.status(404).json({ error: 'Máquina no encontrada' });
    res.status(500).json({ error: 'Error al registrar mantenimiento' });
  }
});

module.exports = router;
