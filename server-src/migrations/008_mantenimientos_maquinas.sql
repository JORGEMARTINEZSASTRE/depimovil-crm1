ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS icono_url TEXT;
ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS es_viajera BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS mantenimientos (
  id SERIAL PRIMARY KEY,
  maquina_id INTEGER NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cambio_agua','cambio_filtros')),
  fecha_realizado DATE NOT NULL,
  proximo_vencimiento DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','vencido','próximo')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
