/* ══════════════════════════════════
   MANTENIMIENTOS DE MÁQUINAS
══════════════════════════════════ */
let mantFilter={maquina:'',estado:''};

function mantTipoLabel(tipo){
  return {cambio_agua:'Cambio de agua',cambio_filtros:'Cambio de filtros'}[tipo]||tipo;
}
function badgeMantEstado(estado){
  const e=estado||'vigente';
  const cls={vigente:'badge-green','próximo':'badge-yellow',vencido:'badge-red'}[e]||'badge-gray';
  const label={vigente:'Vigente','próximo':'Próximo',vencido:'Vencido'}[e]||e;
  return `<span class="badge ${cls}">${label}</span>`;
}
function getMantEstado(m){
  const prox=m.proximoVencimiento;
  if(!prox)return m.estado||'vigente';
  const diff=daysDiff(today(),prox);
  if(diff<0)return 'vencido';
  if(diff<=30)return 'próximo';
  return 'vigente';
}
function mapMantenimientoLocal(m){
  return {
    id:m.id,maquinaId:m.maquina_id,tipo:m.tipo,
    fechaRealizado:normalizeDateInput(m.fecha_realizado),
    proximoVencimiento:normalizeDateInput(m.proximo_vencimiento),
    estado:m.estado||'vigente',
    maquinaCodigo:m.maquina_codigo||'',maquinaNombre:m.maquina_nombre||''
  };
}
function syncMantFilters(){
  const select=document.getElementById('mantFilterMaquina');if(!select)return;
  const prev=select.value||mantFilter.maquina;
  select.innerHTML='<option value="">Todas las máquinas</option>'+
    (DB.get('maquinas')||[]).map(m=>`<option value="${m.id}">${escapeHTML(m.codigo||'')} — ${escapeHTML(m.nombre||'')}</option>`).join('');
  select.value=prev;
}
function renderMantAlerts(rows){
  const box=document.getElementById('mantAlerts');if(!box)return;
  const vencidos=rows.filter(m=>getMantEstado(m)==='vencido').length;
  const proximos=rows.filter(m=>getMantEstado(m)==='próximo').length;
  let html='';
  if(vencidos)html+=`<div class="alert-banner danger"><span class="ab-icon">🔴</span><div><strong>${vencidos} mantenimiento${vencidos!==1?'s':''} vencido${vencidos!==1?'s':''}</strong> — Revisar antes de asignar nuevas reservas.</div></div>`;
  if(proximos)html+=`<div class="alert-banner warn"><span class="ab-icon">🟡</span><div><strong>${proximos} mantenimiento${proximos!==1?'s':''} próximo${proximos!==1?'s':''}</strong> — Vencen dentro de 30 días.</div></div>`;
  box.innerHTML=html;
}
function renderMantenimientos(){
  syncMantFilters();
  const maqs=DB.get('maquinas')||[];
  const rows=(DB.get('mantenimientos')||[]).map(m=>({...m,estado:getMantEstado(m)})).filter(m=>{
    const byMaq=!mantFilter.maquina||parseInt(m.maquinaId)===parseInt(mantFilter.maquina);
    const byEstado=!mantFilter.estado||m.estado===mantFilter.estado;
    return byMaq&&byEstado;
  }).sort((a,b)=>(a.proximoVencimiento||'').localeCompare(b.proximoVencimiento||''));
  renderMantAlerts(rows);
  updateMantenimientosBadge();
  const tbody=document.getElementById('mantTableBody');if(!tbody)return;
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="icon">🔧</div><h3>Sin mantenimientos</h3><p>No hay registros con esos filtros.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML=rows.map(m=>{
    const maq=maqs.find(x=>parseInt(x.id)===parseInt(m.maquinaId));
    const estado=getMantEstado(m);
    const cls=estado==='vencido'?'mant-row-vencido':(estado==='próximo'?'mant-row-proximo':'');
    const nombre=maq?`${maq.codigo||''} — ${maq.nombre||''}`:(m.maquinaCodigo?`${m.maquinaCodigo} — ${m.maquinaNombre}`:'—');
    return `<tr class="${cls}">
      <td>${escapeHTML(nombre)}</td>
      <td>${escapeHTML(mantTipoLabel(m.tipo))}</td>
      <td>${fmtDate(m.fechaRealizado)}</td>
      <td>${fmtDate(m.proximoVencimiento)}</td>
      <td>${badgeMantEstado(estado)}</td>
    </tr>`;
  }).join('');
}
function filterMantMaquina(v){mantFilter.maquina=v;renderMantenimientos();}
function filterMantEstado(v){mantFilter.estado=v;renderMantenimientos();}
function openMantModal(maquinaId){
  const maqs=DB.get('maquinas')||[];
  const select=document.getElementById('mantMaquinaId');
  select.innerHTML='<option value="">— Seleccionar máquina —</option>'+
    maqs.map(m=>`<option value="${m.id}">${escapeHTML(m.codigo||'')} — ${escapeHTML(m.nombre||'')}</option>`).join('');
  if(maquinaId)select.value=String(maquinaId);
  sv('mantTipo','cambio_agua');
  sv('mantFechaRealizado',today());
  openModal('modalMant');
}
async function saveMantenimiento(){
  const payload={
    maquina_id:parseInt(gv('mantMaquinaId')),
    tipo:gv('mantTipo'),
    fecha_realizado:gv('mantFechaRealizado')
  };
  if(!payload.maquina_id||!payload.tipo||!payload.fecha_realizado){
    showToast('⚠️ Máquina, tipo y fecha son obligatorios','warn');
    return;
  }
  try{
    const saved=await api('/api/mantenimientos',{method:'POST',body:JSON.stringify(payload)});
    const mantenimientos=await api('/api/mantenimientos');
    DB.set('mantenimientos',mantenimientos.map(mapMantenimientoLocal));
    const maqs=await api('/api/maquinas');
    DB.set('maquinas',maqs.map(mapMaquinaLocal));
    closeModal('modalMant');
    renderMantenimientos();
    if(typeof renderMaquinas==='function')renderMaquinas();
    showToast('✅ Mantenimiento registrado');
    return saved;
  }catch(e){
    showToast('❌ Error: '+e.message,'error');
  }
}
function updateMantenimientosBadge(){
  const badge=document.getElementById('navBadgeMant');if(!badge)return;
  const count=(DB.get('mantenimientos')||[]).filter(m=>['vencido','próximo'].includes(getMantEstado(m))).length;
  badge.style.display=count?'':'none';
  badge.textContent=count;
}
