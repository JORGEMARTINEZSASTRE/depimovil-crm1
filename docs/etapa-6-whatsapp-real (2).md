# Etapa 6 - WhatsApp real desde el CRM

## Implementado

- Endpoint autenticado para envio real:
  - `POST /api/webhook/whatsapp/send`
- Endpoint de estado:
  - `GET /api/webhook/whatsapp/status`
- El centro de WhatsApp del CRM ahora envia usando el backend real.
- Cada envio pide confirmacion del administrador antes de mandar.
- Enviar todas tambien pide confirmacion.
- Cada envio queda registrado en auditoria como `WA_SEND`.
- Los cambios de estado de reserva generan notificaciones en cola:
  - Solicitud recibida.
  - Aprobada.
  - Confirmada.
  - Rechazada/cancelada.

## Seguridad

- Solo `superadmin`, `operaciones` y `comercial` pueden enviar.
- El token de WhatsApp queda solo en el servidor.
- El frontend nunca recibe ni muestra `WA_TOKEN`.

## Verificacion

- Servidor WhatsApp en modo `real`.
- `WA_PHONE_ID` configurado.
- `WA_TOKEN` configurado.
- Se probo validacion del endpoint sin enviar mensaje real.
