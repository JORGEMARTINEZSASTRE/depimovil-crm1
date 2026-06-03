CREATE TABLE IF NOT EXISTS maquina_tarifas (
  id SERIAL PRIMARY KEY,
  equipo VARCHAR(160) NOT NULL,
  formato VARCHAR(80),
  localidad VARCHAR(120) NOT NULL,
  localidad_norm VARCHAR(140) NOT NULL,
  jornadas INTEGER NOT NULL DEFAULT 1,
  precio NUMERIC(12,2) NOT NULL,
  moneda VARCHAR(10) NOT NULL DEFAULT 'UYU',
  condicion TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (equipo, formato, localidad_norm, jornadas)
);

CREATE INDEX IF NOT EXISTS idx_maquina_tarifas_lookup
ON maquina_tarifas (activa, localidad_norm, jornadas);

INSERT INTO maquina_tarifas (
  equipo, formato, localidad, localidad_norm, jornadas, precio, moneda, condicion
) VALUES (
  'Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', 1, 8000, 'UYU', 'Jornada máquina grande/de pie'
)
ON CONFLICT (equipo, formato, localidad_norm, jornadas) DO UPDATE SET
  precio=EXCLUDED.precio,
  moneda=EXCLUDED.moneda,
  condicion=EXCLUDED.condicion,
  activa=TRUE,
  updated_at=NOW();
