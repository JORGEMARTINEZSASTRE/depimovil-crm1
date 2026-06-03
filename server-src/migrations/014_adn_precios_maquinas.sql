CREATE TABLE IF NOT EXISTS maquina_tarifas (
  id SERIAL PRIMARY KEY,
  equipo VARCHAR(160) NOT NULL,
  formato VARCHAR(80) NOT NULL DEFAULT '',
  localidad VARCHAR(120) NOT NULL,
  localidad_norm VARCHAR(140) NOT NULL,
  modalidad VARCHAR(60) NOT NULL DEFAULT 'jornada',
  jornadas INTEGER NOT NULL DEFAULT 1,
  precio NUMERIC(12,2) NOT NULL,
  moneda VARCHAR(10) NOT NULL DEFAULT 'UYU',
  condicion TEXT,
  inicio_suave BOOLEAN NOT NULL DEFAULT FALSE,
  disparos_incluidos INTEGER,
  excedente_precio NUMERIC(12,2),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS modalidad VARCHAR(60) NOT NULL DEFAULT 'jornada';
ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS inicio_suave BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS disparos_incluidos INTEGER;
ALTER TABLE maquina_tarifas ADD COLUMN IF NOT EXISTS excedente_precio NUMERIC(12,2);

UPDATE maquina_tarifas SET formato = '' WHERE formato IS NULL;
ALTER TABLE maquina_tarifas ALTER COLUMN formato SET DEFAULT '';
ALTER TABLE maquina_tarifas ALTER COLUMN formato SET NOT NULL;

ALTER TABLE maquina_tarifas DROP CONSTRAINT IF EXISTS maquina_tarifas_equipo_formato_localidad_norm_jornadas_key;

CREATE UNIQUE INDEX IF NOT EXISTS maquina_tarifas_equipo_formato_localidad_norm_modalidad_key
ON maquina_tarifas (equipo, formato, localidad_norm, modalidad);

CREATE INDEX IF NOT EXISTS idx_maquina_tarifas_lookup_modalidad
ON maquina_tarifas (activa, localidad_norm, modalidad);

WITH tarifas (
  equipo, formato, localidad, localidad_norm, modalidad, jornadas, precio, moneda,
  condicion, inicio_suave, disparos_incluidos, excedente_precio
) AS (
  VALUES
    -- Soprano Titanium Ice de pie / grande
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', 'media_jornada', 1, 6000, 'UYU', 'Media jornada máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', 'jornada', 1, 8000, 'UYU', 'Jornada máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', '2_jornadas', 2, 12000, 'UYU', '2 jornadas máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', '3_jornadas', 3, 16000, 'UYU', '3 jornadas máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', 'semana', 7, 20000, 'UYU', 'Semana máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', 'mensual', 30, 45000, 'UYU', 'Mensual máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Maldonado', 'maldonado', 'inicio_suave', 1, 6000, 'UYU', 'Inicio suave: primera jornada de operadora, solo depilación', TRUE, NULL, NULL),

    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', 'media_jornada', 1, 8000, 'UYU', 'Media jornada máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', 'jornada', 1, 10000, 'UYU', 'Jornada máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', '2_jornadas', 2, 18000, 'UYU', '2 jornadas máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', '3_jornadas', 3, 22000, 'UYU', '3 jornadas máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', 'semana', 7, 30000, 'UYU', 'Semana máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', 'mensual', 30, 55000, 'UYU', 'Mensual máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Salto', 'salto', 'inicio_suave', 1, 8000, 'UYU', 'Inicio suave: primera jornada de operadora, solo depilación', TRUE, NULL, NULL),

    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', 'media_jornada', 1, 6000, 'UYU', 'Media jornada máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', 'jornada', 1, 8000, 'UYU', 'Jornada máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', '2_jornadas', 2, 15000, 'UYU', '2 jornadas máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', '3_jornadas', 3, 20000, 'UYU', '3 jornadas máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', 'semana', 7, 30000, 'UYU', 'Semana máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', 'mensual', 30, 60000, 'UYU', 'Mensual máquina grande/de pie', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de pie', 'Tacuarembó', 'tacuarembo', 'inicio_suave', 1, 6000, 'UYU', 'Inicio suave: primera jornada de operadora, solo depilación', TRUE, NULL, NULL),

    -- Soprano Titanium Ice de escritorio / portátil
    ('Soprano Titanium Ice', 'de escritorio', 'Montevideo', 'montevideo', 'jornada', 1, 5500, 'UYU', 'Jornada máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Montevideo', 'montevideo', '2_jornadas', 2, 8000, 'UYU', '2 jornadas máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Montevideo', 'montevideo', '3_jornadas', 3, 11000, 'UYU', '3 jornadas máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Montevideo', 'montevideo', 'semana', 7, 15000, 'UYU', 'Semana máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Montevideo', 'montevideo', 'mensual', 30, 30000, 'UYU', 'Mensual máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Montevideo', 'montevideo', 'inicio_suave', 1, 5000, 'UYU', 'Inicio suave: primera jornada de operadora, solo depilación', TRUE, NULL, NULL),

    ('Soprano Titanium Ice', 'de escritorio', 'Canelones', 'canelones', 'jornada', 1, 6000, 'UYU', 'Jornada máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Canelones', 'canelones', '2_jornadas', 2, 10000, 'UYU', '2 jornadas máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Canelones', 'canelones', '3_jornadas', 3, 12000, 'UYU', '3 jornadas máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Canelones', 'canelones', 'semana', 7, 15000, 'UYU', 'Semana máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Canelones', 'canelones', 'mensual', 30, 30000, 'UYU', 'Mensual máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Canelones', 'canelones', 'inicio_suave', 1, 5000, 'UYU', 'Inicio suave: primera jornada de operadora, solo depilación', TRUE, NULL, NULL),

    ('Soprano Titanium Ice', 'de escritorio', 'Interior', 'interior', 'jornada', 1, 10000, 'UYU', 'Jornada máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Interior', 'interior', '2_jornadas', 2, 18000, 'UYU', '2 jornadas máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Interior', 'interior', '3_jornadas', 3, 22000, 'UYU', '3 jornadas máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Interior', 'interior', 'semana', 7, 25000, 'UYU', 'Semana máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Interior', 'interior', 'mensual', 30, 40000, 'UYU', 'Mensual máquina de escritorio/portátil', FALSE, NULL, NULL),
    ('Soprano Titanium Ice', 'de escritorio', 'Interior', 'interior', 'inicio_suave', 1, 6000, 'UYU', 'Inicio suave: primera jornada de operadora, solo depilación', TRUE, NULL, NULL),

    -- HIFU 12D
    ('HIFU 12D', '', 'Maldonado', 'maldonado', 'jornada', 1, 10000, 'UYU', 'Jornada HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Maldonado', 'maldonado', '2_jornadas', 2, 18000, 'UYU', '2 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Maldonado', 'maldonado', '3_jornadas', 3, 20000, 'UYU', '3 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Montevideo', 'montevideo', 'jornada', 1, 10000, 'UYU', 'Jornada HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Montevideo', 'montevideo', '2_jornadas', 2, 18000, 'UYU', '2 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Montevideo', 'montevideo', '3_jornadas', 3, 20000, 'UYU', '3 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Canelones', 'canelones', 'jornada', 1, 10000, 'UYU', 'Jornada HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Canelones', 'canelones', '2_jornadas', 2, 18000, 'UYU', '2 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Canelones', 'canelones', '3_jornadas', 3, 20000, 'UYU', '3 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Interior', 'interior', 'jornada', 1, 11000, 'UYU', 'Jornada HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Interior', 'interior', '2_jornadas', 2, 20000, 'UYU', '2 jornadas HIFU 12D', FALSE, NULL, NULL),
    ('HIFU 12D', '', 'Interior', 'interior', '3_jornadas', 3, 25000, 'UYU', '3 jornadas HIFU 12D', FALSE, NULL, NULL),

    -- HIFU 12D MAX
    ('HIFU 12D MAX', '', 'Maldonado', 'maldonado', 'jornada', 1, 11000, 'UYU', 'Jornada HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Maldonado', 'maldonado', '2_jornadas', 2, 20000, 'UYU', '2 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Maldonado', 'maldonado', '3_jornadas', 3, 26000, 'UYU', '3 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Montevideo', 'montevideo', 'jornada', 1, 11000, 'UYU', 'Jornada HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Montevideo', 'montevideo', '2_jornadas', 2, 20000, 'UYU', '2 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Montevideo', 'montevideo', '3_jornadas', 3, 26000, 'UYU', '3 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Canelones', 'canelones', 'jornada', 1, 11000, 'UYU', 'Jornada HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Canelones', 'canelones', '2_jornadas', 2, 20000, 'UYU', '2 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Canelones', 'canelones', '3_jornadas', 3, 26000, 'UYU', '3 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Interior', 'interior', 'jornada', 1, 11000, 'UYU', 'Jornada HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Interior', 'interior', '2_jornadas', 2, 21000, 'UYU', '2 jornadas HIFU 12D MAX', FALSE, NULL, NULL),
    ('HIFU 12D MAX', '', 'Interior', 'interior', '3_jornadas', 3, 26000, 'UYU', '3 jornadas HIFU 12D MAX', FALSE, NULL, NULL),

    -- HIFU 22D MAX con Liposonix
    ('HIFU 22D MAX con Liposonix', '', 'Todo el país', 'todo el pais', 'jornada', 1, 13000, 'UYU', 'Hasta 4.000 disparos; pasado ese límite, 1 UYU por disparo extra', FALSE, 4000, 1),
    ('HIFU 22D MAX con Liposonix', '', 'Todo el país', 'todo el pais', '2_jornadas', 2, 25000, 'UYU', 'Hasta 8.000 disparos; pasado ese límite, 1 UYU por disparo extra', FALSE, 8000, 1),
    ('HIFU 22D MAX con Liposonix', '', 'Todo el país', 'todo el pais', '3_jornadas', 3, 30000, 'UYU', 'Hasta 10.000 disparos; pasado ese límite, 1 UYU por disparo extra', FALSE, 10000, 1),

    -- Otros equipos
    ('Pressoterapia', '', 'Todo el país', 'todo el pais', 'semana', 7, 10000, 'UYU', 'Semana Pressoterapia', FALSE, NULL, NULL),
    ('Pressoterapia', '', 'Todo el país', 'todo el pais', 'mensual', 30, 30000, 'UYU', 'Mensual Pressoterapia', FALSE, NULL, NULL),

    ('Exilis', '', 'Todo el país', 'todo el pais', 'jornada', 1, 7000, 'UYU', 'Jornada Exilis', FALSE, NULL, NULL),
    ('Exilis', '', 'Todo el país', 'todo el pais', '2_jornadas', 2, 10000, 'UYU', '2 jornadas Exilis', FALSE, NULL, NULL),
    ('Exilis', '', 'Todo el país', 'todo el pais', '3_jornadas', 3, 12000, 'UYU', '3 jornadas Exilis', FALSE, NULL, NULL),
    ('Exilis', '', 'Todo el país', 'todo el pais', 'semana', 7, 15000, 'UYU', 'Semana Exilis', FALSE, NULL, NULL),
    ('Exilis', '', 'Todo el país', 'todo el pais', 'mensual', 30, 30000, 'UYU', 'Mensual Exilis', FALSE, NULL, NULL),

    ('Hidrofacial', '', 'Todo el país', 'todo el pais', '3_jornadas', 3, 5000, 'UYU', '3 jornadas Hidrofacial', FALSE, NULL, NULL),
    ('Hidrofacial', '', 'Todo el país', 'todo el pais', 'semana', 7, 7000, 'UYU', 'Semana Hidrofacial', FALSE, NULL, NULL),
    ('Hidrofacial', '', 'Todo el país', 'todo el pais', 'mensual', 30, 15000, 'UYU', 'Mensual Hidrofacial', FALSE, NULL, NULL),

    ('EMS / Electroestimulación', '', 'Todo el país', 'todo el pais', 'jornada', 1, 5000, 'UYU', 'Jornada EMS / Electroestimulación', FALSE, NULL, NULL),
    ('EMS / Electroestimulación', '', 'Todo el país', 'todo el pais', '2_jornadas', 2, 7000, 'UYU', '2 jornadas EMS / Electroestimulación', FALSE, NULL, NULL),
    ('EMS / Electroestimulación', '', 'Todo el país', 'todo el pais', '3_jornadas', 3, 10000, 'UYU', '3 jornadas EMS / Electroestimulación', FALSE, NULL, NULL),
    ('EMS / Electroestimulación', '', 'Todo el país', 'todo el pais', 'semana', 7, 12000, 'UYU', 'Semana EMS / Electroestimulación', FALSE, NULL, NULL),
    ('EMS / Electroestimulación', '', 'Todo el país', 'todo el pais', 'mensual', 30, 25000, 'UYU', 'Mensual EMS / Electroestimulación', FALSE, NULL, NULL)
)
INSERT INTO maquina_tarifas (
  equipo, formato, localidad, localidad_norm, modalidad, jornadas, precio, moneda,
  condicion, inicio_suave, disparos_incluidos, excedente_precio, activa, updated_at
)
SELECT
  equipo, formato, localidad, localidad_norm, modalidad, jornadas, precio, moneda,
  condicion, inicio_suave, disparos_incluidos, excedente_precio, TRUE, NOW()
FROM tarifas
ON CONFLICT (equipo, formato, localidad_norm, modalidad) DO UPDATE SET
  localidad=EXCLUDED.localidad,
  jornadas=EXCLUDED.jornadas,
  precio=EXCLUDED.precio,
  moneda=EXCLUDED.moneda,
  condicion=EXCLUDED.condicion,
  inicio_suave=EXCLUDED.inicio_suave,
  disparos_incluidos=EXCLUDED.disparos_incluidos,
  excedente_precio=EXCLUDED.excedente_precio,
  activa=TRUE,
  updated_at=NOW();
