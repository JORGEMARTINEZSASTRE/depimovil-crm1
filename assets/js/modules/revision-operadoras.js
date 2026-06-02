/* ══════════════════════════════════
   REVISION OPERADORAS
══════════════════════════════════ */
let revisionOpsFilter = { search: '', estado: '' };
let revisionOpsCache = [];
let revisionOpsActual = null;

function revEsc(v){
  return String(v ?? '').replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function revMetadata(row){
  if(!row || !row.metadata) return {};
  if(typeof row.metadata === 'object') return row.metadata;
  try{return JSON.parse(row.metadata)}catch(e){return {}}
}

function badgeRevisionEstado(estado){
  const cls = {
    pendiente:'badge-yellow',
    documentos_solicitados:'badge-blue',
    contrato_pendiente:'badge-blue',
    habilitacion_pendiente:'badge-blue',
    observada:'badge-purple',
    aprobada:'badge-green',
    rechazada:'badge-red',
    no_requiere:'badge-gray'
  };
  const label = {
    pendiente:'Pendiente',
    documentos_solicitados:'Documentos solicitados',
    contrato_pendiente:'Contrato pendiente',
    habilitacion_pendiente:'Habilitación pendiente',
    observada:'Observada',
    aprobada:'Aprobada',
    rechazada:'Rechazada',
    no_requiere:'Sin revisión'
  };
  return `<span class="badge ${cls[estado] || 'badge-gray'}">${label[estado] || estado || '—'}</span>`;
}

function revisionCumpleanosLabel(md){
  const dia=parseInt(md?.cumpleanos_dia,10);
  const mes=parseInt(md?.cumpleanos_mes,10);
  if(!dia||!mes) return '—';
  const meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  return mes>=1&&mes<=12 ? `${dia} de ${meses[mes-1]}` : '—';
}

function filterRevisionOperadoras(v){
  revisionOpsFilter.search = v || '';
  renderRevisionOperadorasRows();
}

function filterRevisionEstado(v){
  revisionOpsFilter.estado = v || '';
  renderRevisionOperadorasRows();
}

async function cargarRevisionOperadoras(){
  revisionOpsCache = await api('/api/auth/operadoras/revision');
  return revisionOpsCache;
}

async function updateRevisionOperadorasBadge(){
  const badge = document.getElementById('navBadgeRevisionOps');
  if(!badge || !currentUser || !canEdit()) return;
  try{
    const rows = await cargarRevisionOperadoras();
    const pendientes = rows.filter(function(r){
      return ['pendiente','documentos_solicitados','contrato_pendiente','habilitacion_pendiente','observada'].includes(r.revision_admin_estado);
    }).length;
    badge.textContent = pendientes;
    badge.style.display = pendientes ? 'inline-flex' : 'none';
  }catch(e){
    badge.style.display = 'none';
  }
}

async function renderRevisionOperadoras(){
  const tbody = document.getElementById('revisionOpsTableBody');
  if(!tbody) return;
  if(!canEdit()){
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">☑</div><h3>Sin permisos</h3><p>Esta bandeja es solo para administración.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = '<tr><td colspan="5"><div class="loading-state">Cargando revisiones...</div></td></tr>';
  try{
    await cargarRevisionOperadoras();
    renderRevisionOperadorasResumen();
    renderRevisionOperadorasRows();
    updateRevisionOperadorasBadge();
  }catch(e){
    tbody.innerHTML = `<tr><td colspan="5"><div class="error-state">No se pudo cargar la bandeja: ${revEsc(e.message)}</div></td></tr>`;
  }
}

function renderRevisionOperadorasResumen(){
  const el = document.getElementById('revisionOpsResumen');
  if(!el) return;
  const pendientes = revisionOpsCache.filter(r => r.revision_admin_estado === 'pendiente').length;
  const docs = revisionOpsCache.filter(r => r.revision_admin_estado === 'documentos_solicitados').length;
  const contratos = revisionOpsCache.filter(r => r.revision_admin_estado === 'contrato_pendiente').length;
  const habilitaciones = revisionOpsCache.filter(r => r.revision_admin_estado === 'habilitacion_pendiente').length;
  const obs = revisionOpsCache.filter(r => r.revision_admin_estado === 'observada').length;
  const aprobadas = revisionOpsCache.filter(r => r.revision_admin_estado === 'aprobada').length;
  el.innerHTML = `
    <div class="docs-summary-card"><div class="label">Pendientes</div><div class="value">${pendientes}</div></div>
    <div class="docs-summary-card"><div class="label">Docs pedidos</div><div class="value">${docs}</div></div>
    <div class="docs-summary-card"><div class="label">Contrato</div><div class="value">${contratos}</div></div>
    <div class="docs-summary-card"><div class="label">Habilitación</div><div class="value">${habilitaciones}</div></div>
    <div class="docs-summary-card"><div class="label">Observadas</div><div class="value">${obs}</div></div>
    <div class="docs-summary-card"><div class="label">Aprobadas</div><div class="value">${aprobadas}</div></div>`;
}

function moduloRevision(row, modulo){
  const md = revMetadata(row);
  return (md.review_modulos && md.review_modulos[modulo]) || {};
}

function moduloBadge(row, modulo, fallbackOk){
  const estado = moduloRevision(row, modulo).estado || (fallbackOk ? 'cargada' : 'pendiente');
  const cls = {
    aceptada:'badge-green', cargada:'badge-green', pedida:'badge-blue',
    pendiente:'badge-yellow', denegada:'badge-red'
  }[estado] || 'badge-gray';
  const labels = {
    aceptada:'Aceptada', cargada:'Cargada', pedida:'Pedida',
    pendiente:'Pendiente', denegada:'Denegada'
  };
  return `<span class="badge ${cls}">${labels[estado] || estado}</span>`;
}

function renderModuloRevisionCard(row, modulo, titulo, descripcion, fallbackOk, acciones){
  const m = moduloRevision(row, modulo);
  return `<div class="docs-detail-card">
    <div class="docs-detail-title" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <span>${titulo}</span>${moduloBadge(row, modulo, fallbackOk)}
    </div>
    <div class="docs-line" style="margin-bottom:10px">${revEsc(m.obs || descripcion)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${acciones}</div>
  </div>`;
}

function renderRevisionModulos(row){
  if(!row.operadora_id){
    return `<div class="docs-detail-card" style="margin-top:12px">
      <div class="docs-detail-title">Módulos de revisión</div>
      <div class="docs-line">Este pedido todavía no tiene ficha vinculada, por eso no se pueden aceptar documentos, contrato ni habilitación.</div>
    </div>`;
  }
  const docs = (DB.get('documentos_operadora') || []).filter(d => parseInt(d.operadora_id) === parseInt(row.operadora_id));
  const tieneCedula = docs.some(d => d.tipo === 'cedula') && docs.some(d => d.tipo === 'cedula_dorso');
  const tieneContrato = docs.some(d => d.tipo === 'contrato') || (DB.get('contratos') || []).some(c => parseInt(c.operadoraId) === parseInt(row.operadora_id) && (c.estado === 'firmado' || c.firmadoEn));
  const habs = (DB.get('habilitaciones') || []).filter(h => parseInt(h.operadoraId) === parseInt(row.operadora_id) && ['activa','activo'].includes(h.estado));
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px">
    ${renderModuloRevisionCard(row, 'cedula', 'CI / DNI', tieneCedula ? 'Frente y dorso cargados.' : 'Falta cargar o revisar cédula.', tieneCedula,
      `<button class="action-btn" onclick="guardarRevisionModulo('cedula','pedir')">Pedir CI</button>
       <button class="action-btn" onclick="guardarRevisionModulo('cedula','aceptar')">Aceptar CI</button>
       <button class="action-btn" onclick="guardarRevisionModulo('cedula','denegar')">Denegar</button>`)}
    ${renderModuloRevisionCard(row, 'contrato', 'Firma de contrato', tieneContrato ? 'Contrato firmado o documento cargado.' : 'Falta firma de contrato.', tieneContrato,
      `<button class="action-btn" onclick="guardarRevisionModulo('contrato','pedir')">Pedir firma</button>
       <button class="action-btn" onclick="guardarRevisionModulo('contrato','aceptar')">Aceptar</button>
       <button class="action-btn" onclick="guardarRevisionModulo('contrato','denegar')">Denegar</button>`)}
    ${renderModuloRevisionCard(row, 'habilitacion', 'Habilitación técnica', habs.length ? habs.map(h => h.categoria || h.equipoCategoria || 'Habilitación').join(', ') : 'Falta pedir o registrar habilitación.', !!habs.length,
      `<button class="action-btn" onclick="guardarRevisionModulo('habilitacion','pedir')">Pedir habilitación</button>
       <button class="action-btn" onclick="guardarRevisionModulo('habilitacion','aceptar')">Aceptar</button>
       <button class="action-btn" onclick="guardarRevisionModulo('habilitacion','denegar')">Denegar</button>`)}
  </div>`;
}

function renderRevisionOperadorasRows(){
  const tbody = document.getElementById('revisionOpsTableBody');
  if(!tbody) return;
  const q = (revisionOpsFilter.search || '').toLowerCase();
  const estado = revisionOpsFilter.estado;
  const rows = revisionOpsCache.filter(function(r){
    const md = revMetadata(r);
    const hay = [r.nombre, r.apellido, r.usuario_nombre, r.whatsapp, r.ciudad, r.departamento, r.usuario_email, md.documento]
      .filter(Boolean).join(' ').toLowerCase();
    if(q && !hay.includes(q)) return false;
    if(estado && r.revision_admin_estado !== estado) return false;
    return true;
  });
  if(!rows.length){
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">☑</div><h3>Sin registros</h3><p>No hay operadoras para revisar con ese filtro.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(r){
    const md = revMetadata(r);
    const tratamientos = [md.tratamientos || [], md.tratamientos_otros || ''].flat().filter(Boolean).join(', ');
    const nombre = `${r.nombre || r.usuario_nombre || ''} ${r.apellido || ''}`.trim() || 'Pedido sin nombre';
    const sinFicha = !r.operadora_id;
    return `<tr>
      <td>
        <span class="bold">${revEsc(nombre)}</span>
        ${sinFicha ? '<span class="badge badge-red" style="margin-left:6px">Sin ficha vinculada</span>' : ''}
        <div class="docs-line">${revEsc(r.whatsapp || 'Sin WhatsApp')} · CI/DNI ${revEsc(md.documento || '—')}</div>
      </td>
      <td>
        <span>${fmtDate(r.usuario_created_at)}</span>
        <div class="docs-line">${revEsc(r.ciudad || 'Sin ciudad')}${r.departamento ? ' · ' + revEsc(r.departamento) : ''}</div>
      </td>
      <td>
        <span>${revEsc(md.experiencia || r.nivel || '—')}</span>
        <div class="docs-line">${revEsc(tratamientos || 'Sin tratamientos indicados')}</div>
      </td>
      <td>
        ${badgeRevisionEstado(r.revision_admin_estado)}
        ${r.revision_admin_obs ? `<div class="docs-line">${revEsc(r.revision_admin_obs)}</div>` : ''}
      </td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="openRevisionOperadora(${r.usuario_id})">Revisar</button>
        ${r.operadora_id ? `<button class="action-btn" onclick="showOpFicha(${r.operadora_id})">Ficha</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function openRevisionOperadora(usuarioId){
  const row = revisionOpsCache.find(r => r.usuario_id === usuarioId);
  if(!row) return;
  revisionOpsActual = row;
  const md = revMetadata(row);
  const portal = row.portal_token ? window.location.origin + '/portal.html?token=' + row.portal_token : '';
  const nombre = `${row.nombre || row.usuario_nombre || ''} ${row.apellido || ''}`.trim() || 'Pedido sin nombre';
  const sinFicha = !row.operadora_id;
  document.getElementById('modalRevisionTitle').textContent = `Revisión: ${nombre}`;
  document.getElementById('modalRevisionBody').innerHTML = `
    <div class="revision-detail-grid">
      <div class="docs-detail-card">
        <div class="docs-detail-title">Datos principales</div>
        ${sinFicha ? '<div class="alert-banner danger" style="padding:8px 12px;margin-bottom:10px"><span class="ab-icon">⚠️</span><div><strong>Pedido sin ficha vinculada</strong><br>Este alta llegó incompleta. Se puede rechazar o eliminar el pedido.</div></div>' : ''}
        ${ir('Nombre', revEsc(nombre))}
        ${ir('WhatsApp', revEsc(row.whatsapp || '—'))}
        ${ir('Cédula / DNI', revEsc(md.documento || '—'))}
        ${ir('Cumpleaños', revEsc(revisionCumpleanosLabel(md)))}
        ${ir('Ciudad', revEsc(row.ciudad || '—'))}
        ${ir('Departamento', revEsc(row.departamento || '—'))}
      </div>
      <div class="docs-detail-card">
        <div class="docs-detail-title">Revisión</div>
        ${ir('Estado', badgeRevisionEstado(row.revision_admin_estado))}
        ${ir('Registro', fmtDate(row.usuario_created_at))}
        ${ir('Portal', portal ? `<button class="action-btn" onclick="copyText('${portal}')">Copiar link</button> <a class="action-btn" href="${portal}" target="_blank" rel="noopener">Abrir</a>` : '<span class="badge badge-gray">Sin token</span>')}
      </div>
    </div>
    <div class="docs-detail-card" style="margin-top:12px">
      <div class="docs-detail-title">Actividad declarada</div>
      ${ir('Experiencia', revEsc(md.experiencia || row.nivel || '—'))}
      ${ir('Tratamientos', revEsc([md.tratamientos || [], md.tratamientos_otros || ''].flat().filter(Boolean).join(', ') || '—'))}
      ${ir('Lugares de trabajo', revEsc(md.lugares_trabajo || '—'))}
      ${ir('Otros trabajos', md.trabajo_no_estetico ? revEsc(md.trabajo_no_estetico_detalle || 'Sí') : 'No')}
    </div>
    ${renderRevisionModulos(row)}
    <div class="docs-detail-card" style="margin-top:12px">
      <div class="docs-detail-title">Observación para guardar o enviar</div>
      <textarea id="revisionObs" placeholder="Ej: subir cédula frente y dorso, aclarar dirección, corregir datos..." style="width:100%;min-height:90px">${revEsc(row.revision_admin_obs || '')}</textarea>
    </div>`;
  openModal('modalRevisionOperadora');
}

async function guardarRevisionModulo(modulo, accionModulo){
  if(!revisionOpsActual) return;
  if(!revisionOpsActual.operadora_id){
    showToast('⚠️ Este pedido no tiene ficha de operadora vinculada','warn');
    return;
  }
  const obs = gv('revisionObs').trim();
  const accionMap = {
    cedula:{pedir:'pedir_documentos', aceptar:'aceptar_documentos', denegar:'denegar_documentos'},
    contrato:{pedir:'pedir_contrato', aceptar:'aceptar_contrato', denegar:'denegar_contrato'},
    habilitacion:{pedir:'pedir_habilitacion', aceptar:'aceptar_habilitacion', denegar:'denegar_habilitacion'}
  };
  const accion = accionMap[modulo]?.[accionModulo];
  if(!accion) return;
  try{
    if(modulo === 'habilitacion' && accionModulo === 'aceptar'){
      const categoria = prompt('Categoría habilitada:', 'Láser Depilación');
      if(categoria === null) return;
      if(!categoria.trim()){
        showToast('⚠️ Indicá una categoría para la habilitación','warn');
        return;
      }
      await api('/api/operadoras/' + revisionOpsActual.operadora_id + '/habilitaciones', {
        method:'POST',
        body:JSON.stringify({categoria:categoria.trim(), estado:'activa', fecha_habilitacion:today(), obs:obs || 'Aceptada desde revisión de alta'})
      });
    }
    await api('/api/auth/operadoras/revision/' + revisionOpsActual.usuario_id, {
      method:'POST',
      body:JSON.stringify({accion, obs})
    });
    showToast('✅ Módulo actualizado');
    await loadAllData();
    await cargarRevisionOperadoras();
    revisionOpsActual = revisionOpsCache.find(r => r.usuario_id === revisionOpsActual.usuario_id) || revisionOpsActual;
    openRevisionOperadora(revisionOpsActual.usuario_id);
    renderRevisionOperadorasRows();
    renderRevisionOperadorasResumen();
    updateRevisionOperadorasBadge();
  }catch(e){
    showToast('❌ ' + e.message, 'error');
  }
}

function copyText(text){
  navigator.clipboard.writeText(text).then(function(){ showToast('📋 Copiado'); });
}

async function guardarRevisionOperadora(accion){
  if(!revisionOpsActual) return;
  if(accion === 'aprobar' && !revisionOpsActual.operadora_id){
    showToast('⚠️ No se puede aprobar: este pedido no tiene ficha de operadora vinculada','warn');
    return;
  }
  if(accion === 'pedir_contrato' && !revisionOpsActual.operadora_id){
    showToast('⚠️ No se puede pedir contrato: este pedido no tiene ficha de operadora vinculada','warn');
    return;
  }
  if(accion === 'pedir_faltantes'){
    const obs = gv('revisionObs').trim();
    await pedirFaltantesOperadora(revisionOpsActual.operadora_id, obs);
    return;
  }
  const labels = {
    aprobar:'aprobar este registro',
    observar:'guardar esta observación',
    rechazar:'rechazar este registro',
    pedir_documentos:'pedir documentos a esta operadora',
    pedir_contrato:'pedir firma de contrato a esta operadora',
    eliminar:'eliminar este pedido vacío'
  };
  if(!confirm('¿Confirmás ' + labels[accion] + '?')) return;
  const obs = gv('revisionObs').trim();
  try{
    await api('/api/auth/operadoras/revision/' + revisionOpsActual.usuario_id, {
      method:'POST',
      body:JSON.stringify({accion, obs})
    });
    showToast('✅ Revisión actualizada');
    closeModal('modalRevisionOperadora');
    await renderRevisionOperadoras();
    await loadAllData();
  }catch(e){
    showToast('❌ ' + e.message, 'error');
  }
}
