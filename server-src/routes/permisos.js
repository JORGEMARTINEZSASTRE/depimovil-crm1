const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS — tabla habilitaciones (permisos/categorías habilitadas por operadora)
// ─────────────────────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS habilitaciones (
      id                   SERIAL PRIMARY KEY,
      operadora_id         INTEGER NOT NULL REFERENCES operadoras(id) ON DELETE CASCADE,
      categoria            VARCHAR(100) NOT NULL,
      estado               VARCHAR(20) NOT NULL DEFAULT 'activa'
                           CHECK (estado IN ('activa','suspendida','vencida')),
      fecha_habilitacion   DATE,
      fecha_vencimiento    DATE,
      obs                  TEXT,
      created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (operadora_id, categoria)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reglas_logisticas (
      id              SERIAL PRIMARY KEY,
      departamento    VARCHAR(100) NOT NULL UNIQUE,
      activa          BOOLEAN NOT NULL DEFAULT true,
      mismo_dia       BOOLEAN NOT NULL DEFAULT false,
      dias_antes      INTEGER NOT NULL DEFAULT 2,
      dias_despues    INTEGER NOT NULL DEFAULT 2,
      obs             TEXT,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch(err => console.error('Error creando tablas permisos/habilitaciones:', err.message));

// ─────────────────────────────────────────────
// GET /api/permisos/habilitaciones — todas las habilitaciones
// ─────────────────────────────────────────────
router.get('/habilitaciones', auth, async (req, res) => {
  try {
    const { operadora_id } = req.query;
    let query = 'SELECT * FROM habilitaciones ORDER BY operadora_id, categoria';
    const params = [];
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      query = 'SELECT * FROM habilitaciones WHERE operadora_id=$1 ORDER BY categoria';
      params.push(parseInt(req.user.operadora_id));
    } else if (req.user.rol === 'transportista') {
      return res.json([]);
    } else
    if (operadora_id) {
      query = 'SELECT * FROM habilitaciones WHERE operadora_id=$1 ORDER BY categoria';
      params.push(parseInt(operadora_id));
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/permisos/habilitaciones error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /api/permisos/habilitaciones — crear/actualizar habilitación
// ─────────────────────────────────────────────
router.post('/habilitaciones', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const { operadora_id, categoria, estado, fecha_habilitacion, fecha_vencimiento, obs } = req.body;
  if (!operadora_id || !categoria) {
    return res.status(400).json({ error: 'operadora_id y categoria son obligatorios' });
  }
  try {
    const { rows } = await pool.query(`
      INSERT INTO habilitaciones (operadora_id, categoria, estado, fecha_habilitacion, fecha_vencimiento, obs)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (operadora_id, categoria)
      DO UPDATE SET estado=$3, fecha_habilitacion=$4, fecha_vencimiento=$5, obs=$6, updated_at=NOW()
      RETURNING *
    `, [
      parseInt(operadora_id), categoria,
      estado || 'activa',
      fecha_habilitacion || null, fecha_vencimiento || null,
      obs || null
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/permisos/habilitaciones error:', err);
    res.status(500).json({ error: 'Error al crear habilitación' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/permisos/habilitaciones/:id — eliminar habilitación
// ─────────────────────────────────────────────
router.delete('/habilitaciones/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    await pool.query('DELETE FROM habilitaciones WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/permisos/habilitaciones/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar habilitación' });
  }
});

// ─────────────────────────────────────────────
// GET /api/permisos/reglas-logisticas — obtener reglas
// ─────────────────────────────────────────────
router.get('/reglas-logisticas', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reglas_logisticas ORDER BY departamento');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/permisos/reglas-logisticas error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /api/permisos/reglas-logisticas — crear/actualizar regla
// ─────────────────────────────────────────────
router.post('/reglas-logisticas', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const { departamento, activa, mismo_dia, dias_antes, dias_despues, obs } = req.body;
  if (!departamento) return res.status(400).json({ error: 'departamento es obligatorio' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO reglas_logisticas (departamento, activa, mismo_dia, dias_antes, dias_despues, obs)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (departamento)
      DO UPDATE SET activa=$2, mismo_dia=$3, dias_antes=$4, dias_despues=$5, obs=$6, updated_at=NOW()
      RETURNING *
    `, [
      departamento, activa !== false, mismo_dia || false,
      parseInt(dias_antes) || 2, parseInt(dias_despues) || 2,
      obs || null
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/permisos/reglas-logisticas error:', err);
    res.status(500).json({ error: 'Error al guardar regla logística' });
  }
});

// ─────────────────────────────────────────────
// GET /api/permisos/roles — listar roles disponibles (para la UI)
// ─────────────────────────────────────────────
router.get('/roles', auth, requireRole('superadmin'), async (req, res) => {
  res.json([
    { id: 'superadmin',             label: 'Administrador',              descripcion: 'Acceso total. Jorge y Julieta.' },
    { id: 'operaciones',            label: 'Administración / Ops',       descripcion: 'Gestión operativa sin borrar usuarios críticos' },
    { id: 'comercial',              label: 'Comercial',                  descripcion: 'Leads, reservas, pagos y WhatsApp comercial' },
    { id: 'operadora_habilitada',   label: 'Operadora habilitada',       descripcion: 'Puede ver sus reservas, pagos, envíos, equipos y formación' },
    { id: 'operadora_limitada',     label: 'Operadora en capacitación',  descripcion: 'Solo inicio y formación hasta completar habilitación' },
    { id: 'operadora',              label: 'Operadora automática',       descripcion: 'Se clasifica como habilitada o en capacitación según sus habilitaciones activas' },
    { id: 'transportista',          label: 'Transportista',              descripcion: 'Solo logística/envíos propios' },
  ]);
});

// ─────────────────────────────────────────────
// GET /api/permisos/usuarios — listar usuarios (admin)
// ─────────────────────────────────────────────
router.get('/usuarios', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, email, rol, status, operadora_id, transportista_id,
             registro_origen, created_at, ultimo_login
      FROM usuarios
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/permisos/usuarios error:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
