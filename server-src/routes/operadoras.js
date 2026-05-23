const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole } = require('../middleware/auth');

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

function normalizeDateForDb(value) {
  if (!value || value === '—') return null;
  const str = String(value).trim();
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const local = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (local) return `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}`;
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function normalizeDirecciones(value, direccionEntrega, tipoDireccion) {
  const direcciones = normalizeJsonArray(value).map((d, idx) => ({
    direccion: String(d.direccion || '').trim(),
    localidad: String(d.localidad || d.ciudad || '').trim(),
    departamento: String(d.departamento || '').trim(),
    pais: String(d.pais || '').trim(),
    referencia: String(d.referencia || d.obs || '').trim(),
    tipo: String(d.tipo || tipoDireccion || 'trabajo').trim(),
    principal: !!d.principal || idx === 0
  })).filter(d => d.direccion);
  if (!direcciones.length && direccionEntrega) {
    direcciones.push({
      direccion: String(direccionEntrega).trim(),
      localidad: '',
      departamento: '',
      pais: '',
      referencia: '',
      tipo: tipoDireccion || 'trabajo',
      principal: true
    });
  }
  return direcciones;
}

function normalizeEquipos(value) {
  return normalizeJsonArray(value).map(e => ({
    equipo: String(e.equipo || e.maquina || '').trim(),
    valor: Number(e.valor || e.monto || 0) || 0,
    jornadas: Number.parseInt(e.jornadas || e.cantidad_jornadas || 0, 10) || 0,
    obs: String(e.obs || e.notas || '').trim()
  })).filter(e => e.equipo);
}

// ─────────────────────────────────────────────
// GET /api/operadoras — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      const { rows } = await pool.query(
        `SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
                whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, obs,
                direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila, portal_token
         FROM operadoras
         WHERE id = $1`,
        [req.user.operadora_id]
      );
      return res.json(rows);
    }
    if (req.user.rol === 'transportista') return res.json([]);
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
             whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, obs,
             direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila, portal_token
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
    if (isOperadoraRole(req.user.rol) && parseInt(req.params.id) !== parseInt(req.user.operadora_id)) {
      return res.status(403).json({ error: 'Sin permisos para esta operadora' });
    }
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
             whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, obs,
             direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila, portal_token
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
    whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, obs,
    direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila
  } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  }

  const direcciones = normalizeDirecciones(direcciones_entrega, direccion_entrega, tipo_direccion);
  const direccionPrincipal = direcciones.find(d => d.principal) || direcciones[0] || null;
  const equipos = normalizeEquipos(equipos_alquila);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO operadoras (
        nombre, apellido, gabinete, ciudad, departamento, pais,
        whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, obs,
        direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *
    `, [
      nombre.trim(), apellido.trim(), gabinete || null, ciudad || null, departamento || null,
      pais || 'Uruguay', whatsapp || null, null, instagram_usuario || null, email || null,
      normalizeDateForDb(fecha_alta) || new Date().toISOString().split('T')[0],
      estado || 'prospecto', nivel || 'Inicial', obs || null,
      direccionPrincipal?.direccion || null, direccionPrincipal?.tipo || tipo_direccion || 'trabajo',
      JSON.stringify(direcciones), JSON.stringify(equipos)
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
    whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, obs,
    direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila
  } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  }

  const direcciones = normalizeDirecciones(direcciones_entrega, direccion_entrega, tipo_direccion);
  const direccionPrincipal = direcciones.find(d => d.principal) || direcciones[0] || null;
  const equipos = normalizeEquipos(equipos_alquila);

  try {
    const { rows } = await pool.query(`
      UPDATE operadoras SET
        nombre=$1, apellido=$2, gabinete=$3, ciudad=$4, departamento=$5, pais=$6,
        whatsapp=$7, telefono=$8, instagram_usuario=$9, email=$10, fecha_alta=$11, estado=$12, nivel=$13,
        obs=$14, direccion_entrega=$15, tipo_direccion=$16, direcciones_entrega=$17, equipos_alquila=$18, updated_at=NOW()
      WHERE id=$19
      RETURNING *
    `, [
      nombre.trim(), apellido.trim(), gabinete || null, ciudad || null, departamento || null,
      pais || 'Uruguay', whatsapp || null, null, instagram_usuario || null, email || null,
      normalizeDateForDb(fecha_alta), estado || 'activa', nivel || 'Inicial', obs || null,
      direccionPrincipal?.direccion || null, direccionPrincipal?.tipo || tipo_direccion || 'trabajo',
      JSON.stringify(direcciones), JSON.stringify(equipos), req.params.id
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
  res.status(405).json({ error: 'La eliminación de operadoras está deshabilitada. Usá estado Inactiva o Suspendida.' });
});

// ─────────────────────────────────────────────
// GET /api/operadoras/:id/habilitaciones
// ─────────────────────────────────────────────
router.get('/:id/habilitaciones', auth, async (req, res) => {
  try {
    if (isOperadoraRole(req.user.rol) && parseInt(req.params.id) !== parseInt(req.user.operadora_id)) {
      return res.status(403).json({ error: 'Sin permisos para esta operadora' });
    }
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
