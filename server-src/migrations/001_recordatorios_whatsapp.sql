-- ══════════════════════════════════════════════════════════════
-- DepiMóvil — Migración 001: Sistema de Recordatorios WhatsApp
-- Ejecutar UNA SOLA VEZ en la base de datos de producción.
-- ══════════════════════════════════════════════════════════════

-- 1. Columnas de control en reservas
-- Estas columnas evitan enviar el mismo recordatorio dos veces.
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS recordatorio_24h_enviado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recordatorio_2h_enviado  BOOLEAN DEFAULT false;

-- 2. Índice para que el cron job sea eficiente
-- Solo escanea reservas activas con recordatorio pendiente
CREATE INDEX IF NOT EXISTS idx_reservas_recordatorios
  ON reservas (estado, recordatorio_24h_enviado, recordatorio_2h_enviado, fecha_inicio);

-- 3. Cola de mensajes pendientes (wa_queue)
-- Guarda mensajes que no se pudieron enviar automáticamente
CREATE TABLE IF NOT EXISTS wa_queue (
  id           SERIAL       PRIMARY KEY,
  reserva_id   INTEGER      REFERENCES reservas(id)   ON DELETE SET NULL,
  operadora_id INTEGER      REFERENCES operadoras(id) ON DELETE SET NULL,
  tipo         VARCHAR(50)  NOT NULL,   -- 'recordatorio_24h', 'recordatorio_2h', 'estado_cambio', etc.
  mensaje      TEXT         NOT NULL,
  telefono     VARCHAR(30)  NOT NULL,
  enviado      BOOLEAN      NOT NULL DEFAULT false,
  creado_en    TIMESTAMP    NOT NULL DEFAULT NOW(),
  enviado_en   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wa_queue_pendientes
  ON wa_queue (enviado, creado_en)
  WHERE enviado = false;

-- ══════════════════════════════════════════════════════════════
-- Verificación: después de ejecutar, correr esto para confirmar:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'reservas'
--   AND column_name IN ('recordatorio_24h_enviado', 'recordatorio_2h_enviado');
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'wa_queue';
-- ══════════════════════════════════════════════════════════════
