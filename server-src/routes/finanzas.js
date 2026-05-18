const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
const adminOnly = requireRole('superadmin', 'operaciones');

let schemaReady = false;

function toNumber(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function toIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function dateOnly(v) {
  if (!v) return null;
  return String(v).slice(0, 10);
}

async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS caja_cuentas (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS caja_categorias (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      label TEXT NOT NULL,
      requiere_obs BOOLEAN NOT NULL DEFAULT FALSE,
      requiere_comprobante BOOLEAN NOT NULL DEFAULT FALSE,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      documento TEXT DEFAULT '',
      telefono TEXT DEFAULT '',
      direccion TEXT DEFAULT '',
      obs TEXT DEFAULT '',
      created_by INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS compras (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      proveedor_id INTEGER REFERENCES proveedores(id),
      categoria TEXT NOT NULL DEFAULT 'repuestos',
      maquina_id INTEGER REFERENCES maquinas(id),
      total NUMERIC(14,2) NOT NULL DEFAULT 0,
      moneda TEXT NOT NULL DEFAULT 'UYU',
      pagado NUMERIC(14,2) NOT NULL DEFAULT 0,
      saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      cuenta_id INTEGER REFERENCES caja_cuentas(id),
      comprobante TEXT DEFAULT '',
      servicio TEXT DEFAULT '',
      concepto TEXT DEFAULT '',
      obs TEXT DEFAULT '',
      created_by INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ventas_maquinas (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      maquina_id INTEGER REFERENCES maquinas(id),
      comprador TEXT NOT NULL,
      telefono TEXT DEFAULT '',
      documento TEXT DEFAULT '',
      total NUMERIC(14,2) NOT NULL DEFAULT 0,
      moneda TEXT NOT NULL DEFAULT 'USD',
      pagado NUMERIC(14,2) NOT NULL DEFAULT 0,
      saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      cuenta_id INTEGER REFERENCES caja_cuentas(id),
      comprobante TEXT DEFAULT '',
      obs TEXT DEFAULT '',
      created_by INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS caja_movimientos (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE,
      tipo TEXT NOT NULL DEFAULT 'ingreso',
      estado TEXT NOT NULL DEFAULT 'pendiente',
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      cuenta_id INTEGER REFERENCES caja_cuentas(id),
      categoria TEXT REFERENCES caja_categorias(id),
      categoria_base TEXT,
      moneda TEXT NOT NULL DEFAULT 'UYU',
      monto NUMERIC(14,2) NOT NULL DEFAULT 0,
      comprobante TEXT DEFAULT '',
      operadora_id INTEGER REFERENCES operadoras(id),
      reserva_id INTEGER REFERENCES reservas(id),
      maquina_id INTEGER REFERENCES maquinas(id),
      proveedor_id INTEGER REFERENCES proveedores(id),
      compra_id INTEGER REFERENCES compras(id),
      venta_maquina_id INTEGER REFERENCES ventas_maquinas(id),
      pago_id INTEGER,
      relacionado TEXT DEFAULT '',
      concepto TEXT DEFAULT '',
      obs TEXT DEFAULT '',
      origen TEXT DEFAULT 'manual',
      usuario TEXT DEFAULT '',
      confirmado_por INTEGER REFERENCES usuarios(id),
      confirmado_en TIMESTAMPTZ,
      created_by INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS caja_cierres (
      id SERIAL PRIMARY KEY,
      codigo TEXT UNIQUE,
      periodo TEXT NOT NULL DEFAULT 'diario',
      fecha_desde DATE NOT NULL,
      fecha_hasta DATE NOT NULL,
      cuenta_id INTEGER REFERENCES caja_cuentas(id),
      moneda TEXT NOT NULL DEFAULT 'UYU',
      saldo_sistema NUMERIC(14,2) NOT NULL DEFAULT 0,
      saldo_contado NUMERIC(14,2) NOT NULL DEFAULT 0,
      diferencia NUMERIC(14,2) NOT NULL DEFAULT 0,
      movimientos INTEGER NOT NULL DEFAULT 0,
      obs TEXT DEFAULT '',
      created_by INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const cuentas = ['Efectivo','Banco','Transferencia','MercadoPago','Prex','OCA Blue','BROU','Itaú'];
  for (const nombre of cuentas) {
    await pool.query('INSERT INTO caja_cuentas (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [nombre]);
  }

  const categorias = [
    ['sena','ingreso','Seña',false], ['saldo_reserva','ingreso','Saldo reserva',false],
    ['venta_maquina','ingreso','Venta máquina',false], ['adelanto_venta','ingreso','Adelanto venta máquina',false],
    ['ajuste_positivo','ingreso','Ajuste positivo',false], ['otros_ingreso','ingreso','Otros ingresos',true],
    ['transporte','egreso','Transporte',false], ['limpieza','egreso','Limpieza',false],
    ['servicio_tecnico','egreso','Servicio técnico',false], ['repuestos','egreso','Repuestos',false],
    ['insumos','egreso','Insumos',false], ['comisiones','egreso','Comisiones',false],
    ['ajuste_negativo','egreso','Ajuste negativo',true], ['otros_egreso','egreso','Otros egresos',true],
    ['ajuste_caja','ajuste','Ajuste de caja',true], ['anulacion','ajuste','Anulación',true]
  ];
  for (const c of categorias) {
    await pool.query(
      `INSERT INTO caja_categorias (id,tipo,label,requiere_obs)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET tipo=EXCLUDED.tipo,label=EXCLUDED.label,requiere_obs=EXCLUDED.requiere_obs,updated_at=NOW()`,
      c
    );
  }
  schemaReady = true;
}

async function nextCode(prefix, table) {
  const { rows } = await pool.query(`SELECT COALESCE(MAX(id),0)+1 AS n FROM ${table}`);
  return `${prefix}-${String(rows[0].n).padStart(5, '0')}`;
}

function mapCuenta(r) { return { id:r.id, nombre:r.nombre, activo:r.activo }; }
function mapCategoria(r) { return { id:r.id, tipo:r.tipo, label:r.label, requiereObs:r.requiere_obs, requiereComprobante:r.requiere_comprobante, activo:r.activo }; }
function mapProveedor(r) { return { id:r.id, nombre:r.nombre, documento:r.documento||'', telefono:r.telefono||'', direccion:r.direccion||'', obs:r.obs||'', updatedAt:r.updated_at }; }
function mapCompra(r) {
  return { id:r.id, codigo:r.codigo, fecha:dateOnly(r.fecha), proveedorId:r.proveedor_id, categoria:r.categoria, maquinaId:r.maquina_id,
    total:toNumber(r.total), moneda:r.moneda, pagado:toNumber(r.pagado), saldo:toNumber(r.saldo), estado:r.estado,
    cuentaId:r.cuenta_id, comprobante:r.comprobante||'', servicio:r.servicio||'', concepto:r.concepto||'', obs:r.obs||'', updatedAt:r.updated_at };
}
function mapVenta(r) {
  return { id:r.id, codigo:r.codigo, fecha:dateOnly(r.fecha), maquinaId:r.maquina_id, comprador:r.comprador, telefono:r.telefono||'',
    documento:r.documento||'', total:toNumber(r.total), moneda:r.moneda, pagado:toNumber(r.pagado), saldo:toNumber(r.saldo),
    estado:r.estado, cuentaId:r.cuenta_id, comprobante:r.comprobante||'', obs:r.obs||'', updatedAt:r.updated_at };
}
function mapMovimiento(r) {
  return { id:r.id, codigo:r.codigo, tipo:r.tipo, estado:r.estado, fecha:dateOnly(r.fecha), cuentaId:r.cuenta_id,
    categoria:r.categoria, categoriaBase:r.categoria_base, moneda:r.moneda, monto:toNumber(r.monto), comprobante:r.comprobante||'',
    operadoraId:r.operadora_id, reservaId:r.reserva_id, maquinaId:r.maquina_id, proveedorId:r.proveedor_id,
    compraId:r.compra_id, ventaMaquinaId:r.venta_maquina_id, pagoId:r.pago_id, relacionado:r.relacionado||'',
    concepto:r.concepto||'', obs:r.obs||'', origen:r.origen||'manual', usuario:r.usuario||'', confirmadoEn:r.confirmado_en,
    ts:r.created_at, updatedAt:r.updated_at };
}
function mapCierre(r) {
  return { id:r.id, codigo:r.codigo, periodo:r.periodo, fechaDesde:dateOnly(r.fecha_desde), fechaHasta:dateOnly(r.fecha_hasta),
    cuentaId:r.cuenta_id, moneda:r.moneda, saldoSistema:toNumber(r.saldo_sistema), saldoContado:toNumber(r.saldo_contado),
    diferencia:toNumber(r.diferencia), movimientos:parseInt(r.movimientos,10)||0, obs:r.obs||'', creadoEn:r.created_at };
}

router.use(auth);
router.use(async (req, res, next) => {
  try { await ensureSchema(); next(); }
  catch (err) { console.error('Finanzas schema error:', err); res.status(500).json({ error: 'Error preparando Finanzas' }); }
});

router.get('/bootstrap', async (req, res) => {
  try {
    if (!['superadmin', 'administrador', 'operaciones'].includes(req.user.rol)) {
      return res.json({
        caja_cuentas: [],
        caja_categorias: [],
        caja_movimientos: [],
        caja_cierres: [],
        proveedores: [],
        compras: [],
        ventas_maquinas: []
      });
    }
    const [cuentas,categorias,movs,cierres,proveedores,compras,ventas] = await Promise.all([
      pool.query('SELECT * FROM caja_cuentas ORDER BY id'),
      pool.query('SELECT * FROM caja_categorias ORDER BY tipo,label'),
      pool.query('SELECT * FROM caja_movimientos ORDER BY fecha DESC, id DESC'),
      pool.query('SELECT * FROM caja_cierres ORDER BY fecha_hasta DESC, id DESC'),
      pool.query('SELECT * FROM proveedores ORDER BY nombre'),
      pool.query('SELECT * FROM compras ORDER BY fecha DESC, id DESC'),
      pool.query('SELECT * FROM ventas_maquinas ORDER BY fecha DESC, id DESC')
    ]);
    res.json({
      caja_cuentas: cuentas.rows.map(mapCuenta),
      caja_categorias: categorias.rows.map(mapCategoria),
      caja_movimientos: movs.rows.map(mapMovimiento),
      caja_cierres: cierres.rows.map(mapCierre),
      proveedores: proveedores.rows.map(mapProveedor),
      compras: compras.rows.map(mapCompra),
      ventas_maquinas: ventas.rows.map(mapVenta)
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.post('/caja/movimientos', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const codigo = b.codigo || await nextCode('CJ', 'caja_movimientos');
    const { rows } = await pool.query(
      `INSERT INTO caja_movimientos
       (codigo,tipo,estado,fecha,cuenta_id,categoria,categoria_base,moneda,monto,comprobante,operadora_id,reserva_id,maquina_id,proveedor_id,compra_id,venta_maquina_id,pago_id,relacionado,concepto,obs,origen,usuario,confirmado_por,confirmado_en,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [codigo,b.tipo||'ingreso',b.estado||'pendiente',b.fecha||null,toIntOrNull(b.cuentaId),b.categoria||null,b.categoriaBase||null,b.moneda||'UYU',toNumber(b.monto),b.comprobante||'',
       toIntOrNull(b.operadoraId),toIntOrNull(b.reservaId),toIntOrNull(b.maquinaId),toIntOrNull(b.proveedorId),toIntOrNull(b.compraId),toIntOrNull(b.ventaMaquinaId),toIntOrNull(b.pagoId),
       b.relacionado||'',b.concepto||'',b.obs||'',b.origen||'manual',b.usuario||req.user.email||req.user.whatsapp||'admin',
       b.estado === 'confirmado' ? req.user.id : null, b.estado === 'confirmado' ? new Date() : null, req.user.id]
    );
    res.status(201).json(mapMovimiento(rows[0]));
  } catch (err) { console.error('Create caja movimiento error:', err); res.status(500).json({ error: 'Error interno' }); }
});

router.put('/caja/movimientos/:id', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const current = await pool.query('SELECT estado FROM caja_movimientos WHERE id=$1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Movimiento no encontrado' });
    if (current.rows[0].estado === 'confirmado') return res.status(400).json({ error: 'Un movimiento confirmado se corrige con ajuste' });
    const { rows } = await pool.query(
      `UPDATE caja_movimientos SET tipo=$1,estado=$2,fecha=$3,cuenta_id=$4,categoria=$5,categoria_base=$6,moneda=$7,monto=$8,comprobante=$9,operadora_id=$10,reserva_id=$11,maquina_id=$12,relacionado=$13,concepto=$14,obs=$15,updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [b.tipo||'ingreso',b.estado||'pendiente',b.fecha||null,toIntOrNull(b.cuentaId),b.categoria||null,b.categoriaBase||null,b.moneda||'UYU',toNumber(b.monto),b.comprobante||'',
       toIntOrNull(b.operadoraId),toIntOrNull(b.reservaId),toIntOrNull(b.maquinaId),b.relacionado||'',b.concepto||'',b.obs||'',req.params.id]
    );
    res.json(mapMovimiento(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.patch('/caja/movimientos/:id/confirmar', adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE caja_movimientos SET estado='confirmado',confirmado_por=$1,confirmado_en=NOW(),updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Movimiento no encontrado' });
    res.json(mapMovimiento(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.post('/caja/cierres', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const codigo = b.codigo || await nextCode('CC', 'caja_cierres');
    const saldoSistema = toNumber(b.saldoSistema);
    const saldoContado = toNumber(b.saldoContado);
    const diferencia = Math.round((saldoContado - saldoSistema) * 100) / 100;
    const { rows } = await pool.query(
      `INSERT INTO caja_cierres
       (codigo,periodo,fecha_desde,fecha_hasta,cuenta_id,moneda,saldo_sistema,saldo_contado,diferencia,movimientos,obs,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [codigo,b.periodo||'diario',b.fechaDesde||null,b.fechaHasta||null,toIntOrNull(b.cuentaId),b.moneda||'UYU',
       saldoSistema,saldoContado,diferencia,parseInt(b.movimientos,10)||0,b.obs||'',req.user.id]
    );
    res.status(201).json(mapCierre(rows[0]));
  } catch (err) { console.error('Create caja cierre error:', err); res.status(500).json({ error: 'Error interno' }); }
});

router.post('/proveedores', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    if (!String(b.nombre || '').trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const { rows } = await pool.query(
      `INSERT INTO proveedores (nombre,documento,telefono,direccion,obs,created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [b.nombre.trim(),b.documento||'',b.telefono||'',b.direccion||'',b.obs||'',req.user.id]
    );
    res.status(201).json(mapProveedor(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.put('/proveedores/:id', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const { rows } = await pool.query(
      `UPDATE proveedores SET nombre=$1,documento=$2,telefono=$3,direccion=$4,obs=$5,updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [String(b.nombre||'').trim(),b.documento||'',b.telefono||'',b.direccion||'',b.obs||'',req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(mapProveedor(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.post('/compras', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const codigo = b.codigo || await nextCode('CP', 'compras');
    const { rows } = await pool.query(
      `INSERT INTO compras (codigo,fecha,proveedor_id,categoria,maquina_id,total,moneda,pagado,saldo,estado,cuenta_id,comprobante,servicio,concepto,obs,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [codigo,b.fecha||null,toIntOrNull(b.proveedorId),b.categoria||'repuestos',toIntOrNull(b.maquinaId),toNumber(b.total),b.moneda||'UYU',toNumber(b.pagado),toNumber(b.saldo),b.estado||'pendiente',toIntOrNull(b.cuentaId),b.comprobante||'',b.servicio||'',b.concepto||'',b.obs||'',req.user.id]
    );
    res.status(201).json(mapCompra(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.put('/compras/:id', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const { rows } = await pool.query(
      `UPDATE compras SET fecha=$1,proveedor_id=$2,categoria=$3,maquina_id=$4,total=$5,moneda=$6,pagado=$7,saldo=$8,estado=$9,cuenta_id=$10,comprobante=$11,servicio=$12,concepto=$13,obs=$14,updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [b.fecha||null,toIntOrNull(b.proveedorId),b.categoria||'repuestos',toIntOrNull(b.maquinaId),toNumber(b.total),b.moneda||'UYU',toNumber(b.pagado),toNumber(b.saldo),b.estado||'pendiente',toIntOrNull(b.cuentaId),b.comprobante||'',b.servicio||'',b.concepto||'',b.obs||'',req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(mapCompra(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.post('/ventas-maquinas', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const codigo = b.codigo || await nextCode('VM', 'ventas_maquinas');
    const { rows } = await pool.query(
      `INSERT INTO ventas_maquinas (codigo,fecha,maquina_id,comprador,telefono,documento,total,moneda,pagado,saldo,estado,cuenta_id,comprobante,obs,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [codigo,b.fecha||null,toIntOrNull(b.maquinaId),String(b.comprador||'').trim(),b.telefono||'',b.documento||'',toNumber(b.total),b.moneda||'USD',toNumber(b.pagado),toNumber(b.saldo),b.estado||'pendiente',toIntOrNull(b.cuentaId),b.comprobante||'',b.obs||'',req.user.id]
    );
    res.status(201).json(mapVenta(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

router.put('/ventas-maquinas/:id', adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    const { rows } = await pool.query(
      `UPDATE ventas_maquinas SET fecha=$1,maquina_id=$2,comprador=$3,telefono=$4,documento=$5,total=$6,moneda=$7,pagado=$8,saldo=$9,estado=$10,cuenta_id=$11,comprobante=$12,obs=$13,updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [b.fecha||null,toIntOrNull(b.maquinaId),String(b.comprador||'').trim(),b.telefono||'',b.documento||'',toNumber(b.total),b.moneda||'USD',toNumber(b.pagado),toNumber(b.saldo),b.estado||'pendiente',toIntOrNull(b.cuentaId),b.comprobante||'',b.obs||'',req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(mapVenta(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
