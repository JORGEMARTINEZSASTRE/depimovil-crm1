/* ══════════════════════════════════
   AUDITORÍA
══════════════════════════════════ */
let auditFilter={search:'',accion:''};

function renderAuditoria(){
  const log=DB.get('audit_log')||[];
  const filtered=log.filter(e=>{
    const q=auditFilter.search.toLowerCase();
    const ms=!q||(e.user||'').toLowerCase().includes(q)||(e.entidad||'').toLowerCase().includes(q)
      ||(e.resumen||'').toLowerCase().includes(q);
    return ms&&(!auditFilter.accion||e.action===auditFilter.accion);
  }).sort((a,b)=>b.ts.localeCompare(a.ts));

  const body=document.getElementById('auditBody');
  if(!filtered.length){
    body.innerHTML=`<div class="empty-state"><div class="icon">🔍</div><h3>Sin registros</h3><p>No hay eventos en el log de auditoría.</p></div>`;
    return;
  }
  body.innerHTML=filtered.map(e=>`
    <div class="audit-row">
      <div style="min-width:130px;font-size:11px;color:var(--text3)">${fmtDate(e.ts?.split('T')[0]||'')} ${e.ts?.split('T')[1]?.slice(0,5)||''}</div>
      <div><span class="audit-action audit-${escapeAttr(e.action)}">${escapeHTML(e.action)}</span></div>
      <div style="min-width:90px;font-size:12px;color:var(--text2)">${escapeHTML(e.entidad||'—')} ${e.entidadId?'#'+escapeHTML(e.entidadId):''}</div>
      <div style="flex:1;font-size:12px;color:var(--text2)">${escapeHTML(e.resumen||'')}</div>
      <div style="font-size:11px;color:var(--text3);white-space:nowrap">${escapeHTML((e.user||'').split('@')[0])}</div>
    </div>`).join('');
}
function filterAudit(v){auditFilter.search=v;renderAuditoria();}
function filterAuditAccion(v){auditFilter.accion=v;renderAuditoria();}

// Override auditLog to use resumen field
function auditLog(action,entidad,entidadId,resumen){
  const log=DB.get('audit_log')||[];
  log.push({ts:new Date().toISOString(),user:currentUser?currentUser.email:'—',
    action,entidad,entidadId,resumen:resumen||''});
  if(log.length>500) log.splice(0,log.length-500); // keep last 500
  DB.set('audit_log',log);
}
