const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../utils/db');
const { auth, isOperadoraRole, isOpsRole } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads/documentos-operadora');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    cb(null, allowed.has(file.mimetype));
  },
});
const uploadCedulaFields = upload.fields([
  { name: 'frente', maxCount: 1 },
  { name: 'dorso', maxCount: 1 },
]);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function findOperadoraByToken(token) {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT o.*,
            u.metadata->>'documento' AS documento_identidad,
            u.email AS usuario_email
     FROM operadoras o
     LEFT JOIN LATERAL (
       SELECT metadata, email
       FROM usuarios
       WHERE operadora_id = o.id
       ORDER BY id DESC
       LIMIT 1
     ) u ON true
     WHERE o.portal_token = $1
     LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

function slugFilePart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'operadora';
}

function shortFileCode() {
  return `${Date.now().toString(36).slice(-3)}${crypto.randomBytes(2).toString('hex')}`;
}

function makeContratoToken() {
  return crypto.randomBytes(24).toString('hex');
}

function extFromUpload(file) {
  const byName = path.extname(file?.originalname || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(byName)) return byName === '.jpeg' ? '.jpg' : byName;
  const byMime = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };
  return byMime[file?.mimetype] || '.jpg';
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

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function operadoraDireccion(op) {
  const direcciones = parseJsonArray(op.direcciones_entrega);
  const principal = direcciones.find(d => d?.principal) || direcciones[0] || null;
  if (principal?.direccion) {
    return [principal.direccion, principal.localidad || principal.ciudad, principal.departamento, principal.pais]
      .filter(Boolean).join(', ');
  }
  return op.direccion_entrega || '';
}

function renameCedulaUpload(file, op, lado) {
  if (!file) return null;
  const base = slugFilePart(`${op.nombre || ''} ${op.apellido || ''}`.trim() || `operadora-${op.id}`);
  const ext = extFromUpload(file);
  const filename = `${base}-cedula-${lado}-${shortFileCode()}${ext}`;
  const targetPath = path.join(uploadDir, filename);
  fs.renameSync(file.path, targetPath);
  return {
    url: `/uploads/documentos-operadora/${filename}`,
    nombre: filename,
    mime: file.mimetype,
    size: file.size,
  };
}

async function ensureDocumentosOperadoraTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documentos_operadora (
      id SERIAL PRIMARY KEY,
      operadora_id INTEGER NOT NULL REFERENCES operadoras(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      maquina_id INTEGER,
      archivo_url TEXT,
      firmado_en TIMESTAMPTZ,
      ip_firma VARCHAR(120),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_documentos_operadora_op_tipo ON documentos_operadora(operadora_id, tipo)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_documentos_operadora_contrato ON documentos_operadora(operadora_id, maquina_id) WHERE tipo = \'contrato\'');
}

async function saveOperadoraDocumento(client, operadoraId, tipo, fileData) {
  await client.query(
    'DELETE FROM documentos_operadora WHERE operadora_id=$1 AND tipo=$2',
    [operadoraId, tipo]
  );
  const { rows } = await client.query(
    `INSERT INTO documentos_operadora (operadora_id, tipo, archivo_url, created_at, updated_at)
     VALUES ($1,$2,$3,NOW(),NOW())
     RETURNING *`,
    [operadoraId, tipo, fileData.url || '']
  );
  return rows[0];
}

async function saveContratoDocumento(client, { operadoraId, maquinaId, fileData }) {
  await client.query(
    'DELETE FROM documentos_operadora WHERE operadora_id=$1 AND tipo=$2 AND maquina_id IS NOT DISTINCT FROM $3',
    [operadoraId, 'contrato', maquinaId || null]
  );
  const { rows } = await client.query(
    `INSERT INTO documentos_operadora (operadora_id, tipo, maquina_id, archivo_url, firmado_en, created_at, updated_at)
     VALUES ($1,'contrato',$2,$3,NOW(),NOW(),NOW())
     RETURNING *`,
    [operadoraId, maquinaId || null, fileData.url || '']
  );
  return rows[0];
}

function normalizarFirmaDataUrl(value) {
  const str = String(value || '').trim();
  if (!str) return '';
  if (!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(str)) return '';
  if (str.length > 500000) return '';
  return str;
}

function buildContratoHtml({ op, maquina, reserva, firmaDataUrl = '' }) {
  const nombre = escapeHtml(`${op.nombre || ''} ${op.apellido || ''}`.trim() || '______________________________');
  const maquinaNombre = escapeHtml(maquina?.nombre || reserva?.maquina_nombre || 'equipo identificado en la reserva');
  const maquinaCodigo = maquina?.codigo ? ` (${escapeHtml(maquina.codigo)})` : '';
  const fecha = new Date().toLocaleDateString('es-UY');
  const documento = escapeHtml(op.documento_identidad || op.ci || '______________________');
  const direccion = escapeHtml(operadoraDireccion(op) || '______________________________________');
  const ciudadDepartamento = escapeHtml([op.ciudad, op.departamento].filter(Boolean).join(' / ') || '______________________');
  const whatsapp = escapeHtml(op.whatsapp || op.telefono || '______________________');
  const firmaImg = normalizarFirmaDataUrl(firmaDataUrl);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Contrato de alquiler - ${nombre}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:820px;margin:32px auto;color:#1f2933;line-height:1.55}
    h1{font-size:22px;margin-bottom:6px;text-transform:uppercase} h2{font-size:16px;margin-top:24px;text-transform:uppercase}
    .meta{font-size:13px;color:#667085;margin-bottom:24px}
    .firma{margin-top:36px;padding-top:16px;border-top:1px solid #d0d5dd}
    .firmas{display:flex;gap:48px;margin-top:34px}.firmas>div{flex:1}
    .firma-img{display:block;max-width:260px;max-height:95px;margin:8px 0 10px;border-bottom:1px solid #667085}
  </style>
</head>
<body>
  <h1>Contrato de alquiler de equipos estéticos profesionales</h1>
  <div class="meta"><strong>DEPI MÓVIL URUGUAY</strong><br>Alquiler de Equipos de Estética Profesional<br>Dirección: Uruguay 1533, Salto, Uruguay · Firmado digitalmente el ${fecha}</div>
  <p>En la ciudad de <strong>${ciudadDepartamento}</strong>, República Oriental del Uruguay, comparecen:</p>
  <p>Por una parte, <strong>DEPI MÓVIL URUGUAY</strong>, empresa dedicada al alquiler, soporte, capacitación y provisión de aparatología estética profesional, con domicilio comercial en calle <strong>Uruguay 1533, ciudad de Salto, República Oriental del Uruguay</strong>, en adelante denominada “la Empresa”.</p>
  <p>Y por otra parte, la Sra./Sr./Centro Estético <strong>${nombre}</strong>, C.I./RUT <strong>${documento}</strong>, con domicilio en <strong>${direccion}</strong>, ciudad/departamento <strong>${ciudadDepartamento}</strong>, teléfono <strong>${whatsapp}</strong>, en adelante denominada “la Operadora”.</p>
  <p>Ambas partes acuerdan celebrar el presente Contrato de Alquiler de Equipos Estéticos Profesionales, sujeto a las siguientes cláusulas:</p>
  <h2>Primera: Objeto</h2>
  <p>La Empresa entrega en alquiler a la Operadora el equipo estético profesional identificado en la reserva, presupuesto, remito, constancia digital, mensaje de confirmación o documento correspondiente. Equipo: <strong>${maquinaNombre}${maquinaCodigo}</strong>.</p>
  <p>El equipo será destinado exclusivamente a tratamientos estéticos profesionales, respetando las instrucciones técnicas, protocolos de seguridad, higiene, asepsia y buenas prácticas indicadas por DepiMóvil Uruguay.</p>
  <p>El presente contrato podrá aplicarse, entre otros, a equipos de depilación láser, HIFU, ND-YAG, Hollywood Peel, eliminación de tatuajes, radiofrecuencia, criofrecuencia, criolipólisis, bronceado, hidrofacial, EMSculpt, EXILIS 360 u otros equipos incorporados por la Empresa.</p>
  <h2>Segunda: Identificación del equipo</h2>
  <p>El equipo alquilado podrá identificarse mediante presupuesto aceptado, reserva confirmada por WhatsApp, correo electrónico, sistema interno, remito, constancia de entrega, fotografía, número de serie, código interno o descripción técnica.</p>
  <p>La falta de firma de un nuevo documento físico por cada alquiler no afectará la validez del presente contrato cuando exista confirmación escrita, digital, pago, recepción del equipo o cualquier acto que demuestre aceptación de la reserva.</p>
  <h2>Tercera: Duración</h2>
  <p>El contrato tendrá vigencia durante todo el período en que la reserva, jornada, semana, mes, renovación o alquiler se encuentre activo. La duración concreta será la pactada entre las partes para cada operación comercial.</p>
  <h2>Cuarta: Precio y forma de pago</h2>
  <p>La Operadora se obliga a abonar el canon de alquiler pactado para cada equipo, ciudad, período y modalidad de uso. La falta de pago en fecha podrá habilitar a la Empresa a suspender la entrega, cancelar la reserva, exigir la devolución inmediata del equipo o rechazar futuras reservas.</p>
  <h2>Quinta: Entrega del equipo</h2>
  <p>La Empresa entregará el equipo en correcto estado de funcionamiento, con los accesorios necesarios para su uso habitual, salvo acuerdo distinto entre las partes. Si la Operadora no realiza observaciones inmediatas, se entenderá que recibe el equipo en conformidad y en buen estado operativo.</p>
  <h2>Sexta: Máquinas viajeras y envíos al interior</h2>
  <p>DepiMóvil Uruguay trabaja con equipos que pueden circular por distintos departamentos del país. La Operadora deberá recibir y devolver el equipo en el lugar, fecha y horario coordinados, colaborando con su correcto embalaje, manipulación y entrega.</p>
  <h2>Séptima: Responsabilidad durante el traslado</h2>
  <p>Una vez recibido el equipo por la Operadora o por persona autorizada en su nombre, la responsabilidad por su guarda, conservación, uso y devolución recaerá sobre la Operadora hasta su restitución efectiva a la Empresa o entrega al transporte acordado.</p>
  <h2>Octava: Obligaciones de la Operadora</h2>
  <p>La Operadora se obliga a utilizar el equipo solo para tratamientos estéticos profesionales, respetar instrucciones técnicas, mantenerlo en buen estado, no intervenirlo técnicamente, no subalquilarlo ni cederlo a terceros, abonar puntualmente el canon pactado, comunicar fallas de inmediato y responder por daños derivados de mal uso, negligencia, golpes, humedad, transporte inadecuado, uso por terceros o incumplimiento de protocolos.</p>
  <h2>Novena: Obligaciones de la Empresa</h2>
  <p>DepiMóvil Uruguay se obliga a entregar el equipo en condiciones adecuadas, brindar instrucciones generales de uso, proporcionar soporte técnico dentro de los canales disponibles, realizar mantenimiento cuando corresponda y coordinar la logística de envío, retiro o traslado cuando aplique.</p>
  <h2>Décima: Capacitación y uso responsable</h2>
  <p>La Operadora declara conocer que algunos equipos requieren capacitación previa, criterio técnico, experiencia profesional y cumplimiento estricto de protocolos. Si utiliza el equipo sin capacitación adecuada, o permite que un tercero no autorizado lo utilice, asumirá plena responsabilidad.</p>
  <h2>Décima primera: Higiene, asepsia y pacientes</h2>
  <p>La Operadora deberá utilizar el equipo en ambiente adecuado, limpio y seguro. Será responsable exclusiva de higiene, asepsia, desinfección, consentimiento informado, evaluación previa, contraindicaciones y seguimiento posterior.</p>
  <h2>Décima segunda: Daños, roturas, robo o pérdida</h2>
  <p>La Operadora será responsable por cualquier daño, rotura, faltante, pérdida, robo, hurto, extravío o deterioro del equipo y sus accesorios mientras se encuentren bajo su custodia. En caso de daño total o pérdida, deberá abonar el valor de reposición del equipo.</p>
  <h2>Décima tercera: Devolución del equipo</h2>
  <p>Finalizado el período de alquiler, la Operadora deberá devolver el equipo en la fecha, horario, lugar y condiciones acordadas, incluyendo todos los accesorios y elementos entregados. La demora injustificada podrá generar cargos adicionales.</p>
  <h2>Décima cuarta: Reiteración de alquileres</h2>
  <p>Cada nueva solicitud, reserva, renovación, extensión, reiteración de alquiler o aceptación de presupuesto realizada por la Operadora implicará la aceptación plena y actualizada del presente contrato.</p>
  <p>No será necesaria una nueva firma física por cada operación, siempre que exista confirmación por WhatsApp, correo electrónico, sistema interno, mensaje digital, pago de seña, pago total, recepción del equipo o cualquier otro acto que demuestre aceptación.</p>
  <h2>Décima quinta: Cancelaciones y cambios de fecha</h2>
  <p>Las cancelaciones, cambios de fecha o reprogramaciones deberán solicitarse con la mayor anticipación posible y estarán sujetas a disponibilidad de agenda, logística, transporte y reservas ya asumidas.</p>
  <h2>Décima sexta: Soporte técnico y prohibición de intervención</h2>
  <p>La Empresa brindará soporte técnico razonable. La Operadora deberá suspender el uso y comunicarse inmediatamente ante fallas, ruidos anormales, alarmas, pérdida de potencia, calentamiento excesivo o daño en componentes. Cualquier intervención no autorizada hará responsable a la Operadora.</p>
  <h2>Décima séptima: Incumplimiento</h2>
  <p>El incumplimiento de las obligaciones dará derecho a la Empresa a exigir devolución inmediata, suspender futuras reservas, reclamar pagos pendientes, reclamar daños o perjuicios, rescindir el contrato e iniciar acciones correspondientes.</p>
  <h2>Décima octava: Rescisión</h2>
  <p>Cualquiera de las partes podrá rescindir el contrato marco con preaviso mínimo de 30 días, siempre que no existan reservas activas, pagos pendientes, equipos en poder de la Operadora, daños reclamados o compromisos logísticos asumidos.</p>
  <h2>Décima novena: Comunicaciones válidas</h2>
  <p>Las partes acuerdan como medios válidos de comunicación: WhatsApp, correo electrónico, sistemas internos de gestión, documentos digitales, formularios de reserva, firma electrónica, firma digital o cualquier otro medio escrito aceptado por ambas partes.</p>
  <h2>Vigésima: Firma electrónica y aceptación digital</h2>
  <p>Las partes reconocen la validez de la firma electrónica, firma digital, aceptación por WhatsApp, correo electrónico, formularios digitales, confirmación por mensaje, pago de seña, pago total o recepción del equipo como mecanismos válidos de aceptación.</p>
  <h2>Vigésima primera: Jurisdicción y ley aplicable</h2>
  <p>El presente contrato se regirá por las leyes de la República Oriental del Uruguay. Ante cualquier diferencia, las partes procurarán una solución amistosa y de buena fe; de no alcanzarse acuerdo, se someterán a los juzgados competentes.</p>
  <h2>Vigésima segunda: Aceptación final</h2>
  <p>Leído el presente contrato, y en señal de conformidad, las partes lo aceptan en todos sus términos, ya sea mediante firma física, firma electrónica, firma digital, aceptación por mensaje, confirmación de reserva, pago, recepción del equipo o cualquier otro medio fehaciente de aceptación.</p>
  <div class="firma">
    <div class="firmas">
      <div><strong>POR DEPI MÓVIL URUGUAY</strong><br>Firma: _______________________________<br>Aclaración: ___________________________<br>Cargo: _______________________________<br>Domicilio: Uruguay 1533, Salto, Uruguay<br>Fecha: ${fecha}</div>
      <div><strong>POR LA OPERADORA</strong><br>${firmaImg ? `<img class="firma-img" src="${firmaImg}" alt="Firma de la operadora">` : 'Firma: _______________________________<br>'}Nombre completo: ${nombre}<br>C.I./RUT: ${documento}<br>Ciudad/Departamento: ${ciudadDepartamento}<br>Teléfono: ${whatsapp}<br>Fecha: ${fecha}</div>
    </div>
  </div>
</body>
</html>`;
}

function writeContratoFile({ op, maquina, reserva, firmaDataUrl = '' }) {
  const opSlug = slugFilePart(`${op.nombre || ''} ${op.apellido || ''}`.trim() || `operadora-${op.id}`);
  const maquinaSlug = slugFilePart(maquina?.codigo || maquina?.nombre || `maquina-${maquina?.id || 'sin-maquina'}`);
  const filename = `${opSlug}-contrato-alquiler-${maquinaSlug}-${shortFileCode()}.html`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buildContratoHtml({ op, maquina, reserva, firmaDataUrl }), 'utf8');
  return {
    url: `/uploads/documentos-operadora/${filename}`,
    nombre: filename,
    mime: 'text/html',
    size: fs.statSync(filePath).size,
  };
}

ensureDocumentosOperadoraTable().catch(err => {
  console.error('Error preparando documentos_operadora:', err.message);
});

// ─────────────────────────────────────────────
// GET /api/portal/:token — bootstrap del portal de operadora
// ─────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  try {
    const op = await findOperadoraByToken(req.params.token);
    if (!op) return res.status(404).json({ error: 'Token inválido o expirado' });

    // Documentos subidos
    const { rows: docs } = await pool.query(
      'SELECT * FROM documentos_operadora WHERE operadora_id = $1 ORDER BY created_at DESC',
      [op.id]
    ).catch(() => ({ rows: [] }));

    // Reservas activas
    const { rows: reservas } = await pool.query(`
      SELECT r.id, r.codigo, r.tipo, r.fecha_inicio, r.fecha_fin, r.fecha_jornada, r.estado,
             r.monto, r.moneda, r.dept_logistica,
             m.nombre AS maquina_nombre, m.codigo AS maquina_codigo, m.id AS maquina_id,
             m.categoria AS maquina_categoria, m.foto_url AS maquina_foto_url
      FROM reservas r
      LEFT JOIN maquinas m ON m.id = r.maquina_id
      WHERE r.operadora_id = $1
        AND r.estado IN ('aprobada','confirmada','solicitud_recibida','pendiente_aprobacion')
      ORDER BY r.fecha_inicio DESC
    `, [op.id]).catch(() => ({ rows: [] }));

    // Contratos firmados
    const { rows: contratos } = await pool.query(
      'SELECT id, maquina_id, estado, firmado_en FROM contratos WHERE operadora_id = $1',
      [op.id]
    ).catch(() => ({ rows: [] }));

    res.json({
      operadora: {
        id: op.id,
        nombre: op.nombre,
        apellido: op.apellido,
        whatsapp: op.whatsapp,
        telefono: op.telefono,
        email: op.email || op.usuario_email || '',
        ciudad: op.ciudad,
        departamento: op.departamento,
        pais: op.pais,
        direccion_entrega: op.direccion_entrega,
        direcciones_entrega: op.direcciones_entrega,
        documento_identidad: op.documento_identidad || '',
      },
      cedula: docs.filter(d => ['cedula', 'cedula_dorso'].includes(d.tipo)),
      reservas_activas: reservas,
      contratos,
    });
  } catch (err) {
    console.error('GET /api/portal/:token error:', err);
    res.status(500).json({ error: 'Error al cargar el portal' });
  }
});

// ─────────────────────────────────────────────
// POST /api/portal/:token/cedula — subir cédula
// ─────────────────────────────────────────────
router.post('/:token/cedula', (req, res, next) => {
  uploadCedulaFields(req, res, err => {
    if (!err) return next();
    const isSize = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({
      error: isSize ? 'La foto no puede superar 10 MB' : 'Archivo inválido. Usá JPG, PNG, WebP o PDF.'
    });
  });
}, async (req, res) => {
  const client = await pool.connect();
  try {
    const op = await findOperadoraByToken(req.params.token);
    if (!op) return res.status(404).json({ error: 'Token inválido' });

    const frenteFile = req.files?.frente?.[0] || null;
    const dorsoFile = req.files?.dorso?.[0] || null;
    const frente = frenteFile ? renameCedulaUpload(frenteFile, op, 'frente') : req.body?.frente;
    const dorso = dorsoFile ? renameCedulaUpload(dorsoFile, op, 'dorso') : req.body?.dorso;

    if (!frente && !dorso) {
      return res.status(400).json({ error: 'No se recibieron documentos válidos' });
    }

    const saved = [];
    await client.query('BEGIN');
    if (frente) {
      saved.push(await saveOperadoraDocumento(client, op.id, 'cedula', frente));
    }
    if (dorso) {
      saved.push(await saveOperadoraDocumento(client, op.id, 'cedula_dorso', dorso));
    }
    await client.query('COMMIT');

    res.json({ ok: true, mensaje: 'Documentos guardados', documentos: saved, archivo_url: frente?.url || dorso?.url || '' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('POST /api/portal/:token/cedula error:', err);
    res.status(500).json({ error: 'Error al subir documentos' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// POST /api/portal/:token/contrato/:maquinaId — firmar contrato
// ─────────────────────────────────────────────
router.post('/:token/contrato/:maquinaId', async (req, res) => {
  const client = await pool.connect();
  try {
    const op = await findOperadoraByToken(req.params.token);
    if (!op) return res.status(404).json({ error: 'Token inválido' });

    const maquinaId = parseInt(req.params.maquinaId, 10) || 0;
    const firmaDataUrl = normalizarFirmaDataUrl(req.body?.firma_data_url);
    if (!firmaDataUrl) {
      return res.status(400).json({ error: 'Dibujá tu firma antes de confirmar el contrato' });
    }

    let reserva = null;
    let maquina = null;
    if (maquinaId > 0) {
      const { rows: reservas } = await client.query(`
        SELECT r.id, r.codigo, r.fecha_inicio, r.fecha_fin, r.fecha_jornada,
               m.id AS maquina_id, m.nombre AS maquina_nombre, m.codigo AS maquina_codigo
        FROM reservas r
        LEFT JOIN maquinas m ON m.id = r.maquina_id
        WHERE r.operadora_id=$1 AND r.maquina_id=$2
          AND estado IN ('aprobada','confirmada','solicitud_recibida','pendiente_aprobacion')
        LIMIT 1
      `, [op.id, maquinaId]);
      if (!reservas.length) {
        return res.status(400).json({ error: 'No hay reserva activa para esta máquina' });
      }
      reserva = reservas[0];
      maquina = { id: maquinaId, nombre: reserva.maquina_nombre, codigo: reserva.maquina_codigo };
    }

    // Buscar contrato existente o crear uno
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      'SELECT id FROM contratos WHERE operadora_id=$1 AND maquina_id IS NOT DISTINCT FROM $2 LIMIT 1',
      [op.id, maquinaId || null]
    );

    let contratoId;
    const contratoContenido = buildContratoHtml({ op, maquina, reserva, firmaDataUrl });
    if (existing.length) {
      const { rows } = await client.query(
        `UPDATE contratos SET estado='firmado', firmado_en=NOW(), contenido=$2, updated_at=NOW() WHERE id=$1 RETURNING id`,
        [existing[0].id, contratoContenido]
      );
      contratoId = rows[0].id;
    } else {
      const { rows } = await client.query(`
        INSERT INTO contratos (operadora_id, maquina_id, estado, firmado_en, nombre, ciudad, token, contenido)
        VALUES ($1,$2,'firmado',NOW(),$3,$4,$5,$6)
        RETURNING id
      `, [op.id, maquinaId || null, `${op.nombre} ${op.apellido}`, op.ciudad || '', makeContratoToken(), contratoContenido]);
      contratoId = rows[0].id;
    }
    const contratoFile = writeContratoFile({ op, maquina, reserva, firmaDataUrl });
    const contratoDoc = await saveContratoDocumento(client, { operadoraId: op.id, maquinaId, fileData: contratoFile });
    await client.query('COMMIT');

    res.json({ ok: true, mensaje: 'Contrato firmado correctamente', contrato_id: contratoId, firmado_en: new Date().toISOString(), documento: contratoDoc, archivo_url: contratoFile.url });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('POST /api/portal/:token/contrato/:maquinaId error:', err);
    res.status(500).json({ error: 'Error al firmar contrato' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// GET /api/portal/docs/:operadoraId — admin: documentos de una operadora
// Usado por el módulo de documentos del CRM
// ─────────────────────────────────────────────
router.get('/docs/:operadoraId', auth, async (req, res) => {
  try {
    if (isOperadoraRole(req.user.rol) && parseInt(req.params.operadoraId) !== parseInt(req.user.operadora_id)) {
      return res.status(403).json({ error: 'Sin permisos para documentos de otra operadora' });
    }
    if (req.user.rol === 'transportista') return res.json([]);
    if (!isOperadoraRole(req.user.rol) && !isOpsRole(req.user.rol)) return res.json([]);
    const { rows } = await pool.query(
      'SELECT * FROM documentos_operadora WHERE operadora_id=$1 ORDER BY created_at DESC',
      [req.params.operadoraId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/portal/docs/:id error:', err);
    // Si la tabla no existe aún, devolver array vacío
    res.json([]);
  }
});

module.exports = router;
