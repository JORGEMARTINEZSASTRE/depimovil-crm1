# Etapa Ventas de Maquinas - Base local

## Implementado

- Nuevo menu **Ventas Maquinas** dentro de Finanzas.
- Registro de venta con:
  - maquina
  - comprador
  - telefono
  - documento/RUT
  - precio total
  - moneda UYU/USD
  - pago recibido ahora
  - cuenta de Caja
  - comprobante
  - observaciones
- Estados:
  - pendiente
  - parcial
  - pagada
  - anulada
- Cada pago recibido genera ingreso confirmado en Caja.
- Si la venta queda con saldo, el ingreso se categoriza como `adelanto_venta`.
- Si la venta queda pagada en un solo pago, el ingreso se categoriza como `venta_maquina`.
- Exportacion CSV de ventas.
- Badge de ventas con saldo pendiente.

## Modelo local

- `ventas_maquinas`
- Ingresos generados en `caja_movimientos` con `origen = venta_maquina`.

## Pendiente

- Crear tablas reales en PostgreSQL.
- Crear endpoints API.
- Adjuntar comprobantes reales.
- Crear ficha detallada de venta.
- Ajustes automaticos si una venta pagada se corrige o anula.
