-- Rol 'coordinadora': gestiona reservas, fechas, máquinas, envíos y transportistas sin acceso a finanzas.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (
    rol IN (
      'superadmin',
      'administrador',
      'operaciones',
      'coordinadora',
      'comercial',
      'operadora',
      'operadora_habilitada',
      'operadora_limitada',
      'transportista'
    )
  );
