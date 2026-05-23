-- Mejoras ficha operadora: contacto, multiples direcciones y equipos alquilados.

BEGIN;

ALTER TABLE operadoras
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

COMMIT;
