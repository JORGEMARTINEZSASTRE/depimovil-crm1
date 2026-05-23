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
    observada:'badge-purple',
    aprobada:'badge-green',
    rechazada:'badge-red',
    no_requiere:'badge-gray'
  };
  const label = {
    pendiente:'Pendiente',
    documentos_solicitados:'Documentos solicitados',
    observada:'Observada',
    aprobada:'Aprobada',
    rechazada:'Rechazada',
    no_requiere:'Sin revisión'
  };
  return `<span class="badge ${cls[estado] || 'badge-gray'}">${label[estado] || estado || '—'}</span>`;
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
      return ['pendiente','documentos_solicitados','observada'].includes(r.revision_admin_estado);
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
  const obs = revisionOpsCache.filter(r => r.revision_admin_estado === 'observada').length;
  const aprobadas = revisionOpsCache.filter(r => r.revision_admin_estado === 'aprobada').length;
  el.innerHTML = `
    <div class="docs-summary-card"><div class="label">Pendientes</div><div class="value">${pendientes}</div></div>
    <div class="docs-summary-card"><div class="label">Docs pedidos</div><div class="value">${docs}</div></div>
    <div class="docs-summary-card"><div class="label">Observadas</div><div class="value">${obs}</div></div>
    <div class="docs-summary-card"><div class="label">Aprobadas</div><div class="value">${aprobadas}</div></div>`;
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
    <div class="docs-detail-card" style="margin-top:12px">
      <div class="docs-detail-title">Observación para guardar o enviar</div>
      <textarea id="revisionObs" placeholder="Ej: subir cédula frente y dorso, aclarar dirección, corregir datos..." style="width:100%;min-height:90px">${revEsc(row.revision_admin_obs || '')}</textarea>
    </div>`;
  openModal('modalRevisionOperadora');
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
  const labels = {
    aprobar:'aprobar este registro',
    observar:'guardar esta observación',
    rechazar:'rechazar este registro',
    pedir_documentos:'pedir documentos a esta operadora',
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
