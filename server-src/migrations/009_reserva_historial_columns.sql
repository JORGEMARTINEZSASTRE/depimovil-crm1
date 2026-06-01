CREATE TABLE IF NOT EXISTS reserva_historial (
  id SERIAL PRIMARY KEY,
  reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
  estado_previo VARCHAR(50),
  estado_nuevo VARCHAR(50),
  motivo TEXT,
  usuario_id INTEGER,
  usuario_email VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS estado_previo VARCHAR(50);
ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS estado_nuevo VARCHAR(50);
ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS usuario_id INTEGER;
ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS usuario_email VARCHAR(150);
ALTER TABLE reserva_historial ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
