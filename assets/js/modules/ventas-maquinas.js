/* ══════════════════════════════════
   VENTAS DE MÁQUINAS
══════════════════════════════════ */
let ventasMaqFilter={search:'',estado:''};
let ventasMaqPrecioFilter={equipo:'',localidad:''};
let ventasMaqPreciosLoading=false;
let preciosMaqFilter={equipo:'',formato:'',localidad:'',modalidad:''};
let preciosMaqNuevo=false;
let preciosMaqEditId=null;

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
function precioMaqModalidades(){
  return ['media_jornada','inicio_suave','jornada','2_jornadas','3_jornadas','semana','mensual'];
}
function precioMaqInput(id,key,value,type='text',extra=''){
  return `<input ${type?`type="${type}"`:''} id="precio-${id}-${key}" value="${escapeAttr(value ?? '')}" ${extra} style="width:100%;min-width:90px;text-align:${key==='precio'||key==='disparosIncluidos'||key==='excedentePrecio'?'right':'left'}">`;
}
function precioMaqSelect(id,key,value,options){
  return `<select id="precio-${id}-${key}" style="width:100%;min-width:110px">${options.map(o=>`<option value="${escapeAttr(o.value)}" ${String(o.value)===String(value)?'selected':''}>${escapeHTML(o.label)}</option>`).join('')}</select>`;
}
function precioMaqRowPayload(id){
  const val=k=>gv(`precio-${id}-${k}`).trim();
  const precio=val('precio').replace(/\./g,'').replace(',','.');
  const disparos=val('disparosIncluidos').replace(/\./g,'');
  return {
    equipo:val('equipo'),
    formato:val('formato'),
    localidad:val('localidad'),
    modalidad:val('modalidad'),
    jornadas:parseInt(val('jornadas'),10)||1,
    precio:parseFloat(precio)||0,
    moneda:val('moneda')||'UYU',
    condicion:val('condicion'),
    inicioSuave:val('modalidad')==='inicio_suave',
    disparosIncluidos:disparos?parseInt(disparos,10):null,
    excedentePrecio:val('excedentePrecio')?parseFloat(val('excedentePrecio').replace(/\./g,'').replace(',','.')):null
  };
}
async function guardarPrecioMaquina(id){
  const payload=precioMaqRowPayload(id);
  if(!payload.equipo||!payload.localidad||!payload.modalidad||payload.precio<=0){
    showToast('⚠️ Equipo, zona, modalidad y precio son obligatorios','warn');return;
  }
  try{
    const url=id==='nuevo'?'/api/finanzas/maquina-tarifas':`/api/finanzas/maquina-tarifas/${id}`;
    const saved=await api(url,{method:id==='nuevo'?'POST':'PUT',body:JSON.stringify(payload)});
    const tarifas=DB.get('maquina_tarifas')||[];
    if(id==='nuevo'){
      DB.set('maquina_tarifas',[...tarifas,saved]);
      preciosMaqNuevo=false;
    }else{
      DB.set('maquina_tarifas',tarifas.map(t=>parseInt(t.id)===parseInt(id)?saved:t));
      preciosMaqEditId=null;
    }
    showToast('✅ Precio guardado');
    renderPreciosMaquinas();
    if(typeof renderVentasMaqPrecios==='function')renderVentasMaqPrecios();
  }catch(e){showToast('⛔ '+e.message,'warn');}
}
async function eliminarPrecioMaquina(id){
  if(!confirm('¿Desactivar este precio?'))return;
  try{
    await api(`/api/finanzas/maquina-tarifas/${id}`,{method:'DELETE'});
    DB.set('maquina_tarifas',(DB.get('maquina_tarifas')||[]).filter(t=>parseInt(t.id)!==parseInt(id)));
    showToast('✅ Precio desactivado');
    renderPreciosMaquinas();
  }catch(e){showToast('⛔ '+e.message,'warn');}
}
function precioMaqEditableRow(t,id){
  const modalidades=precioMaqModalidades().map(m=>({value:m,label:precioMaqModalidadLabel(m)}));
  return `<tr>
    <td>${precioMaqInput(id,'equipo',t.equipo)}</td>
    <td>${precioMaqInput(id,'formato',t.formato||'')}</td>
    <td>${precioMaqInput(id,'localidad',t.localidad)}</td>
    <td>${precioMaqSelect(id,'modalidad',t.modalidad||'jornada',modalidades)}</td>
    <td style="text-align:right">
      <div style="display:grid;grid-template-columns:minmax(90px,1fr) 70px;gap:6px;align-items:center">
        ${precioMaqInput(id,'precio',precioMaqFmt(t.precio||0),'text')}
        ${precioMaqInput(id,'moneda',t.moneda||'UYU')}
      </div>
    </td>
    <td>${precioMaqInput(id,'jornadas',t.jornadas||1,'number','min="1"')}</td>
    <td>${precioMaqInput(id,'disparosIncluidos',t.disparosIncluidos||'','text')}</td>
    <td>${precioMaqInput(id,'excedentePrecio',t.excedentePrecio||'','text')}</td>
    <td>${precioMaqInput(id,'condicion',t.condicion||'')}</td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="guardarPrecioMaquina('${id}')">Guardar</button>
      ${id==='nuevo'?`<button class="action-btn" onclick="preciosMaqNuevo=false;renderPreciosMaquinas()">Cancelar</button>`:`<button class="action-btn" onclick="preciosMaqEditId=null;renderPreciosMaquinas()">Cancelar</button>`}
    </td>
  </tr>`;
}
function precioMaqDisplayRow(t){
  const disparos=t.disparosIncluidos?precioMaqFmt(t.disparosIncluidos):'—';
  const excedente=t.excedentePrecio?`${precioMaqFmt(t.excedentePrecio)} ${escapeHTML(t.moneda||'UYU')}`:'—';
  return `<tr>
    <td><strong>${escapeHTML(t.equipo)}</strong></td>
    <td>${escapeHTML(t.formato||'General')}</td>
    <td>${escapeHTML(t.localidad||'—')}</td>
    <td>${t.inicioSuave?'<span class="badge badge-green">Inicio suave</span>':escapeHTML(precioMaqModalidadLabel(t.modalidad))}</td>
    <td style="text-align:right"><strong>${precioMaqFmt(t.precio)}</strong> ${escapeHTML(t.moneda||'UYU')}</td>
    <td>${escapeHTML(String(t.jornadas||1))}</td>
    <td>${escapeHTML(disparos)}</td>
    <td>${excedente}</td>
    <td>${escapeHTML(t.condicion||'—')}</td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="preciosMaqEditId=${parseInt(t.id,10)};renderPreciosMaquinas()">Editar</button>
      <button class="action-btn" onclick="eliminarPrecioMaquina(${parseInt(t.id,10)})">Desactivar</button>
    </td>
  </tr>`;
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
    if(document.getElementById('view-precios-maquinas')?.classList.contains('active'))renderPreciosMaquinas();
  }catch(e){
    const wrap=document.getElementById('ventasMaqPreciosTable');
    if(wrap)wrap.innerHTML='<div class="empty-state" style="padding:18px"><h3>Sin precios cargados</h3><p>No se pudo obtener la matriz de precios.</p></div>';
  }finally{
    ventasMaqPreciosLoading=false;
  }
}
function initMenuPreciosMaquinas(){
  if(typeof viewTitles==='object')viewTitles['precios-maquinas']='Precios de Máquinas';
  if(typeof navGroupByView==='object')navGroupByView['precios-maquinas']='finanzas';
  if(typeof VIEW_PERMISSIONS==='object'){
    ['superadmin','administrador','operaciones'].forEach(role=>{
      if(Array.isArray(VIEW_PERMISSIONS[role])&&!VIEW_PERMISSIONS[role].includes('precios-maquinas')){
        VIEW_PERMISSIONS[role].push('precios-maquinas');
      }
    });
  }
  const finanzas=document.querySelector('[data-nav-group="finanzas"]');
  if(finanzas&&!document.querySelector('[data-view="precios-maquinas"]')){
    const btn=document.createElement('button');
    btn.className='nav-item';
    btn.dataset.view='precios-maquinas';
    btn.innerHTML='<span class="icon">💲</span> Precios';
    btn.onclick=()=>{navigate('precios-maquinas');renderPreciosMaquinas();};
    const ventas=finanzas.querySelector('[data-view="ventas-maquinas"]');
    ventas?.insertAdjacentElement('afterend',btn) || finanzas.appendChild(btn);
  }
  if(!document.getElementById('view-precios-maquinas')){
    const main=document.querySelector('.main-content')||document.querySelector('.content')||document.getElementById('app');
    const after=document.getElementById('view-ventas-maquinas');
    const view=document.createElement('div');
    view.className='view';
    view.id='view-precios-maquinas';
    view.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:18px;font-weight:700;color:var(--text)">💲 Precios de alquiler</h2>
          <p style="font-size:13px;color:var(--text2);margin-top:4px">Variables por equipo, formato, zona y modalidad.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn-secondary" onclick="cargarVentasMaqPreciosRemotos()">Actualizar precios</button>
          <button class="btn-add" onclick="preciosMaqNuevo=true;preciosMaqEditId=null;renderPreciosMaquinas()">+ Precio</button>
        </div>
      </div>
      <div id="preciosMaqResumen" class="fin-summary"></div>
      <div class="table-container">
        <div class="table-header">
          <h3>Matriz de precios por zona</h3>
          <div class="table-actions">
            <select class="filter-select" id="preciosMaqEquipo" onchange="filterPreciosMaquinas('equipo',this.value)"><option value="">Equipo</option></select>
            <select class="filter-select" id="preciosMaqFormato" onchange="filterPreciosMaquinas('formato',this.value)"><option value="">Formato</option></select>
            <select class="filter-select" id="preciosMaqZona" onchange="filterPreciosMaquinas('localidad',this.value)"><option value="">Zona</option></select>
            <select class="filter-select" id="preciosMaqModalidad" onchange="filterPreciosMaquinas('modalidad',this.value)"><option value="">Modalidad</option></select>
          </div>
        </div>
        <div id="preciosMaqTable"></div>
      </div>`;
    if(after)after.insertAdjacentElement('afterend',view);
    else main?.appendChild(view);
  }
}
function setPrecioSelectOptions(id, values, label, current){
  const el=document.getElementById(id);if(!el)return;
  el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${escapeAttr(v)}">${escapeHTML(v||'General')}</option>`).join('');
  el.value=current||'';
}
function renderPreciosMaquinas(){
  initMenuPreciosMaquinas();
  const tarifas=(DB.get('maquina_tarifas')||[]).filter(t=>Number(t.precio)>0);
  const resumen=document.getElementById('preciosMaqResumen');
  const wrap=document.getElementById('preciosMaqTable');
  if(!wrap)return;
  if(!tarifas.length){
    wrap.innerHTML='<div class="empty-state" style="padding:24px"><h3>Cargando precios</h3><p>La matriz se obtiene desde administración.</p></div>';
    cargarVentasMaqPreciosRemotos();
    return;
  }
  const equipos=[...new Set(tarifas.map(t=>t.equipo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const formatos=[...new Set(tarifas.map(t=>t.formato||'').filter(v=>v!==''))].sort((a,b)=>a.localeCompare(b,'es'));
  const zonas=[...new Set(tarifas.map(t=>t.localidad).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  const modalidades=[...new Set(tarifas.map(t=>t.modalidad).filter(Boolean))].sort((a,b)=>precioMaqOrdenModalidad(a)-precioMaqOrdenModalidad(b));
  setPrecioSelectOptions('preciosMaqEquipo',equipos,'Equipo',preciosMaqFilter.equipo);
  setPrecioSelectOptions('preciosMaqFormato',formatos,'Formato',preciosMaqFilter.formato);
  setPrecioSelectOptions('preciosMaqZona',zonas,'Zona',preciosMaqFilter.localidad);
  setPrecioSelectOptions('preciosMaqModalidad',modalidades.map(precioMaqModalidadLabel),'Modalidad','');
  const selectedModalidad=preciosMaqFilter.modalidad;
  const modalEl=document.getElementById('preciosMaqModalidad');
  if(modalEl){
    modalEl.innerHTML='<option value="">Modalidad</option>'+modalidades.map(m=>`<option value="${escapeAttr(m)}">${escapeHTML(precioMaqModalidadLabel(m))}</option>`).join('');
    modalEl.value=selectedModalidad;
  }
  const rows=tarifas.filter(t=>
    (!preciosMaqFilter.equipo||t.equipo===preciosMaqFilter.equipo)&&
    (!preciosMaqFilter.formato||(t.formato||'')===preciosMaqFilter.formato)&&
    (!preciosMaqFilter.localidad||t.localidad===preciosMaqFilter.localidad)&&
    (!preciosMaqFilter.modalidad||t.modalidad===preciosMaqFilter.modalidad)
  ).sort((a,b)=>
    (a.equipo||'').localeCompare(b.equipo||'','es')||
    (a.formato||'').localeCompare(b.formato||'','es')||
    (a.localidad||'').localeCompare(b.localidad||'','es')||
    precioMaqOrdenModalidad(a.modalidad)-precioMaqOrdenModalidad(b.modalidad)
  );
  if(resumen){
    resumen.innerHTML=`
      <div class="fin-cell"><div class="fc-label">Tarifas activas</div><div class="fc-value">${tarifas.length}</div></div>
      <div class="fin-cell"><div class="fc-label">Equipos</div><div class="fc-value">${equipos.length}</div></div>
      <div class="fin-cell"><div class="fc-label">Zonas</div><div class="fc-value">${zonas.length}</div></div>
      <div class="fin-cell"><div class="fc-label">Filtradas</div><div class="fc-value">${rows.length}</div></div>`;
  }
  wrap.innerHTML=`
    <div style="overflow-x:auto">
      <table>
        <thead><tr><th>Equipo</th><th>Formato</th><th>Zona</th><th>Variable</th><th style="text-align:right">Precio</th><th>Jornadas</th><th>Disparos</th><th>Excedente</th><th>Condición</th><th>Acciones</th></tr></thead>
        <tbody>
          ${preciosMaqNuevo?precioMaqEditableRow({equipo:preciosMaqFilter.equipo||'',formato:preciosMaqFilter.formato||'',localidad:preciosMaqFilter.localidad||'',modalidad:preciosMaqFilter.modalidad||'jornada',precio:'',moneda:'UYU',jornadas:1},'nuevo'):''}
          ${rows.map(t=>parseInt(t.id)===parseInt(preciosMaqEditId)?precioMaqEditableRow(t,t.id):precioMaqDisplayRow(t)).join('')}
        </tbody>
      </table>
    </div>`;
}
function filterPreciosMaquinas(k,v){
  preciosMaqFilter[k]=v;
  renderPreciosMaquinas();
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
setTimeout(()=>initMenuPreciosMaquinas(),0);
