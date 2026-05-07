# Etapa 1 - Base para login WhatsApp

## Decisiones

- El admin conserva ingreso por email y contraseña.
- Operadoras y transportistas usarán WhatsApp con código.
- Roles funcionales futuros: `admin`, `operadora`, `transportista`.
- El backend actual usa `superadmin`, `operaciones` y `comercial`; esos roles se mapean a `admin` para permisos.

## Cambios de base de datos aplicados

### Tabla `usuarios`

Se amplió sin romper el login actual:

- `whatsapp`
- `transportista_id`
- `registro_origen`
- `requiere_revision_admin`
- `revision_admin_estado`
- `revision_admin_obs`
- `ultimo_login_whatsapp`
- `metadata`

También se agregó índice único parcial para `whatsapp`.

### Tabla `sesiones_whatsapp`

Guarda códigos OTP por WhatsApp:

- `whatsapp`
- `codigo_hash`
- `rol_solicitado`
- `usuario_id`
- `expires_at`
- `used_at`
- `attempts`
- `ip`
- `user_agent`

### Tabla `permisos_rol`

Permisos fijos iniciales por rol.

### Tabla `permisos_usuario`

Queda preparada para permisos personalizados por usuario en una etapa posterior.

### Configuración

Se guardó:

- `admin_whatsapp_notificaciones = +59899921164`

## API agregada

- `GET /api/permisos/me`
- `GET /api/permisos/rol/:rol`

## Verificación

- Login admin: `200`
- `/api/permisos/me`: `200`
- `/api/health`: `200`
- PM2 `depimovil-api`: online
