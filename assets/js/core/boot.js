/* ══════════════════════════════════
   BOOT
══════════════════════════════════ */


/* ==================================
   DOCUMENTOS OPERADORA (parche)
================================== */
function copyPortalLink(token){
  var safeToken=String(token||'').replace(/[^a-zA-Z0-9_-]/g,'');
  var url=window.location.origin+'/portal.html?token='+safeToken;
  navigator.clipboard.writeText(url).then(function(){showToast('📋 Link del portal copiado');}).catch(function(){prompt('Copiá este link:',url);});
}
var opDocsRefreshTimer=null;
var opDocsRefreshId=null;
var opDocsSignatures={};
function opDocsNormalizeList(docs){
  return (docs||[]).map(function(d){
    return typeof normalizeOperadoraDoc==='function'?normalizeOperadoraDoc(d):d;
  });
}
function opDocsSignature(docs){
  return opDocsNormalizeList(docs).map(function(d){
    return [d.id,d.tipo,d.archivo_url,d.maquina_id,d.firmado_en,d.updated_at,d.created_at].join(':');
  }).sort().join('|');
}
function cacheOperadoraDocs(opId, docs){
  var normalized=opDocsNormalizeList(docs);
  var signature=opDocsSignature(normalized);
  var prev=opDocsSignatures[opId]||'';
  opDocsSignatures[opId]=signature;
  var all=DB.get('documentos_operadora')||[];
  var others=all.filter(function(d){return parseInt(d.operadora_id)!==parseInt(opId);});
  DB.set('documentos_operadora',others.concat(normalized));
  return signature!==prev;
}
function activeViewId(){
  var active=document.querySelector('.view.active');
  return active?String(active.id||'').replace(/^view-/,''):'';
}
function refreshOperadoraLivePanels(opId, changed){
  if(!changed)return;
  var panel=document.getElementById('op360Panel_'+opId);
  if(panel&&typeof renderOp360Panel==='function'){
    var op=(DB.get('operadoras')||[]).find(function(o){return parseInt(o.id)===parseInt(opId);});
    if(op)panel.outerHTML=renderOp360Panel(op);
  }
  if(typeof refreshRevisionOperadoraOpen==='function')refreshRevisionOperadoraOpen(opId);
  if(typeof updateRevisionOperadorasBadge==='function')updateRevisionOperadorasBadge();
}
function startOpDocsAutoRefresh(opId){
  if(!opId)return;
  opDocsRefreshId=opId;
  if(opDocsRefreshTimer)clearInterval(opDocsRefreshTimer);
  opDocsRefreshTimer=setInterval(function(){
    var body=document.getElementById('docsBody_'+opDocsRefreshId);
    var revModal=document.getElementById('modalRevisionOperadora');
    var revisionOpen=revModal&&revModal.classList.contains('open');
    if(activeViewId()!=='operadora-ficha'&&!body&&!revisionOpen){
      clearInterval(opDocsRefreshTimer);
      opDocsRefreshTimer=null;
      opDocsRefreshId=null;
      return;
    }
    loadOpDocs(opDocsRefreshId,true);
  },4000);
}
async function loadOpDocs(opId){
  var body=document.getElementById('docsBody_'+opId);
  try{
    var docs=opDocsNormalizeList(await api('/api/portal/docs/'+opId));
    var changed=cacheOperadoraDocs(opId,docs);
    var cedula=(docs||[]).find(function(d){return d.tipo==='cedula';});
    var cedulaDorso=(docs||[]).find(function(d){return d.tipo==='cedula_dorso';});
    var contratos=(docs||[]).filter(function(d){return d.tipo==='contrato';});
    refreshOperadoraLivePanels(opId,changed);
    if(!body)return;
    var reservas=(DB.get('reservas')||[]).filter(function(r){return r.operadoraId===opId&&['confirmada','activa','aprobada','solicitud_recibida','pendiente_aprobacion'].includes(r.estado);});
    var fileUrl=function(doc){
      if(!doc||!doc.archivo_url)return '';
      return /^https?:\/\//.test(doc.archivo_url)?doc.archivo_url:window.location.origin+doc.archivo_url;
    };
    var fileButton=function(doc,label){
      var url=fileUrl(doc);
      return url?'<a class="action-btn" href="'+escapeAttr(url)+'" target="_blank" rel="noopener">'+escapeHTML(label)+'</a>':'<span class="badge badge-red">'+escapeHTML(label)+' pendiente</span>';
    };
    var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    h+='<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">🪪 Cédula</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    h+=cedula?'<span class="badge badge-green">✓ Frente</span>':'<span class="badge badge-red">✗ Frente</span>';
    h+=cedulaDorso?'<span class="badge badge-green">✓ Dorso</span>':'<span class="badge badge-red">✗ Dorso</span>';
    h+='</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+fileButton(cedula,'Ver frente')+fileButton(cedulaDorso,'Ver dorso')+'</div>';
    if(cedula||cedulaDorso){
      h+='<div style="font-size:11px;color:var(--text3);margin-top:6px">';
      if(cedula)h+='Frente subida '+new Date(cedula.created_at).toLocaleDateString('es-UY');
      if(cedula&&cedulaDorso)h+=' · ';
      if(cedulaDorso)h+='Dorso subido '+new Date(cedulaDorso.created_at).toLocaleDateString('es-UY');
      h+='</div>';
    }
    h+='</div>';
    h+='<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">📋 Contratos</div>';
    if(!reservas.length){h+='<div style="font-size:12px;color:var(--text3)">Sin reservas activas</div>';}
    else{var firmados=reservas.filter(function(r){return contratos.some(function(ct){return ct.maquina_id===r.maquinaId;});});h+='<span class="badge '+(firmados.length===reservas.length?'badge-green':'badge-yellow')+'">'+firmados.length+'/'+reservas.length+' firmados</span>';}
    h+='</div></div>';
    if(reservas.length){h+='<div style="margin-top:12px">';reservas.forEach(function(r){var maq=getMaq(r.maquinaId);var firmado=contratos.find(function(ct){return ct.maquina_id===r.maquinaId;});h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span>⚙️ '+escapeHTML(maq?maq.nombre:'Máq #'+r.maquinaId)+' — '+escapeHTML(r.codigo)+'</span>'+(firmado?'<span class="badge badge-green">✓ Firmado '+new Date(firmado.firmado_en).toLocaleDateString('es-UY')+'</span>':'<span class="badge badge-red">✗ Sin firmar</span>')+'</div>';});h+='</div>';}
    body.innerHTML=h;
  }catch(e){if(body)body.innerHTML='<div style="font-size:12px;color:var(--text3)">No se pudieron cargar documentos.</div>';}
}

initData();
(async()=>{
  await tryRestoreSession();
  if(!currentUser && typeof configureLoginEntry==='function') configureLoginEntry();
  if(!currentUser && typeof openOperadoraRegistroFromLink==='function') openOperadoraRegistroFromLink();
})();
