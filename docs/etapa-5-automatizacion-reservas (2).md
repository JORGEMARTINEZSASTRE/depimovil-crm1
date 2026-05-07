# Etapa 5 - Automatizacion de reservas

## Implementado

- Columna **Control** en la tabla de reservas.
- Validacion automatica antes de confirmar una reserva.
- Panel de bloqueos dentro de la ficha de reserva.
- Panel de control dentro del modal de nueva/editar reserva.
- Aviso general cuando hay reservas activas bloqueadas.

## Bloqueos detectados

- Operadora inexistente, inactiva, suspendida o no aprobada por administracion.
- Falta cedula/DNI frente y dorso.
- Falta contrato firmado para la maquina de la reserva.
- Maquina inexistente, en mantenimiento, fuera de servicio o con conflicto logistico.
- Deuda vencida de la operadora.
- Sena pendiente cuando hay sena requerida.

## Avisos detectados

- No hay pago/sena registrado todavia.
- Falta departamento logistico.
- Revisar si corresponde bloqueo logistico/envio.

## Comportamiento

- Una reserva puede crearse como solicitud o pendiente aunque tenga bloqueos.
- El CRM no permite pasarla a **Confirmada** si tiene bloqueos criticos.
- La ficha muestra los motivos concretos para resolverlos.

## Datos usados

- `operadoras`
- `usuarios` / revision administrativa
- `documentos_operadora`
- `contratos`
- `pagos`
- `maquinas`
- reglas logisticas existentes
