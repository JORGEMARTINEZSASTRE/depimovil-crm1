/* ══════════════════════════════════
   LIMPIEZAS DE MÁQUINAS
   Registro de limpiezas (chica/grande) para poder liquidarlas a quien las realiza.
══════════════════════════════════ */
let limpFilter={maquina:'',transportista:'',estado:'',desde:'',hasta:''};
let limpEditId=null;
let limpResumen=null;

function limpTamanoLabel(t){return {chica:'Chica',grande:'Grande'}[t]||t;}
function limpPuedeLiquidar(){return !!(currentUser&&(isAdminRole(currentUser.rol)||currentUser.rol==='operaciones'));}
function limpMaquinaLabel(m){return `${m.codigo||''} — ${escapeHTML(m.nombre||'')}`;}
function limpTransportistas(){return (DB.get('transportistas')||[]).filter(t=>(t.estado||'activo')!=='eliminado');}

async function cargarLimpiezas(){
  try{
    const data=await api('/api/limpiezas');
    DB.set('limpiezas',Array.isArray(data)?data:[]);
  }catch(e){
    showToast('❌ No se pudieron cargar las limpiezas: '+e.message,'error');
  }
}

function syncLimpFilters(){
  const maq=document.getElementById('limpFilterMaquina');
  if(maq){
    const prev=maq.value||limpFilter.maquina;
    maq.innerHTML='<option value="">Todas las máquinas</option>'+
      (DB.get('maquinas')||[]).map(m=>`<option value="${m.id}">${escapeHTML(limpMaquinaLabel(m))}</option>`).join('');
    maq.value=prev;
  }
  const tr=document.getElementById('limpFilterTransportista');
  if(tr){
    const prev=tr.value||limpFilter.transportista;
    tr.innerHTML='<option value="">Todos los responsables</option>'+
      limpTransportistas().map(t=>`<option value="${t.id}">${escapeHTML(t.nombre||'')}</option>`).join('');
    tr.value=prev;
  }
  const btn=document.getElementById('btnLiquidarLimp');
  if(btn)btn.style.display=limpPuedeLiquidar()?'':'none';
}

async function renderLimpiezas(){
  syncLimpFilters();
  await cargarLimpiezas();
  pintarLimpiezas();
}

function pintarLimpiezas(){
  const tbody=document.getElementById('limpTableBody');if(!tbody)return;
  const rows=(DB.get('limpiezas')||[]).filter(l=>{
    if(limpFilter.maquina&&parseInt(l.maquina_id)!==parseInt(limpFilter.maquina))return false;
    if(limpFilter.transportista&&parseInt(l.transportista_id)!==parseInt(limpFilter.transportista))return false;
    if(limpFilter.estado&&l.estado!==limpFilter.estado)return false;
    if(limpFilter.desde&&l.fecha<limpFilter.desde)return false;
    if(limpFilter.hasta&&l.fecha>limpFilter.hasta)return false;
    return true;
  });
  const resumen=document.getElementById('limpResumenLinea');
  if(resumen){
    const chicas=rows.filter(l=>l.tamano==='chica').length;
    const grandes=rows.filter(l=>l.tamano==='grande').length;
    resumen.textContent=rows.length?`${rows.length} limpieza${rows.length!==1?'s':''} · ${chicas} chica${chicas!==1?'s':''} · ${grandes} grande${grandes!==1?'s':''}`:'';
  }
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="icon">🧽</div><h3>Sin limpiezas</h3><p>No hay registros con esos filtros.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML=rows.map(l=>{
    const liquidada=l.estado==='liquidada';
    const acciones=liquidada
      ? '<span style="color:var(--text3);font-size:12px">Liquidada</span>'
      : `<button class="action-btn" onclick="openLimpiezaModal(${l.id})">✏️</button>
         ${canDelete()?`<button class="btn-danger" onclick="deleteLimpieza(${l.id})">🗑</button>`:''}`;
    return `<tr>
      <td>${fmtDate(l.fecha)}</td>
      <td>${escapeHTML((l.maquina_codigo||'')+' — '+(l.maquina_nombre||''))}</td>
      <td><span class="badge ${l.tamano==='grande'?'badge-purple':'badge-blue'}">${limpTamanoLabel(l.tamano)}</span></td>
      <td>${escapeHTML(l.transportista_nombre||'Sin asignar')}</td>
      <td>${liquidada?'<span class="badge badge-green">Liquidada</span>':'<span class="badge badge-gray">Registrada</span>'}
        ${l.obs?`<div style="color:var(--text3);font-size:12px;margin-top:2px">${escapeHTML(l.obs)}</div>`:''}</td>
      <td>${acciones}</td>
    </tr>`;
  }).join('');
}

function filterLimp(campo,valor){limpFilter[campo]=valor;pintarLimpiezas();}

function openLimpiezaModal(id){
  limpEditId=id||null;
  const maqs=DB.get('maquinas')||[];
  document.getElementById('limpMaquinaId').innerHTML='<option value="">— Seleccionar máquina —</option>'+
    maqs.map(m=>`<option value="${m.id}">${escapeHTML(limpMaquinaLabel(m))}</option>`).join('');
  document.getElementById('limpTransportistaId').innerHTML='<option value="">— Sin asignar —</option>'+
    limpTransportistas().map(t=>`<option value="${t.id}">${escapeHTML(t.nombre||'')}</option>`).join('');
  const l=id?(DB.get('limpiezas')||[]).find(x=>parseInt(x.id)===parseInt(id)):null;
  document.getElementById('modalLimpiezaTitle').textContent=l?'Editar limpieza':'Registrar limpieza';
  sv('limpMaquinaId',l?String(l.maquina_id):'');
  sv('limpTransportistaId',l&&l.transportista_id?String(l.transportista_id):'');
  sv('limpTamano',l?l.tamano:'chica');
  sv('limpFecha',l?l.fecha:today());
  sv('limpObs',l?(l.obs||''):'');
  openModal('modalLimpieza');
}

async function saveLimpieza(){
  const payload={
    maquina_id:parseInt(gv('limpMaquinaId'))||null,
    transportista_id:parseInt(gv('limpTransportistaId'))||null,
    tamano:gv('limpTamano'),
    fecha:gv('limpFecha'),
    obs:gv('limpObs').trim()
  };
  if(!payload.maquina_id||!payload.tamano||!payload.fecha){
    showToast('⚠️ Máquina, tamaño y fecha son obligatorios','warn');
    return;
  }
  try{
    await api(limpEditId?'/api/limpiezas/'+limpEditId:'/api/limpiezas',{method:limpEditId?'PUT':'POST',body:JSON.stringify(payload)});
    closeModal('modalLimpieza');
    await cargarLimpiezas();
    pintarLimpiezas();
    showToast(limpEditId?'✅ Limpieza actualizada':'✅ Limpieza registrada');
  }catch(e){
    showToast('❌ Error: '+e.message,'error');
  }
}

async function deleteLimpieza(id){
  if(!confirm('¿Borrar esta limpieza? Usalo solo si se cargó por error.'))return;
  try{
    await api('/api/limpiezas/'+id,{method:'DELETE'});
    await cargarLimpiezas();
    pintarLimpiezas();
    showToast('🗑 Limpieza eliminada');
  }catch(e){
    showToast('❌ Error: '+e.message,'error');
  }
}

/* ── Liquidación (solo administración) ── */
function openLiquidarLimpModal(){
  if(!limpPuedeLiquidar())return;
  limpResumen=null;
  document.getElementById('liqLimpTransportista').innerHTML='<option value="">— Seleccionar —</option>'+
    limpTransportistas().map(t=>`<option value="${t.id}">${escapeHTML(t.nombre||'')}</option>`).join('');
  const hoy=today();
  sv('liqLimpDesde',hoy.slice(0,8)+'01');
  sv('liqLimpHasta',hoy);
  document.getElementById('liqLimpResultado').innerHTML='';
  document.getElementById('btnConfirmarLiqLimp').style.display='none';
  openModal('modalLiquidarLimp');
}

async function calcularLiqLimp(){
  const transportista_id=parseInt(gv('liqLimpTransportista'));
  const desde=gv('liqLimpDesde'),hasta=gv('liqLimpHasta');
  const box=document.getElementById('liqLimpResultado');
  const btn=document.getElementById('btnConfirmarLiqLimp');
  limpResumen=null;btn.style.display='none';
  if(!transportista_id||!desde||!hasta){showToast('⚠️ Elegí responsable y período','warn');return;}
  try{
    const r=await api(`/api/limpiezas/resumen?transportista_id=${transportista_id}&desde=${desde}&hasta=${hasta}`);
    limpResumen={transportista_id,desde,hasta};
    const fmt=n=>Number(n||0).toLocaleString('es-UY');
    box.innerHTML=r.total_limpiezas
      ? `<div class="info-card full"><h4>${escapeHTML(r.transportista_nombre)}</h4>
          ${ir('Chicas',r.chicas+' × '+fmt(r.tarifa_chica))}
          ${ir('Grandes',r.grandes+' × '+fmt(r.tarifa_grande))}
          ${ir('<strong>Total a liquidar</strong>','<strong>'+fmt(r.monto_limpiezas)+'</strong>')}
          ${(!r.tarifa_chica&&r.chicas)||(!r.tarifa_grande&&r.grandes)?'<div class="alert-banner warn" style="margin-top:8px"><span class="ab-icon">⚠️</span><div>Falta cargar la tarifa de limpieza en la ficha del transportista.</div></div>':''}
        </div>`
      : '<div class="empty-state"><p>No hay limpiezas registradas para liquidar en ese período.</p></div>';
    if(r.total_limpiezas)btn.style.display='';
  }catch(e){
    box.innerHTML='';
    showToast('❌ Error: '+e.message,'error');
  }
}

async function confirmarLiqLimp(){
  if(!limpResumen)return;
  if(!confirm('Se creará la liquidación pendiente y las limpiezas quedarán marcadas como liquidadas. ¿Continuar?'))return;
  try{
    await api('/api/limpiezas/liquidar',{method:'POST',body:JSON.stringify(limpResumen)});
    closeModal('modalLiquidarLimp');
    await cargarLimpiezas();
    pintarLimpiezas();
    showToast('✅ Liquidación creada. Figura en Transportistas → pagos.');
  }catch(e){
    showToast('❌ Error: '+e.message,'error');
  }
}
