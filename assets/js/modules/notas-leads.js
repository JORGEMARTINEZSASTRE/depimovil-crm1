/* ══════════════════════════════════
   NOTAS DE SEGUIMIENTO
══════════════════════════════════ */
function openNotaModal(leadId){
  if(!canEditLead()){showToast('⚠️ Sin permisos para agregar notas','warn');return;}
  sv('notaLeadId', leadId);
  sv('notaTipo', 'whatsapp');
  sv('notaFecha', today());
  sv('notaTexto', '');
  sv('notaResultado', '');
  sv('notaProxAccion', '');
  sv('notaProxFecha', '');
  sv('notaEstadoNuevo', '');
  // Pre-fill proxima accion from lead if exists
  const l = getLead(leadId);
  if(l && l.proxAccion) sv('notaProxAccion', l.proxAccion);
  if(l && l.proxFecha)  sv('notaProxFecha', l.proxFecha);
  openModal('modalNota');
}

function saveNotaLead(){
  const leadId   = parseInt(gv('notaLeadId'));
  const texto    = gv('notaTexto').trim();
  if(!texto){showToast('⚠️ Escribí una nota antes de guardar','warn');return;}

  const resultado   = gv('notaResultado').trim();
  const proxAccion  = gv('notaProxAccion').trim();
  const proxFecha   = gv('notaProxFecha');

  // Save seguimiento
  const notas = DB.get('leads_notas')||[];
  const newId = Math.max(0,...notas.map(n=>n.id))+1;
  notas.push({
    id:newId, leadId,
    tipo:      gv('notaTipo'),
    fecha:     gv('notaFecha')||today(),
    texto,
    resultado: resultado||null,
    proxAccion: proxAccion||null,
    proxFecha:  proxFecha||null,
    usuario:   currentUser?.email||'—',
    ts:        new Date().toISOString(),
  });
  DB.set('leads_notas', notas);

  // Update lead's proxAccion / proxFecha if provided
  if(proxAccion || proxFecha){
    const leads = DB.get('leads')||[];
    const idx   = leads.findIndex(l=>l.id===leadId);
    if(idx>=0){
      if(proxAccion) leads[idx].proxAccion = proxAccion;
      if(proxFecha)  leads[idx].proxFecha  = proxFecha;
      leads[idx].fechaUpdate = today();
      DB.set('leads', leads);
    }
  }

  // Change state if selected
  const nuevoEstado = gv('notaEstadoNuevo');
  if(nuevoEstado) cambiarEstadoLead(leadId, nuevoEstado);

  auditLog('CREATE','lead_nota',newId,`Lead #${leadId} — ${gv('notaTipo')} — ${resultado||texto.slice(0,40)}`);
  closeModal('modalNota');
  showToast('✅ Seguimiento registrado');
  showLeadFicha(leadId);
}
