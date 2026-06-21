const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole, isOpsRole } = require('../middleware/auth');
const { enviarMensaje } = require('../utils/wa_sender');
const { encolar } = require('../utils/wa_queue');
const { emitAutomationEvent } = require('../utils/automation_engine');

const router = express.Router();
const certificadosDir = path.join(__dirname, '../../uploads/documentos-operadora');
fs.mkdirSync(certificadosDir, { recursive: true });

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function nextCodigo(prefix, table) {
  const { rows } = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function slugFilePart(value) {
  return String(value || 'certificado')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'certificado';
}

function publicBaseUrl(req) {
  return (process.env.PUBLIC_BASE_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

async function ensureCertificadosTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documentos_operadora (
      id SERIAL PRIMARY KEY,
      operadora_id INTEGER REFERENCES operadoras(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      maquina_id INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
      archivo_url TEXT,
      firmado_en TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('ALTER TABLE documentos_operadora ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'::jsonb');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_documentos_operadora_certificados ON documentos_operadora(operadora_id, tipo, created_at DESC)');
  // Nivel progresivo operadora (1=bienvenida, 2=activa, 3=experimentada, 4=avanzada)
  await pool.query('ALTER TABLE operadoras ADD COLUMN IF NOT EXISTS nivel_operadora SMALLINT NOT NULL DEFAULT 1');
  await pool.query('ALTER TABLE operadoras ADD COLUMN IF NOT EXISTS nivel_operadora_updated_at TIMESTAMP');
}

function buildCertificadoHtml({ op, categoria, evaluacionTitulo, correctas, total, porcentaje, codigo, fecha }) {
  const nombre = escapeHtml(`${op.nombre || ''} ${op.apellido || ''}`.trim());
  const ciudad = escapeHtml([op.ciudad, op.departamento].filter(Boolean).join(' / ') || 'Uruguay');
  const cat = escapeHtml(categoria);
  const test = escapeHtml(evaluacionTitulo || 'Evaluación técnica DepiMóvil');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Certificado DepiMóvil - ${nombre}</title>
  <style>
    body{margin:0;background:#f4f0e8;font-family:Arial,Helvetica,sans-serif;color:#27231f}
    .page{max-width:980px;margin:34px auto;background:#fffaf2;border:10px solid #d4a96a;padding:54px 62px;box-shadow:0 20px 60px rgba(0,0,0,.16)}
    .top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:1px solid #e3d3bb;padding-bottom:22px}
    .brand{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#8a6b42;font-weight:700}
    .code{font-size:12px;color:#7a7168;text-align:right;line-height:1.5}
    h1{font-size:44px;margin:48px 0 8px;text-align:center;letter-spacing:.04em;text-transform:uppercase}
    .sub{text-align:center;font-size:16px;color:#7a7168;margin-bottom:44px}
    .name{text-align:center;font-size:34px;font-weight:700;color:#111827;margin-bottom:18px}
    .line{width:68%;height:1px;background:#d4a96a;margin:0 auto 30px}
    .body{font-size:18px;line-height:1.65;text-align:center;max-width:780px;margin:0 auto;color:#35302a}
    .cat{display:inline-block;margin:22px auto 8px;padding:12px 20px;border:1px solid #d4a96a;background:#fff3de;font-weight:700;border-radius:4px}
    .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:44px 0 34px}
    .box{border:1px solid #ead9be;padding:14px 16px;background:#fffdf8}
    .label{font-size:11px;color:#8a6b42;text-transform:uppercase;letter-spacing:.09em;margin-bottom:5px}
    .value{font-size:15px;font-weight:700}
    .sign{display:flex;justify-content:space-between;gap:42px;margin-top:52px}
    .sign>div{flex:1;border-top:1px solid #9a8a78;padding-top:12px;font-size:13px;color:#62584d;text-align:center}
    .footer{margin-top:34px;font-size:11px;color:#8a8178;text-align:center;line-height:1.5}
    @media(max-width:720px){.page{margin:0;border-width:6px;padding:32px 24px}.meta{grid-template-columns:1fr}h1{font-size:30px}.name{font-size:26px}.sign{flex-direction:column}}
  </style>
</head>
<body>
  <main class="page">
    <div class="top">
      <div>
        <div class="brand">DepiMóvil Uruguay</div>
        <div style="font-size:13px;color:#7a7168;margin-top:6px">Aparatología estética profesional</div>
      </div>
      <div class="code">Certificado: <strong>${escapeHtml(codigo)}</strong><br>Emitido: ${escapeHtml(fecha)}<br>${ciudad}</div>
    </div>
    <h1>Certificado</h1>
    <div class="sub">Habilitación técnica interna de operadora</div>
    <div class="name">${nombre}</div>
    <div class="line"></div>
    <div class="body">
      DepiMóvil Uruguay certifica que la operadora indicada aprobó la evaluación técnica requerida y queda habilitada para operar equipos de la categoría:
      <br><span class="cat">${cat}</span>
      <br>La certificación corresponde al test <strong>${test}</strong> y acredita conocimiento operativo, criterios de seguridad, higiene, contraindicaciones y buenas prácticas de uso.
    </div>
    <div class="meta">
      <div class="box"><div class="label">Resultado</div><div class="value">${Number(correctas || 0)}/${Number(total || 0)} correctas</div></div>
      <div class="box"><div class="label">Puntaje</div><div class="value">${Number(porcentaje || 0)}%</div></div>
      <div class="box"><div class="label">Estado</div><div class="value">Operadora certificada</div></div>
    </div>
    <div class="sign">
      <div>DepiMóvil Uruguay<br>Responsable de capacitación</div>
      <div>${nombre}<br>Operadora certificada</div>
    </div>
    <div class="footer">Documento generado por el CRM DepiMóvil. Su validez depende del mantenimiento de la habilitación activa, cumplimiento de protocolos y criterio técnico responsable.</div>
  </main>
</body>
</html>`;
}

ensureCertificadosTable().catch(err => console.error('Error preparando certificados:', err.message));

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

function publicOperadora(row) {
  const equipos = normalizeEquipos(row.equipos_alquila);
  const habilitaciones = Array.isArray(row.habilitaciones)
    ? row.habilitaciones.filter(Boolean)
    : [];
  const jornadasTotal = equipos.reduce((sum, e) => sum + (Number.parseInt(e.jornadas, 10) || 0), 0);
  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido || '',
    gabinete: row.gabinete || '',
    ciudad: row.ciudad || '',
    departamento: row.departamento || '',
    estado: row.estado,
    nivel: row.nivel || 'Inicial',
    nivel_operadora: parseInt(row.nivel_operadora || 1, 10),
    equipos_alquila: equipos.map(e => ({
      equipo: e.equipo,
      jornadas: e.jornadas,
      obs: e.obs,
    })),
    jornadas_total: jornadasTotal,
    preparacion: habilitaciones.join(', '),
    titulos: habilitaciones.join(', '),
    rango_depimovil: row.nivel || 'Inicial',
    perfil_minimo: true,
  };
}

async function missingOperadoraDocs(operadoraId) {
  const { rows } = await pool.query(
    'SELECT tipo FROM documentos_operadora WHERE operadora_id=$1',
    [operadoraId]
  ).catch(() => ({ rows: [] }));
  const tipos = new Set(rows.map(r => r.tipo));
  const faltantes = [];
  if (!tipos.has('cedula')) faltantes.push('cédula/DNI frente');
  if (!tipos.has('cedula_dorso')) faltantes.push('cédula/DNI dorso');
  return faltantes;
}

async function sendOrQueueOperadoraMessage({ operadoraId, telefono, mensaje, tipo }) {
  const envio = await enviarMensaje(telefono, mensaje);
  if (envio?.ok) return { enviado: true, error: null };
  await encolar({ operadoraId, telefono, mensaje, tipo });
  return { enviado: false, error: envio?.error || 'No se pudo enviar por WhatsApp' };
}

// ─────────────────────────────────────────────
// GET /api/operadoras — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      const { rows } = await pool.query(
        `SELECT o.*,
                COALESCE(h.habilitaciones, '{}') AS habilitaciones,
                GREATEST(
                  COALESCE(o.updated_at, o.created_at, o.fecha_alta::timestamp, 'epoch'::timestamp),
                  COALESCE((SELECT MAX(u.ultimo_login_whatsapp) FROM usuarios u WHERE u.operadora_id = o.id), 'epoch'::timestamp),
                  COALESCE((SELECT MAX(u.updated_at) FROM usuarios u WHERE u.operadora_id = o.id), 'epoch'::timestamp),
                  COALESCE((SELECT MAX(d.created_at) FROM documentos_operadora d WHERE d.operadora_id = o.id), 'epoch'::timestamp),
                  COALESCE((SELECT MAX(r.updated_at) FROM reservas r WHERE r.operadora_id = o.id), 'epoch'::timestamp),
                  COALESCE((SELECT MAX(p.updated_at) FROM pagos p WHERE p.operadora_id = o.id), 'epoch'::timestamp),
                  COALESCE((SELECT MAX(e.updated_at) FROM envios e WHERE e.operadora_id = o.id), 'epoch'::timestamp)
                ) AS ultima_actividad
         FROM operadoras o
         LEFT JOIN (
           SELECT operadora_id, array_agg(categoria ORDER BY categoria) AS habilitaciones
           FROM habilitaciones
           WHERE estado = 'activa' AND categoria IS NOT NULL
           GROUP BY operadora_id
         ) h ON h.operadora_id = o.id
         WHERE o.estado = 'activa'
         ORDER BY ultima_actividad DESC NULLS LAST, o.id DESC`
      );
      return res.json(rows.map(row => (
        parseInt(row.id, 10) === parseInt(req.user.operadora_id, 10)
          ? row
          : publicOperadora(row)
      )));
    }
    if (req.user.rol === 'transportista') return res.json([]);
    if (!isOpsRole(req.user.rol)) return res.json([]);
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
             whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, nivel_operadora, obs,
             direccion_entrega, tipo_direccion, direcciones_entrega, equipos_alquila, portal_token,
             updated_at, created_at,
             GREATEST(
               COALESCE(updated_at, created_at, fecha_alta::timestamp, 'epoch'::timestamp),
               COALESCE((SELECT MAX(u.ultimo_login_whatsapp) FROM usuarios u WHERE u.operadora_id = operadoras.id), 'epoch'::timestamp),
               COALESCE((SELECT MAX(u.updated_at) FROM usuarios u WHERE u.operadora_id = operadoras.id), 'epoch'::timestamp),
               COALESCE((SELECT MAX(d.created_at) FROM documentos_operadora d WHERE d.operadora_id = operadoras.id), 'epoch'::timestamp),
               COALESCE((SELECT MAX(r.updated_at) FROM reservas r WHERE r.operadora_id = operadoras.id), 'epoch'::timestamp),
               COALESCE((SELECT MAX(p.updated_at) FROM pagos p WHERE p.operadora_id = operadoras.id), 'epoch'::timestamp),
               COALESCE((SELECT MAX(e.updated_at) FROM envios e WHERE e.operadora_id = operadoras.id), 'epoch'::timestamp)
             ) AS ultima_actividad
      FROM operadoras
      ORDER BY ultima_actividad DESC NULLS LAST, id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/operadoras error:', err);
    res.status(500).json({ error: 'Error al obtener operadoras' });
  }
});

// ─────────────────────────────────────────────
// POST /api/operadoras/:id/pedir-faltantes — solicitar documentos faltantes
// ─────────────────────────────────────────────
router.post('/:id/pedir-faltantes', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const obs = String(req.body?.obs || '').trim().slice(0, 700);
    const { rows } = await pool.query(
      `SELECT id, nombre, apellido, whatsapp, telefono, portal_token
       FROM operadoras WHERE id = $1 LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Operadora no encontrada' });
    const op = rows[0];
    const telefono = op.whatsapp || op.telefono;
    if (!telefono) return res.status(400).json({ error: 'La operadora no tiene WhatsApp cargado' });

    const client = await pool.connect();
    let token = op.portal_token;
    try {
      await client.query('BEGIN');
      token = await ensurePortalToken(client, op.id, token);
      await client.query(
        `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.user.id, req.user.email, 'PEDIR_FALTANTES', 'operadora', op.id, obs || 'Solicitud automática de documentos faltantes']
      ).catch(() => {});
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    const faltantes = await missingOperadoraDocs(op.id);
    const portalUrl = `${req.protocol}://${req.get('host')}/portal.html?token=${token}`;
    const mensaje = [
      `Hola ${op.nombre || ''}, para dejar tu ficha DepiMóvil completa necesitamos que subas:`,
      faltantes.length ? faltantes.map(f => `- ${f}`).join('\n') : '- documentación o datos solicitados por administración',
      obs ? `\nNota: ${obs}` : '',
      `\nPodés cargarlo acá: ${portalUrl}`,
      'Gracias.'
    ].filter(Boolean).join('\n');
    const envio = await sendOrQueueOperadoraMessage({
      operadoraId: op.id,
      telefono,
      mensaje,
      tipo: 'operadora_faltantes',
    });
    res.json({ ok: true, faltantes, portal_token: token, codigo_enviado: envio.enviado, codigo_error: envio.error });
  } catch (err) {
    console.error('POST /api/operadoras/:id/pedir-faltantes error:', err);
    res.status(500).json({ error: 'Error al pedir faltantes' });
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
    if (!isOperadoraRole(req.user.rol) && !isOpsRole(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para operadoras' });
    }
    const { rows } = await pool.query(`
      SELECT id, nombre, apellido, gabinete, ciudad, departamento, pais,
             whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, nivel_operadora, obs,
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
router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, nivel_operadora, obs,
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
        whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, nivel_operadora, obs,
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
    await emitAutomationEvent(client, {
      event: 'operator.created',
      entity: 'operadora',
      entityId: op.id,
      dedupeKey: `operator.created:operadora:${op.id}`,
      payload: { operadora: op },
      user: req.user,
    });
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
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    whatsapp, telefono, instagram_usuario, email, fecha_alta, estado, nivel, nivel_operadora, obs,
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

    // Si se aprobó (estado -> activa) y antes no lo era, enviar link de acceso al portal
    const opActualizada = rows[0];
    if (estado === 'activa') {
      try {
        const { rows: prevRows } = await pool.query('SELECT estado, portal_token FROM operadoras WHERE id=$1', [req.params.id]);
        const client2 = await pool.connect();
        try {
          await client2.query('BEGIN');
          const token = await ensurePortalToken(client2, opActualizada.id, opActualizada.portal_token);
          await client2.query('COMMIT');
          const portalUrl = `${req.protocol}://${req.get('host')}/portal.html?token=${token}`;
          const telefono = opActualizada.whatsapp || opActualizada.telefono;
          if (telefono) {
            const mensaje = `¡Hola ${opActualizada.nombre}! 🎉 Tu cuenta en DepiMóvil fue aprobada.\n\nYa podés ingresar a tu portal personal desde este link (guardalo):\n${portalUrl}\n\nDentro vas a poder ver tus máquinas, reservas y firmar contratos. ¡Bienvenida!`;
            await sendOrQueueOperadoraMessage({ operadoraId: opActualizada.id, telefono, mensaje, tipo: 'bienvenida_portal' }).catch(() => {});
          }
        } catch(e) {
          await client2.query('ROLLBACK').catch(() => {});
        } finally {
          client2.release();
        }
      } catch(e) { /* no bloquear si falla el envío */ }
    }

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
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      'SELECT id, nombre, apellido FROM operadoras WHERE id=$1',
      [id]
    );
    if (!existing.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Operadora no encontrada' });
    }

    const { rows: refs } = await client.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.constraint_schema = kcu.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'operadoras'
      ORDER BY tc.table_name, kcu.column_name
    `);
    const deleteRefs = new Set(['documentos_operadora', 'habilitaciones']);
    for (const ref of refs) {
      const table = String(ref.table_name || '').replace(/[^a-zA-Z0-9_]/g, '');
      const column = String(ref.column_name || '').replace(/[^a-zA-Z0-9_]/g, '');
      if (!table || !column || table === 'operadoras') continue;
      if (deleteRefs.has(table)) {
        await client.query(`DELETE FROM ${table} WHERE ${column}=$1`, [id]);
      } else {
        await client.query(`UPDATE ${table} SET ${column}=NULL WHERE ${column}=$1`, [id]);
      }
    }
    const { rows } = await client.query(
      'DELETE FROM operadoras WHERE id=$1 RETURNING id, nombre, apellido',
      [id]
    );

    // Desactivar todos los usuarios asociados a esta operadora
    await client.query(
      `UPDATE usuarios SET status='inactivo', operadora_id=NULL, updated_at=NOW() WHERE operadora_id=$1`,
      [id]
    ).catch(() => {});
    await client.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'operadora', id, `${existing[0].nombre || ''} ${existing[0].apellido || ''}`.trim()]
    ).catch(() => {});

    await client.query('COMMIT');
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('DELETE /api/operadoras/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar operadora' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// GET /api/operadoras/:id/habilitaciones
// ─────────────────────────────────────────────
router.get('/:id/habilitaciones', auth, async (req, res) => {
  try {
    if (isOperadoraRole(req.user.rol) && parseInt(req.params.id) !== parseInt(req.user.operadora_id)) {
      return res.status(403).json({ error: 'Sin permisos para esta operadora' });
    }
    if (!isOperadoraRole(req.user.rol) && !isOpsRole(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para habilitaciones' });
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
router.post('/:id/habilitaciones', auth, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const ownOperadora = isOperadoraRole(req.user.rol) && parseInt(req.user.operadora_id, 10) === targetId;
  if (!isOpsRole(req.user.rol) && !ownOperadora) {
    return res.status(403).json({ error: 'Sin permisos para crear habilitación' });
  }
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
    const { rows: colRows } = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='habilitaciones'`
    );
    const cols = new Set(colRows.map(r => r.column_name));
    const { rows: constraintRows } = await pool.query(
      `SELECT pg_get_constraintdef(oid) AS def
       FROM pg_constraint
       WHERE conrelid='habilitaciones'::regclass AND conname LIKE '%estado%'`
    ).catch(() => ({ rows: [] }));
    const estadoDef = constraintRows.map(r => r.def || '').join(' ');
    const estadoDb = /'activa'/.test(estadoDef) ? (estado || 'activa') : (estado === 'activa' ? 'activo' : (estado || 'activo'));
    const equipoCat = equipo_categoria || {
      'Láser Depilación':'laser_diodo',
      'Radiofrecuencia / HIFU':'hifu',
      'Pressoterapia':'Pressoterapia',
      'Electroestimulación':'electroestimulacion',
    }[cat] || cat;
    const fecha = fecha_habilitacion || fecha_otorgamiento || null;

    const where = ['operadora_id=$1'];
    const params = [targetId];
    if (cols.has('categoria')) {
      params.push(cat);
      where.push(`categoria=$${params.length}`);
    } else if (cols.has('equipo_categoria')) {
      params.push(equipoCat);
      where.push(`equipo_categoria=$${params.length}`);
    }
    const existing = await pool.query(
      `SELECT id FROM habilitaciones WHERE ${where.join(' AND ')} LIMIT 1`,
      params
    );

    let result;
    if (existing.rows.length) {
      const sets = [];
      const values = [];
      let i = 1;
      if (cols.has('categoria')) { sets.push(`categoria=$${i++}`); values.push(cat); }
      if (cols.has('equipo_categoria')) { sets.push(`equipo_categoria=$${i++}`); values.push(equipoCat); }
      sets.push(`estado=$${i++}`); values.push(estadoDb);
      if (cols.has('fecha_habilitacion')) { sets.push(`fecha_habilitacion=$${i++}`); values.push(fecha); }
      if (cols.has('fecha_otorgamiento')) { sets.push(`fecha_otorgamiento=$${i++}`); values.push(fecha); }
      if (cols.has('obs')) { sets.push(`obs=$${i++}`); values.push(obs || null); }
      if (cols.has('updated_at')) sets.push('updated_at=NOW()');
      values.push(existing.rows[0].id);
      result = await pool.query(`UPDATE habilitaciones SET ${sets.join(', ')} WHERE id=$${i} RETURNING *`, values);
    } else {
      const insertCols = ['operadora_id'];
      const values = [targetId];
      if (cols.has('categoria')) { insertCols.push('categoria'); values.push(cat); }
      if (cols.has('equipo_categoria')) { insertCols.push('equipo_categoria'); values.push(equipoCat); }
      insertCols.push('estado'); values.push(estadoDb);
      if (cols.has('fecha_habilitacion')) { insertCols.push('fecha_habilitacion'); values.push(fecha); }
      if (cols.has('fecha_otorgamiento')) { insertCols.push('fecha_otorgamiento'); values.push(fecha); }
      if (cols.has('obs')) { insertCols.push('obs'); values.push(obs || null); }
      const placeholders = values.map((_, idx) => `$${idx + 1}`).join(',');
      result = await pool.query(
        `INSERT INTO habilitaciones (${insertCols.join(',')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
    }
    const rows = result.rows;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST habilitaciones error:', err);
    res.status(500).json({ error: 'Error al crear habilitación' });
  }
});

// ─────────────────────────────────────────────
// POST /api/operadoras/:id/certificados — emitir certificado y avisar por WhatsApp
// ─────────────────────────────────────────────
router.post('/:id/certificados', auth, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const ownOperadora = isOperadoraRole(req.user.rol) && parseInt(req.user.operadora_id, 10) === targetId;
  if (!isOpsRole(req.user.rol) && !ownOperadora) {
    return res.status(403).json({ error: 'Sin permisos para emitir certificado' });
  }

  const categoria = String(req.body.categoria || '').trim();
  const evaluacionId = String(req.body.evaluacion_id || req.body.evaluacionId || '').trim();
  const evaluacionTitulo = String(req.body.evaluacion_titulo || req.body.titulo || 'Evaluación técnica DepiMóvil').trim();
  const resultadoId = String(req.body.resultado_id || req.body.resultadoId || '').trim();
  const correctas = Number.parseInt(req.body.correctas || 0, 10) || 0;
  const total = Number.parseInt(req.body.total || 0, 10) || 0;
  const porcentaje = Number.parseInt(req.body.porcentaje || 0, 10) || 0;

  if (!categoria) return res.status(400).json({ error: 'Categoría requerida' });

  const client = await pool.connect();
  try {
    await ensureCertificadosTable();
    await client.query('BEGIN');
    const { rows: opRows } = await client.query(
      'SELECT id, nombre, apellido, ciudad, departamento, whatsapp, telefono FROM operadoras WHERE id=$1 FOR UPDATE',
      [targetId]
    );
    if (!opRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Operadora no encontrada' });
    }
    const op = opRows[0];
    const { rows: habColRows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='habilitaciones'`
    );
    const habCols = new Set(habColRows.map(r => r.column_name));
    const catWhere = [];
    const catParams = [targetId];
    if (habCols.has('categoria')) {
      catParams.push(categoria);
      catWhere.push(`categoria=$${catParams.length}`);
    }
    if (habCols.has('equipo_categoria')) {
      catParams.push(categoria);
      catWhere.push(`equipo_categoria=$${catParams.length}`);
    }
    const { rows: habRows } = await client.query(
      `SELECT id, estado FROM habilitaciones
       WHERE operadora_id=$1
         AND (${catWhere.length ? catWhere.join(' OR ') : 'FALSE'})
         AND estado IN ('activa','activo')
       LIMIT 1`,
      catParams
    );
    if (!habRows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'La operadora no tiene habilitación activa para esta categoría' });
    }

    const dedupe = resultadoId || `${evaluacionId || categoria}:${new Date().toISOString().slice(0, 10)}`;
    const { rows: existingRows } = await client.query(
      `SELECT * FROM documentos_operadora
       WHERE operadora_id=$1 AND tipo='certificado'
         AND metadata->>'dedupe_key' = $2
       LIMIT 1`,
      [targetId, dedupe]
    );

    let documento = existingRows[0] || null;
    if (!documento) {
      const fecha = new Date().toLocaleDateString('es-UY');
      const codigo = `CERT-${String(targetId).padStart(4, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const filename = `${slugFilePart(`${op.nombre || ''}-${op.apellido || ''}`)}-certificado-${slugFilePart(categoria)}-${codigo.toLowerCase()}.html`;
      const filePath = path.join(certificadosDir, filename);
      fs.writeFileSync(filePath, buildCertificadoHtml({
        op,
        categoria,
        evaluacionTitulo,
        correctas,
        total,
        porcentaje,
        codigo,
        fecha,
      }), 'utf8');
      const metadata = {
        categoria,
        evaluacion_id: evaluacionId || null,
        evaluacion_titulo: evaluacionTitulo,
        resultado_id: resultadoId || null,
        dedupe_key: dedupe,
        correctas,
        total,
        porcentaje,
        codigo,
        habilitacion_id: habRows[0].id,
      };
      const { rows } = await client.query(
        `INSERT INTO documentos_operadora (operadora_id, tipo, archivo_url, metadata, created_at, updated_at)
         VALUES ($1,'certificado',$2,$3::jsonb,NOW(),NOW())
         RETURNING *`,
        [targetId, `/uploads/documentos-operadora/${filename}`, JSON.stringify(metadata)]
      );
      documento = rows[0];
      await client.query(
        `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
         VALUES ($1,$2,'CERTIFICATE_CREATE','operadora',$3,$4)`,
        [req.user.id || null, req.user.email || null, targetId, `${op.nombre || ''} ${op.apellido || ''} — ${categoria}`]
      );
    }

    const meta = documento.metadata || {};
    const alreadySent = !!meta.whatsapp_sent_at;
    let whatsapp = { enviado: false, omitido: alreadySent, error: null };
    if (!alreadySent) {
      const telefono = op.whatsapp || op.telefono || '';
      if (telefono) {
        const url = `${publicBaseUrl(req)}${documento.archivo_url}`;
        const mensaje = `Hola ${op.nombre || ''} 👋\n\n¡Felicitaciones! Ya quedaste como *OPERADORA CERTIFICADA* en DepiMóvil para *${categoria}*.\n\nTu certificado está disponible acá:\n${url}\n\nGuardalo para tu respaldo. _Equipo DepiMóvil_ ✦`;
        whatsapp = await sendOrQueueOperadoraMessage({
          operadoraId: targetId,
          telefono,
          mensaje,
          tipo: 'certificado_operadora',
        });
        const updatedMeta = {
          ...meta,
          whatsapp_sent_at: whatsapp.enviado ? new Date().toISOString() : null,
          whatsapp_queued_at: whatsapp.enviado ? null : new Date().toISOString(),
          whatsapp_error: whatsapp.error || null,
        };
        const { rows } = await client.query(
          `UPDATE documentos_operadora SET metadata=$1::jsonb, updated_at=NOW() WHERE id=$2 RETURNING *`,
          [JSON.stringify(updatedMeta), documento.id]
        );
        documento = rows[0];
        await client.query(
          `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
           VALUES ($1,$2,'CERTIFICATE_WA','operadora',$3,$4)`,
          [req.user.id || null, req.user.email || null, targetId, `${categoria} — ${whatsapp.enviado ? 'enviado' : 'encolado'}`]
        );
      } else {
        whatsapp = { enviado: false, omitido: false, error: 'La operadora no tiene WhatsApp cargado' };
      }
    }

    await client.query('COMMIT');
    res.status(documento.created_at === documento.updated_at ? 201 : 200).json({
      ok: true,
      documento,
      archivo_url: documento.archivo_url,
      whatsapp,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST certificado error:', err);
    res.status(500).json({ error: 'Error al emitir certificado' });
  } finally {
    client.release();
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

// ─────────────────────────────────────────────
// PATCH /api/operadoras/:id/nivel — subir/bajar nivel progresivo
// ─────────────────────────────────────────────
router.patch('/:id/nivel', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const nivel = parseInt(req.body.nivel, 10);
  if (![1, 2, 3, 4].includes(nivel)) {
    return res.status(400).json({ error: 'Nivel inválido. Debe ser 1, 2, 3 o 4.' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE operadoras SET nivel_operadora=$1, nivel_operadora_updated_at=NOW(), updated_at=NOW()
       WHERE id=$2 RETURNING id, nombre, apellido, nivel_operadora`,
      [nivel, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Operadora no encontrada' });
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'NIVEL_OPERADORA','operadora',$3,$4)`,
      [req.user.id, req.user.email, req.params.id, `Nivel cambiado a ${nivel}: ${rows[0].nombre} ${rows[0].apellido}`]
    ).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH nivel operadora error:', err);
    res.status(500).json({ error: 'Error al actualizar nivel' });
  }
});

// ─────────────────────────────────────────────
// POST /api/operadoras/:id/nivel/auto — evalúa y sube nivel automáticamente
// ─────────────────────────────────────────────
router.post('/:id/nivel/auto', auth, async (req, res) => {
  // Solo la propia operadora o admin puede llamar esto
  if (!isOpsRole(req.user.rol) && String(req.user.operadora_id) !== String(req.params.id)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  try {
    const { rows: opRows } = await pool.query(
      'SELECT id, nivel_operadora FROM operadoras WHERE id=$1',
      [req.params.id]
    );
    if (!opRows.length) return res.status(404).json({ error: 'Operadora no encontrada' });
    const op = opRows[0];
    const nivelActual = op.nivel_operadora || 1;

    // Calcular reservas completadas
    const { rows: resRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM reservas
       WHERE operadora_id=$1 AND estado IN ('completada','finalizada')`,
      [req.params.id]
    );
    const reservasCompletadas = parseInt(resRows[0].cnt, 10);

    // Calcular documentos subidos
    const { rows: docRows } = await pool.query(
      `SELECT COUNT(*) AS cnt FROM documentos_operadora WHERE operadora_id=$1`,
      [req.params.id]
    );
    const tieneDocumentos = parseInt(docRows[0].cnt, 10) > 0;

    // Reglas de nivel automático
    let nivelNuevo = nivelActual;
    if (nivelActual < 2 && tieneDocumentos && reservasCompletadas >= 1) nivelNuevo = 2;
    if (nivelActual < 3 && reservasCompletadas >= 3) nivelNuevo = 3;
    if (nivelActual < 4 && reservasCompletadas >= 10) nivelNuevo = 4;

    if (nivelNuevo !== nivelActual) {
      await pool.query(
        'UPDATE operadoras SET nivel_operadora=$1, nivel_operadora_updated_at=NOW(), updated_at=NOW() WHERE id=$2',
        [nivelNuevo, req.params.id]
      );
    }
    res.json({ nivel_anterior: nivelActual, nivel_nuevo: nivelNuevo, subio: nivelNuevo > nivelActual });
  } catch (err) {
    console.error('POST nivel/auto error:', err);
    res.status(500).json({ error: 'Error al evaluar nivel' });
  }
});

module.exports = router;
