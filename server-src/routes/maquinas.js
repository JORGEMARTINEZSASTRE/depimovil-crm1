const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole, isOpsRole } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads/maquinas');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    cb(null, allowed.has(file.mimetype));
  },
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function normalizarLocalidad(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function localidadesOperadora(row) {
  const values = [row?.ciudad, row?.localidad];
  parseJsonArray(row?.direcciones_entrega).forEach(d => {
    values.push(d.localidad, d.ciudad, d.departamento);
  });
  return Array.from(new Set(values.map(normalizarLocalidad).filter(Boolean)));
}

function localidadMaquina(row) {
  const tipo = row?.tipo_operativo === 'alquiler' ? 'viajera' : (row?.tipo_operativo || (row?.es_viajera ? 'viajera' : 'base_ciudad'));
  return normalizarLocalidad(tipo === 'base_ciudad' ? (row?.ciudad_base || row?.ubicacion) : (row?.ubicacion || row?.ciudad_base));
}

function maquinaVisibleParaLocalidades(row, localidades) {
  if (!row || row.tipo_operativo === 'solo_venta') return false;
  const loc = localidadMaquina(row);
  return !!(localidades.length && loc && localidades.includes(loc));
}

function isViajera(row) {
  const tipo = row?.tipo_operativo === 'alquiler' ? 'viajera' : (row?.tipo_operativo || (row?.es_viajera ? 'viajera' : 'base_ciudad'));
  return tipo === 'viajera' || tipo === 'alquiler' || !!row?.es_viajera;
}

async function getTransportistaPersonaFisica(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, whatsapp, telefono, tipo, estado
     FROM transportistas
     WHERE id=$1 AND tipo='persona_fisica' AND estado='activo'`,
    [id]
  );
  return rows[0] || null;
}

async function notifyPuestaPunto(transportista, maquina) {
  const telefono = transportista?.whatsapp || transportista?.telefono;
  if (!telefono) return { status: 'sin_telefono' };
  if (maquina.puesta_punto_wa_key && maquina.puesta_punto_wa_notificado_en) {
    return { status: 'duplicado', key: maquina.puesta_punto_wa_key };
  }
  try {
    const { enviarMensaje } = require('../utils/wa_sender');
    const { encolar } = require('../utils/wa_queue');
    const mensaje = `Hola ${transportista.nombre || ''} 👋\n\nDepiMóvil te asignó una *puesta a punto de máquina viajera*.\n\nMáquina: *${maquina.codigo} — ${maquina.nombre}*\nUbicación/base estética: *${maquina.ubicacion || 'a confirmar'}*\n\nPor favor realizar:\n1. Limpieza exterior y accesorios.\n2. Revisión visual de cabezales/cables.\n3. Control de piezas y elementos entregados.\n4. Avisar cualquier daño o faltante.\n\nCuando esté lista, entrá al CRM y tocá *Dar alta disponible* en la ficha de la máquina.\n\nTambién podés responder *LISTA* por WhatsApp para dejar constancia en la conversación.`;
    const envio = await enviarMensaje(telefono, mensaje);
    if (envio?.ok) return { status: 'enviado', messageId: envio.messageId || null };
    await encolar({ telefono, mensaje, tipo: 'puesta_punto_maquina', maquinaId: maquina.id });
    return { status: 'encolado', error: envio?.error || null };
  } catch (err) {
    console.error('notifyPuestaPunto error:', err.message);
    return { status: 'error', error: err.message };
  }
}

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS maquinas (
      id           SERIAL PRIMARY KEY,
      codigo       VARCHAR(50)  NOT NULL UNIQUE,
      nombre       VARCHAR(200) NOT NULL,
      categoria    VARCHAR(100) DEFAULT 'Láser Depilación',
      ubicacion    VARCHAR(200),
      estado       VARCHAR(50)  NOT NULL DEFAULT 'disponible'
                   CHECK (estado IN ('disponible','reservada','mantenimiento','fuera_servicio','en_viaje')),
      serial_num   VARCHAR(100),
      marca        VARCHAR(100),
      modelo       VARCHAR(100),
      dept_base    VARCHAR(100) DEFAULT 'Uruguay',
      ult_mant     DATE,
      prox_mant    DATE,
      foto_url     TEXT,
      icono_url    TEXT,
      es_viajera   BOOLEAN DEFAULT FALSE,
      tipo_operativo VARCHAR(50) NOT NULL DEFAULT 'alquiler',
      ciudad_base  VARCHAR(100),
      obs          TEXT,
      created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS foto_url TEXT');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS icono_url TEXT');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS es_viajera BOOLEAN DEFAULT FALSE');
  await client.query("ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tipo_operativo VARCHAR(50) NOT NULL DEFAULT 'alquiler'");
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS ciudad_base VARCHAR(100)');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS gestor_puesta_punto_id INTEGER');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_estado VARCHAR(50)');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_asignada_en TIMESTAMP');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_completada_en TIMESTAMP');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_estado VARCHAR(50)');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_nombre VARCHAR(160)');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_salida_en TIMESTAMP');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_regreso_en TIMESTAMP');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS disponibilidad_visible_gestor BOOLEAN DEFAULT FALSE');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_key VARCHAR(180)');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_notificado_en TIMESTAMP');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_estado VARCHAR(50)');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_error TEXT');
  await client.query("ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_checklist JSONB DEFAULT '{}'::jsonb");
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_checklist_en TIMESTAMP');
  await client.query('ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_checklist_responsable VARCHAR(200)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_maquinas_gestor_puesta_punto ON maquinas(gestor_puesta_punto_id, puesta_punto_estado)');
  await client.query(`
    CREATE TABLE IF NOT EXISTS maquina_movimientos (
      id SERIAL PRIMARY KEY,
      maquina_id INTEGER NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
      tipo VARCHAR(80) NOT NULL,
      estado_anterior VARCHAR(80),
      estado_nuevo VARCHAR(80),
      ubicacion TEXT,
      gestor_id INTEGER,
      tecnico_nombre VARCHAR(160),
      detalle TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      usuario_id INTEGER,
      usuario_email VARCHAR(200),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_maquina_movimientos_maquina ON maquina_movimientos(maquina_id, created_at DESC)');
  await client.query(`
    CREATE TABLE IF NOT EXISTS maquina_incidencias (
      id SERIAL PRIMARY KEY,
      maquina_id INTEGER NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
      reserva_id INTEGER,
      operadora_id INTEGER,
      tipo VARCHAR(80) NOT NULL DEFAULT 'falla_tecnica',
      gravedad VARCHAR(30) NOT NULL DEFAULT 'media',
      estado VARCHAR(40) NOT NULL DEFAULT 'abierta',
      descripcion TEXT NOT NULL,
      evidencia_url TEXT,
      resolucion TEXT,
      bloquea_reservas BOOLEAN DEFAULT FALSE,
      estado_maquina_anterior VARCHAR(50),
      reportado_por_id INTEGER,
      reportado_por_email VARCHAR(200),
      responsable_id INTEGER,
      responsable_email VARCHAR(200),
      cerrada_en TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_maquina_incidencias_maquina ON maquina_incidencias(maquina_id, estado, created_at DESC)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_maquina_incidencias_reserva ON maquina_incidencias(reserva_id)');
  await client.query(`
    CREATE TABLE IF NOT EXISTS maquina_categorias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL UNIQUE,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  const categorias = [
    'Láser Depilación', 'Radiofrecuencia / HIFU', 'IPL', 'Pressoterapia',
    'Hidrofacial', 'Electroestimulación', 'Ultrasonido', 'Cavitación',
    'Diodo + NDYAG', 'Otro'
  ];
  for (const nombre of categorias) {
    await client.query(
      `INSERT INTO maquina_categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`,
      [nombre]
    );
  }
}

ensureTable(pool).catch(err => console.error('Error preparando tabla maquinas:', err.message));

async function registrarMovimientoMaquina(client, { maquinaId, tipo, estadoAnterior, estadoNuevo, ubicacion, gestorId, tecnicoNombre, detalle, metadata, user }) {
  await client.query(
    `INSERT INTO maquina_movimientos (
       maquina_id, tipo, estado_anterior, estado_nuevo, ubicacion,
       gestor_id, tecnico_nombre, detalle, metadata, usuario_id, usuario_email
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
    [
      maquinaId,
      tipo,
      estadoAnterior || null,
      estadoNuevo || null,
      ubicacion || null,
      gestorId || null,
      tecnicoNombre || null,
      detalle || null,
      JSON.stringify(metadata || {}),
      user?.id || null,
      user?.email || null,
    ]
  );
}

function normalizarChecklistPuestaPunto(value) {
  const raw = value && typeof value === 'object' ? value : {};
  const items = [
    ['limpieza_exterior', 'Limpieza exterior realizada'],
    ['limpieza_cabezales', 'Cabezales y accesorios limpios'],
    ['cables_conectores', 'Cableado y conectores revisados'],
    ['prueba_encendido', 'Prueba de encendido correcta'],
    ['prueba_funcional', 'Prueba funcional básica correcta'],
    ['accesorios_controlados', 'Piezas y accesorios controlados'],
    ['foto_post_limpieza', 'Foto post limpieza cargada o verificada'],
  ];
  const checklist = {};
  const faltantes = [];
  for (const [key, label] of items) {
    checklist[key] = raw[key] === true || raw[key] === 'true' || raw[key] === 1 || raw[key] === '1';
    if (!checklist[key]) faltantes.push(label);
  }
  return { checklist, faltantes };
}

async function assertCanViewMachine(req, maquinaId, scope = 'máquinas') {
  if (req.user.rol === 'transportista' && !req.user.transportista_id) {
    const err = new Error(`Sin permisos para ${scope}`);
    err.status = 403;
    throw err;
  }
  if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') {
    const err = new Error(`Sin permisos para ${scope}`);
    err.status = 403;
    throw err;
  }
  const { rows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [maquinaId]);
  if (!rows.length) {
    const err = new Error('Máquina no encontrada');
    err.status = 404;
    throw err;
  }
  const maquina = rows[0];
  if (req.user.rol === 'transportista') {
    const visible = parseInt(maquina.gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
      && maquina.disponibilidad_visible_gestor;
    if (!visible) {
      const err = new Error('Máquina no asignada a este gestor');
      err.status = 403;
      throw err;
    }
  }
  if (isOperadoraRole(req.user.rol)) {
    if (!req.user.operadora_id) {
      const err = new Error(`Sin permisos para ${scope}`);
      err.status = 403;
      throw err;
    }
    const { rows: opRows } = await pool.query(
      `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
      [req.user.operadora_id]
    );
    if (!maquinaVisibleParaLocalidades(maquina, localidadesOperadora(opRows[0]))) {
      const err = new Error('Máquina no disponible para tus localidades declaradas');
      err.status = 403;
      throw err;
    }
  }
  return maquina;
}

function incidenciaBloqueaReservas(gravedad, bloquea) {
  return bloquea === true || ['alta', 'critica'].includes(String(gravedad || '').toLowerCase());
}

// ─────────────────────────────────────────────
// GET /api/maquinas/categorias — listar categorías
// ─────────────────────────────────────────────
router.get('/categorias', auth, async (req, res) => {
  try {
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') return res.json([]);
    const { rows } = await pool.query(`
      SELECT nombre FROM maquina_categorias WHERE activo = TRUE
      UNION
      SELECT DISTINCT categoria AS nombre FROM maquinas WHERE categoria IS NOT NULL AND trim(categoria) <> ''
      ORDER BY nombre
    `);
    res.json(rows.map(r => r.nombre));
  } catch (err) {
    console.error('GET /api/maquinas/categorias error:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/categorias — crear categoría
// ─────────────────────────────────────────────
router.post('/categorias', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'Nombre de categoría requerido' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO maquina_categorias (nombre) VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET activo=TRUE
       RETURNING nombre`,
      [nombre]
    );
    res.status(201).json({ nombre: rows[0].nombre });
  } catch (err) {
    console.error('POST /api/maquinas/categorias error:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// ─────────────────────────────────────────────
// GET /api/maquinas/siguiente-codigo — próximo código OP disponible
// ─────────────────────────────────────────────
router.get('/siguiente-codigo', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(MAX((substring(codigo FROM '^OP-([0-9]+)$'))::int), 0) + 1 AS siguiente
      FROM maquinas
      WHERE codigo ~ '^OP-[0-9]+$'
    `);
    const n = Number(rows[0]?.siguiente || 1);
    res.json({ codigo: `OP-${String(n).padStart(3, '0')}` });
  } catch (err) {
    console.error('GET /api/maquinas/siguiente-codigo error:', err);
    res.status(500).json({ error: 'Error al calcular próximo código' });
  }
});

// ─────────────────────────────────────────────
// GET /api/maquinas — listar todas
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && !req.user.transportista_id) return res.json([]);
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol)) return res.json([]);
    let localidades = null;
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      const { rows: opRows } = await pool.query(
        `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
        [req.user.operadora_id]
      );
      localidades = localidadesOperadora(opRows[0]);
      if (!localidades.length) return res.json([]);
    }
    const { rows } = await pool.query(`
      SELECT id, codigo, nombre, categoria, ubicacion, estado,
             serial_num, marca, modelo, dept_base,
             ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs,
             gestor_puesta_punto_id, puesta_punto_estado, puesta_punto_asignada_en, puesta_punto_completada_en,
             puesta_punto_wa_estado, puesta_punto_wa_notificado_en, puesta_punto_wa_error,
             puesta_punto_checklist, puesta_punto_checklist_en, puesta_punto_checklist_responsable,
             tecnico_estado, tecnico_nombre, tecnico_salida_en, tecnico_regreso_en, disponibilidad_visible_gestor,
             created_at, updated_at
      FROM maquinas
      ORDER BY codigo
    `);
    if (req.user.rol === 'transportista') {
      return res.json(rows.filter(row =>
        parseInt(row.gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
        && row.disponibilidad_visible_gestor
      ));
    }
    res.json(localidades ? rows.filter(row => maquinaVisibleParaLocalidades(row, localidades)) : rows);
  } catch (err) {
    console.error('GET /api/maquinas error:', err);
    res.status(500).json({ error: 'Error al obtener máquinas' });
  }
});

// ─────────────────────────────────────────────
// GET /api/maquinas/:id — obtener una
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && !req.user.transportista_id) return res.status(403).json({ error: 'Sin permisos para máquinas' });
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') return res.status(403).json({ error: 'Sin permisos para máquinas' });
    const { rows } = await pool.query(
      'SELECT * FROM maquinas WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (req.user.rol === 'transportista') {
      const visible = parseInt(rows[0].gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
        && rows[0].disponibilidad_visible_gestor;
      if (!visible) return res.status(403).json({ error: 'Máquina no asignada a este gestor' });
      return res.json(rows[0]);
    }
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.status(403).json({ error: 'Sin permisos para máquinas' });
      const { rows: opRows } = await pool.query(
        `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
        [req.user.operadora_id]
      );
      const localidades = localidadesOperadora(opRows[0]);
      if (!maquinaVisibleParaLocalidades(rows[0], localidades)) {
        return res.status(403).json({ error: 'Máquina no disponible para tus localidades declaradas' });
      }
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/maquinas/:id error:', err);
    res.status(500).json({ error: 'Error al obtener máquina' });
  }
});

// ─────────────────────────────────────────────
// GET /api/maquinas/:id/movimientos — historial operativo de una máquina
// ─────────────────────────────────────────────
router.get('/:id/movimientos', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && !req.user.transportista_id) return res.status(403).json({ error: 'Sin permisos para historial' });
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') {
      return res.status(403).json({ error: 'Sin permisos para historial' });
    }
    const { rows: maqRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    if (!maqRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (req.user.rol === 'transportista') {
      const visible = parseInt(maqRows[0].gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
        && maqRows[0].disponibilidad_visible_gestor;
      if (!visible) return res.status(403).json({ error: 'Máquina no asignada a este gestor' });
    }
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.status(403).json({ error: 'Sin permisos para historial' });
      const { rows: opRows } = await pool.query(
        `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
        [req.user.operadora_id]
      );
      if (!maquinaVisibleParaLocalidades(maqRows[0], localidadesOperadora(opRows[0]))) {
        return res.status(403).json({ error: 'Máquina no disponible para tus localidades declaradas' });
      }
    }
    const { rows } = await pool.query(
      `SELECT mv.*, t.nombre AS gestor_nombre
       FROM maquina_movimientos mv
       LEFT JOIN transportistas t ON t.id = mv.gestor_id
       WHERE mv.maquina_id=$1
       ORDER BY mv.created_at DESC
       LIMIT 80`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET maquina movimientos error:', err);
    res.status(500).json({ error: 'Error al obtener historial de máquina' });
  }
});

// ─────────────────────────────────────────────
// GET /api/maquinas/:id/incidencias — incidencias técnicas
// ─────────────────────────────────────────────
router.get('/:id/incidencias', auth, async (req, res) => {
  try {
    await assertCanViewMachine(req, req.params.id, 'incidencias');
    const { rows } = await pool.query(
      `SELECT i.*,
              r.codigo AS reserva_codigo,
              o.nombre AS operadora_nombre,
              o.apellido AS operadora_apellido
       FROM maquina_incidencias i
       LEFT JOIN reservas r ON r.id = i.reserva_id
       LEFT JOIN operadoras o ON o.id = COALESCE(i.operadora_id, r.operadora_id)
       WHERE i.maquina_id=$1
       ORDER BY CASE i.estado WHEN 'abierta' THEN 0 WHEN 'en_revision' THEN 1 ELSE 2 END,
                i.created_at DESC
       LIMIT 80`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET maquina incidencias error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al obtener incidencias de máquina' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/:id/incidencias — registrar incidencia
// ─────────────────────────────────────────────
router.post('/:id/incidencias', auth, async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const tipo = String(req.body.tipo || 'falla_tecnica').trim();
  const gravedad = String(req.body.gravedad || 'media').trim().toLowerCase();
  const descripcion = String(req.body.descripcion || '').trim();
  const evidenciaUrl = String(req.body.evidencia_url || '').trim();
  const reservaId = req.body.reserva_id ? parseInt(req.body.reserva_id, 10) : null;
  const operadoraId = req.body.operadora_id ? parseInt(req.body.operadora_id, 10) : (isOperadoraRole(req.user.rol) ? req.user.operadora_id : null);
  const bloqueaReservas = incidenciaBloqueaReservas(gravedad, req.body.bloquea_reservas === true);
  if (!descripcion) return res.status(400).json({ error: 'Descripción de la incidencia requerida' });
  if (!['baja', 'media', 'alta', 'critica'].includes(gravedad)) return res.status(400).json({ error: 'Gravedad inválida' });
  try {
    const maquina = await assertCanViewMachine(req, maquinaId, 'incidencias');
    if (reservaId) {
      const { rows: reservaRows } = await pool.query('SELECT id, maquina_id, operadora_id FROM reservas WHERE id=$1', [reservaId]);
      if (!reservaRows.length || parseInt(reservaRows[0].maquina_id, 10) !== maquinaId) {
        return res.status(400).json({ error: 'La reserva indicada no corresponde a esta máquina' });
      }
    }
    const { rows } = await pool.query(
      `INSERT INTO maquina_incidencias (
         maquina_id, reserva_id, operadora_id, tipo, gravedad, estado, descripcion,
         evidencia_url, bloquea_reservas, estado_maquina_anterior,
         reportado_por_id, reportado_por_email, responsable_id, responsable_email
       ) VALUES ($1,$2,$3,$4,$5,'abierta',$6,NULLIF($7,''),$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        maquinaId, reservaId, operadoraId, tipo, gravedad, descripcion,
        evidenciaUrl, bloqueaReservas, maquina.estado,
        req.user.id || null, req.user.email || null,
        isOpsRole(req.user.rol) ? req.user.id : null,
        isOpsRole(req.user.rol) ? req.user.email : null,
      ]
    );
    if (bloqueaReservas && !['fuera_servicio', 'en_viaje'].includes(maquina.estado)) {
      await pool.query('UPDATE maquinas SET estado=$1, updated_at=NOW() WHERE id=$2', ['fuera_servicio', maquinaId]);
    }
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'INCIDENCIA_TECNICA_CREADA','maquina_incidencia',$3,$4)`,
      [req.user.id, req.user.email, rows[0].id, `${maquina.codigo} — ${maquina.nombre}: ${gravedad}`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId,
      tipo: 'incidencia_creada',
      estadoAnterior: maquina.estado,
      estadoNuevo: bloqueaReservas ? 'fuera_servicio' : maquina.estado,
      ubicacion: maquina.ubicacion,
      detalle: `Incidencia técnica ${gravedad}: ${descripcion}`,
      metadata: { incidencia_id: rows[0].id, reserva_id: reservaId, operadora_id: operadoraId, tipo, gravedad, bloquea_reservas: bloqueaReservas },
      user: req.user,
    }).catch(() => {});
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST maquina incidencia error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al registrar incidencia técnica' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/maquinas/:id/incidencias/:incidenciaId — actualizar/cerrar
// ─────────────────────────────────────────────
router.patch('/:id/incidencias/:incidenciaId', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const incidenciaId = parseInt(req.params.incidenciaId, 10);
  const estado = String(req.body.estado || '').trim();
  const resolucion = String(req.body.resolucion || '').trim();
  if (!['abierta', 'en_revision', 'resuelta', 'descartada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado de incidencia inválido' });
  }
  try {
    const maquina = await assertCanViewMachine(req, maquinaId, 'incidencias');
    const { rows: prevRows } = await pool.query(
      'SELECT * FROM maquina_incidencias WHERE id=$1 AND maquina_id=$2',
      [incidenciaId, maquinaId]
    );
    if (!prevRows.length) return res.status(404).json({ error: 'Incidencia no encontrada' });
    const cerrada = ['resuelta', 'descartada'].includes(estado);
    const { rows } = await pool.query(
      `UPDATE maquina_incidencias SET
         estado=$1,
         resolucion=CASE WHEN $2='' THEN resolucion ELSE $2 END,
         responsable_id=$3,
         responsable_email=$4,
         cerrada_en=CASE WHEN $5 THEN COALESCE(cerrada_en,NOW()) ELSE NULL END,
         updated_at=NOW()
       WHERE id=$6 AND maquina_id=$7
       RETURNING *`,
      [estado, resolucion, req.user.id || null, req.user.email || null, cerrada, incidenciaId, maquinaId]
    );
    if (cerrada && prevRows[0].bloquea_reservas) {
      const { rows: abiertas } = await pool.query(
        `SELECT id FROM maquina_incidencias
         WHERE maquina_id=$1 AND bloquea_reservas=TRUE AND estado IN ('abierta','en_revision') AND id<>$2
         LIMIT 1`,
        [maquinaId, incidenciaId]
      );
      const estadoPrevio = prevRows[0].estado_maquina_anterior || 'disponible';
      if (!abiertas.length && maquina.estado === 'fuera_servicio' && ['disponible', 'reservada', 'mantenimiento'].includes(estadoPrevio)) {
        await pool.query('UPDATE maquinas SET estado=$1, updated_at=NOW() WHERE id=$2', [estadoPrevio, maquinaId]);
      }
    }
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'INCIDENCIA_TECNICA_ACTUALIZADA','maquina_incidencia',$3,$4)`,
      [req.user.id, req.user.email, incidenciaId, `Incidencia ${incidenciaId}: ${estado}`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId,
      tipo: cerrada ? 'incidencia_cerrada' : 'incidencia_actualizada',
      estadoAnterior: maquina.estado,
      estadoNuevo: cerrada && prevRows[0].bloquea_reservas ? (prevRows[0].estado_maquina_anterior || maquina.estado) : maquina.estado,
      ubicacion: maquina.ubicacion,
      detalle: `Incidencia técnica ${estado}${resolucion ? ': ' + resolucion : ''}`,
      metadata: { incidencia_id: incidenciaId, estado, resolucion },
      user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH maquina incidencia error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al actualizar incidencia técnica' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas — crear nueva
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    codigo, nombre, categoria, ubicacion, estado,
    serial_num, marca, modelo, dept_base, ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs
  } = req.body;

  if (!codigo || !nombre) {
    return res.status(400).json({ error: 'Código y nombre son obligatorios' });
  }
  const tipoOperativo = tipo_operativo || (es_viajera ? 'viajera' : 'base_ciudad');

  try {
    const { rows } = await pool.query(`
      INSERT INTO maquinas (codigo, nombre, categoria, ubicacion, estado, serial_num, marca, modelo, dept_base, ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [
      codigo.trim(), nombre.trim(), categoria || 'Láser Depilación',
      ubicacion || null, tipoOperativo === 'solo_venta' ? 'fuera_servicio' : (estado || 'disponible'),
      serial_num || null, marca || null, modelo || null,
      dept_base || 'Uruguay',
      ult_mant || null, prox_mant || null, foto_url || null,
      icono_url || null, tipoOperativo === 'viajera' || !!es_viajera, tipoOperativo, ciudad_base || null, obs || null
    ]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'maquina', rows[0].id, `${codigo} — ${nombre}`]
    );
    await registrarMovimientoMaquina(pool, {
      maquinaId: rows[0].id,
      tipo: 'creada',
      estadoAnterior: null,
      estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion,
      detalle: 'Máquina creada en CRM',
      metadata: { codigo: rows[0].codigo, nombre: rows[0].nombre },
      user: req.user,
    }).catch(() => {});

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/maquinas error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: `Ya existe una máquina con el código ${codigo}` });
    }
    res.status(500).json({ error: 'Error al crear máquina' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/maquinas/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    codigo, nombre, categoria, ubicacion, estado,
    serial_num, marca, modelo, dept_base, ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs
  } = req.body;

  if (!codigo || !nombre) {
    return res.status(400).json({ error: 'Código y nombre son obligatorios' });
  }
  const tipoOperativo = tipo_operativo || (es_viajera ? 'viajera' : 'base_ciudad');

  try {
    const { rows: prevRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        codigo=$1, nombre=$2, categoria=$3, ubicacion=$4, estado=$5,
        serial_num=$6, marca=$7, modelo=$8, dept_base=$9,
        ult_mant=$10, prox_mant=$11, foto_url=COALESCE($12, foto_url),
        icono_url=$13, es_viajera=$14, tipo_operativo=$15, ciudad_base=$16, obs=$17, updated_at=NOW()
      WHERE id=$18
      RETURNING *
    `, [
      codigo.trim(), nombre.trim(), categoria || 'Láser Depilación',
      ubicacion || null, tipoOperativo === 'solo_venta' ? 'fuera_servicio' : (estado || 'disponible'),
      serial_num || null, marca || null, modelo || null,
      dept_base || 'Uruguay',
      ult_mant || null, prox_mant || null, foto_url || null,
      icono_url || null, tipoOperativo === 'viajera' || !!es_viajera, tipoOperativo, ciudad_base || null, obs || null,
      req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'UPDATE', 'maquina', req.params.id, `${codigo} — ${nombre}`]
    );
    const prev = prevRows[0] || {};
    if (prev.estado !== rows[0].estado || prev.ubicacion !== rows[0].ubicacion) {
      await registrarMovimientoMaquina(pool, {
        maquinaId: req.params.id,
        tipo: 'actualizada',
        estadoAnterior: prev.estado,
        estadoNuevo: rows[0].estado,
        ubicacion: rows[0].ubicacion,
        detalle: 'Máquina actualizada manualmente',
        metadata: { ubicacion_anterior: prev.ubicacion },
        user: req.user,
      }).catch(() => {});
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/maquinas/:id error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: `Ya existe una máquina con ese código` });
    }
    res.status(500).json({ error: 'Error al actualizar máquina' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/:id/puesta-punto/asignar — viajera vuelve a base estética
// ─────────────────────────────────────────────
router.post('/:id/puesta-punto/asignar', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const gestorId = parseInt(req.body.gestor_puesta_punto_id || req.body.transportista_id, 10);
  const ubicacion = String(req.body.ubicacion || '').trim();
  const obs = String(req.body.obs || '').trim();
  if (!gestorId) return res.status(400).json({ error: 'Gestor persona física requerido' });
  try {
    const gestor = await getTransportistaPersonaFisica(gestorId);
    if (!gestor) return res.status(400).json({ error: 'Solo una empresa/persona física activa puede gestionar puesta a punto' });
    const { rows: currentRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [maquinaId]);
    if (!currentRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (!isViajera(currentRows[0])) return res.status(400).json({ error: 'La puesta a punto gestionada aplica a máquinas viajeras' });
    const existingPendingSameGestor = currentRows[0].puesta_punto_estado === 'pendiente'
      && parseInt(currentRows[0].gestor_puesta_punto_id, 10) === gestorId
      && currentRows[0].puesta_punto_wa_key;
    const waKey = existingPendingSameGestor || `puesta-punto:${maquinaId}:${gestorId}:${Date.now()}`;

    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='mantenimiento',
        ubicacion=COALESCE(NULLIF($1,''), ubicacion),
        gestor_puesta_punto_id=$2,
        puesta_punto_estado='pendiente',
        puesta_punto_asignada_en=CASE WHEN $5::boolean THEN puesta_punto_asignada_en ELSE NOW() END,
        puesta_punto_completada_en=NULL,
        disponibilidad_visible_gestor=TRUE,
        puesta_punto_wa_key=$6,
        puesta_punto_wa_estado=CASE WHEN $5::boolean THEN puesta_punto_wa_estado ELSE NULL END,
        puesta_punto_wa_error=NULL,
        puesta_punto_wa_notificado_en=CASE WHEN $5::boolean THEN puesta_punto_wa_notificado_en ELSE NULL END,
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $3='' THEN '' ELSE E'\n' || $3 END)),
        updated_at=NOW()
      WHERE id=$4
      RETURNING *
    `, [ubicacion, gestorId, obs, maquinaId, !!existingPendingSameGestor, waKey]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'PUESTA_PUNTO_ASIGNADA','maquina',$3,$4)`,
      [req.user.id, req.user.email, maquinaId, `${rows[0].codigo} — ${rows[0].nombre} asignada a ${gestor.nombre}`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId,
      tipo: 'puesta_punto_asignada',
      estadoAnterior: currentRows[0].estado,
      estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion,
      gestorId,
      detalle: `Asignada a puesta a punto por ${gestor.nombre}`,
      metadata: { whatsapp_key: waKey, obs },
      user: req.user,
    }).catch(() => {});

    const wa = await notifyPuestaPunto(gestor, rows[0]);
    const notified = ['enviado','encolado','duplicado'].includes(wa?.status);
    const { rows: finalRows } = await pool.query(`
      UPDATE maquinas SET
        puesta_punto_wa_estado=$1,
        puesta_punto_wa_error=$2,
        puesta_punto_wa_notificado_en=CASE WHEN $3 THEN COALESCE(puesta_punto_wa_notificado_en,NOW()) ELSE puesta_punto_wa_notificado_en END,
        updated_at=NOW()
      WHERE id=$4
      RETURNING *
    `, [wa?.status || null, wa?.error || null, notified, maquinaId]);
    res.json({ ...finalRows[0], whatsapp: wa });
  } catch (err) {
    console.error('POST puesta punto asignar error:', err);
    res.status(500).json({ error: 'Error al asignar puesta a punto' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/:id/puesta-punto/alta — limpiar/revisar y poner disponible
// ─────────────────────────────────────────────
router.post('/:id/puesta-punto/alta', auth, async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const isAssignedManager = req.user.rol === 'transportista' && req.user.transportista_id;
  if (!isOpsRole(req.user.rol) && !isAssignedManager) {
    return res.status(403).json({ error: 'Sin permisos para dar alta de puesta a punto' });
  }
  const obs = String(req.body.obs || '').trim();
  const responsable = String(req.body.responsable || req.user?.email || '').trim();
  const { checklist, faltantes } = normalizarChecklistPuestaPunto(req.body.checklist);
  if (faltantes.length) {
    return res.status(400).json({
      error: `Checklist incompleto. Falta confirmar: ${faltantes.join(', ')}`,
      faltantes,
    });
  }
  try {
    const params = [maquinaId];
    let managerWhere = '';
    if (isAssignedManager && !isOpsRole(req.user.rol)) {
      params.push(req.user.transportista_id);
      managerWhere = ` AND gestor_puesta_punto_id=$${params.length} AND disponibilidad_visible_gestor=TRUE`;
    }
    const { rows: currentRows } = await pool.query(`SELECT * FROM maquinas WHERE id=$1${managerWhere}`, params);
    if (!currentRows.length) return res.status(404).json({ error: 'Máquina no encontrada o no asignada a este gestor' });
    if (!isViajera(currentRows[0])) return res.status(400).json({ error: 'La puesta a punto aplica a máquinas viajeras' });

    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='disponible',
        puesta_punto_estado='completada',
        puesta_punto_completada_en=NOW(),
        disponibilidad_visible_gestor=FALSE,
        puesta_punto_wa_key=NULL,
        puesta_punto_checklist=$1::jsonb,
        puesta_punto_checklist_en=NOW(),
        puesta_punto_checklist_responsable=NULLIF($2,''),
        ult_mant=COALESCE(ult_mant, CURRENT_DATE),
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $3='' THEN '' ELSE E'\n' || $3 END)),
        updated_at=NOW()
      WHERE id=$4
      RETURNING *
    `, [JSON.stringify(checklist), responsable, obs, maquinaId]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'PUESTA_PUNTO_ALTA','maquina',$3,$4)`,
      [req.user.id, req.user.email, maquinaId, `${rows[0].codigo} — ${rows[0].nombre} disponible`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId,
      tipo: 'puesta_punto_alta',
      estadoAnterior: currentRows[0].estado,
      estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion,
      gestorId: rows[0].gestor_puesta_punto_id,
      detalle: 'Puesta a punto completada con checklist. Máquina disponible.',
      metadata: { obs, checklist, responsable },
      user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST puesta punto alta error:', err);
    res.status(500).json({ error: 'Error al dar alta de puesta a punto' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/:id/tecnico/baja — sale al técnico y queda no disponible
// ─────────────────────────────────────────────
router.post('/:id/tecnico/baja', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const tecnico = String(req.body.tecnico_nombre || req.body.tecnico || '').trim();
  const obs = String(req.body.obs || '').trim();
  try {
    const { rows: prevRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    if (!prevRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='fuera_servicio',
        tecnico_estado='en_tecnico',
        tecnico_nombre=NULLIF($1,''),
        tecnico_salida_en=NOW(),
        tecnico_regreso_en=NULL,
        disponibilidad_visible_gestor=FALSE,
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $2='' THEN '' ELSE E'\n' || $2 END)),
        updated_at=NOW()
      WHERE id=$3
      RETURNING *
    `, [tecnico, obs, req.params.id]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'TECNICO_BAJA','maquina',$3,$4)`,
      [req.user.id, req.user.email, req.params.id, `${rows[0].codigo} — ${rows[0].nombre} enviada a técnico`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId: req.params.id,
      tipo: 'tecnico_baja',
      estadoAnterior: prevRows[0].estado,
      estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion,
      tecnicoNombre: tecnico,
      detalle: 'Máquina enviada a técnico y dada de baja comercial.',
      metadata: { obs },
      user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST tecnico baja error:', err);
    res.status(500).json({ error: 'Error al enviar máquina al técnico' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/:id/tecnico/alta — vuelve del técnico
// ─────────────────────────────────────────────
router.post('/:id/tecnico/alta', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const obs = String(req.body.obs || '').trim();
  try {
    const { rows: prevRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    if (!prevRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='disponible',
        tecnico_estado='regresada',
        tecnico_regreso_en=NOW(),
        ult_mant=CURRENT_DATE,
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $1='' THEN '' ELSE E'\n' || $1 END)),
        updated_at=NOW()
      WHERE id=$2
      RETURNING *
    `, [obs, req.params.id]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'TECNICO_ALTA','maquina',$3,$4)`,
      [req.user.id, req.user.email, req.params.id, `${rows[0].codigo} — ${rows[0].nombre} regresó del técnico`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId: req.params.id,
      tipo: 'tecnico_alta',
      estadoAnterior: prevRows[0].estado,
      estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion,
      tecnicoNombre: rows[0].tecnico_nombre,
      detalle: 'Máquina regresó del técnico y quedó disponible.',
      metadata: { obs },
      user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST tecnico alta error:', err);
    res.status(500).json({ error: 'Error al dar alta de técnico' });
  }
});

// ─────────────────────────────────────────────
// POST /api/maquinas/:id/foto — subir foto visible en ficha
// ─────────────────────────────────────────────
router.post('/:id/foto', auth, requireRole('superadmin', 'operaciones'), upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Foto requerida. Usá JPG, PNG o WebP hasta 8 MB.' });
    const fotoUrl = `/uploads/maquinas/${req.file.filename}`;
    const { rows } = await pool.query(
      `UPDATE maquinas SET foto_url=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [fotoUrl, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'UPLOAD_PHOTO', 'maquina', req.params.id, rows[0].codigo]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId: req.params.id,
      tipo: 'foto_actualizada',
      estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion,
      detalle: 'Foto de máquina actualizada',
      metadata: { foto_url: fotoUrl },
      user: req.user,
    }).catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/maquinas/:id/foto error:', err);
    res.status(500).json({ error: 'Error al subir foto de máquina' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/maquinas/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM maquinas WHERE id=$1 RETURNING id, codigo, nombre',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'maquina', req.params.id, `${rows[0].codigo} — ${rows[0].nombre}`]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/maquinas/:id error:', err);
    if (err.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: la máquina tiene reservas asociadas' });
    }
    res.status(500).json({ error: 'Error al eliminar máquina' });
  }
});

module.exports = router;
