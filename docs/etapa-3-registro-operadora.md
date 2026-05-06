# Etapa 3 - Registro publico de operadora

## Implementado

- Pantalla de registro desde el login, boton **Soy operadora nueva**.
- Endpoint publico `POST /api/auth/operadora/register`.
- La operadora queda creada en `operadoras` con estado `activa`.
- Se crea un usuario `operadora` vinculado a esa ficha.
- El usuario queda con `requiere_revision_admin = true` y `revision_admin_estado = pendiente`.
- Los datos ampliados quedan guardados en `usuarios.metadata` y resumidos en `operadoras.obs`.
- Se avisa al administrador usando `configuracion.admin_whatsapp_notificaciones`.

## Campos del registro

- Nombre y apellido.
- WhatsApp.
- Cedula/DNI, solo numeros.
- Ciudad y departamento.
- Sucursales o lugares esporadicos donde trabaja.
- Experiencia en estetica.
- Tratamientos con casillas, incluyendo Peluqueria.
- Campo libre para otros tratamientos.
- Otros trabajos no esteticos, con detalle opcional.

## Flujo

1. La operadora completa el formulario.
2. El CRM crea la ficha activa y el usuario WhatsApp.
3. El administrador recibe aviso y revisa la ficha.
4. La operadora vuelve al login por WhatsApp y pide codigo para entrar.

## Proximo paso sugerido

Crear una vista administrativa para revisar registros pendientes, pedir fotos de documento de identidad y aprobar/rechazar con observaciones.
