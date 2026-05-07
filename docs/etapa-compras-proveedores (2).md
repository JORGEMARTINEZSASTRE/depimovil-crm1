# Etapa Compras y Proveedores - Base local

## Implementado

- Nuevos menús dentro de Finanzas:
  - **Proveedores**
  - **Compras**
- Proveedor con:
  - nombre
  - documento/RUT
  - teléfono
  - dirección
  - observaciones
- Compra con:
  - proveedor
  - categoría: repuestos, insumos, servicio técnico, limpieza, transporte u otros
  - máquina vinculada opcional
  - referencia de servicio técnico/mantenimiento
  - total, moneda UYU/USD, comprobante y observaciones
  - pago parcial o total
- Estados de compra:
  - pendiente
  - parcial
  - pagada
  - anulada
- Cada pago de compra genera un egreso confirmado en Caja.
- Exportación CSV de Compras.
- Badge de Compras pendientes/parciales.

## Modelo local

- `proveedores`
- `compras`
- Los egresos generados se guardan en `caja_movimientos` con `origen = compra`.

## Pendiente

- Crear tablas reales en PostgreSQL.
- Crear endpoints API de proveedores y compras.
- Permitir adjuntar archivos reales de comprobantes/facturas.
- Crear ficha detallada de compra y proveedor.
- Crear anulación/ajustes automáticos si una compra pagada se corrige.
