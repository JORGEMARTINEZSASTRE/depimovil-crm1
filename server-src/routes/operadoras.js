const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function nextCodigo(prefix, table) {
  const { rows } = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

async function ensurePortalToken(client, operadoraId, currentToken) {
  if (currentToken) return currentToken;
  const crypto = require('crypto');
  const token = crypto.randomBytes(24).toString('hex');
  await client.query('UPDATE operadoras SET portal_token = $1 WHERE id = $2', [token, operadoraId]);
  return token;
}

// ─────────────────────────────────────────────
// GET /api/operadoras — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
             whatsapp, telefono, email, fecha_alta, estado, nivel, obs,
             direccion_entrega, tipo_direccion, portal_token
      FROM operadoras
      ORDER BY nombre, apellido
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/operadoras error:', err);
    res.status(500).json({ error: 'Error al obtener operadoras' });
  }
});

// ─────────────────────────────────────────────
// GET /api/operadoras/:id — obtener una
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
             whatsapp, telefono, email, fecha_alta, estado, nivel, obs,
             direccion_entrega, tipo_direccion, portal_token
      FROM operadoras WHERE id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Operadora no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/operadoras/:id error:', err);
    res.status(500).json({ error: 'Error al obtener operadora' });
  }
});

// ─────────────────────────────────────────────
// POST /api/operadoras — crear nueva
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    whatsapp, telefono, email, fecha_alta, estado, nivel, obs,
    direccion_entrega, tipo_direccion
  } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO operadoras (
        nombre, apellido, gabinete, ciudad, departamento, pais,
        whatsapp, telefono, email, fecha_alta, estado, nivel, obs,
        direccion_entrega, tipo_direccion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `, [
      nombre.trim(), apellido.trim(), gabinete || null, ciudad || null, departamento || null,
      pais || 'Uruguay', whatsapp || null, telefono || null, email || null,
      fecha_alta || new Date().toISOString().split('T')[0],
      estado || 'prospecto', nivel || 'Inicial', obs || null,
      direccion_entrega || null, tipo_direccion || 'trabajo'
    ]);
    const op = rows[0];
    // Generar portal_token automáticamente
    const token = await ensurePortalToken(client, op.id, op.portal_token);
    op.portal_token = token;

    await client.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'operadora', op.id, `${nombre} ${apellido}`]
    );
    await client.query('COMMIT');
    res.status(201).json(op);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/operadoras error:', err);
    res.status(500).json({ error: 'Error al crear operadora' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/operadoras/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    whatsapp, telefono, email, fecha_alta, estado, nivel, obs,
    direccion_entrega, tipo_direccion
  } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  }

  try {
    const { rows } = await pool.query(`
      UPDATE operadoras SET
        nombre=$1, apellido=$2, gabinete=$3, ciudad=$4, departamento=$5, pais=$6,
        whatsapp=$7, telefono=$8, email=$9, fecha_alta=$10, estado=$11, nivel=$12,
        obs=$13, direccion_entrega=$14, tipo_direccion=$15, updated_at=NOW()
      WHERE id=$16
      RETURNING *
    `, [
      nombre.trim(), apellido.trim(), gabinete || null, ciudad || null, departamento || null,
      pais || 'Uruguay', whatsapp || null, telefono || null, email || null,
      fecha_alta || null, estado || 'activa', nivel || 'Inicial', obs || null,
      direccion_entrega || null, tipo_direccion || 'trabajo', req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Operadora no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'UPDATE', 'operadora', req.params.id, `${nombre} ${apellido}`]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/operadoras/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar operadora' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/operadoras/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM operadoras WHERE id=$1 RETURNING id, nombre, apellido', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Operadora no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'operadora', req.params.id, `${rows[0].nombre} ${rows[0].apellido}`]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/operadoras/:id error:', err);
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: la operadora tiene registros asociados' });
    }
    res.status(500).json({ error: 'Error al eliminar operadora' });
  }
});

// ─────────────────────────────────────────────
// GET /api/operadoras/:id/habilitaciones
// ─────────────────────────────────────────────
router.get('/:id/habilitaciones', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM habilitaciones WHERE operadora_id = $1 ORDER BY categoria`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET habilitaciones error:', err);
    res.status(500).json({ error: 'Error al obtener habilitaciones' });
  }
});

// ─────────────────────────────────────────────
// POST /api/operadoras/:id/habilitaciones
// ─────────────────────────────────────────────
router.post('/:id/habilitaciones', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const { categoria, equipo_categoria, estado, fecha_habilitacion, fecha_otorgamiento, obs } = req.body;
  const cat = categoria || {
    laser_diodo:'Láser Depilación',
    soprano_ice:'Láser Depilación',
    hifu:'Radiofrecuencia / HIFU',
    radiofrecuencia_hifu:'Radiofrecuencia / HIFU',
    Pressoterapia:'Pressoterapia',
    pressoterapia:'Pressoterapia',
    electroestimulacion:'Electroestimulación',
  }[equipo_categoria] || equipo_categoria;
  if (!cat) return res.status(400).json({ error: 'Categoría es obligatoria' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO habilitaciones (operadora_id, categoria, estado, fecha_habilitacion, obs)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (operadora_id, categoria)
      DO UPDATE SET estado=$3, fecha_habilitacion=$4, obs=$5, updated_at=NOW()
       RETURNING *`,
      [req.params.id, cat, estado || 'activa', fecha_habilitacion || fecha_otorgamiento || null, obs || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST habilitaciones error:', err);
    res.status(500).json({ error: 'Error al crear habilitación' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/operadoras/:id/habilitaciones/:habId
// ─────────────────────────────────────────────
router.delete('/:id/habilitaciones/:habId', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    await pool.query('DELETE FROM habilitaciones WHERE id=$1 AND operadora_id=$2', [req.params.habId, req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE habilitaciones error:', err);
    res.status(500).json({ error: 'Error al eliminar habilitación' });
  }
});

module.exports = router;
