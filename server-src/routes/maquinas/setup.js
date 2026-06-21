// routes/maquinas/setup.js — DDL / ensureTable + multer config
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const pool = require('../../utils/db');

const uploadDir = path.join(__dirname, '../../../uploads/maquinas');
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
  const alteraciones = [
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS foto_url TEXT',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS icono_url TEXT',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS es_viajera BOOLEAN DEFAULT FALSE',
    "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tipo_operativo VARCHAR(50) NOT NULL DEFAULT 'alquiler'",
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS ciudad_base VARCHAR(100)',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS gestor_puesta_punto_id INTEGER',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_estado VARCHAR(50)',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_asignada_en TIMESTAMP',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_completada_en TIMESTAMP',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_estado VARCHAR(50)',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_nombre VARCHAR(160)',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_salida_en TIMESTAMP',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS tecnico_regreso_en TIMESTAMP',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS disponibilidad_visible_gestor BOOLEAN DEFAULT FALSE',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_key VARCHAR(180)',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_notificado_en TIMESTAMP',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_estado VARCHAR(50)',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_wa_error TEXT',
    "ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_checklist JSONB DEFAULT '{}'::jsonb",
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_checklist_en TIMESTAMP',
    'ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS puesta_punto_checklist_responsable VARCHAR(200)',
    'CREATE INDEX IF NOT EXISTS idx_maquinas_gestor_puesta_punto ON maquinas(gestor_puesta_punto_id, puesta_punto_estado)',
  ];
  for (const sql of alteraciones) await client.query(sql);

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
  const categoriasDefault = [
    'Láser Depilación', 'Radiofrecuencia / HIFU', 'IPL', 'Pressoterapia',
    'Hidrofacial', 'Electroestimulación', 'Ultrasonido', 'Cavitación',
    'Diodo + NDYAG', 'Otro',
  ];
  for (const nombre of categoriasDefault) {
    await client.query(
      `INSERT INTO maquina_categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`,
      [nombre]
    );
  }
}

ensureTable(pool).catch(err => console.error('Error preparando tabla maquinas:', err.message));

module.exports = { upload };
