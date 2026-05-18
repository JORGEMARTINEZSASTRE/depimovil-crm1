-- Compatibilidad auditoria producción CRM1.
-- Algunas rutas actuales registran usuario_email en audit_log.

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS usuario_email VARCHAR(200);
