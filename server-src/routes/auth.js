const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../utils/db');
const { auth, requireRole, generateToken } = require('../middleware/auth');
const { enviarMensaje } = require('../utils/wa_sender');
const { encolar } = require('../utils/wa_queue');

const router = express.Router();
const LOGIN_ROLES = ['superadmin', 'administrador', 'operaciones', 'operadora', 'operadora_habilitada', 'operadora_limitada', 'transportista', 'comercial'];

function normalizeWhatsapp(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '598' + digits.slice(1);
  if (!digits.startsWith('598') && digits.length <= 9) digits = '598' + digits;
  return '+' + digits;
}

function phoneVariants(whatsapp) {
  const digits = normalizeWhatsapp(whatsapp).replace(/\D/g, '');
  const variants = new Set([digits]);
  if (digits.startsWith('598')) {
    variants.add(digits.slice(3));
    variants.add('0' + digits.slice(3));
  }
  return [...variants];
}

async function findLinkedRecord(whatsapp, rol) {
  const variants = phoneVariants(whatsapp);
  if (rol === 'operadora') {
    const { rows } = await pool.query(
      `SELECT id, nombre, apellido, whatsapp, telefono, estado
       FROM operadoras
       WHERE regexp_replace(coalesce(whatsapp, telefono, ''), '[^0-9]', '', 'g') = ANY($1)
       ORDER BY id DESC LIMIT 1`,
      [variants]
    );
    return rows[0] || null;
  }
  if (rol === 'transportista') {
    const { rows } = await pool.query(
      `SELECT id, nombre, whatsapp, telefono, estado
       FROM transportistas
       WHERE regexp_replace(coalesce(whatsapp, telefono, ''), '[^0-9]', '', 'g') = ANY($1)
       ORDER BY id DESC LIMIT 1`,
      [variants]
    );
    return rows[0] || null;
  }
  return null;
}

async function findOrCreateWhatsappUser(whatsapp, rol) {
  rol = normalizeRole(rol);
  if (!LOGIN_ROLES.includes(rol)) return null;
  const variants = phoneVariants(whatsapp);
  const { rows: existing } = await pool.query(
    `SELECT * FROM usuarios
     WHERE regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g') = ANY($1)
       AND rol = $2 AND status = $3
     LIMIT 1`,
    [variants, rol, 'activo']
  );
  if (existing.length) return existing[0];

  if (!['operadora', 'transportista'].includes(rol)) return null;

  const linked = await findLinkedRecord(whatsapp, rol);
  if (!linked) return null;
  if (linked.estado && ['inactiva', 'suspendida'].includes(linked.estado)) return null;

  const nombre = rol === 'operadora'
    ? `${linked.nombre || ''} ${linked.apellido || ''}`.trim()
    : (linked.nombre || 'Transportista');
  const email = `${rol}.${linked.id}.${whatsapp.replace(/\D/g, '')}@whatsapp.depimovil.local`;
  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (
      nombre, email, password_hash, rol, whatsapp, operadora_id, transportista_id,
      registro_origen, requiere_revision_admin, revision_admin_estado
    )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (email) DO UPDATE SET whatsapp = EXCLUDED.whatsapp
     RETURNING *`,
    [
      nombre || whatsapp,
      email,
      passwordHash,
      rol,
      whatsapp,
      rol === 'operadora' ? linked.id : null,
      rol === 'transportista' ? linked.id : null,
      'whatsapp_login',
      false,
      'no_requiere'
    ]
  );
  return rows[0];
}

function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    operadora_id: user.operadora_id,
    transportista_id: user.transportista_id,
    whatsapp: user.whatsapp
  };
}

function normalizeRole(rol) {
  if (rol === 'administrador') return 'superadmin';
  return rol;
}

function cleanText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function buildOperadoraRegistroObs(payload) {
  const parts = [
    'Registro web de operadora pendiente de revisión administrativa.',
    `Cédula/DNI: ${payload.documento}`,
    `Experiencia: ${payload.experiencia || 'Sin indicar'}`,
    `Tratamientos: ${(payload.tratamientos || []).join(', ') || 'Sin indicar'}${payload.tratamientos_otros ? ` | Otros: ${payload.tratamientos_otros}` : ''}`,
    `Lugares de trabajo: ${payload.lugares_trabajo || 'Sin indicar'}`,
    `Otros trabajos no estéticos: ${payload.trabajo_no_estetico ? (payload.trabajo_no_estetico_detalle || 'Sí') : 'No'}`
  ];
  return parts.join('\n');
}

function mensajeCodigoLogin(codigo) {
  return `Tu código de ingreso a DepiMóvil es: *${codigo}*.\n\nVence en 10 minutos. Si no lo pediste, ignorá este mensaje.`;
}

async function crearSesionCodigoWhatsapp({ whatsapp, rol, usuarioId, ip, userAgent }) {
  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const codigoHash = await bcrypt.hash(codigo, 10);
  await pool.query(
    `INSERT INTO sesiones_whatsapp (whatsapp, codigo_hash, rol_solicitado, usuario_id, expires_at, ip, user_agent)
     VALUES ($1,$2,$3,$4,NOW() + INTERVAL '10 minutes',$5,$6)`,
    [whatsapp, codigoHash, rol, usuarioId, ip, userAgent || '']
  );
  return { codigo, mensaje: mensajeCodigoLogin(codigo) };
}

async function enviarOEncolarWhatsapp({ telefono, mensaje, tipo, operadoraId = null, reservaId = null }) {
  const envio = await enviarMensaje(telefono, mensaje);
  if (envio?.ok) return { enviado: true, error: null, result: envio };

  await encolar({
    reservaId,
    operadoraId,
    tipo,
    mensaje,
    telefono,
  });
  return { enviado: false, error: envio?.error || 'No se pudo enviar por WhatsApp', result: envio };
}

async function notifyAdminNuevaOperadora(payload, operadoraId) {
  try {
    const { rows: configRows } = await pool.query(
      "SELECT valor FROM configuracion WHERE clave = 'admin_whatsapp_notificaciones' AND COALESCE(valor, '') <> ''"
    );
    const { rows: userRows } = await pool.query(
      `SELECT whatsapp FROM usuarios
       WHERE rol IN ('superadmin','administrador','operaciones')
         AND status = 'activo'
         AND COALESCE(whatsapp, '') <> ''`
    );
    const telefonos = [...new Set([
      ...configRows.map(r => r.valor),
      ...userRows.map(r => r.whatsapp),
    ].filter(Boolean))];
    if (!telefonos.length) return;

    const mensaje = [
        'Nueva operadora registrada en DepiMóvil.',
        `ID: ${operadoraId}`,
        `Nombre: ${payload.nombre} ${payload.apellido}`,
        `WhatsApp: ${payload.whatsapp}`,
        `Ciudad: ${payload.ciudad}${payload.departamento ? ` / ${payload.departamento}` : ''}`,
        `Experiencia: ${payload.experiencia || 'Sin indicar'}`,
        'Estado: activa, pendiente de revisión administrativa.'
      ].join('\n');

    for (const telefono of telefonos) {
      await enviarOEncolarWhatsapp({
        telefono,
        mensaje,
        tipo: 'admin_nueva_operadora',
        operadoraId,
      });
    }
  } catch (err) {
    console.error('Admin notification error:', err.message);
  }
}

function makePortalToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function ensurePortalToken(client, operadoraId, currentToken) {
  if (currentToken) return currentToken;
  const token = makePortalToken();
  await client.query('UPDATE operadoras SET portal_token = $1, updated_at = NOW() WHERE id = $2', [token, operadoraId]);
  return token;
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND status = $2',
      [email.toLowerCase().trim(), 'activo']
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Log de auditoría
    await pool.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
      ['LOGIN', 'session', user.id, `${user.email} — ${user.rol}`, user.id, req.ip]
    );

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        operadora_id: user.operadora_id,
        transportista_id: user.transportista_id,
        whatsapp: user.whatsapp,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * GET /api/auth/me — perfil del usuario autenticado
 */
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, rol, operadora_id, transportista_id, whatsapp, status FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/auth/whatsapp/request
 * Body: { whatsapp, rol }
 */
router.post('/whatsapp/request', async (req, res) => {
  try {
    const whatsapp = normalizeWhatsapp(req.body.whatsapp);
    const rol = normalizeRole(req.body.rol || 'operadora');
    if (!LOGIN_ROLES.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    if (!whatsapp || whatsapp.length < 9) {
      return res.status(400).json({ error: 'WhatsApp requerido' });
    }

    const user = await findOrCreateWhatsappUser(whatsapp, rol);
    if (!user) {
      return res.status(404).json({ error: rol === 'transportista' ? 'Transportista no habilitado' : rol === 'operadora' ? 'Operadora no encontrada' : 'Usuario no encontrado o sin WhatsApp cargado' });
    }

    const recent = await pool.query(
      `SELECT id FROM sesiones_whatsapp
       WHERE whatsapp=$1 AND used_at IS NULL AND created_at > NOW() - INTERVAL '60 seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [whatsapp]
    );
    if (recent.rows.length) {
      return res.status(429).json({ error: 'Esperá un minuto antes de pedir otro código' });
    }

    const { mensaje } = await crearSesionCodigoWhatsapp({
      whatsapp,
      rol,
      usuarioId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    const envio = await enviarOEncolarWhatsapp({
      telefono: whatsapp,
      mensaje,
      tipo: rol === 'operadora' ? 'codigo_login_operadora' : 'codigo_login',
      operadoraId: user.operadora_id || null,
    });

    res.json({ ok: true, whatsapp, expires_in_minutes: 10, codigo_enviado: envio.enviado, codigo_error: envio.error });
  } catch (err) {
    console.error('WhatsApp request error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/auth/whatsapp/verify
 * Body: { whatsapp, rol, codigo }
 */
router.post('/whatsapp/verify', async (req, res) => {
  try {
    const whatsapp = normalizeWhatsapp(req.body.whatsapp);
    const rol = normalizeRole(req.body.rol || 'operadora');
    if (!LOGIN_ROLES.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    const codigo = String(req.body.codigo || '').replace(/\D/g, '');
    if (!whatsapp || codigo.length !== 6) {
      return res.status(400).json({ error: 'WhatsApp y código requeridos' });
    }

    const { rows } = await pool.query(
      `SELECT
         s.id AS sesion_id, s.codigo_hash, s.attempts,
         u.id AS user_id, u.nombre, u.email, u.rol, u.operadora_id, u.transportista_id, u.whatsapp
       FROM sesiones_whatsapp s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.whatsapp=$1 AND s.rol_solicitado=$2 AND s.used_at IS NULL AND s.expires_at > NOW()
       ORDER BY s.created_at DESC LIMIT 1`,
      [whatsapp, rol]
    );
    if (!rows.length) return res.status(401).json({ error: 'Código vencido o no solicitado' });

    const row = rows[0];
    if (row.attempts >= 5) return res.status(429).json({ error: 'Demasiados intentos' });
    const valid = await bcrypt.compare(codigo, row.codigo_hash);
    if (!valid) {
      await pool.query('UPDATE sesiones_whatsapp SET attempts = attempts + 1 WHERE id = $1', [row.sesion_id]);
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    await pool.query('UPDATE sesiones_whatsapp SET used_at = NOW() WHERE id = $1', [row.sesion_id]);
    await pool.query('UPDATE usuarios SET ultimo_login_whatsapp = NOW(), updated_at = NOW() WHERE id = $1', [row.user_id]);
    await pool.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
      ['LOGIN_WHATSAPP', 'session', row.user_id, `${whatsapp} — ${rol}`, row.user_id, req.ip]
    );

    const user = {
      id: row.user_id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol,
      operadora_id: row.operadora_id,
      transportista_id: row.transportista_id,
      whatsapp: row.whatsapp
    };
    res.json({ token: generateToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('WhatsApp verify error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/auth/operadora/register
 * Alta pública de operadora: queda activa y pendiente de revisión admin.
 */
router.post('/operadora/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = {
      nombre: cleanText(req.body.nombre, 120),
      apellido: cleanText(req.body.apellido, 120),
      whatsapp: normalizeWhatsapp(req.body.whatsapp),
      documento: String(req.body.documento || '').replace(/\D/g, '').slice(0, 30),
      ciudad: cleanText(req.body.ciudad, 120),
      departamento: cleanText(req.body.departamento, 120),
      lugares_trabajo: cleanText(req.body.lugares_trabajo, 1000),
      experiencia: cleanText(req.body.experiencia, 120),
      tratamientos: Array.isArray(req.body.tratamientos)
        ? req.body.tratamientos.map(v => cleanText(v, 80)).filter(Boolean).slice(0, 20)
        : [],
      tratamientos_otros: cleanText(req.body.tratamientos_otros, 400),
      trabajo_no_estetico: !!req.body.trabajo_no_estetico,
      trabajo_no_estetico_detalle: cleanText(req.body.trabajo_no_estetico_detalle, 700)
    };

    if (!payload.nombre || !payload.apellido || !payload.whatsapp || !payload.documento || !payload.ciudad) {
      return res.status(400).json({ error: 'Nombre, apellido, WhatsApp, cédula/DNI y ciudad son obligatorios' });
    }
    if (payload.documento.length < 5) {
      return res.status(400).json({ error: 'La cédula/DNI debe tener solo números y al menos 5 dígitos' });
    }

    const variants = phoneVariants(payload.whatsapp);
    const existingUser = await client.query(
      `SELECT id FROM usuarios
       WHERE rol = 'operadora' AND regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g') = ANY($1)
       LIMIT 1`,
      [variants]
    );
    if (existingUser.rows.length) {
      return res.status(409).json({ error: 'Ese WhatsApp ya tiene usuario de operadora' });
    }

    const existingOp = await client.query(
      `SELECT id FROM operadoras
       WHERE regexp_replace(coalesce(whatsapp, telefono, ''), '[^0-9]', '', 'g') = ANY($1)
       LIMIT 1`,
      [variants]
    );
    if (existingOp.rows.length) {
      return res.status(409).json({ error: 'Ese WhatsApp ya está registrado como operadora' });
    }

    const obs = buildOperadoraRegistroObs(payload);
    await client.query('BEGIN');
    const operadoraResult = await client.query(
      `INSERT INTO operadoras (
        nombre, apellido, gabinete, ciudad, departamento, pais, whatsapp, telefono, email,
        fecha_alta, estado, nivel, obs, direccion_entrega, tipo_direccion, direcciones_entrega, portal_token
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        payload.nombre,
        payload.apellido,
        payload.tratamientos.includes('Peluquería') ? 'Peluquería' : '',
        payload.ciudad,
        payload.departamento,
        'Uruguay',
        payload.whatsapp,
        null,
        '',
        'activa',
        payload.experiencia || 'Inicial',
        obs,
        payload.lugares_trabajo || null,
        'trabajo',
        JSON.stringify(payload.lugares_trabajo ? [{
          direccion: payload.lugares_trabajo,
          localidad: payload.ciudad,
          departamento: payload.departamento,
          pais: 'Uruguay',
          referencia: '',
          tipo: 'trabajo',
          principal: true
        }] : []),
        makePortalToken()
      ]
    );
    const operadora = operadoraResult.rows[0];
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
    const email = `operadora.${operadora.id}.${payload.whatsapp.replace(/\D/g, '')}@whatsapp.depimovil.local`;
    const metadata = {
      documento: payload.documento,
      lugares_trabajo: payload.lugares_trabajo,
      experiencia: payload.experiencia,
      tratamientos: payload.tratamientos,
      tratamientos_otros: payload.tratamientos_otros,
      trabajo_no_estetico: payload.trabajo_no_estetico,
      trabajo_no_estetico_detalle: payload.trabajo_no_estetico_detalle,
      documentos_identidad_requeridos: true
    };
    const usuarioResult = await client.query(
      `INSERT INTO usuarios (
        nombre, email, password_hash, rol, whatsapp, operadora_id, registro_origen,
        requiere_revision_admin, revision_admin_estado, metadata
      )
       VALUES ($1,$2,$3,'operadora',$4,$5,'registro_web_operadora',true,'pendiente',$6)
       RETURNING id, nombre, email, rol, operadora_id, whatsapp`,
      [`${payload.nombre} ${payload.apellido}`.trim(), email, passwordHash, payload.whatsapp, operadora.id, metadata]
    );
    await client.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, ip) VALUES ($1,$2,$3,$4,$5)',
      ['REGISTRO_OPERADORA', 'operadora', operadora.id, `${payload.nombre} ${payload.apellido} — ${payload.whatsapp}`, req.ip]
    );
    await client.query('COMMIT');

    await notifyAdminNuevaOperadora(payload, operadora.id);
    let codigoEnviado = false;
    let codigoError = null;
    try {
      const { mensaje } = await crearSesionCodigoWhatsapp({
        whatsapp: payload.whatsapp,
        rol: 'operadora',
        usuarioId: usuarioResult.rows[0].id,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });
      const envio = await enviarOEncolarWhatsapp({
        telefono: payload.whatsapp,
        mensaje,
        tipo: 'codigo_login_operadora',
        operadoraId: operadora.id,
      });
      codigoEnviado = envio.enviado;
      codigoError = envio.error;
    } catch (codeErr) {
      codigoError = codeErr.message || 'No se pudo enviar el código';
      console.error('Operadora register auto-code error:', codeErr);
    }
    res.status(201).json({
      ok: true,
      whatsapp: payload.whatsapp,
      codigo_enviado: codigoEnviado,
      codigo_error: codigoError,
      operadora,
      user: publicUser(usuarioResult.rows[0])
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Operadora register error:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/auth/operadoras/revision
 * Bandeja administrativa de operadoras registradas desde la web.
 */
router.get('/operadoras/revision', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const estado = cleanText(req.query.estado, 40);
    const params = [];
    let query = `
      SELECT
        u.id AS usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email, u.whatsapp,
        u.requiere_revision_admin, u.revision_admin_estado, u.revision_admin_obs,
        u.registro_origen, u.metadata, u.created_at AS usuario_created_at, u.updated_at AS usuario_updated_at,
        o.id AS operadora_id, o.nombre, o.apellido, o.gabinete, o.ciudad, o.departamento,
        o.estado AS operadora_estado, o.nivel, o.obs, o.portal_token
      FROM usuarios u
      LEFT JOIN operadoras o ON o.id = u.operadora_id
      WHERE u.rol = 'operadora'
        AND (u.registro_origen = 'registro_web_operadora' OR u.requiere_revision_admin = true)
    `;
    if (estado) {
      params.push(estado);
      query += ` AND u.revision_admin_estado = $${params.length}`;
    }
    query += ` ORDER BY u.requiere_revision_admin DESC, u.created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Revision list error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/auth/operadoras/revision/:usuarioId
 * Acciones: aprobar, observar, rechazar, pedir_documentos, eliminar.
 */
router.post('/operadoras/revision/:usuarioId', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const client = await pool.connect();
  try {
    const usuarioId = parseInt(req.params.usuarioId, 10);
    const accion = cleanText(req.body.accion, 40);
    const obs = cleanText(req.body.obs, 1000);
    const acciones = ['aprobar', 'observar', 'rechazar', 'pedir_documentos', 'eliminar'];
    if (!usuarioId || !acciones.includes(accion)) {
      return res.status(400).json({ error: 'Acción inválida' });
    }
    const { rows } = await client.query(
      `SELECT u.*, o.id AS operadora_id, o.nombre, o.apellido, o.whatsapp AS op_whatsapp, o.portal_token
       FROM usuarios u
       LEFT JOIN operadoras o ON o.id = u.operadora_id
       WHERE u.id = $1 AND u.rol = 'operadora'
       LIMIT 1`,
      [usuarioId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Registro no encontrado' });
    const row = rows[0];

    if (!row.operadora_id) {
      if (accion === 'aprobar') {
        return res.status(400).json({ error: 'No se puede aprobar: el pedido no tiene ficha de operadora vinculada' });
      }
      await client.query('BEGIN');
      if (accion === 'eliminar') {
        await client.query('DELETE FROM usuarios WHERE id = $1 AND rol = $2', [usuarioId, 'operadora']);
        await client.query(
          'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
          ['REV_HUERF_DEL', 'usuario', usuarioId, obs || 'Pedido de alta sin ficha de operadora eliminado', req.user.id, req.ip]
        );
        await client.query('COMMIT');
        return res.json({ ok: true, estado: 'eliminada' });
      }
      const nuevoEstadoHuerfano = accion === 'rechazar'
        ? 'rechazada'
        : (accion === 'observar' ? 'observada' : 'documentos_solicitados');
      const nuevoStatusHuerfano = accion === 'rechazar' ? 'suspendido' : row.status;
      await client.query(
        `UPDATE usuarios
         SET requiere_revision_admin = $1,
             revision_admin_estado = $2,
             revision_admin_obs = $3,
             status = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [accion !== 'rechazar', nuevoEstadoHuerfano, obs || 'Pedido sin ficha de operadora vinculada', nuevoStatusHuerfano, usuarioId]
      );
      await client.query(
        'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
        ['REV_HUERFANA', 'usuario', usuarioId, `${accion}: ${obs || 'Pedido de alta sin ficha de operadora vinculada'}`, req.user.id, req.ip]
      );
      await client.query('COMMIT');
      return res.json({ ok: true, estado: nuevoEstadoHuerfano });
    }

    const estadoMap = {
      aprobar: 'aprobada',
      observar: 'observada',
      rechazar: 'rechazada',
      pedir_documentos: 'documentos_solicitados',
      eliminar: 'eliminada'
    };
    if (accion === 'eliminar') {
      return res.status(400).json({ error: 'Este pedido tiene ficha vinculada. Rechazalo o cambiá el estado de la operadora.' });
    }
    const requiereRevision = ['observar', 'pedir_documentos'].includes(accion);
    await client.query('BEGIN');
    const portalToken = await ensurePortalToken(client, row.operadora_id, row.portal_token);
    await client.query(
      `UPDATE usuarios
       SET requiere_revision_admin = $1,
           revision_admin_estado = $2,
           revision_admin_obs = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [requiereRevision, estadoMap[accion], obs || null, usuarioId]
    );
    if (accion === 'rechazar') {
      await client.query('UPDATE operadoras SET estado = $1, updated_at = NOW() WHERE id = $2', ['suspendida', row.operadora_id]);
    } else if (accion === 'aprobar') {
      await client.query('UPDATE operadoras SET estado = $1, updated_at = NOW() WHERE id = $2', ['activa', row.operadora_id]);
    }
    await client.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
      [`REVISION_${accion.toUpperCase()}`, 'operadora', row.operadora_id, obs || estadoMap[accion], req.user.id, req.ip]
    );
    await client.query('COMMIT');

    const wa = row.whatsapp || row.op_whatsapp;
    if (wa && ['observar', 'rechazar', 'pedir_documentos'].includes(accion)) {
      const portalUrl = `${req.protocol}://${req.get('host')}/portal.html?token=${portalToken}`;
      const mensajeMap = {
        observar: `DepiMóvil revisó tu registro y necesita aclarar algunos datos.${obs ? `\n\nObservación: ${obs}` : ''}`,
        rechazar: `DepiMóvil revisó tu registro y por ahora no quedó aprobado.${obs ? `\n\nMotivo: ${obs}` : ''}`,
        pedir_documentos: `DepiMóvil necesita que subas fotos de tu cédula/DNI frente y dorso para completar tu registro.${obs ? `\n\nNota: ${obs}` : ''}\n\nSubilos acá: ${portalUrl}`
      };
      await enviarMensaje(wa, mensajeMap[accion]);
    }

    res.json({ ok: true, estado: estadoMap[accion], portal_token: portalToken });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Revision action error:', err);
    res.status(500).json({ error: 'Error interno' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/register — solo superadmin puede crear usuarios
 * Body: { nombre, email, password, rol, operadora_id? }
 */
router.post('/register', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { nombre, email, password, operadora_id, transportista_id } = req.body;
    const rol = normalizeRole(req.body.rol);
    const whatsapp = normalizeWhatsapp(req.body.whatsapp);
    
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, email, password, rol' });
    }

    if (!LOGIN_ROLES.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Verificar email único
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, whatsapp, operadora_id, transportista_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nombre, email, rol, whatsapp, operadora_id, transportista_id`,
      [nombre.trim(), email.toLowerCase().trim(), hash, rol, whatsapp || null, operadora_id || null, transportista_id || null]
    );

    await pool.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id) VALUES ($1,$2,$3,$4,$5)',
      ['CREATE', 'usuario', rows[0].id, `${nombre} (${rol})`, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * PUT /api/auth/password — cambiar contraseña propia
 */
router.put('/password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const { rows } = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
