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
  if(m.tipo==='ajuste'&&m.categoria==='ajuste_negativo')return -monto;
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

function saveCajaMovimiento(){
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
  DB.set('caja_movimientos',prev?movs.map(m=>m.id===prev.id?data:m):[...movs,data]);
  auditLog(prev?'UPDATE':'CREATE','caja_movimientos',data.id,`${data.codigo} ${data.tipo} ${data.monto} ${data.moneda}`);
  closeModal('modalCaja');
  showToast(prev?'✅ Movimiento actualizado':'✅ Movimiento registrado');
  renderCaja();
}

function confirmarCajaMovimiento(id){
  const movs=DB.get('caja_movimientos')||[];
  const mov=movs.find(m=>m.id===id);if(!mov)return;
  mov.estado='confirmado';mov.confirmadoPor=currentUser?.email||currentUser?.nombre||'admin';mov.confirmadoEn=new Date().toISOString();
  DB.set('caja_movimientos',movs);
  auditLog('UPDATE','caja_movimientos',id,`Movimiento ${mov.codigo} confirmado`);
  showToast('✅ Movimiento confirmado');
  renderCaja();
}

function updateCajaBadge(){
  const count=(DB.get('caja_movimientos')||[]).filter(m=>m.estado==='pendiente').length;
  const badge=document.getElementById('navBadgeCaja');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}
