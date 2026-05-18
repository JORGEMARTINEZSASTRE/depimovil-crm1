-- DepiMovil CRM1 - Transportistas reales iniciales
-- Reaplica datos historicos sin duplicar transportistas existentes.

BEGIN;

WITH transportistas_base (tipo, nombre, ciclo_pago, estado, notas) AS (
  VALUES
    ('empresa',        'DAC',             'mensual', 'activo', NULL),
    ('persona_fisica', 'El Norteño',      'semanal', 'activo', 'Cubre el norte del pais. Sin rastreo en algunos destinos.'),
    ('empresa',        'JT Transporte',   'mensual', 'activo', NULL),
    ('empresa',        'Agencia Central', 'mensual', 'activo', NULL),
    ('empresa',        'Turismar',        'mensual', 'activo', NULL),
    ('persona_fisica', 'Sintia',          'semanal', 'activo', NULL),
    ('persona_fisica', 'Paola',           'semanal', 'activo', NULL),
    ('persona_fisica', 'Mi Negra',        'semanal', 'activo', NULL)
)
INSERT INTO transportistas (tipo, nombre, ciclo_pago, estado, notas)
SELECT b.tipo, b.nombre, b.ciclo_pago, b.estado, b.notas
FROM transportistas_base b
WHERE NOT EXISTS (
  SELECT 1
  FROM transportistas t
  WHERE lower(trim(t.nombre)) = lower(trim(b.nombre))
);

WITH transportistas_base (tipo, nombre, ciclo_pago, estado, notas) AS (
  VALUES
    ('empresa',        'DAC',             'mensual', 'activo', NULL),
    ('persona_fisica', 'El Norteño',      'semanal', 'activo', 'Cubre el norte del pais. Sin rastreo en algunos destinos.'),
    ('empresa',        'JT Transporte',   'mensual', 'activo', NULL),
    ('empresa',        'Agencia Central', 'mensual', 'activo', NULL),
    ('empresa',        'Turismar',        'mensual', 'activo', NULL),
    ('persona_fisica', 'Sintia',          'semanal', 'activo', NULL),
    ('persona_fisica', 'Paola',           'semanal', 'activo', NULL),
    ('persona_fisica', 'Mi Negra',        'semanal', 'activo', NULL)
)
UPDATE transportistas t
SET
  tipo = b.tipo,
  ciclo_pago = b.ciclo_pago,
  estado = CASE WHEN t.estado = 'eliminado' THEN b.estado ELSE t.estado END,
  notas = COALESCE(NULLIF(t.notas, ''), b.notas),
  sin_rastreo_siempre = COALESCE(t.sin_rastreo_siempre, false),
  updated_at = NOW()
FROM transportistas_base b
WHERE lower(trim(t.nombre)) = lower(trim(b.nombre));

COMMIT;
