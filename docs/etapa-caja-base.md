# Etapa Caja - Base visual y modelo local

## Implementado

- Nuevo menú **Caja** dentro de Finanzas.
- Pantalla con resumen de saldos UYU/USD.
- Saldos separados por cuenta/medio:
  - Efectivo
  - Banco
  - Transferencia
  - MercadoPago
  - Prex
  - OCA Blue
  - BROU
  - Itaú
- Tabla de movimientos de Caja.
- Filtros por texto, tipo, estado y moneda.
- Alta/edición de movimientos pendientes.
- Confirmación administrativa de movimientos pendientes.
- Exportación CSV de Caja.
- Auditoría de creación, edición y confirmación.
- Conexión inicial con **Pagos y Señas**:
  - Pago en estado `sena_abonada` crea ingreso confirmado de seña.
  - Pago en estado `validado` crea ingresos confirmados de seña y/o saldo de reserva.
  - Si el pago se corrige por mayor monto, crea ingreso adicional por la diferencia.
  - Si el pago se corrige por menor monto, se rechaza o se anula, crea ajuste negativo.
  - No duplica movimientos: compara lo esperado contra lo ya registrado y agrega solo diferencias.

## Modelo local

Claves en cache local:

- `caja_cuentas`
- `caja_categorias`
- `caja_movimientos`
- `caja_cierres`

## Reglas aplicadas

- Tipo de movimiento: ingreso, egreso o ajuste.
- Estado: pendiente, confirmado o anulado.
- Monedas: UYU y USD.
- Los movimientos confirmados no se editan directamente; deben corregirse con ajuste.
- Categorías sensibles requieren observación.
- Un movimiento puede vincularse con operadora, reserva, máquina y una persona/empresa relacionada.

## Pendiente

- Crear tablas reales en PostgreSQL.
- Crear endpoints API de Caja.
- Sincronizar la pantalla con backend.
- Agregar proveedores, compras y ventas de máquinas con adelantos.
- Agregar cierres diarios/semanales/mensuales.
