/* ══════════════════════════════════
   VENTAS DE MÁQUINAS
══════════════════════════════════ */
let ventasMaqFilter={search:'',estado:''};
let ventasMaqPrecioFilter={equipo:'',localidad:''};
let ventasMaqPreciosLoading=false;

function ensureVentasMaquinasData(){
  if(!DB.get('ventas_maquinas')) DB.set('ventas_maquinas',[]);
  if(!DB.get('maquina_tarifas')) DB.set('maquina_tarifas',[]);
}
function precioMaqFmt(valor){
  const n=Number(valor)||0;
  return n.toLocaleString('es-UY',{maximumFractionDigits:0});
}
function precioMaqModalidadLabel(m){
  const map={
    media_jornada:'Media jornada',
    inicio_suave:'Inicio suave',
    jornada:'Jornada',
    '2_jornadas':'2 jornadas',
    '3_jornadas':'3 jornadas',
    semana:'Semana',
    mensual:'Mensual'
  };
  return map[m]||m||'Jornada';
}
function precioMaqOrdenModalidad(m){
  return {media_jornada:0,inicio_suave:1,jornada:2,'2_jornadas':3,'3_jornadas':4,semana:5,mensual:6}[m] ?? 9;
}
function ensureVentasMaqPreciosPanel(){
  let panel=document.getElementById('ventasMaqPreciosPanel');
  if(panel)return panel;
  const resumen=document.getElementById('ventasMaqResumen');
  if(!resumen||!resumen.parentNode)return null;
  panel=document.createElement('div');
  panel.className='table-container';
  panel.id='ventasMaqPreciosPanel';
  panel.innerHTML=`
    <div class="table-header">
      <h3>ADN precios de alquiler</h3>
      <div class="table-actions">
        <select class="filter-select" id="ventasMaqPrecioEquipo" onchange="filterVentasMaqPrecios('equipo',this.value)"><option value="">Equipo</option></select>
        <select class="filter-select" id="ventasMaqPrecioZona" onchange="filterVentasMaqPrecios('localidad',this.value)"><option value="">Zona</option></select>
      </div>
    </div>
    <div id="ventasMaqPreciosTable"></div>`;
  resumen.insertAdjacentElement('afterend',panel);
  return panel;
}
function ventaMaqEstadoBadge(e){
  const map={pendiente:['badge-yellow','Pendiente'],parcial:['badge-blue','Parcial'],pagada:['badge-green','Pagada'],anulada:['badge-red','Anulada']};
  const m=map[e]||map.pendiente;return `<span class="badge ${m[0]}">${m[1]}</span>`;
}
function renderVentasMaquinas(){
  ensureVentasMaquinasData();
  const ventas=DB.get('ventas_maquinas')||[];
  const pendientes=ventas.filter(v=>['pendiente','parcial'].includes(v.estado));
  const totalVendido=ventas.reduce((s,v)=>s+(v.total||0),0);
  const totalCobrado=ventas.reduce((s,v)=>s+(v.pagado||0),0);
  const totalSaldo=pendientes.reduce((s,v)=>s+(v.saldo||0),0);
  document.getElementById('ventasMaqAlerts').innerHTML=pendientes.length?`<div class="alert-banner warn"><span class="ab-icon">⏳</span><div><strong>${pendientes.length} venta${pendientes.length>1?'s':''} con saldo pendiente</strong> — Saldo abierto ${totalSaldo.toLocaleString()}.</div></div>`:'';
  document.getElementById('ventasMaqResumen').innerHTML=`
    <div class="fin-cell"><div class="fc-label">Ventas</div><div class="fc-value">${ventas.length}</div></div>
    <div class="fin-cell"><div class="fc-label">Total vendido</div><div class="fc-value">${totalVendido.toLocaleString()}</div></div>
    <div class="fin-cell"><div class="fc-label">Cobrado</div><div class="fc-value" style="color:var(--green)">${totalCobrado.toLocaleString()}</div></div>
    <div class="fin-cell"><div class="fc-label">Saldo pendiente</div><div class="fc-value" style="color:var(--yellow)">${totalSaldo.toLocaleString()}</div></div>`;
  renderVentasMaqPrecios();
  renderVentasMaquinasTabla(ventas);updateVentasMaquinasBadge();
}
function renderVentasMaqPrecios(){
  ensureVentasMaqPreciosPanel();
  const tarifas=(DB.get('maquina_tarifas')||[]).filter(t=>Number(t.precio)>0);
  const panel=document.getElementById('ventasMaqPreciosPanel');
  const wrap=document.getElementById('ventasMaqPreciosTable');
  if(!panel||!wrap)return;
  if(!tarifas.length){
    wrap.innerHTML='<div class="empty-state" style="padding:18px"><h3>Cargando precios</h3><p>La matriz de precios se carga desde administración.</p></div>';
    cargarVentasMaqPreciosRemotos();
    return;
  }
  const equipoEl=document.getElementById('ventasMaqPrecioEquipo');
  const zonaEl=document.getElementById('ventasMaqPrecioZona');
  const equipos=[...new Set(tarifas.map(t=>t.equipo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const zonas=[...new Set(tarifas.map(t=>t.localidad).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  if(equipoEl){
    const actual=ventasMaqPrecioFilter.equipo||equipoEl.value||'';
    equipoEl.innerHTML='<option value="">Equipo</option>'+equipos.map(e=>`<option value="${escapeHTML(e)}">${escapeHTML(e)}</option>`).join('');
    equipoEl.value=actual;
  }
  if(zonaEl){
    const actual=ventasMaqPrecioFilter.localidad||zonaEl.value||'';
    zonaEl.innerHTML='<option value="">Zona</option>'+zonas.map(z=>`<option value="${escapeHTML(z)}">${escapeHTML(z)}</option>`).join('');
    zonaEl.value=actual;
  }
  const rows=tarifas.filter(t=>
    (!ventasMaqPrecioFilter.equipo||t.equipo===ventasMaqPrecioFilter.equipo)&&
    (!ventasMaqPrecioFilter.localidad||t.localidad===ventasMaqPrecioFilter.localidad)
  ).sort((a,b)=>
    (a.equipo||'').localeCompare(b.equipo||'','es')||
    (a.formato||'').localeCompare(b.formato||'','es')||
    (a.localidad||'').localeCompare(b.localidad||'','es')||
    precioMaqOrdenModalidad(a.modalidad)-precioMaqOrdenModalidad(b.modalidad)
  );
  const limit=36;
  const visible=rows.slice(0,limit);
  wrap.innerHTML=`
    <div style="overflow-x:auto">
      <table>
        <thead><tr><th>Equipo</th><th>Formato</th><th>Zona</th><th>Modalidad</th><th style="text-align:right">Precio</th><th>Condición</th></tr></thead>
        <tbody>${visible.map(t=>`
          <tr>
            <td><strong>${escapeHTML(t.equipo)}</strong></td>
            <td>${escapeHTML(t.formato||'General')}</td>
            <td>${escapeHTML(t.localidad||'—')}</td>
            <td>${t.inicioSuave?'<span class="badge badge-green">Inicio suave</span>':escapeHTML(precioMaqModalidadLabel(t.modalidad))}</td>
            <td style="text-align:right"><strong>${precioMaqFmt(t.precio)}</strong> ${escapeHTML(t.moneda||'UYU')}</td>
            <td>${escapeHTML(t.condicion||'—')}</td>
          </tr>`).join('')}</tbody>
      </table>
    </div>
    ${rows.length>limit?`<div style="font-size:12px;color:var(--text3);margin-top:8px">Mostrando ${limit} de ${rows.length}. Usá los filtros para afinar la búsqueda.</div>`:''}`;
}
function filterVentasMaqPrecios(k,v){
  ventasMaqPrecioFilter[k]=v;
  renderVentasMaqPrecios();
}
async function cargarVentasMaqPreciosRemotos(){
  if(ventasMaqPreciosLoading||!(currentUser&&isAdminRole(currentUser.rol)))return;
  ventasMaqPreciosLoading=true;
  try{
    const tarifas=await api('/api/finanzas/maquina-tarifas');
    if(Array.isArray(tarifas))DB.set('maquina_tarifas',tarifas);
    renderVentasMaqPrecios();
  }catch(e){
    const wrap=document.getElementById('ventasMaqPreciosTable');
    if(wrap)wrap.innerHTML='<div class="empty-state" style="padding:18px"><h3>Sin precios cargados</h3><p>No se pudo obtener la matriz de precios.</p></div>';
  }finally{
    ventasMaqPreciosLoading=false;
  }
}
function renderVentasMaquinasTabla(ventas){
  const q=ventasMaqFilter.search.toLowerCase();
  const rows=ventas.filter(v=>{
    const m=getMaq(v.maquinaId);
    const txt=[v.codigo,v.comprador,v.telefono,v.documento,v.comprobante,v.obs,m&&m.nombre,m&&m.codigo].filter(Boolean).join(' ').toLowerCase();
    return (!q||txt.includes(q))&&(!ventasMaqFilter.estado||v.estado===ventasMaqFilter.estado);
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.id-a.id);
  const tbody=document.getElementById('ventasMaqTableBody');
  if(!rows.length){tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="icon">🏷</div><h3>Sin ventas</h3><p>Cargá ventas de máquinas con adelantos y saldo.</p></div></td></tr>`;return;}
  tbody.innerHTML=rows.map(v=>{const m=getMaq(v.maquinaId);return `<tr>
    <td>${fmtDate(v.fecha)}</td><td><span style="font-family:monospace;color:var(--accent);font-size:11px">${v.codigo}</span></td>
    <td>${m?m.nombre:'—'}</td><td><span class="bold">${v.comprador}</span></td>
    <td><strong>${(v.total||0).toLocaleString()}</strong> ${v.moneda}</td><td>${(v.pagado||0).toLocaleString()}</td><td style="color:${v.saldo>0?'var(--yellow)':'var(--green)'}">${(v.saldo||0).toLocaleString()}</td>
    <td>${ventaMaqEstadoBadge(v.estado)}</td><td><button class="action-btn" onclick="openVentaMaquinaModal(${v.id})">Editar</button></td>
  </tr>`;}).join('');
}
function filterVentasMaq(k,v){ventasMaqFilter[k]=v;renderVentasMaquinas();}
function openVentaMaquinaModal(id){
  ensureVentasMaquinasData();ensureCajaData();
  const venta=(DB.get('ventas_maquinas')||[]).find(v=>v.id===id);
  document.getElementById('modalVentaMaquinaTitle').textContent=venta?'Editar Venta de Máquina':'Nueva Venta de Máquina';
  document.getElementById('ventaMaqMaquina').innerHTML='<option value="">— Seleccionar —</option>'+(DB.get('maquinas')||[]).map(m=>`<option value="${m.id}">${m.codigo||''} ${m.nombre||''}</option>`).join('');
  document.getElementById('ventaMaqCuenta').innerHTML=(DB.get('caja_cuentas')||[]).map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('');
  sv('ventaMaqId',venta?.id||'');sv('ventaMaqFecha',venta?.fecha||today());sv('ventaMaqMaquina',venta?.maquinaId||'');
  sv('ventaMaqComprador',venta?.comprador||'');sv('ventaMaqTelefono',venta?.telefono||'');sv('ventaMaqDocumento',venta?.documento||'');
  sv('ventaMaqTotal',venta?.total||'');sv('ventaMaqMoneda',venta?.moneda||'USD');sv('ventaMaqPago','');
  sv('ventaMaqCuenta',venta?.cuentaId||1);sv('ventaMaqComprobante',venta?.comprobante||'');sv('ventaMaqObs',venta?.obs||'');
  calcVentaMaqSaldo();openModal('modalVentaMaquina');
}
function calcVentaMaqSaldo(){
  const total=parseFloat(gv('ventaMaqTotal'))||0;const pago=parseFloat(gv('ventaMaqPago'))||0;const wrap=document.getElementById('ventaMaqSaldoWrap');
  if(total>0){wrap.style.display='flex';wrap.innerHTML=`Pago recibido ahora: <strong>${pago.toLocaleString()}</strong> · Saldo estimado: <strong>${Math.max(0,total-pago).toLocaleString()}</strong>`;}else wrap.style.display='none';
}
async function saveVentaMaquina(){
  ensureVentasMaquinasData();
  const ventas=DB.get('ventas_maquinas')||[];const id=gv('ventaMaqId');const total=parseFloat(gv('ventaMaqTotal'))||0;const pago=parseFloat(gv('ventaMaqPago'))||0;
  if(!gv('ventaMaqMaquina')){showToast('⚠️ Seleccioná máquina','warn');return;}
  if(!gv('ventaMaqComprador').trim()){showToast('⚠️ Ingresá comprador','warn');return;}
  if(total<=0){showToast('⚠️ Ingresá precio total','warn');return;}
  const prev=id?ventas.find(v=>v.id===parseInt(id)):null;const pagadoPrev=prev?.pagado||0;const pagado=Math.min(total,pagadoPrev+pago);const saldo=Math.max(0,total-pagado);
  const data={id:prev?.id||ventas.reduce((m,v)=>Math.max(m,v.id||0),0)+1,codigo:prev?.codigo||`VM-${String(ventas.reduce((m,v)=>Math.max(m,v.id||0),0)+1).padStart(5,'0')}`,fecha:gv('ventaMaqFecha')||today(),maquinaId:parseInt(gv('ventaMaqMaquina')),comprador:gv('ventaMaqComprador').trim(),telefono:gv('ventaMaqTelefono').trim(),documento:gv('ventaMaqDocumento').trim(),total,moneda:gv('ventaMaqMoneda'),pagado,saldo,estado:saldo<=0?'pagada':pagado>0?'parcial':'pendiente',cuentaId:parseInt(gv('ventaMaqCuenta')),comprobante:gv('ventaMaqComprobante').trim(),obs:gv('ventaMaqObs').trim(),updatedAt:new Date().toISOString()};
  try{
    const saved=await api(prev?`/api/finanzas/ventas-maquinas/${prev.id}`:'/api/finanzas/ventas-maquinas',{method:prev?'PUT':'POST',body:JSON.stringify(data)});
    Object.assign(data,saved||{});
    if(pago>0)crearIngresoCajaVentaMaquina(data,pago,saldo>0);
    await recargarFinanzas();
  }catch(e){
    DB.set('ventas_maquinas',prev?ventas.map(v=>v.id===prev.id?data:v):[...ventas,data]);
    if(pago>0)crearIngresoCajaVentaMaquina(data,pago,saldo>0);
  }
  auditLog(prev?'UPDATE':'CREATE','ventas_maquinas',data.id,`${data.codigo} ${data.total} ${data.moneda}`);
  closeModal('modalVentaMaquina');showToast('✅ Venta guardada');renderVentasMaquinas();
}
function crearIngresoCajaVentaMaquina(venta,monto,esAdelanto){
  ensureCajaData();
  const movs=DB.get('caja_movimientos')||[];const nextId=movs.reduce((m,x)=>Math.max(m,x.id||0),0)+1;const maq=getMaq(venta.maquinaId);
  const categoria=esAdelanto?'adelanto_venta':'venta_maquina';
  const mov={id:nextId,codigo:`CJ-${String(nextId).padStart(5,'0')}`,tipo:'ingreso',estado:'confirmado',fecha:venta.fecha,cuentaId:venta.cuentaId,categoria,moneda:venta.moneda,monto,comprobante:venta.comprobante||'',operadoraId:null,reservaId:null,maquinaId:venta.maquinaId,relacionado:venta.comprador,concepto:`${esAdelanto?'Adelanto':'Pago'} venta ${venta.codigo} · ${maq?maq.nombre:''}`,obs:`Ingreso automático desde venta ${venta.codigo}`,origen:'venta_maquina',ventaMaquinaId:venta.id,usuario:'sistema',ts:new Date().toISOString(),updatedAt:new Date().toISOString()};
  DB.set('caja_movimientos',[...movs,mov]);
  if(typeof api==='function'){
    api('/api/finanzas/caja/movimientos',{method:'POST',body:JSON.stringify(mov)}).then(()=>typeof recargarFinanzas==='function'?recargarFinanzas():null).catch(()=>{});
  }
  auditLog('CREATE','caja_movimientos',mov.id,`${mov.codigo} ingreso venta ${venta.codigo}`);
}
function updateVentasMaquinasBadge(){
  const count=(DB.get('ventas_maquinas')||[]).filter(v=>['pendiente','parcial'].includes(v.estado)).length;const badge=document.getElementById('navBadgeVentasMaq');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}
