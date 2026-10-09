const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole, isOpsRole, isOpsOrCoordinadora } = require('../middleware/auth');

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
    } else if (!isOpsOrCoordinadora(req.user.rol)) {
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
    if (!isOpsOrCoordinadora(req.user.rol)) return res.json([]);
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
router.post('/reglas-logisticas', auth, requireRole('superadmin', 'operaciones', 'coordinadora'), async (req, res) => {
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
    { id: 'coordinadora',           label: 'Coordinadora',               descripcion: 'Reservas, fechas, máquinas, envíos y transportistas. Sin finanzas, contratos, reportes ni configuración.' },
    { id: 'comercial',              label: 'Comercial',                  descripcion: 'Leads, embudo y WhatsApp comercial' },
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
      SELECT id, nombre, email, whatsapp, rol, status, operadora_id, transportista_id,
             registro_origen, created_at, ultimo_login_whatsapp AS ultimo_login
      FROM usuarios
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/permisos/usuarios error:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// ─────────────────────────────────────────────
// USUARIOS INTERNOS — editar / eliminar / reactivar (admin)
// ─────────────────────────────────────────────
const ROLES_INTERNOS = ['superadmin', 'administrador', 'operaciones', 'comercial', 'coordinadora'];
const ROLES_ADMIN = ['superadmin', 'administrador'];

function normWhatsapp(input) {
  let d = String(input || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '598' + d.slice(1);
  if (!d.startsWith('598') && d.length <= 9) d = '598' + d;
  return '+' + d;
}

async function getInterno(id) {
  const { rows } = await pool.query('SELECT id, nombre, email, rol, status FROM usuarios WHERE id = $1', [id]);
  const u = rows[0];
  if (!u || !ROLES_INTERNOS.includes(u.rol)) return null;
  return u;
}

async function otrosAdminsActivos(id) {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM usuarios WHERE id <> $1 AND status = 'activo' AND rol = ANY($2)",
    [id, ROLES_ADMIN]
  );
  return rows[0].n;
}

function audit(req, accion, id, detalle) {
  return pool.query(
    'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
    [accion, 'usuario', id, detalle, req.user.id, req.ip]
  ).catch(() => {});
}

// PUT /api/permisos/usuarios/:id — editar nombre, email, whatsapp, rol y (opcional) contraseña
router.put('/usuarios/:id', auth, requireRole('superadmin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const b = req.body || {};
  const nombre = String(b.nombre || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const rol = b.rol === 'superadmin' ? 'superadmin' : b.rol;
  const password = b.password ? String(b.password) : '';
  if (!id || !nombre || !email) return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  if (!ROLES_INTERNOS.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
  if (password && password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  try {
    const u = await getInterno(id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (id === req.user.id && rol !== u.rol) return res.status(400).json({ error: 'No podés cambiar tu propio rol' });
    if (ROLES_ADMIN.includes(u.rol) && !ROLES_ADMIN.includes(rol) && (await otrosAdminsActivos(id)) === 0) {
      return res.status(400).json({ error: 'Tiene que quedar al menos un administrador' });
    }
    const dup = await pool.query('SELECT 1 FROM usuarios WHERE email = $1 AND id <> $2', [email, id]);
    if (dup.rows.length) return res.status(409).json({ error: 'Ese email ya lo usa otro usuario' });
    const params = [nombre, email, normWhatsapp(b.whatsapp), rol, id];
    let sql = 'UPDATE usuarios SET nombre=$1, email=$2, whatsapp=$3, rol=$4';
    if (password) {
      const bcrypt = require('bcryptjs');
      params.push(await bcrypt.hash(password, 12));
      sql += ', password_hash=$6';
    }
    await pool.query(sql + ' WHERE id=$5', params);
    const cambios = [u.rol !== rol ? `rol ${u.rol}→${rol}` : '', password ? 'contraseña' : ''].filter(Boolean).join(', ');
    await audit(req, 'UPDATE', id, `${email}${cambios ? ' (' + cambios + ')' : ''}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/permisos/usuarios/:id error:', err);
    res.status(500).json({ error: 'Error al guardar el usuario' });
  }
});

// DELETE /api/permisos/usuarios/:id — elimina; si tiene historial, lo desactiva
router.delete('/usuarios/:id', auth, requireRole('superadmin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'ID inválido' });
  if (id === req.user.id) return res.status(400).json({ error: 'No podés eliminar tu propio usuario' });
  try {
    const u = await getInterno(id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (ROLES_ADMIN.includes(u.rol) && (await otrosAdminsActivos(id)) === 0) {
      return res.status(400).json({ error: 'Tiene que quedar al menos un administrador' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM usuarios WHERE id = $1', [id]);
      await client.query('COMMIT');
      await audit(req, 'DELETE', id, `${u.email} (${u.rol})`);
      return res.json({ ok: true, eliminado: true });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      if (e.code !== '23503') throw e;
    } finally {
      client.release();
    }
    // Tiene reservas, pagos o historial asociados: se desactiva para no perder datos.
    await pool.query("UPDATE usuarios SET status = 'inactivo' WHERE id = $1", [id]);
    await audit(req, 'DESACTIVAR', id, `${u.email} (${u.rol})`);
    res.json({ ok: true, desactivado: true });
  } catch (err) {
    console.error('DELETE /api/permisos/usuarios/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// POST /api/permisos/usuarios/:id/reactivar
router.post('/usuarios/:id/reactivar', auth, requireRole('superadmin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const u = await getInterno(id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    await pool.query("UPDATE usuarios SET status = 'activo' WHERE id = $1", [id]);
    await audit(req, 'REACTIVAR', id, u.email);
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/permisos/usuarios/:id/reactivar error:', err);
    res.status(500).json({ error: 'Error al reactivar el usuario' });
  }
});

module.exports = router;
