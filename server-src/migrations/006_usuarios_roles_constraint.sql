ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (
    rol IN (
      'superadmin',
      'administrador',
      'operaciones',
      'comercial',
      'operadora',
      'operadora_habilitada',
      'operadora_limitada',
      'transportista'
    )
  );
