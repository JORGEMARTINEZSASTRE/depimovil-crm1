-- Compatibilidad producción CRM1
-- Agrega columnas usadas por las rutas actuales sin borrar datos existentes.

BEGIN;

ALTER TABLE operadoras
  ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
  ADD COLUMN IF NOT EXISTS tipo_direccion VARCHAR(50) DEFAULT 'trabajo',
  ADD COLUMN IF NOT EXISTS instagram_usuario VARCHAR(120),
  ADD COLUMN IF NOT EXISTS direcciones_entrega JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS equipos_alquila JSONB DEFAULT '[]'::jsonb;

UPDATE operadoras
SET direcciones_entrega = jsonb_build_array(jsonb_build_object(
  'direccion', direccion_entrega,
  'tipo', COALESCE(tipo_direccion, 'trabajo'),
  'principal', true
))
WHERE COALESCE(direccion_entrega, '') <> ''
  AND (direcciones_entrega IS NULL OR direcciones_entrega = '[]'::jsonb);

ALTER TABLE maquinas
  ADD COLUMN IF NOT EXISTS marca VARCHAR(100),
  ADD COLUMN IF NOT EXISTS modelo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dept_base VARCHAR(100) DEFAULT 'Uruguay';

ALTER TABLE habilitaciones
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fecha_habilitacion DATE,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE habilitaciones
SET categoria = COALESCE(categoria, equipo_categoria)
WHERE categoria IS NULL;

UPDATE habilitaciones
SET fecha_habilitacion = COALESCE(fecha_habilitacion, fecha_otorgamiento)
WHERE fecha_habilitacion IS NULL;

UPDATE habilitaciones
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS recordatorio_24h_enviado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recordatorio_2h_enviado BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS wa_queue (
  id           SERIAL PRIMARY KEY,
  reserva_id   INTEGER,
  operadora_id INTEGER,
  tipo         VARCHAR(50)  NOT NULL,
  mensaje      TEXT         NOT NULL,
  telefono     VARCHAR(30)  NOT NULL,
  enviado      BOOLEAN      NOT NULL DEFAULT false,
  creado_en    TIMESTAMP    NOT NULL DEFAULT NOW(),
  enviado_en   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_queue_pendientes
  ON wa_queue (enviado, creado_en)
  WHERE enviado = false;

CREATE INDEX IF NOT EXISTS idx_reservas_recordatorios
  ON reservas (estado, recordatorio_24h_enviado, recordatorio_2h_enviado, fecha_inicio);

COMMIT;
