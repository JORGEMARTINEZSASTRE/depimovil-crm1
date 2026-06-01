const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole, isOpsRole } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads/documentos-operadora');
fs.mkdirSync(uploadDir, { recursive: true });

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contratos (
      id                  SERIAL PRIMARY KEY,
      operadora_id        INTEGER REFERENCES operadoras(id) ON DELETE SET NULL,
      maquina_id          INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
      reserva_id          INTEGER REFERENCES reservas(id) ON DELETE SET NULL,
      nombre              VARCHAR(200),
      ci                  VARCHAR(50),
      domicilio           TEXT,
      ciudad              VARCHAR(100),
      maquina             VARCHAR(200),
      serial              VARCHAR(100),
      fecha_inicio        DATE,
      fecha_fin           DATE,
      monto               NUMERIC(12,2) DEFAULT 0,
      moneda              VARCHAR(10)   DEFAULT 'UYU',
      forma_pago          VARCHAR(100)  DEFAULT 'Transferencia bancaria',
      garantia            NUMERIC(12,2) DEFAULT 0,
      estado              VARCHAR(50)   NOT NULL DEFAULT 'activo'
                          CHECK (estado IN ('activo','pendiente','firmado','finalizado','anulado')),
      firmado_en          TIMESTAMP,
      cedula_frente_meta  JSONB,
      cedula_dorso_meta   JSONB,
      obs                 TEXT,
      contenido           TEXT,
      token               VARCHAR(100),
      created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query("ALTER TABLE contratos ALTER COLUMN contenido SET DEFAULT ''");
  await pool.query("UPDATE contratos SET contenido='' WHERE contenido IS NULL");
}

ensureTable().catch(err => console.error('Error creando tabla contratos:', err.message));

function makeContratoToken() {
  return crypto.randomBytes(24).toString('hex');
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

async function ensureDocumentosOperadoraTable(client = pool) {
  await client.query(`
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
  await client.query('CREATE INDEX IF NOT EXISTS idx_documentos_operadora_op_tipo ON documentos_operadora(operadora_id, tipo)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_documentos_operadora_contrato ON documentos_operadora(operadora_id, maquina_id) WHERE tipo = \'contrato\'');
}

ensureDocumentosOperadoraTable().catch(err => console.error('Error preparando documentos_operadora:', err.message));

function buildContratoArchivoHtml(contrato) {
  if (contrato.contenido) {
    return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${escapeHtml(contrato.nombre || `Contrato #${contrato.id}`)}</title></head>
<body><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.55">${escapeHtml(contrato.contenido)}</pre></body>
</html>`;
  }
  const nombre = escapeHtml(contrato.nombre || `${contrato.operadora_nombre || ''} ${contrato.operadora_apellido || ''}`.trim() || `Operadora #${contrato.operadora_id}`);
  const maquina = escapeHtml(contrato.maquina || contrato.maquina_nombre || `Máquina #${contrato.maquina_id || ''}`.trim());
  const ciudad = escapeHtml(contrato.ciudad || '—');
  const fecha = contrato.firmado_en ? new Date(contrato.firmado_en).toLocaleDateString('es-UY') : new Date().toLocaleDateString('es-UY');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Contrato de alquiler - ${nombre}</title>
  <style>body{font-family:Arial,sans-serif;max-width:820px;margin:32px auto;color:#1f2933;line-height:1.55}h1{font-size:22px}.meta{font-size:13px;color:#667085}.firma{margin-top:36px;padding-top:16px;border-top:1px solid #d0d5dd}</style>
</head>
<body>
  <h1>Contrato de alquiler de equipos estéticos profesionales</h1>
  <div class="meta">DEPI MÓVIL URUGUAY · Uruguay 1533, Salto, Uruguay · Firmado digitalmente el ${fecha}</div>
  <p>Comparecen <strong>DEPI MÓVIL URUGUAY</strong>, con domicilio comercial en calle <strong>Uruguay 1533, ciudad de Salto, República Oriental del Uruguay</strong>, en adelante la Empresa, y <strong>${nombre}</strong>, ciudad/departamento <strong>${ciudad}</strong>, en adelante la Operadora.</p>
  <p>La Empresa entrega en alquiler a la Operadora el equipo estético profesional <strong>${maquina}</strong>, para uso exclusivo en tratamientos estéticos profesionales, bajo las instrucciones técnicas, protocolos de seguridad, higiene, asepsia y buenas prácticas indicadas por DepiMóvil Uruguay.</p>
  <p>Cada nueva solicitud, reserva, renovación, extensión, reiteración de alquiler o aceptación de presupuesto realizada por la Operadora implicará la aceptación plena y actualizada del presente contrato, sin necesidad de una nueva firma física por cada operación cuando exista confirmación por WhatsApp, correo electrónico, sistema interno, mensaje digital, pago, recepción del equipo o cualquier otro acto que demuestre aceptación.</p>
  <p>La Operadora será responsable por el uso, custodia, devolución, daños, roturas, robo, pérdida, faltantes, higiene, aplicación profesional, cumplimiento de protocolos y cualquier consecuencia derivada del uso incorrecto o no autorizado del equipo.</p>
  <div class="firma"><strong>POR DEPI MÓVIL URUGUAY</strong><br>Domicilio: Uruguay 1533, Salto, Uruguay<br><br><strong>POR LA OPERADORA:</strong> ${nombre}<br><strong>Ciudad:</strong> ${ciudad}<br><strong>Equipo:</strong> ${maquina}</div>
</body>
</html>`;
}

function contratoContenidoSeguro(data) {
  const contenido = String(data?.contenido || '').trim();
  if (contenido) return contenido;
  return buildContratoArchivoHtml(data)
    .replace(/<style>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000) || 'Contrato de alquiler DepiMovil';
}

function writeContratoDocumentoFile(contrato) {
  const opSlug = slugFilePart(contrato.nombre || `${contrato.operadora_nombre || ''} ${contrato.operadora_apellido || ''}`.trim() || `operadora-${contrato.operadora_id || contrato.id}`);
  const maquinaSlug = slugFilePart(contrato.maquina_codigo || contrato.serial || contrato.maquina || contrato.maquina_nombre || `maquina-${contrato.maquina_id || contrato.id}`);
  const filename = `${opSlug}-contrato-alquiler-${maquinaSlug}-${shortFileCode()}.html`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buildContratoArchivoHtml(contrato), 'utf8');
  return {
    url: `/uploads/documentos-operadora/${filename}`,
    nombre: filename,
    mime: 'text/html',
    size: fs.statSync(filePath).size,
  };
}

async function saveContratoDocumento(client, contrato) {
  if (!contrato.operadora_id) return null;
  const fileData = writeContratoDocumentoFile(contrato);
  await client.query(
    `DELETE FROM documentos_operadora
     WHERE operadora_id=$1 AND tipo='contrato' AND maquina_id IS NOT DISTINCT FROM $2`,
    [contrato.operadora_id, contrato.maquina_id || null]
  );
  const { rows } = await client.query(
    `INSERT INTO documentos_operadora (operadora_id, tipo, maquina_id, archivo_url, firmado_en, created_at, updated_at)
     VALUES ($1,'contrato',$2,$3,$4,NOW(),NOW())
     RETURNING *`,
    [contrato.operadora_id, contrato.maquina_id || null, fileData.url, contrato.firmado_en || new Date().toISOString()]
  );
  return rows[0];
}

// ─────────────────────────────────────────────
// GET /api/contratos — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const params = [];
    let where = '';
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      params.push(req.user.operadora_id);
      where = `WHERE c.operadora_id = $${params.length}`;
    } else if (req.user.rol === 'transportista') {
      return res.json([]);
    } else if (!isOpsRole(req.user.rol)) {
      return res.json([]);
    }
    const { rows } = await pool.query(`
      SELECT c.*,
             o.nombre AS operadora_nombre, o.apellido AS operadora_apellido,
             m.nombre AS maquina_nombre_cat, m.codigo AS maquina_codigo
      FROM contratos c
      LEFT JOIN operadoras o ON o.id = c.operadora_id
      LEFT JOIN maquinas m ON m.id = c.maquina_id
      ${where}
      ORDER BY c.id DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/contratos error:', err);
    res.status(500).json({ error: 'Error al obtener contratos' });
  }
});

// ─────────────────────────────────────────────
// GET /api/contratos/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const params = [req.params.id];
    let query = 'SELECT * FROM contratos WHERE id=$1';
    if (isOperadoraRole(req.user.rol)) {
      params.push(req.user.operadora_id || 0);
      query += ` AND operadora_id = $${params.length}`;
    } else if (req.user.rol === 'transportista') {
      return res.status(403).json({ error: 'Sin permisos para contratos' });
    } else if (!isOpsRole(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para contratos' });
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/contratos/:id error:', err);
    res.status(500).json({ error: 'Error al obtener contrato' });
  }
});

// ─────────────────────────────────────────────
// POST /api/contratos — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    operadora_id, maquina_id, reserva_id,
    nombre, ci, domicilio, ciudad, maquina, serial,
    fecha_inicio, fecha_fin, monto, moneda, forma_pago, garantia,
    firmado, fecha_firma, cedula_frente_meta, cedula_dorso_meta,
    obs, contenido
  } = req.body;

  // Si se marcó como firmado en el formulario, usar estado='firmado'
  const estadoFinal = firmado ? 'firmado' : 'activo';
  const firmadoEn = firmado && fecha_firma ? fecha_firma : firmado ? new Date().toISOString() : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO contratos (
        operadora_id, maquina_id, reserva_id,
        nombre, ci, domicilio, ciudad, maquina, serial,
        fecha_inicio, fecha_fin, monto, moneda, forma_pago, garantia,
        estado, firmado_en, cedula_frente_meta, cedula_dorso_meta, obs, contenido, token
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [
      operadora_id ? parseInt(operadora_id) : null,
      maquina_id ? parseInt(maquina_id) : null,
      reserva_id ? parseInt(reserva_id) : null,
      nombre || null, ci || null, domicilio || null, ciudad || null,
      maquina || null, serial || null,
      fecha_inicio || null, fecha_fin || null,
      parseFloat(monto) || 0, moneda || 'UYU',
      forma_pago || 'Transferencia bancaria',
      parseFloat(garantia) || 0,
      estadoFinal, firmadoEn || null,
      cedula_frente_meta ? JSON.stringify(cedula_frente_meta) : null,
      cedula_dorso_meta ? JSON.stringify(cedula_dorso_meta) : null,
      obs || null, contratoContenidoSeguro({
        contenido,
        nombre,
        ciudad,
        maquina,
        maquina_id,
        operadora_id,
        firmado_en: firmadoEn,
      }),
      makeContratoToken()
    ]);

    let documento = null;
    if (estadoFinal === 'firmado') {
      documento = await saveContratoDocumento(client, rows[0]);
    }

    await client.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'contrato', rows[0].id, nombre || `Contrato #${rows[0].id}`]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...rows[0], documento, archivo_url: documento?.archivo_url || null });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('POST /api/contratos error:', err);
    res.status(500).json({ error: 'Error al crear contrato' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/contratos/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    operadora_id, maquina_id, reserva_id,
    nombre, ci, domicilio, ciudad, maquina, serial,
    fecha_inicio, fecha_fin, monto, moneda, forma_pago, garantia,
    estado, firmado_en, cedula_frente_meta, cedula_dorso_meta, obs, contenido
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: prev } = await client.query('SELECT id FROM contratos WHERE id=$1', [req.params.id]);
    if (!prev.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const { rows } = await client.query(`
      UPDATE contratos SET
        operadora_id=$1, maquina_id=$2, reserva_id=$3,
        nombre=$4, ci=$5, domicilio=$6, ciudad=$7, maquina=$8, serial=$9,
        fecha_inicio=$10, fecha_fin=$11, monto=$12, moneda=$13, forma_pago=$14, garantia=$15,
        estado=$16, firmado_en=$17,
        cedula_frente_meta=$18, cedula_dorso_meta=$19,
        obs=$20, contenido=$21, updated_at=NOW()
      WHERE id=$22
      RETURNING *
    `, [
      operadora_id ? parseInt(operadora_id) : null,
      maquina_id ? parseInt(maquina_id) : null,
      reserva_id ? parseInt(reserva_id) : null,
      nombre || null, ci || null, domicilio || null, ciudad || null,
      maquina || null, serial || null,
      fecha_inicio || null, fecha_fin || null,
      parseFloat(monto) || 0, moneda || 'UYU',
      forma_pago || 'Transferencia bancaria',
      parseFloat(garantia) || 0,
      estado || 'activo', firmado_en || null,
      cedula_frente_meta ? JSON.stringify(cedula_frente_meta) : null,
      cedula_dorso_meta ? JSON.stringify(cedula_dorso_meta) : null,
      obs || null, contratoContenidoSeguro({
        contenido,
        nombre,
        ciudad,
        maquina,
        maquina_id,
        operadora_id,
        firmado_en,
      }),
      req.params.id
    ]);

    let documento = null;
    if ((estado || '').toLowerCase() === 'firmado' || firmado_en) {
      documento = await saveContratoDocumento(client, rows[0]);
    }

    await client.query('COMMIT');
    res.json({ ...rows[0], documento, archivo_url: documento?.archivo_url || null });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/contratos/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar contrato' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// DELETE /api/contratos/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM contratos WHERE id=$1 RETURNING id, nombre',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'contrato', req.params.id, rows[0].nombre || `Contrato #${req.params.id}`]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/contratos/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar contrato' });
  }
});

module.exports = router;
