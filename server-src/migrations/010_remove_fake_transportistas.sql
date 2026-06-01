-- Quita transportistas de prueba que no corresponden a datos reales.

BEGIN;

UPDATE transportistas
SET estado = 'eliminado',
    updated_at = NOW()
WHERE lower(trim(nombre)) IN (
  lower('TESTempresaACTIVO'),
  lower('TestEMPRESAACTIVO'),
  lower('TestCurlEMPRESACTIVO'),
  lower('TestCurlEMPRESAACTIVO')
);

COMMIT;
