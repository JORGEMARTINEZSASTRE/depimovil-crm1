ALTER TABLE transportistas OWNER TO depimovil;

ALTER TABLE transportistas
  ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(100),
  ADD COLUMN IF NOT EXISTS referencia TEXT,
  ADD COLUMN IF NOT EXISTS horarios TEXT;

ALTER TABLE transportistas DROP CONSTRAINT IF EXISTS transportistas_ciclo_pago_check;
ALTER TABLE transportistas
  ADD CONSTRAINT transportistas_ciclo_pago_check
  CHECK (ciclo_pago IN ('semanal', 'mensual', 'por_envio'));

ALTER TABLE transportistas DROP CONSTRAINT IF EXISTS transportistas_estado_check;
ALTER TABLE transportistas
  ADD CONSTRAINT transportistas_estado_check
  CHECK (estado IN ('activo', 'inactivo', 'eliminado'));

ALTER TABLE transportistas_incidentes OWNER TO depimovil;
ALTER TABLE transportistas_pagos OWNER TO depimovil;

ALTER TABLE IF EXISTS transportista_incidentes RENAME TO transportista_incidentes_legacy_20260525;
ALTER TABLE IF EXISTS transportista_pagos RENAME TO transportista_pagos_legacy_20260525;
