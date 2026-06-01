BEGIN;

CREATE TABLE IF NOT EXISTS automation_rules (
  id SERIAL PRIMARY KEY,
  key VARCHAR(120) UNIQUE NOT NULL,
  event VARCHAR(120) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_events (
  id SERIAL PRIMARY KEY,
  event VARCHAR(120) NOT NULL,
  entity VARCHAR(80),
  entity_id INTEGER,
  dedupe_key VARCHAR(180) UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(40) NOT NULL DEFAULT 'processed',
  error TEXT,
  created_by INTEGER,
  created_by_email VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES automation_events(id) ON DELETE CASCADE,
  rule_key VARCHAR(120) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  action VARCHAR(80),
  dedupe_key VARCHAR(220) UNIQUE,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_tasks (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES automation_events(id) ON DELETE SET NULL,
  rule_key VARCHAR(120),
  area VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  entity VARCHAR(80),
  entity_id INTEGER,
  responsible_role VARCHAR(50),
  status VARCHAR(40) NOT NULL DEFAULT 'pendiente',
  due_at TIMESTAMPTZ,
  dedupe_key VARCHAR(220) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_created_at ON automation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status_due ON automation_tasks (status, due_at);

INSERT INTO automation_rules (key, event, description, active, config) VALUES
('operator.created.followup','operator.created','Crear seguimiento comercial y mensaje de bienvenida para una operadora nueva',true,'{}'::jsonb),
('booking.created.deposit_control','booking.created','Crear control interno de seña y alerta operativa cuando se crea una reserva',true,'{}'::jsonb),
('booking.confirmed.logistics','booking.confirmed','Crear seguimiento de logística cuando una reserva queda confirmada',true,'{}'::jsonb),
('payment.completed.reserve_confirm','payment.completed','Registrar seguimiento administrativo cuando una seña o pago queda validado',true,'{}'::jsonb),
('machine.shipped.operator_notice','machine.shipped','Preparar aviso de envío y tarea de confirmación de recepción',true,'{}'::jsonb),
('machine.received.safe_use','machine.received','Preparar instrucciones de uso y recordatorio de devolución',true,'{}'::jsonb),
('machine.returned.aftercare','machine.returned','Crear encuesta posterior y recomendación de próxima reserva',true,'{}'::jsonb),
('operator.inactive.recovery','operator.inactive.detected','Crear tarea comercial para recuperar operadoras inactivas',true,'{}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  event=EXCLUDED.event,
  description=EXCLUDED.description,
  updated_at=NOW();

COMMIT;
