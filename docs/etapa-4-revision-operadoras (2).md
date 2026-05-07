# Etapa 4 - Revision administrativa de operadoras

## Implementado

- Nuevo menu **Revision** para administradores.
- Bandeja de operadoras registradas desde la web.
- Filtros por estado de revision.
- Modal de revision con datos personales, cedula/DNI, ciudad, experiencia, tratamientos y lugares de trabajo.
- Acciones administrativas:
  - Aprobar.
  - Pedir documentos.
  - Observar.
  - Rechazar.
- Aviso por WhatsApp a la operadora cuando se piden documentos, se observa o se rechaza.
- Token de portal por operadora para pedir subida de cedula frente y dorso.
- Auditoria de cada decision administrativa.

## Base de datos

- `operadoras.portal_token` agregado para generar enlaces individuales de portal.
- Las operadoras existentes recibieron token automaticamente.

## Endpoints

- `GET /api/auth/operadoras/revision`
- `POST /api/auth/operadoras/revision/:usuarioId`

## Siguiente mejora sugerida

Agregar indicador visual en la ficha de operadora cuando tiene revision pendiente, documentos solicitados u observaciones administrativas.
