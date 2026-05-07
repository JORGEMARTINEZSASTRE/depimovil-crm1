/* ══════════════════════════════════
   CAJA
══════════════════════════════════ */
const CAJA_CUENTAS_DEFAULT=[
  'Efectivo','Banco','Transferencia','MercadoPago','Prex','OCA Blue','BROU','Itaú'
];
const CAJA_CATEGORIAS_DEFAULT=[
  {id:'sena',tipo:'ingreso',label:'Seña'},
  {id:'saldo_reserva',tipo:'ingreso',label:'Saldo reserva'},
  {id:'venta_maquina',tipo:'ingreso',label:'Venta máquina'},
  {id:'adelanto_venta',tipo:'ingreso',label:'Adelanto venta máquina'},
  {id:'ajuste_positivo',tipo:'ingreso',label:'Ajuste positivo'},
  {id:'otros_ingreso',tipo:'ingreso',label:'Otros ingresos',requiereObs:true},
  {id:'transporte',tipo:'egreso',label:'Transporte'},
  {id:'limpieza',tipo:'egreso',label:'Limpieza'},
  {id:'servicio_tecnico',tipo:'egreso',label:'Servicio técnico'},
  {id:'repuestos',tipo:'egreso',label:'Repuestos'},
  {id:'insumos',tipo:'egreso',label:'Insumos'},
  {id:'comisiones',tipo:'egreso',label:'Comisiones'},
  {id:'ajuste_negativo',tipo:'egreso',label:'Ajuste negativo',requiereObs:true},
  {id:'otros_egreso',tipo:'egreso',label:'Otros egresos',requiereObs:true},
  {id:'ajuste_caja',tipo:'ajuste',label:'Ajuste de caja',requiereObs:true},
  {id:'anulacion',tipo:'ajuste',label:'Anulación',requiereObs:true}
];
const CAJA_ESTADOS={
  pendiente:{label:'Pendiente',badge:'badge-yellow',icon:'⏳'},
  confirmado:{label:'Confirmado',badge:'badge-green',icon:'✓'},
  anulado:{label:'Anulado',badge:'badge-red',icon:'✕'}
};
let cajaFilter={search:'',tipo:'',estado:'',moneda:''};

function ensureCajaData(){
  if(!DB.get('caja_cuentas')){
    DB.set('caja_cuentas',CAJA_CUENTAS_DEFAULT.map((nombre,i)=>({id:i+1,nombre,activo:true})));
  }
  if(!DB.get('caja_categorias')) DB.set('caja_categorias',CAJA_CATEGORIAS_DEFAULT);
  if(!DB.get('caja_movimientos')) DB.set('caja_movimientos',[]);
  if(!DB.get('caja_cierres')) DB.set('caja_cierres',[]);
}

function badgeCajaEstado(e){
  const st=CAJA_ESTADOS[e]||CAJA_ESTADOS.pendiente;
  return `<span class="badge ${st.badge}">${st.icon} ${st.label}</span>`;
}

function cajaCategoriaLabel(id){
  const c=(DB.get('caja_categorias')||[]).find(x=>x.id===id);
  return c?c.label:id||'—';
}

function cajaCuentaNombre(id){
  const c=(DB.get('caja_cuentas')||[]).find(x=>parseInt(x.id)===parseInt(id));
  return c?c.nombre:'—';
}

function cajaMontoClass(tipo){
  if(tipo==='ingreso')return 'caja-monto-ingreso';
  if(tipo==='egreso')return 'caja-monto-egreso';
  return 'caja-monto-ajuste';
}

function cajaMontoFirmado(m){
  const monto=parseFloat(m.monto)||0;
  if(m.tipo==='egreso')return -monto;
  if(m.tipo==='ajuste'&&['ajuste_negativo','anulacion'].includes(m.categoria))return -monto;
  return monto;
}

function renderCaja(){
  ensureCajaData();
  const movs=DB.get('caja_movimientos')||[];
  const confirmados=movs.filter(m=>m.estado==='confirmado');
  const total=function(moneda,tipo){
    return confirmados.filter(m=>m.moneda===moneda&&(!tipo||m.tipo===tipo))
      .reduce((s,m)=>s+Math.abs(cajaMontoFirmado(m)),0);
  };
  const saldo=function(moneda){
    return confirmados.filter(m=>m.moneda===moneda).reduce((s,m)=>s+cajaMontoFirmado(m),0);
  };
  document.getElementById('cajaResumen').innerHTML=`
    <div class="fin-cell"><div class="fc-label">Saldo UYU</div><div class="fc-value" style="color:${saldo('UYU')>=0?'var(--green)':'var(--red)'}">${saldo('UYU').toLocaleString()} UYU</div></div>
    <div class="fin-cell"><div class="fc-label">Saldo USD</div><div class="fc-value" style="color:${saldo('USD')>=0?'var(--green)':'var(--red)'}">${saldo('USD').toLocaleString()} USD</div></div>
    <div class="fin-cell"><div class="fc-label">Ingresos confirmados</div><div class="fc-value" style="color:var(--green)">${total('UYU','ingreso').toLocaleString()} UYU</div></div>
    <div class="fin-cell"><div class="fc-label">Egresos confirmados</div><div class="fc-value" style="color:var(--red)">${total('UYU','egreso').toLocaleString()} UYU</div></div>`;

  const pendientes=movs.filter(m=>m.estado==='pendiente').length;
  document.getElementById('cajaAlerts').innerHTML=pendientes?`<div class="alert-banner warn"><span class="ab-icon">⏳</span><div><strong>${pendientes} movimiento${pendientes>1?'s':''} pendiente${pendientes>1?'s':''}</strong> — Requieren confirmación administrativa.</div></div>`:'';
  renderCajaCuentas(confirmados);
  renderCajaCierres();
  renderCajaTabla(movs);
  updateCajaBadge();
}

function renderCajaCuentas(movs){
  const cuentas=DB.get('caja_cuentas')||[];
  document.getElementById('cajaCuentasGrid').innerHTML=cuentas.map(c=>{
    const saldos=['UYU','USD'].map(moneda=>{
      const s=movs.filter(m=>parseInt(m.cuentaId)===parseInt(c.id)&&m.moneda===moneda)
        .reduce((acc,m)=>acc+cajaMontoFirmado(m),0);
      return `<div class="caja-saldo-row"><span>${moneda}</span><strong style="color:${s>=0?'var(--text)':'var(--red)'}">${s.toLocaleString()}</strong></div>`;
    }).join('');
    return `<div class="caja-cuenta-card"><h4>${c.nombre}</h4>${saldos}</div>`;
  }).join('');
}

function renderCajaTabla(movs){
  const q=cajaFilter.search.toLowerCase();
  const filtered=movs.filter(m=>{
    const op=getOp(m.operadoraId);
    const res=(DB.get('reservas')||[]).find(r=>r.id===m.reservaId);
    const maq=getMaq(m.maquinaId);
    const haystack=[m.codigo,m.concepto,m.comprobante,m.relacionado,m.obs,cajaCategoriaLabel(m.categoria),op&&`${op.nombre} ${op.apellido}`,res&&res.codigo,maq&&maq.nombre].filter(Boolean).join(' ').toLowerCase();
    return (!q||haystack.includes(q))&&(!cajaFilter.tipo||m.tipo===cajaFilter.tipo)&&(!cajaFilter.estado||m.estado===cajaFilter.estado)&&(!cajaFilter.moneda||m.moneda===cajaFilter.moneda);
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.id-a.id);
  const tbody=document.getElementById('cajaTableBody');
  if(!filtered.length){
    tbody.innerHTML=`<tr><td colspan="10"><div class="empty-state"><div class="icon">💵</div><h3>Sin movimientos</h3><p>Cargá el primer ingreso, egreso o ajuste de Caja.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML=filtered.map(m=>{
    const op=getOp(m.operadoraId);
    const res=(DB.get('reservas')||[]).find(r=>r.id===m.reservaId);
    const maq=getMaq(m.maquinaId);
    const vinc=[op&&`${op.nombre} ${op.apellido}`,res&&res.codigo,maq&&maq.nombre,m.relacionado].filter(Boolean).join(' · ')||'—';
    return `<tr>
      <td>${fmtDate(m.fecha)}</td>
      <td><span style="font-family:monospace;color:var(--accent);font-size:11px">${m.codigo}</span></td>
      <td><span class="badge badge-${m.tipo==='ingreso'?'green':m.tipo==='egreso'?'red':'yellow'}">${m.tipo}</span></td>
      <td>${cajaCategoriaLabel(m.categoria)}</td>
      <td>${cajaCuentaNombre(m.cuentaId)}</td>
      <td><span class="${cajaMontoClass(m.tipo)}">${(parseFloat(m.monto)||0).toLocaleString()} ${m.moneda}</span></td>
      <td>${badgeCajaEstado(m.estado)}</td>
      <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${vinc}</td>
      <td>${m.origen||'manual'}</td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="openCajaModal(${m.id})">Ver</button>
        ${m.estado==='pendiente'?`<button class="action-btn" onclick="confirmarCajaMovimiento(${m.id})" style="margin-left:4px">Confirmar</button>`:''}
      </td></tr>`;
  }).join('');
}

function filterCaja(k,v){cajaFilter[k]=v;renderCaja();}

function cierreCajaRango(periodo,base){
  const d=new Date((base||today())+'T12:00:00');
  let desde=new Date(d), hasta=new Date(d);
  if(periodo==='semanal'){
    const day=(d.getDay()+6)%7;
    desde.setDate(d.getDate()-day);
    hasta=new Date(desde);hasta.setDate(desde.getDate()+6);
  }
  if(periodo==='mensual'){
    desde=new Date(d.getFullYear(),d.getMonth(),1);
    hasta=new Date(d.getFullYear(),d.getMonth()+1,0);
  }
  const fmt=x=>x.toISOString().slice(0,10);
  return {desde:fmt(desde),hasta:fmt(hasta)};
}

function calcularCierreCaja(){
  ensureCajaData();
  const desde=gv('cierreCajaDesde')||today();
  const hasta=gv('cierreCajaHasta')||desde;
  const cuentaId=parseInt(gv('cierreCajaCuenta'))||null;
  const moneda=gv('cierreCajaMoneda')||'UYU';
  const movs=(DB.get('caja_movimientos')||[]).filter(m=>
    m.estado==='confirmado'&&m.moneda===moneda&&
    (!cuentaId||parseInt(m.cuentaId)===cuentaId)&&
    (m.fecha||'')>=desde&&(m.fecha||'')<=hasta
  );
  const saldo=movs.reduce((s,m)=>s+cajaMontoFirmado(m),0);
  const contado=parseFloat(gv('cierreCajaContado'))||0;
  return {desde,hasta,cuentaId,moneda,movs,saldo,contado,diferencia:Math.round((contado-saldo)*100)/100};
}

function renderCajaCierres(){
  const tbody=document.getElementById('cajaCierresTableBody');
  if(!tbody)return;
  const rows=(DB.get('caja_cierres')||[]).slice().sort((a,b)=>(b.fechaHasta||'').localeCompare(a.fechaHasta||'')||b.id-a.id).slice(0,8);
  if(!rows.length){
    tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="icon">✓</div><h3>Sin cierres</h3><p>Cuando cierres caja, quedará el respaldo diario, semanal o mensual.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML=rows.map(c=>`<tr>
    <td>${fmtDate(c.fechaHasta)}</td><td>${c.periodo}</td><td>${cajaCuentaNombre(c.cuentaId)}</td><td>${c.moneda}</td>
    <td>${(c.saldoSistema||0).toLocaleString()}</td><td>${(c.saldoContado||0).toLocaleString()}</td>
    <td style="color:${Math.abs(c.diferencia||0)<0.01?'var(--green)':(c.diferencia||0)>0?'var(--yellow)':'var(--red)'}">${(c.diferencia||0).toLocaleString()}</td>
    <td>${c.movimientos||0}</td><td style="max-width:240px;overflow:hidden;text-overflow:ellipsis">${c.obs||'—'}</td>
  </tr>`).join('');
}

function actualizarCierreCajaPreview(){
  const c=calcularCierreCaja();
  const el=document.getElementById('cierreCajaPreview');
  if(!el)return;
  el.innerHTML=`<span class="ab-icon">✓</span><div><strong>Saldo sistema: ${c.saldo.toLocaleString()} ${c.moneda}</strong> · Movimientos: ${c.movs.length} · Diferencia: <strong style="color:${Math.abs(c.diferencia)<0.01?'var(--green)':c.diferencia>0?'var(--yellow)':'var(--red)'}">${c.diferencia.toLocaleString()} ${c.moneda}</strong></div>`;
}

function onCierreCajaPeriodoChange(){
  const r=cierreCajaRango(gv('cierreCajaPeriodo'),gv('cierreCajaHasta')||today());
  sv('cierreCajaDesde',r.desde);sv('cierreCajaHasta',r.hasta);
  actualizarCierreCajaPreview();
}

function openCierreCajaModal(){
  ensureCajaData();
  document.getElementById('cierreCajaCuenta').innerHTML=(DB.get('caja_cuentas')||[]).map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
  sv('cierreCajaPeriodo','diario');
  sv('cierreCajaDesde',today());sv('cierreCajaHasta',today());sv('cierreCajaMoneda','UYU');sv('cierreCajaContado','');sv('cierreCajaObs','');
  actualizarCierreCajaPreview();
  openModal('modalCierreCaja');
}

async function saveCierreCaja(){
  const c=calcularCierreCaja();
  const cierres=DB.get('caja_cierres')||[];
  const data={
    id:cierres.reduce((m,x)=>Math.max(m,x.id||0),0)+1,
    codigo:`CC-${String(cierres.reduce((m,x)=>Math.max(m,x.id||0),0)+1).padStart(5,'0')}`,
    periodo:gv('cierreCajaPeriodo')||'diario',fechaDesde:c.desde,fechaHasta:c.hasta,cuentaId:c.cuentaId,moneda:c.moneda,
    saldoSistema:c.saldo,saldoContado:c.contado,diferencia:c.diferencia,movimientos:c.movs.length,obs:gv('cierreCajaObs').trim(),creadoEn:new Date().toISOString()
  };
  try{
    const saved=await api('/api/finanzas/caja/cierres',{method:'POST',body:JSON.stringify(data)});
    Object.assign(data,saved||{});
    await recargarFinanzas();
  }catch(e){
    DB.set('caja_cierres',[...cierres,data]);
  }
  auditLog('CREATE','caja_cierres',data.id,`${data.codigo} ${data.periodo} ${data.moneda}`);
  closeModal('modalCierreCaja');
  showToast('✅ Cierre de caja guardado');
  renderCaja();
}

function onCajaTipoChange(){
  const tipo=gv('cajaTipo');
  const cats=(DB.get('caja_categorias')||[]).filter(c=>c.tipo===tipo);
  document.getElementById('cajaCategoria').innerHTML=cats.map(c=>`<option value="${c.id}">${c.label}</option>`).join('');
}

function openCajaModal(id){
  ensureCajaData();
  const mov=(DB.get('caja_movimientos')||[]).find(m=>m.id===id);
  document.getElementById('modalCajaTitle').textContent=mov?'Movimiento de Caja':'Nuevo Movimiento de Caja';
  document.getElementById('cajaCuenta').innerHTML=(DB.get('caja_cuentas')||[]).map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
  document.getElementById('cajaOperadora').innerHTML='<option value="">— Sin operadora —</option>'+(DB.get('operadoras')||[]).map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido||''}</option>`).join('');
  document.getElementById('cajaReserva').innerHTML='<option value="">— Sin reserva —</option>'+(DB.get('reservas')||[]).map(r=>`<option value="${r.id}">${r.codigo}</option>`).join('');
  document.getElementById('cajaMaquina').innerHTML='<option value="">— Sin máquina —</option>'+(DB.get('maquinas')||[]).map(m=>`<option value="${m.id}">${m.codigo||''} ${m.nombre||''}</option>`).join('');
  sv('cajaId',mov?.id||'');sv('cajaTipo',mov?.tipo||'ingreso');onCajaTipoChange();
  sv('cajaEstado',mov?.estado||'pendiente');sv('cajaFecha',mov?.fecha||today());
  sv('cajaCuenta',mov?.cuentaId||1);sv('cajaCategoria',mov?.categoria||'sena');
  sv('cajaMoneda',mov?.moneda||'UYU');sv('cajaMonto',mov?.monto||'');
  sv('cajaComprobante',mov?.comprobante||'');sv('cajaOperadora',mov?.operadoraId||'');
  sv('cajaReserva',mov?.reservaId||'');sv('cajaMaquina',mov?.maquinaId||'');
  sv('cajaRelacionado',mov?.relacionado||'');sv('cajaConcepto',mov?.concepto||'');
  sv('cajaObs',mov?.obs||'');
  openModal('modalCaja');
}

async function guardarCajaMovimientoApi(data, prev){
  if(typeof api!=='function')return null;
  const method=prev?'PUT':'POST';
  const path=prev?`/api/finanzas/caja/movimientos/${prev.id}`:'/api/finanzas/caja/movimientos';
  return api(path,{method,body:JSON.stringify(data)});
}

async function saveCajaMovimiento(){
  ensureCajaData();
  const movs=DB.get('caja_movimientos')||[];
  const id=gv('cajaId');
  const monto=parseFloat(gv('cajaMonto'))||0;
  if(monto<=0){showToast('⚠️ Ingresá un monto','warn');return;}
  const cat=(DB.get('caja_categorias')||[]).find(c=>c.id===gv('cajaCategoria'));
  const obs=gv('cajaObs').trim();
  if((cat?.requiereObs||gv('cajaEstado')==='anulado')&&!obs){showToast('⚠️ Esta categoría requiere observación','warn');return;}
  const prev=id?movs.find(m=>m.id===parseInt(id)):null;
  if(prev&&prev.estado==='confirmado'){showToast('⚠️ Un movimiento confirmado se corrige con ajuste, no se edita','warn');return;}
  const data={
    id:prev?.id||((movs.reduce((m,x)=>Math.max(m,x.id||0),0))+1),
    codigo:prev?.codigo||`CJ-${String((movs.reduce((m,x)=>Math.max(m,x.id||0),0))+1).padStart(5,'0')}`,
    tipo:gv('cajaTipo'),estado:gv('cajaEstado'),fecha:gv('cajaFecha')||today(),
    cuentaId:parseInt(gv('cajaCuenta')),categoria:gv('cajaCategoria'),moneda:gv('cajaMoneda'),monto,
    comprobante:gv('cajaComprobante').trim(),operadoraId:parseInt(gv('cajaOperadora'))||null,
    reservaId:parseInt(gv('cajaReserva'))||null,maquinaId:parseInt(gv('cajaMaquina'))||null,
    relacionado:gv('cajaRelacionado').trim(),concepto:gv('cajaConcepto').trim()||cajaCategoriaLabel(gv('cajaCategoria')),
    obs,origen:prev?.origen||'manual',usuario:currentUser?.email||currentUser?.nombre||'sistema',
    ts:prev?.ts||new Date().toISOString(),updatedAt:new Date().toISOString()
  };
  try{
    const saved=await guardarCajaMovimientoApi(data,prev);
    if(saved) data.id=saved.id;
    await recargarFinanzas();
  }catch(e){
    DB.set('caja_movimientos',prev?movs.map(m=>m.id===prev.id?data:m):[...movs,data]);
  }
  auditLog(prev?'UPDATE':'CREATE','caja_movimientos',data.id,`${data.codigo} ${data.tipo} ${data.monto} ${data.moneda}`);
  closeModal('modalCaja');
  showToast(prev?'✅ Movimiento actualizado':'✅ Movimiento registrado');
  renderCaja();
}

async function confirmarCajaMovimiento(id){
  const movs=DB.get('caja_movimientos')||[];
  const mov=movs.find(m=>m.id===id);if(!mov)return;
  try{
    await api('/api/finanzas/caja/movimientos/'+id+'/confirmar',{method:'PATCH'});
    await recargarFinanzas();
  }catch(e){
    mov.estado='confirmado';mov.confirmadoPor=currentUser?.email||currentUser?.nombre||'admin';mov.confirmadoEn=new Date().toISOString();
    DB.set('caja_movimientos',movs);
  }
  auditLog('UPDATE','caja_movimientos',id,`Movimiento ${mov.codigo} confirmado`);
  showToast('✅ Movimiento confirmado');
  renderCaja();
}

function cajaCuentaPorPago(pago){
  ensureCajaData();
  const ref=String(pago.comprobante||pago.obs||'').toLowerCase();
  const cuentas=DB.get('caja_cuentas')||[];
  const match=cuentas.find(c=>{
    const n=c.nombre.toLowerCase();
    return ref.includes(n.toLowerCase())||(n==='brou'&&ref.includes('brou'))||(n==='itaú'&&ref.includes('itau'));
  });
  return match?.id||cuentas.find(c=>c.nombre==='Transferencia')?.id||1;
}

function cajaBasePagoMovimiento(m){
  return m.categoriaBase||(['sena','saldo_reserva'].includes(m.categoria)?m.categoria:null);
}

function totalCajaPagoPorBase(pagoId,base){
  return (DB.get('caja_movimientos')||[])
    .filter(m=>m.origen==='pago'&&parseInt(m.pagoId)===parseInt(pagoId)&&m.estado!=='anulado'&&cajaBasePagoMovimiento(m)===base)
    .reduce((s,m)=>s+cajaMontoFirmado(m),0);
}

function crearCajaMovimientoPago(pago,tipo,categoria,monto,concepto,opts={}){
  if(!pago||!pago.id||monto<=0)return false;
  ensureCajaData();
  const movs=DB.get('caja_movimientos')||[];
  const nextId=movs.reduce((m,x)=>Math.max(m,x.id||0),0)+1;
  const data={
    id:nextId,
    codigo:`CJ-${String(nextId).padStart(5,'0')}`,
    tipo,
    estado:'confirmado',
    fecha:pago.fechaPago||today(),
    cuentaId:cajaCuentaPorPago(pago),
    categoria,
    moneda:pago.moneda||'UYU',
    monto:parseFloat(monto)||0,
    comprobante:pago.comprobante||'',
    operadoraId:pago.operadoraId||null,
    reservaId:pago.reservaId||null,
    maquinaId:null,
    relacionado:'',
    concepto,
    obs:opts.obs||`Movimiento automático desde pago ${pago.codigo||('#'+pago.id)}`,
    origen:'pago',
    pagoId:pago.id,
    categoriaBase:opts.categoriaBase||categoria,
    usuario:'sistema',
    ts:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  DB.set('caja_movimientos',[...movs,data]);
  if(typeof api==='function'){
    api('/api/finanzas/caja/movimientos',{method:'POST',body:JSON.stringify(data)}).then(saved=>{
      if(saved&&typeof recargarFinanzas==='function')return recargarFinanzas();
      return null;
    }).catch(()=>{});
  }
  auditLog('CREATE','caja_movimientos',data.id,`${data.codigo} generado desde ${pago.codigo||'pago'}: ${data.monto} ${data.moneda}`);
  return true;
}

function sincronizarCajaDesdePago(pago){
  if(!pago||!pago.id)return 0;
  const total=parseFloat(pago.montoTotal)||0;
  const sena=parseFloat(pago.senaAbonada)||0;
  const esperado={sena:0,saldo_reserva:0};
  if(pago.estado==='sena_abonada'){
    esperado.sena=sena;
  }
  if(pago.estado==='validado'){
    esperado.sena=sena;
    esperado.saldo_reserva=sena>0?Math.max(0,total-sena):total;
  }
  let creados=0;
  Object.entries(esperado).forEach(([base,montoEsperado])=>{
    const actual=totalCajaPagoPorBase(pago.id,base);
    const delta=Math.round((montoEsperado-actual)*100)/100;
    if(Math.abs(delta)<0.01)return;
    if(delta>0){
      creados+=crearCajaMovimientoPago(pago,'ingreso',base,delta,`${cajaCategoriaLabel(base)} ${pago.codigo||''}`,{
        categoriaBase:base,
        obs:`Ingreso automático por diferencia de pago ${pago.codigo||('#'+pago.id)}`
      })?1:0;
    }else{
      creados+=crearCajaMovimientoPago(pago,'ajuste','ajuste_negativo',Math.abs(delta),`Ajuste ${cajaCategoriaLabel(base)} ${pago.codigo||''}`,{
        categoriaBase:base,
        obs:`Ajuste automático por corrección/anulación de pago ${pago.codigo||('#'+pago.id)}`
      })?1:0;
    }
  });
  if(creados)updateCajaBadge();
  return creados;
}

function updateCajaBadge(){
  const count=(DB.get('caja_movimientos')||[]).filter(m=>m.estado==='pendiente').length;
  const badge=document.getElementById('navBadgeCaja');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}
