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
  const l = getLead(leadId);
  if(l && l.proxAccion) sv('notaProxAccion', l.proxAccion);
  if(l && l.proxFecha)  sv('notaProxFecha', l.proxFecha);
  openModal('modalNota');
}

async function saveNotaLead(){
  const leadId  = parseInt(gv('notaLeadId'));
  const texto   = gv('notaTexto').trim();
  if(!texto){showToast('⚠️ Escribí una nota antes de guardar','warn');return;}

  const resultado  = gv('notaResultado').trim();
  const proxAccion = gv('notaProxAccion').trim();
  const proxFecha  = gv('notaProxFecha');

  try{
    await api('/api/leads/'+leadId+'/notas', {
      method:'POST',
      body: JSON.stringify({
        tipo:      gv('notaTipo'),
        texto,
        resultado: resultado||null,
        prox_accion: proxAccion||null,
        prox_fecha:  proxFecha||null,
      })
    });

    // Actualizar proxAccion/proxFecha del lead si se ingresaron
    if(proxAccion || proxFecha){
      const leads = DB.get('leads')||[];
      const idx = leads.findIndex(l=>l.id===leadId);
      if(idx>=0){
        if(proxAccion) leads[idx].proxAccion = proxAccion;
        if(proxFecha)  leads[idx].proxFecha  = proxFecha;
        DB.set('leads', leads);
      }
      await api('/api/leads/'+leadId, {method:'PATCH', body:JSON.stringify({
        prox_accion: proxAccion||undefined,
        prox_fecha:  proxFecha||undefined,
      })}).catch(()=>{});
    }

    // Cambiar estado si se seleccionó
    const nuevoEstado = gv('notaEstadoNuevo');
    if(nuevoEstado) cambiarEstadoLead(leadId, nuevoEstado);

    closeModal('modalNota');
    showToast('✅ Seguimiento registrado');
    showLeadFicha(leadId);
  }catch(e){
    showToast('❌ Error al guardar nota: '+e.message,'error');
  }
}
