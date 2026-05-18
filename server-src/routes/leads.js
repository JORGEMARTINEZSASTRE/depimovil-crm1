const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id           SERIAL PRIMARY KEY,
      nombre       VARCHAR(200) NOT NULL,
      apellido     VARCHAR(200),
      gabinete     VARCHAR(200),
      ciudad       VARCHAR(100),
      departamento VARCHAR(100),
      pais         VARCHAR(100) DEFAULT 'Uruguay',
      telefono     VARCHAR(50),
      email        VARCHAR(200),
      canal        VARCHAR(50)  DEFAULT 'otro',
      estado       VARCHAR(50)  NOT NULL DEFAULT 'nuevo'
                   CHECK (estado IN ('nuevo','contactado','interesado','presupuesto_enviado','seguimiento','ganado','perdido','reactivar_luego')),
      temperatura  VARCHAR(20)  DEFAULT 'frio',
      interes      TEXT,
      tecnologia   VARCHAR(200),
      obs          TEXT,
      prox_accion  TEXT,
      prox_fecha   DATE,
      operadora_id INTEGER REFERENCES operadoras(id) ON DELETE SET NULL,
      convertido_en TIMESTAMP,
      convertido_por VARCHAR(200),
      created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads_notas (
      id           SERIAL PRIMARY KEY,
      lead_id      INTEGER      REFERENCES leads(id) ON DELETE CASCADE,
      tipo         VARCHAR(50)  DEFAULT 'otro',
      texto        TEXT         NOT NULL,
      resultado    TEXT,
      prox_accion  TEXT,
      prox_fecha   DATE,
      usuario_email VARCHAR(200),
      created_at   TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads_estado_historial (
      id            SERIAL PRIMARY KEY,
      lead_id       INTEGER      REFERENCES leads(id) ON DELETE CASCADE,
      estado_previo VARCHAR(50),
      estado_nuevo  VARCHAR(50),
      motivo        TEXT,
      usuario_email VARCHAR(200),
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch(err => console.error('Error creando tablas leads:', err.message));

function canEditLead(user) {
  return ['superadmin', 'administrador', 'operaciones', 'comercial'].includes(user?.rol);
}

// ─────────────────────────────────────────────
// GET /api/leads — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  if (!canEditLead(req.user)) return res.json([]);
  try {
    const { rows } = await pool.query(`
      SELECT * FROM leads
      ORDER BY
        CASE estado
          WHEN 'nuevo' THEN 1 WHEN 'contactado' THEN 2 WHEN 'interesado' THEN 3
          WHEN 'presupuesto_enviado' THEN 4 WHEN 'seguimiento' THEN 5
          WHEN 'ganado' THEN 6 WHEN 'perdido' THEN 7 WHEN 'reactivar_luego' THEN 8
          ELSE 9 END,
        created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/leads error:', err);
    res.status(500).json({ error: 'Error al obtener leads' });
  }
});

// ─────────────────────────────────────────────
// GET /api/leads/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  if (!canEditLead(req.user)) return res.status(403).json({ error: 'Sin permisos para leads' });
  try {
    const { rows } = await pool.query('SELECT * FROM leads WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/leads/:id error:', err);
    res.status(500).json({ error: 'Error al obtener lead' });
  }
});

// ─────────────────────────────────────────────
// POST /api/leads — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos para crear leads' });
  }
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    telefono, email, canal, estado, temperatura, interes, tecnologia, obs,
    prox_accion, prox_fecha
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });

  try {
    const { rows } = await pool.query(`
      INSERT INTO leads (
        nombre, apellido, gabinete, ciudad, departamento, pais,
        telefono, email, canal, estado, temperatura, interes, tecnologia, obs,
        prox_accion, prox_fecha
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      nombre.trim(), apellido || null, gabinete || null, ciudad || null,
      departamento || null, pais || 'Uruguay',
      telefono || null, email || null, canal || 'otro',
      estado || 'nuevo', temperatura || 'frio',
      interes || null, tecnologia || null, obs || null,
      prox_accion || null, prox_fecha || null
    ]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'lead', rows[0].id, nombre]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/leads error:', err);
    res.status(500).json({ error: 'Error al crear lead' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/leads/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos para editar leads' });
  }
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    telefono, email, canal, estado, temperatura, interes, tecnologia, obs,
    prox_accion, prox_fecha, operadora_id, convertido_en, convertido_por
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });

  try {
    const { rows: prev } = await pool.query('SELECT estado FROM leads WHERE id=$1', [req.params.id]);
    if (!prev.length) return res.status(404).json({ error: 'Lead no encontrado' });

    const { rows } = await pool.query(`
      UPDATE leads SET
        nombre=$1, apellido=$2, gabinete=$3, ciudad=$4, departamento=$5, pais=$6,
        telefono=$7, email=$8, canal=$9, estado=$10, temperatura=$11,
        interes=$12, tecnologia=$13, obs=$14,
        prox_accion=$15, prox_fecha=$16,
        operadora_id=$17, convertido_en=$18, convertido_por=$19,
        updated_at=NOW()
      WHERE id=$20
      RETURNING *
    `, [
      nombre.trim(), apellido || null, gabinete || null, ciudad || null,
      departamento || null, pais || 'Uruguay',
      telefono || null, email || null, canal || 'otro',
      estado || prev[0].estado, temperatura || 'frio',
      interes || null, tecnologia || null, obs || null,
      prox_accion || null, prox_fecha || null,
      operadora_id ? parseInt(operadora_id) : null,
      convertido_en || null, convertido_por || null,
      req.params.id
    ]);

    // Historial si cambió estado
    if (estado && estado !== prev[0].estado) {
      await pool.query(`
        INSERT INTO leads_estado_historial (lead_id, estado_previo, estado_nuevo, motivo, usuario_email)
        VALUES ($1,$2,$3,$4,$5)
      `, [req.params.id, prev[0].estado, estado, 'Actualización desde CRM', req.user.email]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/leads/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar lead' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/leads/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM leads WHERE id=$1 RETURNING id, nombre', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead no encontrado' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'lead', req.params.id, rows[0].nombre]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/leads/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar lead' });
  }
});

// ─────────────────────────────────────────────
// GET /api/leads/:id/notas — notas de seguimiento
// ─────────────────────────────────────────────
router.get('/:id/notas', auth, async (req, res) => {
  if (!canEditLead(req.user)) return res.status(403).json({ error: 'Sin permisos para leads' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM leads_notas WHERE lead_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/leads/:id/notas error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /api/leads/:id/notas — agregar nota
// ─────────────────────────────────────────────
router.post('/:id/notas', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  const { tipo, texto, resultado, prox_accion, prox_fecha } = req.body;
  if (!texto) return res.status(400).json({ error: 'texto es requerido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO leads_notas (lead_id, tipo, texto, resultado, prox_accion, prox_fecha, usuario_email)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [req.params.id, tipo || 'otro', texto, resultado || null, prox_accion || null, prox_fecha || null, req.user.email]);

    // Actualizar prox_accion/prox_fecha del lead si se proporcionó
    if (prox_accion || prox_fecha) {
      await client.query(`
        UPDATE leads SET prox_accion=$1, prox_fecha=$2, updated_at=NOW() WHERE id=$3
      `, [prox_accion || null, prox_fecha || null, req.params.id]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/leads/:id/notas error:', err);
    res.status(500).json({ error: 'Error al crear nota' });
  } finally {
    client.release();
  }
});

module.exports = router;
