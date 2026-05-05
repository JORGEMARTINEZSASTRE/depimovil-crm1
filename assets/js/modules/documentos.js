/* ══════════════════════════════════
   DOCUMENTOS
══════════════════════════════════ */
let documentosFilter = { search: '', estado: '' };
let documentosCache = [];

function filterDocumentos(v){
  documentosFilter.search = v || '';
  renderDocumentosRows();
}

function filterDocumentosEstado(v){
  documentosFilter.estado = v || '';
  renderDocumentosRows();
}

function docsBadge(ok, textOk, textNo){
  return ok ? `<span class="badge badge-green">${textOk}</span>` : `<span class="badge badge-red">${textNo}</span>`;
}

function docsPortalUrl(token){
  return token ? window.location.origin + '/portal.html?token=' + token : '';
}

function docsFileUrl(doc){
  if(!doc || !doc.archivo_url) return '';
  if(/^https?:\/\//.test(doc.archivo_url)) return doc.archivo_url;
  return window.location.origin + doc.archivo_url;
}

function docsFileLink(doc, label){
  const url = docsFileUrl(doc);
  return url ? `<a class="action-btn" href="${url}" target="_blank" rel="noopener">${label}</a>` : `<span class="badge badge-red">${label} pendiente</span>`;
}

function getReservasActivasOp(opId){
  return (DB.get('reservas') || []).filter(function(r){
    return r.operadoraId === opId && ['confirmada','activa','aprobada','solicitud_recibida','pendiente_aprobacion'].includes(r.estado);
  });
}

async function getDocsOperadora(op){
  try{
    const docs = await api('/api/portal/docs/' + op.id);
    return docs || [];
  }catch(e){
    return [];
  }
}

async function buildDocumentosCache(){
  const ops = (DB.get('operadoras') || []).filter(function(o){ return o.estado !== 'inactiva'; });
  const rows = await Promise.all(ops.map(async function(op){
    const docs = await getDocsOperadora(op);
    const cedulaFrente = docs.find(function(d){ return d.tipo === 'cedula'; });
    const cedulaDorso = docs.find(function(d){ return d.tipo === 'cedula_dorso'; });
    const contratosDocs = docs.filter(function(d){ return d.tipo === 'contrato'; });
    const reservas = getReservasActivasOp(op.id);
    const firmados = reservas.filter(function(r){
      return contratosDocs.some(function(ct){ return ct.maquina_id === r.maquinaId; });
    });
    return {
      op: op,
      docs: docs,
      cedulaFrente: cedulaFrente || null,
      cedulaDorso: cedulaDorso || null,
      reservas: reservas,
      contratosDocs: contratosDocs,
      contratosFirmados: firmados.length,
      contratosPendientes: Math.max(0, reservas.length - firmados.length)
    };
  }));
  documentosCache = rows;
}

async function renderDocumentos(){
  const tbody = document.getElementById('documentosTableBody');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5"><div class="loading-state">Cargando documentos...</div></td></tr>';
  await buildDocumentosCache();
  renderDocumentosResumen();
  renderDocumentosRows();
  updateDocumentosBadge();
}

function renderDocumentosResumen(){
  const el = document.getElementById('documentosResumen');
  if(!el) return;
  const total = documentosCache.length;
  const cedulaCompleta = documentosCache.filter(function(r){ return r.cedulaFrente && r.cedulaDorso; }).length;
  const cedulaPendiente = documentosCache.filter(function(r){ return !r.cedulaFrente || !r.cedulaDorso; }).length;
  const contratosPend = documentosCache.reduce(function(sum,r){ return sum + r.contratosPendientes; }, 0);
  el.innerHTML = `
    <div class="docs-summary-card"><div class="label">Operadoras</div><div class="value">${total}</div></div>
    <div class="docs-summary-card"><div class="label">Cédulas completas</div><div class="value">${cedulaCompleta}</div></div>
    <div class="docs-summary-card"><div class="label">Cédulas pendientes</div><div class="value">${cedulaPendiente}</div></div>
    <div class="docs-summary-card"><div class="label">Contratos pendientes</div><div class="value">${contratosPend}</div></div>`;
}

function renderDocumentosRows(){
  const tbody = document.getElementById('documentosTableBody');
  if(!tbody) return;
  const q = (documentosFilter.search || '').toLowerCase();
  const estado = documentosFilter.estado;
  const rows = documentosCache.filter(function(r){
    const op = r.op;
    const completo = !!(r.cedulaFrente && r.cedulaDorso) && r.contratosPendientes === 0;
    const hay = [op.nombre, op.apellido, op.gabinete, op.ciudad, op.departamento, op.email, op.whatsapp]
      .filter(Boolean).join(' ').toLowerCase();
    if(q && !hay.includes(q)) return false;
    if(estado === 'pendiente') return !r.cedulaFrente || !r.cedulaDorso || r.contratosPendientes > 0;
    if(estado === 'completo') return completo;
    if(estado === 'contrato_pendiente') return r.contratosPendientes > 0;
    return true;
  });
  if(!rows.length){
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">🪪</div><h3>Sin documentos para mostrar</h3><p>No hay operadoras que coincidan con el filtro.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(r){
    const op = r.op;
    const portal = docsPortalUrl(op.portalToken);
    return `<tr>
      <td>
        <span class="bold">${op.nombre} ${op.apellido || ''}</span>
        <div class="docs-line">${op.gabinete || 'Sin gabinete'} · ${op.ciudad || 'Sin ciudad'}</div>
      </td>
      <td>
        <div class="docs-doc-list">
          ${docsBadge(!!r.cedulaFrente, 'Frente', 'Frente pendiente')}
          ${docsBadge(!!r.cedulaDorso, 'Dorso', 'Dorso pendiente')}
        </div>
        <div class="docs-line">${r.cedulaFrente ? 'Subida ' + fmtDate(r.cedulaFrente.created_at) : 'Cédula incompleta'}</div>
      </td>
      <td>
        <span class="badge ${r.contratosPendientes ? 'badge-yellow' : 'badge-green'}">${r.contratosFirmados}/${r.reservas.length} firmados</span>
        <div class="docs-line">${r.reservas.length ? (r.contratosPendientes ? r.contratosPendientes + ' pendiente(s)' : 'Todo firmado') : 'Sin reservas activas'}</div>
      </td>
      <td>
        ${portal ? `<button class="action-btn" onclick="copyPortalLink('${op.portalToken}')">Copiar link</button>` : '<span class="badge badge-gray">Sin token</span>'}
      </td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="openDocumentosModal(${op.id})">Ver documentos</button>
        <button class="action-btn" onclick="showOpFicha(${op.id})">Ver ficha</button>
        ${portal ? `<a class="action-btn" href="${portal}" target="_blank" rel="noopener">Abrir portal</a>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function updateDocumentosBadge(){
  const badge = document.getElementById('navBadgeDocumentos');
  if(!badge) return;
  const pendientes = documentosCache.filter(function(r){
    return !r.cedulaFrente || !r.cedulaDorso || r.contratosPendientes > 0;
  }).length;
  badge.textContent = pendientes;
  badge.style.display = pendientes ? 'inline-flex' : 'none';
}

function openDocumentosModal(opId){
  const row = documentosCache.find(function(r){ return r.op.id === opId; });
  if(!row) return;
  const op = row.op;
  const portal = docsPortalUrl(op.portalToken);
  const body = document.getElementById('modalDocumentosBody');
  const contratosHTML = row.reservas.length ? row.reservas.map(function(r){
    const firmado = row.contratosDocs.find(function(ct){ return ct.maquina_id === r.maquinaId; });
    const maq = getMaq(r.maquinaId);
    return `<div class="docs-detail-row">
      <div>
        <div class="bold">${maq ? maq.nombre : 'Máquina #' + r.maquinaId}</div>
        <div class="docs-line">${r.codigo || 'Reserva'} · ${maq ? maq.codigo : ''}</div>
      </div>
      <div>${firmado ? `<span class="badge badge-green">Firmado</span><div class="docs-line">${fmtDate(firmado.firmado_en || firmado.created_at)}</div>` : '<span class="badge badge-yellow">Pendiente firma</span>'}</div>
    </div>`;
  }).join('') : '<div class="empty-state" style="padding:14px">Sin reservas activas con contrato.</div>';

  body.innerHTML = `
    <div class="docs-detail-head">
      <div>
        <h2>${op.nombre} ${op.apellido || ''}</h2>
        <p>${op.gabinete || 'Sin gabinete'} · ${op.ciudad || 'Sin ciudad'}, ${op.departamento || ''}</p>
      </div>
      <div class="docs-doc-list">
        ${portal ? `<button class="action-btn" onclick="copyPortalLink('${op.portalToken}')">Copiar portal</button>` : '<span class="badge badge-gray">Sin portal</span>'}
        ${portal ? `<a class="action-btn" href="${portal}" target="_blank" rel="noopener">Abrir portal</a>` : ''}
      </div>
    </div>
    <div class="docs-detail-grid">
      <div class="docs-detail-card">
        <div class="docs-detail-title">Cédula de identidad</div>
        <div class="docs-doc-list">
          ${docsFileLink(row.cedulaFrente, 'Ver frente')}
          ${docsFileLink(row.cedulaDorso, 'Ver dorso')}
        </div>
        <div class="docs-line">${row.cedulaFrente ? 'Frente subida ' + fmtDate(row.cedulaFrente.created_at) : 'Falta frente'} · ${row.cedulaDorso ? 'Dorso cargado' : 'Falta dorso'}</div>
      </div>
      <div class="docs-detail-card">
        <div class="docs-detail-title">Estado de contratos</div>
        <span class="badge ${row.contratosPendientes ? 'badge-yellow' : 'badge-green'}">${row.contratosFirmados}/${row.reservas.length} firmados</span>
        <div class="docs-line">${row.contratosPendientes ? row.contratosPendientes + ' contrato(s) pendiente(s)' : 'Sin pendientes de firma'}</div>
      </div>
    </div>
    <div class="docs-detail-card" style="margin-top:12px">
      <div class="docs-detail-title">Contratos por máquina</div>
      ${contratosHTML}
    </div>`;
  openModal('modalDocumentos');
}
