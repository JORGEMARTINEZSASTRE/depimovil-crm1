/* ══════════════════════════════════
   LEADS / CRM COMERCIAL
══════════════════════════════════ */
const LEAD_ESTADOS = {
  nuevo:               {label:'Nuevo lead',          icon:'🆕', cls:'lead-estado-nuevo',          orden:1},
  contactado:          {label:'Contactado',          icon:'📞', cls:'lead-estado-contactado',      orden:2},
  interesado:          {label:'Interesado',          icon:'👀', cls:'lead-estado-interesado',      orden:3},
  calificado:          {label:'Calificado',          icon:'⭐', cls:'lead-estado-interesado',      orden:4},
  presupuesto_enviado: {label:'Presupuesto enviado', icon:'📄', cls:'lead-estado-presupuesto_enviado', orden:5},
  pendiente_respuesta: {label:'Pendiente respuesta', icon:'⏳', cls:'lead-estado-seguimiento',     orden:6},
  pendiente_sena:      {label:'Pendiente seña',      icon:'💳', cls:'lead-estado-presupuesto_enviado', orden:7},
  reserva_confirmada:  {label:'Reserva confirmada',  icon:'🔒', cls:'lead-estado-ganado',          orden:8},
  cliente_activa:      {label:'Cliente activa',      icon:'✅', cls:'lead-estado-ganado',          orden:9},
  cliente_inactiva:    {label:'Cliente inactiva',    icon:'🧊', cls:'lead-estado-reactivar_luego', orden:10},
  recuperacion:        {label:'Recuperación',        icon:'📣', cls:'lead-estado-reactivar_luego', orden:11},
  seguimiento:         {label:'Seguimiento',         icon:'🔄', cls:'lead-estado-seguimiento',     orden:12},
  ganado:              {label:'Ganado',              icon:'🏆', cls:'lead-estado-ganado',          orden:13},
  perdido:             {label:'Perdido',             icon:'❌', cls:'lead-estado-perdido',         orden:14},
  reactivar_luego:     {label:'Reactivar luego',     icon:'🕐', cls:'lead-estado-reactivar_luego', orden:15},
};

const LEAD_PIPELINE = ['nuevo','contactado','interesado','calificado','presupuesto_enviado','pendiente_respuesta','pendiente_sena','reserva_confirmada','cliente_activa','recuperacion'];
const LEAD_ESTADOS_CERRADOS = ['ganado','perdido','cliente_activa'];

const LEAD_FUENTES = {
  instagram:'Instagram 📸', facebook:'Facebook', whatsapp:'WhatsApp 💬',
  referido:'Referido 🤝', web:'Web / Google 🌐', feria:'Feria / Evento 🎪',
  llamada:'Llamada entrante 📱', otro:'Otro',
};

function badgeLead(estado){
  const st = LEAD_ESTADOS[estado];
  if(!st) return `<span class="badge badge-gray">${estado}</span>`;
  return `<span class="badge ${st.cls}">${st.icon} ${st.label}</span>`;
}

function getLead(id){return (DB.get('leads')||[]).find(l=>l.id===parseInt(id));}
function mapLeadApi(l){
  return {
    id:l.id,nombre:l.nombre||'',apellido:l.apellido||'',gabinete:l.gabinete||'',
    ciudad:l.ciudad||'',departamento:l.departamento||'',pais:l.pais||'Uruguay',
    whatsapp:l.telefono||'',telefono:l.telefono||'',email:l.email||'',
    fuente:l.canal||'',interes:l.interes||'',tecnologia:l.tecnologia||'',estado:l.estado||'nuevo',
    temperatura:l.temperatura||'frio',obs:l.obs||'',proxAccion:l.prox_accion||'',proxFecha:l.prox_fecha||'',
    fechaAlta:l.created_at?l.created_at.split('T')[0]:'',fechaUpdate:l.updated_at?l.updated_at.split('T')[0]:'',
    operadoraId:l.operadora_id||null,convertidoEn:l.convertido_en||null,convertidoPor:l.convertido_por||null,
    whatsappScore:Number(l.whatsapp_score||0),ultimoContacto:l.ultimo_contacto||'',intencionWhatsapp:l.intencion_whatsapp||'',
  };
}

/* ── Listado ── */
let leadFilter = {search:'', estado:'', fuente:''};

function renderLeads(){
  const leads = DB.get('leads')||[];

  // Alertas
  const nuevos = leads.filter(l=>l.estado==='nuevo');
  const leadsCalientes = leads.filter(l=>Number(l.whatsappScore||0)>=45 || ['pendiente_sena','reserva_confirmada'].includes(l.estado));
  const sinSeguimiento = leads.filter(l=>['seguimiento','pendiente_respuesta','presupuesto_enviado'].includes(l.estado));
  let alertsHTML='';
  const hoyDate = today();
  const proxVencidas = leads.filter(l=>l.proxFecha && l.proxFecha < hoyDate && !['ganado','perdido'].includes(l.estado));
  const proxHoy      = leads.filter(l=>l.proxFecha === hoyDate && !['ganado','perdido'].includes(l.estado));
  if(proxVencidas.length) alertsHTML += `<div class="alert-banner danger" style="margin-bottom:8px"><span class="ab-icon">🔴</span><strong>${proxVencidas.length} lead${proxVencidas.length>1?'s':''} con próxima acción vencida</strong> — Atención inmediata. <button class="action-btn" style="margin-left:8px" onclick="filterProxVencidas()">Ver →</button></div>`;
  if(proxHoy.length) alertsHTML += `<div class="alert-banner warn" style="margin-bottom:8px"><span class="ab-icon">🟡</span><strong>${proxHoy.length} lead${proxHoy.length>1?'s':''} con próxima acción hoy</strong> — Revisar agenda. <button class="action-btn" style="margin-left:8px" onclick="filterProxHoy()">Ver →</button></div>`;
  const paraReactivar = leads.filter(l=>l.estado==='reactivar_luego');
  if(paraReactivar.length) alertsHTML += `<div class="alert-banner info" style="margin-bottom:8px"><span class="ab-icon">🕐</span><strong>${paraReactivar.length} lead${paraReactivar.length>1?'s':''} para reactivar</strong> — Revisar y volver a contactar. <button class="action-btn" style="margin-left:8px" onclick="filterReactivar()">Ver →</button></div>`;
  if(leadsCalientes.length) alertsHTML += `<div class="alert-banner warn" style="margin-bottom:8px"><span class="ab-icon">🔥</span><strong>${leadsCalientes.length} oportunidad${leadsCalientes.length>1?'es':''} caliente${leadsCalientes.length>1?'s':''}</strong> — Priorizar cierre comercial.</div>`;
  if(nuevos.length) alertsHTML += `<div class="alert-banner info" style="margin-bottom:8px"><span class="ab-icon">🆕</span><strong>${nuevos.length} lead${nuevos.length>1?'s':''} nuevo${nuevos.length>1?'s':''} sin contactar</strong> — Requieren primer contacto. <button class="action-btn" style="margin-left:8px" onclick="document.getElementById('filterLeadStatus').value='nuevo';filterLeadEstado('nuevo')">Filtrar →</button></div>`;
  if(sinSeguimiento.length) alertsHTML += `<div class="alert-banner info" style="margin-bottom:8px"><span class="ab-icon">🔄</span><strong>${sinSeguimiento.length} lead${sinSeguimiento.length>1?'s':''} en seguimiento</strong> — Revisar próxima acción.</div>`;
  document.getElementById('leadsAlerts').innerHTML = alertsHTML;

  const filtered = leads.filter(l=>{
    const q = leadFilter.search.toLowerCase();
    const ms = !q || (l.nombre+' '+l.apellido+' '+l.gabinete+' '+l.ciudad).toLowerCase().includes(q);
    const hoyF = today();
    if(leadFilter._proxFilter==='vencida') return l.proxFecha&&l.proxFecha<hoyF&&!['ganado','perdido'].includes(l.estado);
    if(leadFilter._proxFilter==='hoy')     return l.proxFecha===hoyF&&!['ganado','perdido'].includes(l.estado);
    return ms
      && (!leadFilter.estado  || l.estado  === leadFilter.estado)
      && (!leadFilter.fuente  || l.fuente  === leadFilter.fuente);
  }).sort((a,b)=>{
    // Primero por orden de estado, luego por fecha desc
    const oa = LEAD_ESTADOS[a.estado]?.orden||99;
    const ob = LEAD_ESTADOS[b.estado]?.orden||99;
    if(oa!==ob) return oa-ob;
    return (b.fechaAlta||'').localeCompare(a.fechaAlta||'');
  });

  const tbody = document.getElementById('leadsTableBody');
  if(!filtered.length){
    tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="icon">🎯</div><h3>Sin leads</h3><p>No hay leads que coincidan con los filtros. <button class="btn-add" onclick="openLeadModal()" style="margin-left:8px">+ Nuevo Lead</button></p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(l=>`<tr>
    <td><span class="bold">${escapeHTML(l.nombre)} ${escapeHTML(l.apellido)}</span>${l.operadoraId?` <span title="Convertido a operadora" style="color:var(--green);font-size:12px">✓OP</span>`:''}</td>
    <td>${escapeHTML(l.gabinete||'—')}</td>
    <td>${escapeHTML(l.ciudad||'—')}</td>
    <td>${l.whatsapp?`<a href="https://wa.me/${l.whatsapp.replace(/\D/g,'')}" target="_blank" style="color:var(--green);text-decoration:none">💬 ${escapeHTML(l.whatsapp)}</a>`:'—'}</td>
    <td><span style="font-size:12px;color:var(--text2)">${escapeHTML(LEAD_FUENTES[l.fuente]||l.fuente||'—')}</span></td>
    <td>${badgeLead(l.estado)}</td>
    <td>${(()=>{
      if(!l.proxAccion && !l.proxFecha && !l.whatsappScore) return '<span style="color:var(--text3);font-size:12px">—</span>';
      const hoy = today();
      const vencida = l.proxFecha && l.proxFecha < hoy;
      const esHoy   = l.proxFecha === hoy;
      const cls = vencida ? 'prox-chip vencida' : esHoy ? 'prox-chip hoy' : 'prox-chip proxima';
      const ico = vencida ? '🔴' : esHoy ? '🟡' : '🔵';
      return `<div><span class="${cls}">${ico} ${l.proxFecha ? fmtDate(l.proxFecha) : 'Sin fecha'}</span>
        ${l.proxAccion ? `<div style="font-size:11px;color:var(--text2);margin-top:3px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeAttr(l.proxAccion)}">${escapeHTML(l.proxAccion)}</div>` : ''}
        ${l.whatsappScore ? `<div style="font-size:11px;color:var(--accent);margin-top:3px">Score WA: ${Number(l.whatsappScore)||0}</div>` : ''}
      </div>`;
    })()}</td>
    <td><span style="font-size:12px;color:var(--text3)">${fmtDate(l.fechaAlta)}</span></td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="showLeadFicha(${l.id})">Ver</button>
      ${canEditLead()?`<button class="action-btn" onclick="openLeadModal(${l.id})" style="margin-left:4px">Editar</button>`:''}
    </td></tr>`).join('');
}

function filterLeads(v){leadFilter.search=v;renderLeads();}
function filterLeadEstado(v){leadFilter.estado=v;renderLeads();}
function filterLeadFuente(v){leadFilter.fuente=v;renderLeads();}

function filterProxVencidas(){
  leadFilter.estado=''; leadFilter.fuente=''; leadFilter.search='';
  document.getElementById('filterLeadStatus').value='';
  document.getElementById('filterLeadFuente').value='';
  leadFilter._proxFilter='vencida';
  renderLeads();
  delete leadFilter._proxFilter;
}
function filterProxHoy(){
  leadFilter.estado=''; leadFilter.fuente=''; leadFilter.search='';
  document.getElementById('filterLeadStatus').value='';
  document.getElementById('filterLeadFuente').value='';
  leadFilter._proxFilter='hoy';
  renderLeads();
  delete leadFilter._proxFilter;
}

function filterReactivar(){
  leadFilter._proxFilter=null;
  leadFilter.search='';
  document.getElementById('filterLeadStatus').value='reactivar_luego';
  document.getElementById('filterLeadFuente').value='';
  filterLeadEstado('reactivar_luego');
}

/* ── Ficha ── */
function showLeadFicha(id){
  const l = getLead(id); if(!l) return;
  const st = LEAD_ESTADOS[l.estado]||{};
  const nombreCompleto = `${escapeHTML(l.nombre)} ${escapeHTML(l.apellido)}`;

  // Embudo visual — estado actual en el pipeline
  const pipeline = LEAD_PIPELINE;
  const curIdx = pipeline.indexOf(l.estado);
  const isLost = l.estado==='perdido';
  const isReact = l.estado==='reactivar_luego';

  const embudoHTML = `<div class="lead-kanban-hint">
    ${pipeline.map((s,i)=>{
      const st2=LEAD_ESTADOS[s];
      let cls = 'lk-step';
      if(isLost||isReact) cls += '';
      else if(i < curIdx) cls += ' done';
      else if(i === curIdx) cls += ' active';
      return `<div class="${cls}">${st2.icon} ${st2.label}</div>`;
    }).join('')}
    ${isLost?`<div class="lk-step lost">❌ Perdido</div>`:''}
    ${isReact?`<div class="lk-step" style="border-color:var(--text2);color:var(--text2)">🕐 Reactivar</div>`:''}
  </div>`;

  navigate('lead-ficha');
  document.getElementById('fichaLeadContent').innerHTML = `
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar" style="background:linear-gradient(135deg,#5c6fd8,#3040a0)">
          ${escapeHTML((l.nombre||'').charAt(0))}${escapeHTML((l.apellido||'').charAt(0))}
        </div>
        <div class="ficha-title">
          <h2>${nombreCompleto}</h2>
          <p>${escapeHTML(l.gabinete||'Sin gabinete')} · ${escapeHTML(l.ciudad||'Sin ciudad')}, ${escapeHTML(l.departamento||'')}</p>
        </div>
      </div>
      <div class="ficha-actions">
        ${badgeLead(l.estado)}
        ${canEditLead()?`<button class="btn-secondary" onclick="openLeadModal(${l.id})">✏️ Editar</button>`:''}
        ${canEdit()&&!l.operadoraId&&l.estado==='ganado'?`<button class="btn-convert" onclick="convertirLeadAOperadora(${l.id})">👩‍💼 Convertir a Operadora</button>`:''}
        ${l.operadoraId?`<button class="btn-secondary" onclick="showOpFicha(${l.operadoraId})" style="color:var(--green);border-color:rgba(82,196,138,.3)">✓ Ver Operadora</button>`:''}
        ${isSuperAdmin()?`<button class="btn-danger" onclick="deleteLead(${l.id})">🗑</button>`:''}
      </div>
    </div>
    ${embudoHTML}
    <div class="ficha-grid">
      <div class="info-card">
        <h4>📋 Datos de Contacto</h4>
        ${ir('Nombre completo',nombreCompleto)}
        ${ir('Gabinete / Negocio',escapeHTML(l.gabinete||'—'))}
        ${ir('WhatsApp',l.whatsapp?`<a href="https://wa.me/${l.whatsapp.replace(/\D/g,'')}" target="_blank" style="color:var(--green)">💬 ${escapeHTML(l.whatsapp)}</a>`:'—')}
        ${ir('Teléfono',escapeHTML(l.telefono||'—'))}
        ${ir('Email',l.email?`<a href="mailto:${escapeAttr(l.email)}" style="color:var(--blue)">${escapeHTML(l.email)}</a>`:'—')}
        ${ir('Ciudad',escapeHTML(l.ciudad||'—'))}
        ${ir('Departamento',escapeHTML(l.departamento||'—'))}
        ${ir('País',escapeHTML(l.pais||'—'))}
      </div>
      <div class="info-card">
        <h4>🎯 Información Comercial</h4>
        ${ir('Estado',badgeLead(l.estado))}
        ${ir('Fuente',escapeHTML(LEAD_FUENTES[l.fuente]||l.fuente||'—'))}
        ${ir('Interés principal',escapeHTML(l.interes||'—'))}
        ${ir('Tecnología consultada',escapeHTML(l.tecnologia||'—'))}
        ${ir('Temperatura',escapeHTML(l.temperatura||'—'))}
        ${ir('Score WhatsApp',escapeHTML(String(l.whatsappScore||0)))}
        ${ir('Intención WhatsApp',escapeHTML(l.intencionWhatsapp||'—'))}
        ${ir('Último contacto',l.ultimoContacto?fmtDate(String(l.ultimoContacto).split('T')[0]):'—')}
        ${ir('Fecha de alta',fmtDate(l.fechaAlta))}
        ${ir('Última actualización',fmtDate(l.fechaUpdate))}
        ${l.operadoraId?ir('Operadora vinculada',`<button class="action-btn" onclick="showOpFicha(${l.operadoraId})" style="color:var(--green)">Ver operadora →</button>`):''}
      </div>
      ${(()=>{
        if(!l.proxAccion && !l.proxFecha) return '';
        const hoy = today();
        const vencida = l.proxFecha && l.proxFecha < hoy;
        const esHoy   = l.proxFecha === hoy;
        const panelCls = vencida ? 'prox-accion-panel urgente' : esHoy ? 'prox-accion-panel hoy' : 'prox-accion-panel pendiente';
        const ico = vencida ? '🔴 Vencida' : esHoy ? '🟡 Hoy' : '🔵 Programada';
        return `<div class="${panelCls}">
          <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">📌 Próxima Acción</div>
          <div style="font-size:14px;color:var(--text);font-weight:600;margin-bottom:6px">${escapeHTML(l.proxAccion||'—')}</div>
          ${l.proxFecha ? `<div style="font-size:12px;color:var(--text2);display:flex;align-items:center;gap:8px">${ico} <strong>${fmtDate(l.proxFecha)}</strong></div>` : ''}
          ${canEditLead() ? `<div style="margin-top:10px"><button class="action-btn" onclick="openNotaModal(${l.id})" style="color:var(--accent);border-color:rgba(212,169,106,.3)">+ Registrar seguimiento</button></div>` : ''}
        </div>`;
      })()}
      <div class="info-card full">
        <h4>📝 Observaciones Comerciales</h4>
        <div class="obs-text">${escapeHTML(l.obs||'Sin observaciones.')}</div>
      </div>
      ${l.operadoraId ? `<div class="info-card full conversion-box">
        <h4>✅ Lead Convertido en Operadora</h4>
        ${ir('Operadora',`<button class="action-btn" onclick="showOpFicha(${l.operadoraId})" style="color:var(--green)">👩‍💼 Ver ficha de operadora →</button>`)}
        ${l.convertidoEn ? ir('Convertido el', fmtDate(l.convertidoEn?.split('T')[0]||'')) : ''}
        ${l.convertidoPor ? ir('Por', `<span style="font-size:12px;color:var(--text2)">${escapeHTML(l.convertidoPor.split('@')[0])}</span>`) : ''}
      </div>` : ''}
      ${!l.operadoraId&&l.estado!=='perdido' ? `<div class="info-card full">
        <h4>🔄 Cambiar Estado</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:4px 0">
          ${canEditLead() ? Object.entries(LEAD_ESTADOS)
            .filter(([k])=>k!==l.estado)
            .map(([k,v])=>`<button class="action-btn" onclick="cambiarEstadoLead(${l.id},'${k}')">${v.icon} ${v.label}</button>`)
            .join('') : '<span style="color:var(--text3);font-size:13px">Sin permisos.</span>'}
        </div>
        ${l.estado==='ganado' && canEdit() ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
            <button class="btn-add" style="font-size:13px" onclick="convertirLeadAOperadora(${l.id})">
              🚀 Convertir en Operadora
            </button>
          </div>` : `
          <div style="margin-top:8px;font-size:12px;color:var(--text3)">
            💡 Marcá como <strong>Ganado</strong> para convertir este lead en operadora activa.
          </div>`}
        ${l.estado==='reactivar_luego' ? `
          <div class="reactivar-box" style="margin-top:12px">
            <h4>🔔 Programado para Reactivación</h4>
            ${l.proxFecha ? `<div style="font-size:13px;color:var(--text)">📅 Próximo contacto: <strong>${fmtDate(l.proxFecha)}</strong></div>` : ''}
            ${l.proxAccion ? `<div style="font-size:12px;color:var(--text2);margin-top:4px">${escapeHTML(l.proxAccion)}</div>` : ''}
            ${canEditLead() ? `<div style="margin-top:10px"><button class="action-btn" onclick="openNotaModal(${l.id})" style="color:var(--blue);border-color:rgba(92,143,224,.3)">+ Registrar recontacto</button></div>` : ''}
          </div>` : ''}
      </div>` : ''}
      <div class="info-card full">
        <h4 style="display:flex;align-items:center;justify-content:space-between">
          📝 Notas de Seguimiento
          ${canEditLead()?`<button class="btn-add" style="font-size:12px;padding:6px 12px" onclick="openNotaModal(${l.id})">+ Nota</button>`:''}
        </h4>
        ${(()=>{
          const notas=(DB.get('leads_notas')||[]).filter(n=>n.leadId===l.id).sort((a,b)=>b.ts.localeCompare(a.ts));
          if(!notas.length) return `<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin notas aún. Registrá el primer contacto con el botón + Nota.</div>`;
          const tipoMap={llamada:'📞 llamada',whatsapp:'💬 WhatsApp',email:'✉️ email',reunion:'🤝 reunión',otro:'📌 otro'};
          return notas.map(n=>`<div class="seguimiento-card">
            <div class="sc-head">
              <span class="sc-tipo sc-tipo-${n.tipo}">${tipoMap[n.tipo]||n.tipo}</span>
              <span class="nc-date">${fmtDate(n.fecha)} — ${n.ts.split('T')[1]?.slice(0,5)||''}</span>
            </div>
            <div class="sc-nota">${escapeHTML(n.texto)}</div>
            ${n.resultado ? `<div class="sc-resultado">✅ ${escapeHTML(n.resultado)}</div>` : ''}
            ${(n.proxAccion||n.proxFecha) ? `<div class="sc-prox">📌 <strong>Próxima acción:</strong> ${escapeHTML(n.proxAccion||'—')}${n.proxFecha ? ` · <strong>${fmtDate(n.proxFecha)}</strong>` : ''}</div>` : ''}
            <div class="sc-meta">
              <span>👤 ${escapeHTML(n.usuario?.split('@')[0]||'—')}</span>
            </div>
          </div>`).join('');
        })()}
      </div>
      <div class="info-card full">
        <h4>🕐 Historial de Estado</h4>
        ${(()=>{
          const hist=(DB.get('leads_estado_historial')||[]).filter(h=>h.leadId===l.id).sort((a,b)=>b.ts.localeCompare(a.ts));
          if(!hist.length) return `<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin historial aún.</div>`;
          return `<ul class="timeline">${hist.map(h=>{
            const stN=LEAD_ESTADOS[h.estadoNuevo]||{}; const stP=LEAD_ESTADOS[h.estadoPrevio]||{};
            return `<li class="timeline-item">
              <div class="timeline-dot" style="background:var(--accent)">${stN.icon||'→'}</div>
              <div class="timeline-content">
                <div class="tc-head">
                  <span class="tc-title">${stP.label||h.estadoPrevio||'Creación'} → ${stN.label||h.estadoNuevo}</span>
                  <span class="tc-date">${fmtDate(h.ts?.split('T')[0]||'')} ${h.ts?.split('T')[1]?.slice(0,5)||''}</span>
                </div>
                ${h.motivo?`<div class="tc-body">${escapeHTML(h.motivo)}</div>`:''}
                <div class="tc-body" style="font-size:11px;color:var(--text3)">${escapeHTML(h.usuario?.split('@')[0]||'')}</div>
              </div>
            </li>`;
          }).join('')}</ul>`;
        })()}
      </div>
    </div>`;
}

/* ── Modal alta/edición ── */
function openLeadModal(id){
  document.getElementById('modalLeadTitle').textContent = id ? 'Editar Lead' : 'Nuevo Lead';
  document.getElementById('leadDuplicateWarn').style.display = 'none';

  if(id){
    const l = getLead(id); if(!l) return;
    sv('leadId',l.id); sv('leadNombre',l.nombre); sv('leadApellido',l.apellido);
    sv('leadGabinete',l.gabinete||''); sv('leadCiudad',l.ciudad||'');
    sv('leadDepartamento',l.departamento||''); sv('leadPais',l.pais||'Uruguay');
    sv('leadWhatsapp',l.whatsapp||''); sv('leadTelefono',l.telefono||'');
    sv('leadEmail',l.email||''); sv('leadFuente',l.fuente||'otro');
    sv('leadEstado',l.estado||'nuevo'); sv('leadInteres',l.interes||'');
    sv('leadTecnologia',l.tecnologia||''); sv('leadObs',l.obs||'');
  } else {
    sv('leadId','');
    ['leadNombre','leadApellido','leadGabinete','leadCiudad','leadDepartamento',
     'leadWhatsapp','leadTelefono','leadEmail','leadInteres','leadTecnologia','leadObs']
      .forEach(f=>sv(f,''));
    sv('leadPais','Uruguay'); sv('leadFuente','instagram'); sv('leadEstado','nuevo');
  }
  openModal('modalLead');
}

/* ── Validación duplicado ── */
function checkDuplicadoLead(){
  const wa    = gv('leadWhatsapp').trim().replace(/\D/g,'');
  const email = gv('leadEmail').trim().toLowerCase();
  const editId= parseInt(gv('leadId'))||0;
  const warn  = document.getElementById('leadDuplicateWarn');
  const msg   = document.getElementById('leadDuplicateMsg');

  // Check contra operadoras activas
  const ops = DB.get('operadoras')||[];
  const matchOp = ops.find(o=>{
    const oWa=o.whatsapp.replace(/\D/g,''); const oEm=(o.email||'').toLowerCase();
    return (wa&&oWa===wa)||(email&&oEm===email);
  });
  if(matchOp){
    warn.style.display='flex';
    msg.innerHTML=`Ya existe la operadora <strong>${escapeHTML(matchOp.nombre)} ${escapeHTML(matchOp.apellido)}</strong> con este contacto. Verificá si ya está activa antes de crear el lead.`;
    return;
  }

  // Check contra leads existentes
  const leads = DB.get('leads')||[];
  const matchLead = leads.find(l=>{
    if(l.id===editId) return false;
    const lWa=l.whatsapp.replace(/\D/g,''); const lEm=(l.email||'').toLowerCase();
    return (wa&&lWa===wa)||(email&&lEm===email);
  });
  if(matchLead){
    warn.style.display='flex';
    msg.innerHTML=`Ya existe el lead <strong>${escapeHTML(matchLead.nombre)} ${escapeHTML(matchLead.apellido)}</strong> con este contacto (estado: ${escapeHTML(LEAD_ESTADOS[matchLead.estado]?.label||matchLead.estado)}).`;
    return;
  }
  warn.style.display='none';
}

/* ── Guardar ── */
async function saveLead(){
  const id=gv('leadId');
  const payload={
    nombre:gv('leadNombre').trim(),apellido:gv('leadApellido').trim(),gabinete:gv('leadGabinete').trim(),
    telefono:gv('leadWhatsapp').trim()||gv('leadTelefono').trim(),
    email:gv('leadEmail').trim(),ciudad:gv('leadCiudad').trim(),
    departamento:gv('leadDepartamento').trim(),pais:gv('leadPais')||'Uruguay',
    canal:gv('leadFuente'),estado:gv('leadEstado'),temperatura:gv('leadTemperatura')||'frio',
    interes:gv('leadInteres').trim(),tecnologia:gv('leadTecnologia').trim(),obs:gv('leadObs').trim()};
  if(!payload.nombre){showToast('\u26a0\ufe0f Nombre es obligatorio','warn');return;}
  try{
    if(id){
      await api('/api/leads/'+id,{method:'PUT',body:JSON.stringify(payload)});
      showToast('\u2705 Lead actualizado');
    }else{
      await api('/api/leads',{method:'POST',body:JSON.stringify(payload)});
      showToast('\u2705 Lead creado');
    }
    const leads=await api('/api/leads');
    DB.set('leads',leads.map(mapLeadApi));
    closeModal('modalLead');renderLeads();updateLeadsBadge();
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}

/* ── Cambio rápido de estado ── */
async function cambiarEstadoLead(id, nuevoEstado){
  if(!canEditLead()){ showToast('⚠️ Sin permisos para cambiar estado','warn'); return; }
  const leads = DB.get('leads')||[];
  const idx = leads.findIndex(l=>l.id===id); if(idx<0) return;
  const prev = leads[idx].estado;
  try{
    const saved=await api(`/api/leads/${id}/estado`,{method:'PATCH',body:JSON.stringify({estado:nuevoEstado,motivo:'Cambio manual desde ficha'})});
    leads[idx]={...leads[idx],...mapLeadApi(saved)};
    DB.set('leads',leads);
    const hist=DB.get('leads_estado_historial')||[];
    hist.push({id:Math.max(0,...hist.map(h=>h.id))+1,leadId:parseInt(id),estadoPrevio:prev,estadoNuevo:nuevoEstado,motivo:'Cambio manual',usuario:currentUser?.email||'—',ts:new Date().toISOString()});
    DB.set('leads_estado_historial',hist);
    showToast(`🔄 ${LEAD_ESTADOS[nuevoEstado]?.label||nuevoEstado}`);
    updateLeadsBadge();
    showLeadFicha(id);
  }catch(e){showToast('❌ '+e.message,'error');}
}

/* ── Cambio de estado desde el embudo (sin navegar a ficha) ── */
async function cambiarEstadoLeadDesdeEmbudo(id, nuevoEstado){
  if(!nuevoEstado) return;
  if(!canEditLead()){ showToast('⚠️ Sin permisos para cambiar estado','warn'); return; }
  const leads = DB.get('leads')||[];
  const idx   = leads.findIndex(l=>l.id===id); if(idx<0) return;
  const prev  = leads[idx].estado;
  if(prev === nuevoEstado) return;
  try{
    const saved=await api(`/api/leads/${id}/estado`,{method:'PATCH',body:JSON.stringify({estado:nuevoEstado,motivo:'Cambio desde embudo'})});
    leads[idx]={...leads[idx],...mapLeadApi(saved)};
    DB.set('leads', leads);
    const hist = DB.get('leads_estado_historial')||[];
    hist.push({
      id: Math.max(0,...hist.map(h=>h.id))+1,
      leadId: parseInt(id),
      estadoPrevio: prev,
      estadoNuevo:  nuevoEstado,
      motivo:       'Cambio desde embudo',
      usuario:      currentUser?.email||'—',
      ts:           new Date().toISOString(),
    });
    DB.set('leads_estado_historial', hist);
    showToast(`🔄 ${leads[idx].nombre} → ${LEAD_ESTADOS[nuevoEstado]?.label||nuevoEstado}`);
    updateLeadsBadge();
    renderEmbudo();
  }catch(e){showToast('❌ '+e.message,'error');renderEmbudo();}
}

/* ── Conversión Lead → Operadora ── */
function convertirLeadAOperadora(id){
  if(!canEdit()){ showToast('⚠️ Solo administración puede convertir leads en operadoras','warn'); return; }
  const l = getLead(id); if(!l) return;
  if(l.estado !== 'ganado'){
    showToast('⚠️ Solo se pueden convertir leads en estado Ganado','warn'); return;
  }
  if(l.operadoraId){
    showToast('ℹ️ Este lead ya fue convertido en operadora');
    showOpFicha(l.operadoraId); return;
  }

  // Duplicate detection — check against existing operadoras
  const ops = DB.get('operadoras')||[];
  const wa  = (l.whatsapp||'').replace(/\D/g,'');
  const em  = (l.email||'').toLowerCase();
  const dupOp = ops.find(o=>{
    const oWa=(o.whatsapp||'').replace(/\D/g,'');
    const oEm=(o.email||'').toLowerCase();
    return (wa && oWa === wa) || (em && oEm === em);
  });

  if(dupOp){
    const ok = confirm(
      `⚠️ Posible duplicado detectado\n\n` +
      `Ya existe la operadora "${dupOp.nombre} ${dupOp.apellido}" ` +
      `(${dupOp.estado}) con los mismos datos de contacto.\n\n` +
      `¿Querés vincular este lead con esa operadora existente en vez de crear una nueva?\n\n` +
      `"Aceptar" = vincular con la existente\n"Cancelar" = abrir formulario de nueva operadora`
    );
    if(ok){
      // Link to existing operadora
      _completarConversionLead(id, dupOp.id);
      showToast(`✅ Lead vinculado con operadora existente: ${dupOp.nombre} ${dupOp.apellido}`);
      showLeadFicha(id);
      return;
    }
  }

  // Pre-fill operadora modal
  sv('opNombre',       l.nombre);
  sv('opApellido',     l.apellido);
  sv('opGabinete',     l.gabinete||'');
  sv('opCiudad',       l.ciudad||'');
  sv('opDepartamento', l.departamento||'');
  sv('opPais',         l.pais||'Uruguay');
  sv('opWhatsapp',     l.whatsapp||'');
  sv('opTelefono',     l.telefono||'');
  sv('opEmail',        l.email||'');
  sv('opFechaAlta',    today());
  sv('opEstado',       'activa');
  sv('opNivel',        'Inicial');
  sv('opObs', `Convertida desde CRM. Interés: ${l.interes||'—'} | Tecnología: ${l.tecnologia||'—'} | Fuente: ${LEAD_FUENTES[l.fuente]||l.fuente||'—'}`);
  sv('opId','');

  document.getElementById('modalOpTitle').textContent = `🚀 Nueva Operadora (desde Lead #${id})`;
  document._leadConvertiendo = id;
  openModal('modalOp');
}

// Called internally to link lead ↔ operadora and save history
function _completarConversionLead(leadId, operadoraId){
  const leads = DB.get('leads')||[];
  const idx   = leads.findIndex(l=>l.id===parseInt(leadId));
  if(idx<0) return;
  leads[idx].operadoraId   = operadoraId;
  leads[idx].convertidoEn  = new Date().toISOString();
  leads[idx].convertidoPor = currentUser?.email||'—';
  leads[idx].estado        = 'ganado';
  leads[idx].fechaUpdate   = today();
  DB.set('leads', leads);

  // Historial entry
  const hist = DB.get('leads_estado_historial')||[];
  hist.push({
    id:          Math.max(0,...hist.map(h=>h.id))+1,
    leadId:      parseInt(leadId),
    estadoPrevio: leads[idx].estado,
    estadoNuevo:  'ganado',
    motivo:       `Convertido en operadora #${operadoraId}`,
    usuario:      currentUser?.email||'—',
    ts:           new Date().toISOString(),
  });
  DB.set('leads_estado_historial', hist);
  auditLog('CREATE','conversion',leadId,`Lead #${leadId} → Operadora #${operadoraId} por ${currentUser?.email||'—'}`);
}

/* ── Eliminar ── */
async function deleteLead(id){
  if(!confirm('\u00bfEliminar este lead?'))return;
  try{
    await api('/api/leads/'+id,{method:'DELETE'});
    const leads=await api('/api/leads');
    DB.set('leads',leads.map(l=>({id:l.id,nombre:l.nombre,apellido:'',gabinete:'',
      ciudad:l.ciudad||'',departamento:l.departamento||'',pais:'Uruguay',
      whatsapp:l.telefono||'',telefono:l.telefono||'',email:l.email||'',
      fuente:l.canal||'',interes:'',tecnologia:'',estado:l.estado||'nuevo',
      obs:l.obs||'',fechaAlta:l.created_at?l.created_at.split('T')[0]:'',
      fechaUpdate:l.updated_at?l.updated_at.split('T')[0]:'',operadoraId:null})));
    showToast('\ud83d\uddd1 Lead eliminado');navigate('leads');updateLeadsBadge();
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}

/* ── Badge ── */
function updateLeadsBadge(){
  const leads = DB.get('leads')||[];
  const count = leads.filter(l=>l.estado==='nuevo').length;
  const badge = document.getElementById('navBadgeLeads');
  if(badge){ badge.textContent=count; badge.style.display=count>0?'inline':'none'; }
}
