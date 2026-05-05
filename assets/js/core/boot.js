/* ══════════════════════════════════
   BOOT
══════════════════════════════════ */


/* ==================================
   DOCUMENTOS OPERADORA (parche)
================================== */
function copyPortalLink(token){
  var url=window.location.origin+'/portal.html?token='+token;
  navigator.clipboard.writeText(url).then(function(){showToast('📋 Link del portal copiado');}).catch(function(){prompt('Copiá este link:',url);});
}
async function loadOpDocs(opId){
  var body=document.getElementById('docsBody_'+opId);if(!body)return;
  try{
    var docs=await api('/api/portal/docs/'+opId);
    var cedula=(docs||[]).find(function(d){return d.tipo==='cedula';});
    var cedulaDorso=(docs||[]).find(function(d){return d.tipo==='cedula_dorso';});
    var contratos=(docs||[]).filter(function(d){return d.tipo==='contrato';});
    var reservas=(DB.get('reservas')||[]).filter(function(r){return r.operadoraId===opId&&['confirmada','activa','aprobada','solicitud_recibida','pendiente_aprobacion'].includes(r.estado);});
    var h='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    h+='<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">🪨 Cédula</div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    h+=cedula?'<span class="badge badge-green">✓ Frente</span>':'<span class="badge badge-red">✗ Frente</span>';
    h+=cedulaDorso?'<span class="badge badge-green">✓ Dorso</span>':'<span class="badge badge-red">✗ Dorso</span>';
    h+='</div>';
    if(cedula){h+='<div style="font-size:11px;color:var(--text3);margin-top:4px">Frente subida '+new Date(cedula.created_at).toLocaleDateString('es-UY')+'</div>';}
    h+='</div>';
    h+='<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px">';
    h+='<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">📋 Contratos</div>';
    if(!reservas.length){h+='<div style="font-size:12px;color:var(--text3)">Sin reservas activas</div>';}
    else{var firmados=reservas.filter(function(r){return contratos.some(function(ct){return ct.maquina_id===r.maquinaId;});});h+='<span class="badge '+(firmados.length===reservas.length?'badge-green':'badge-yellow')+'">'+firmados.length+'/'+reservas.length+' firmados</span>';}
    h+='</div></div>';
    if(reservas.length){h+='<div style="margin-top:12px">';reservas.forEach(function(r){var maq=getMaq(r.maquinaId);var firmado=contratos.find(function(ct){return ct.maquina_id===r.maquinaId;});h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"><span>⚙️ '+(maq?maq.nombre:'Máq #'+r.maquinaId)+' — '+r.codigo+'</span>'+(firmado?'<span class="badge badge-green">✓ Firmado '+new Date(firmado.firmado_en).toLocaleDateString('es-UY')+'</span>':'<span class="badge badge-red">✗ Sin firmar</span>')+'</div>';});h+='</div>';}
    body.innerHTML=h;
  }catch(e){body.innerHTML='<div style="font-size:12px;color:var(--text3)">No se pudieron cargar documentos.</div>';}
}

initData();
(async()=>{await tryRestoreSession();})();
