# Etapa 2 - Login WhatsApp con código

## Implementado

- Admin sigue entrando con email y contraseña.
- Operadoras y transportistas tienen una pestaña nueva de ingreso por WhatsApp.
- Endpoints backend:
  - `POST /api/auth/whatsapp/request`
  - `POST /api/auth/whatsapp/verify`
- El código OTP se guarda hasheado en `sesiones_whatsapp`.
- El código vence en 10 minutos.
- Máximo 5 intentos por sesión.
- Se usa la integración actual `enviarMensaje` de WhatsApp.
- Si WhatsApp está en modo simulación, el mensaje se registra en logs sin envío real.

## Comportamiento

- Operadora: debe existir en la tabla `operadoras` con WhatsApp activo.
- Transportista: debe existir en la tabla `transportistas` con WhatsApp activo.
- Si no existe, no se envía código y se devuelve error.
- Si existe y no tiene usuario, se crea un usuario técnico vinculado.

## Pendiente para etapa 3

- Registro público de operadora nueva desde cero.
- Aviso WhatsApp al admin cuando se registra una operadora nueva.
- Pantalla/portal por rol con permisos aplicados en UI.
