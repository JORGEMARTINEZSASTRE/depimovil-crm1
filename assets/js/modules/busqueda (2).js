/* ══════════════════════════════════
   BÚSQUEDA GLOBAL
══════════════════════════════════ */
function openSearch(){
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('globalSearchInput').focus(),50);
}
function closeSearch(){
  document.getElementById('searchOverlay').classList.remove('open');
  document.getElementById('globalSearchInput').value='';
  document.getElementById('searchResults').innerHTML='<div class="search-hint">Escribí para buscar · <kbd style="background:var(--surface2);padding:1px 5px;border-radius:4px;font-size:10px">ESC</kbd> para cerrar</div>';
}
function closeSearchIfBg(e){if(e.target===document.getElementById('searchOverlay'))closeSearch();}
function onSearchKey(e){if(e.key==='Escape')closeSearch();}

document.addEventListener('keydown',e=>{
  if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
    e.preventDefault(); openSearch();
  }
});

function runGlobalSearch(q){
  const el=document.getElementById('searchResults');
  if(!q||q.length<2){el.innerHTML='<div class="search-hint">Escribí al menos 2 caracteres…</div>';return;}
  const term=q.toLowerCase();
  const results=[];

  // Operadoras
  (DB.get('operadoras')||[]).forEach(o=>{
    if((o.nombre+' '+o.apellido+' '+o.ciudad+' '+o.gabinete).toLowerCase().includes(term))
      results.push({icon:'👩‍💼',title:`${o.nombre} ${o.apellido}`,sub:`${o.gabinete||'Sin gabinete'} · ${o.ciudad}`,badge:o.estado,action:()=>{closeSearch();showOpFicha(o.id);}});
  });
  // Máquinas
  (DB.get('maquinas')||[]).forEach(m=>{
    if((m.nombre+' '+m.codigo+' '+m.categoria+' '+m.ubicacion).toLowerCase().includes(term))
      results.push({icon:'⚙️',title:m.nombre,sub:`${m.codigo} · ${m.ubicacion}`,badge:m.estado,action:()=>{closeSearch();showMaqFicha(m.id);}});
  });
  // Reservas
  (DB.get('reservas')||[]).forEach(r=>{
    const op=getOp(r.operadoraId);
    if((r.codigo+(op?op.nombre+' '+op.apellido:'')+r.tipo).toLowerCase().includes(term))
      results.push({icon:'📅',title:r.codigo,sub:op?`${op.nombre} ${op.apellido} · ${r.tipo}`:'',badge:RES_ESTADOS[r.estado]?.label||r.estado,action:()=>{closeSearch();showResFicha(r.id);}});
  });
  // Pagos
  (DB.get('pagos')||[]).forEach(p=>{
    const op=getOp(p.operadoraId);
    if((p.codigo+(op?op.nombre+' '+op.apellido:'')).toLowerCase().includes(term))
      results.push({icon:'💳',title:p.codigo,sub:op?`${op.nombre} ${op.apellido} · ${p.tipo}`:'',badge:PAGO_ESTADOS[p.estado]?.label||p.estado,action:()=>{closeSearch();showPagoFicha(p.id);}});
  });
  // Envíos
  (DB.get('envios')||[]).forEach(e=>{
    const op=getOp(e.operadoraId);
    if((e.codigo+e.departamento+(op?op.nombre:'')+(e.tracking||'')).toLowerCase().includes(term))
      results.push({icon:'🚚',title:e.codigo,sub:`${e.departamento} · ${e.transportista||'Sin transportista'}`,badge:ENVIO_ESTADOS[e.estado]?.label||e.estado,action:()=>{closeSearch();showEnvioFicha(e.id);}});
  });

  // Leads
  (DB.get('leads')||[]).forEach(l=>{
    const st=LEAD_ESTADOS[l.estado]||{};
    if((l.nombre+' '+l.apellido+' '+(l.gabinete||'')+' '+(l.ciudad||'')+' '+(l.tecnologia||'')).toLowerCase().includes(term))
      results.push({icon:'🎯',title:`${l.nombre} ${l.apellido}`,
        sub:`${l.gabinete||'Sin negocio'} · ${l.ciudad||''} · ${l.tecnologia||''}`,
        badge:st.label||l.estado,
        action:()=>{closeSearch();showLeadFicha(l.id);}});
  });

  if(!results.length){el.innerHTML='<div class="search-hint">Sin resultados para "'+q+'"</div>';return;}
  el.innerHTML=results.slice(0,12).map((r,i)=>`
    <div class="search-result-item" onclick="searchResultActions[${i}]()">
      <div class="search-result-icon">${r.icon}</div>
      <div class="search-result-body">
        <div class="search-result-title">${r.title}</div>
        <div class="search-result-sub">${r.sub}</div>
      </div>
      <span class="search-result-badge">${r.badge}</span>
    </div>`).join('');
  // Store action refs
  window.searchResultActions = results.slice(0,12).map(r=>r.action);
}
