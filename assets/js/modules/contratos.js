/* ══════════════════════════════════
   CONTRATOS
══════════════════════════════════ */
let contratoFilter = {search:'', estado:''};

function getContratos(){
  return JSON.parse(localStorage.getItem('dm_contratos') || '[]');
}

function setContratos(contratos){
  localStorage.setItem('dm_contratos', JSON.stringify(contratos));
  _contratos = contratos;
  _ctrNextId = contratos.length ? Math.max(...contratos.map(c=>c.id||0)) + 1 : 1;
}

function badgeContrato(estado){
  const map = {
    activo: ['badge-green','Activo'],
    finalizado: ['badge-blue','Finalizado'],
    anulado: ['badge-red','Anulado'],
  };
  const cfg = map[estado] || ['badge-gray', estado || 'Sin estado'];
  return `<span class="badge ${cfg[0]}">${cfg[1]}</span>`;
}

function badgeFirmaContrato(c){
  if(c.firmado) return `<span class="badge badge-green">Firmado</span>${c.fechaFirma ? `<div style="font-size:11px;color:var(--text3);margin-top:3px">${fmtDate(c.fechaFirma)}</div>` : ''}`;
  return '<span class="badge badge-yellow">Pendiente firma</span>';
}

function renderContratos(){
  const tbody = document.getElementById('contratosTableBody');
  if(!tbody) return;
  const q = (contratoFilter.search || '').toLowerCase();
  const contratos = getContratos().filter(c=>{
    const op = getOp(c.operadoraId);
    const maq = getMaq(c.maquinaId);
    const hay = [
      c.id, c.nombre, c.ci, c.ciudad, c.maquina, c.serial,
      op && `${op.nombre} ${op.apellido || ''}`,
      maq && `${maq.codigo} ${maq.nombre}`
    ].filter(Boolean).join(' ').toLowerCase();
    return (!q || hay.includes(q)) && (!contratoFilter.estado || c.estado === contratoFilter.estado);
  }).sort((a,b)=>(b.id||0)-(a.id||0));

  updateContratosBadge();
  if(!contratos.length){
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">📋</div><h3>Sin contratos</h3><p>No hay contratos para mostrar. <button class="btn-add" onclick="openContratoModal()" style="margin-left:8px">+ Nuevo Contrato</button></p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = contratos.map(c=>{
    const op = getOp(c.operadoraId);
    const maq = getMaq(c.maquinaId);
    const nombre = c.nombre || (op ? `${op.nombre} ${op.apellido || ''}` : '—');
    const maquina = c.maquina || (maq ? `${maq.codigo} — ${maq.nombre}` : '—');
    const monto = formatMonto(c.monto || 0, c.moneda || 'UYU');
    const garantia = c.garantia ? formatMonto(c.garantia, c.moneda || 'UYU') : '—';
    return `<tr>
      <td><span style="font-family:monospace;color:var(--accent);font-size:11px">CTR-${String(c.id||0).padStart(3,'0')}</span></td>
      <td><span class="bold">${nombre}</span><div style="font-size:11px;color:var(--text3)">${c.ci || 'Sin CI/RUT'}</div></td>
      <td>${maquina}</td>
      <td>${fmtDate(c.fechaInicio)} → ${fmtDate(c.fechaFin)}</td>
      <td>${monto}</td>
      <td>${garantia}</td>
      <td>${badgeContrato(c.estado || 'activo')}<div style="margin-top:6px">${badgeFirmaContrato(c)}</div></td>
      <td>
        <button class="action-btn" onclick="previewContrato(${c.id})">👁 Ver/PDF</button>
        <button class="action-btn danger" onclick="deleteContrato(${c.id})">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function filterContratos(q){
  contratoFilter.search = q || '';
  renderContratos();
}

function filterContratoEstado(estado){
  contratoFilter.estado = estado || '';
  renderContratos();
}

function previewContrato(id){
  const c = getContratos().find(x=>x.id === parseInt(id));
  if(!c) return;
  openContratoModal(c.operadoraId);
  document.getElementById('ctrNombre').value = c.nombre || '';
  document.getElementById('ctrCI').value = c.ci || '';
  document.getElementById('ctrDomicilio').value = c.domicilio || '';
  document.getElementById('ctrCiudad').value = c.ciudad || '';
  document.getElementById('ctrMaquina').value = c.maquinaId || '';
  document.getElementById('ctrSerial').value = c.serial || '';
  document.getElementById('ctrFechaInicio').value = c.fechaInicio || '';
  document.getElementById('ctrFechaFin').value = c.fechaFin || '';
  document.getElementById('ctrMonto').value = c.monto || '';
  document.getElementById('ctrMoneda').value = c.moneda || 'UYU';
  document.getElementById('ctrFormaPago').value = c.formaPago || 'Transferencia bancaria';
  document.getElementById('ctrGarantia').value = c.garantia || '';
  document.getElementById('ctrFirmado').value = c.firmado ? 'firmado' : 'pendiente';
  document.getElementById('ctrFechaFirma').value = c.fechaFirma || '';
  if(typeof _ctrDocumentos !== 'undefined'){
    _ctrDocumentos = { frente: c.cedulaFrente || null, dorso: c.cedulaDorso || null };
    if(typeof updateContratoDocumentoInfo === 'function'){
      updateContratoDocumentoInfo('frente');
      updateContratoDocumentoInfo('dorso');
    }
  }
  document.getElementById('ctrObs').value = c.obs || '';
  calcDuracion();
  switchContratoTab('preview');
}

async function deleteContrato(id){
  if(!confirm('¿Eliminar este contrato del listado?')) return;
  try{
    await api('/api/contratos/'+parseInt(id), {method:'DELETE'});
  }catch(e){
    showToast('⚠️ No se pudo eliminar en servidor. Se quita de esta vista.');
  }
  const contratos = getContratos().filter(c=>c.id !== parseInt(id));
  setContratos(contratos);
  renderContratos();
  showToast('🗑 Contrato eliminado');
}

function updateContratosBadge(){
  const badge = document.getElementById('navBadgeContratos');
  if(!badge) return;
  const count = getContratos().filter(c=>(c.estado || 'activo') === 'activo').length;
  badge.textContent = count;
  badge.style.display = count ? 'inline-flex' : 'none';
}

updateContratosBadge();

/* WhatsApp pending queue cleanup controls */
(function(){
  if (window.__waPendingDeleteControls) return;
  window.__waPendingDeleteControls = true;

  function escapeWA(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }

  async function deleteWAQueue(url, okMessage){
    if (!confirm('Eliminar mensajes pendientes de WhatsApp?')) return;
    try {
      await api(url, { method: 'DELETE' });
      showToast(okMessage || 'Pendientes eliminados');
      if (typeof loadWAQueue === 'function') await loadWAQueue();
      if (typeof renderWA === 'function') renderWA();
    } catch (err) {
      showToast('No se pudo eliminar la cola: ' + (err.message || err));
    }
  }

  window.borrarPendientesWA = function(){
    return deleteWAQueue('/api/webhook/whatsapp/queue', 'Cola pendiente eliminada');
  };

  window.borrarColaServidorWA = function(id){
    return deleteWAQueue('/api/webhook/whatsapp/queue/' + encodeURIComponent(id), 'Pendiente eliminado');
  };

  function injectWAButtons(){
    var pendingRoot = document.querySelector('#waPendingList, .wa-pending-list, [data-wa-pending-list]');
    var queue = Array.isArray(window._waQueue) ? window._waQueue : (Array.isArray(window.waQueue) ? window.waQueue : []);
    var total = queue.length;
    var container = pendingRoot || document.querySelector('#whatsappView, #whatsappPanel, .whatsapp-panel, main');
    if (!container || document.getElementById('waPendingDeleteBar')) return;

    var bar = document.createElement('div');
    bar.id = 'waPendingDeleteBar';
    bar.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin:10px 0;';
    bar.innerHTML = '<button class="btn danger" onclick="borrarPendientesWA()">Borrar pendientes' + (total ? ' (' + total + ')' : '') + '</button>';
    container.insertBefore(bar, container.firstChild);

    queue.forEach(function(item){
      if (!item || !item.id) return;
      var text = item.telefono || item.numero || item.mensaje || '';
      var cards = Array.prototype.slice.call(document.querySelectorAll('.wa-card,.notification-card,.card,.queue-item'));
      var card = cards.find(function(el){ return el.textContent && el.textContent.indexOf(text) !== -1; });
      if (card && !card.querySelector('[data-wa-delete-id="' + item.id + '"]')) {
        var btn = document.createElement('button');
        btn.className = 'action-btn danger';
        btn.setAttribute('data-wa-delete-id', item.id);
        btn.onclick = function(){ borrarColaServidorWA(item.id); };
        btn.innerHTML = 'Borrar pendiente';
        card.appendChild(btn);
      }
    });
  }

  var originalRenderWA = window.renderWA;
  if (typeof originalRenderWA === 'function') {
    window.renderWA = function(){
      var result = originalRenderWA.apply(this, arguments);
      setTimeout(injectWAButtons, 0);
      return result;
    };
  }
  setTimeout(injectWAButtons, 500);
})();


/* DepiMovil CRM - boton QR para conectar celular */
(function () {
  if (window.__depimovilMobileQrTool) return;
  window.__depimovilMobileQrTool = true;

  var CRM_URL = window.location.origin || 'https://crm.depimovil.live';
  var QR_PAGE = CRM_URL + '/conectar-crm-celular.html';

  function cssText() {
    return [
      '#mobileQrFab{position:fixed;right:18px;bottom:18px;z-index:9998;min-height:44px;border:0;border-radius:8px;',
      'background:#0f766e;color:#fff;padding:0 14px;font-weight:800;box-shadow:0 12px 28px rgba(0,0,0,.22);cursor:pointer}',
      '#mobileQrFab:hover{filter:brightness(.96)}',
      '#mobileQrModal{position:fixed;inset:0;z-index:9999;display:none;place-items:center;background:rgba(15,23,42,.52);padding:16px}',
      '#mobileQrModal.open{display:grid}',
      '#mobileQrCard{width:min(430px,100%);background:#fff;color:#1f2933;border-radius:10px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.28)}',
      '#mobileQrCard h2{margin:0 0 8px;font-size:20px;letter-spacing:0}',
      '#mobileQrCard p{margin:0 0 12px;color:#64748b;line-height:1.45}',
      '#mobileQrBox{display:grid;place-items:center;border:1px solid #d8d1c3;border-radius:8px;background:#fff;padding:14px;margin:12px 0}',
      '#mobileQrBox img{width:min(100%,300px);height:auto;display:block}',
      '#mobileQrActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}',
      '#mobileQrActions a,#mobileQrActions button{min-height:42px;border:0;border-radius:7px;display:grid;place-items:center;text-align:center;',
      'text-decoration:none;font-weight:800;cursor:pointer;background:#e9e2d4;color:#1f2933}',
      '#mobileQrActions .primary{background:#0f766e;color:#fff}',
      '@media(max-width:520px){#mobileQrFab{right:10px;bottom:10px;padding:0 12px}#mobileQrActions{grid-template-columns:1fr}}'
    ].join('');
  }

  function qrImageUrl(value) {
    var params = new URLSearchParams({
      size: '720x720',
      margin: '16',
      format: 'png',
      data: value
    });
    return 'https://api.qrserver.com/v1/create-qr-code/?' + params.toString();
  }

  function ensureStyle() {
    if (document.getElementById('mobileQrStyle')) return;
    var style = document.createElement('style');
    style.id = 'mobileQrStyle';
    style.textContent = cssText();
    document.head.appendChild(style);
  }

  function ensureModal() {
    var modal = document.getElementById('mobileQrModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'mobileQrModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = [
      '<div id="mobileQrCard">',
      '<h2>Conectar celular al CRM</h2>',
      '<p>Escanea este codigo con la camara del telefono para abrir el CRM en el celular.</p>',
      '<div id="mobileQrBox"><img alt="Codigo QR para abrir el CRM" src="' + qrImageUrl(CRM_URL) + '"></div>',
      '<p style="font-size:13px">Enlace: <strong>' + CRM_URL + '</strong></p>',
      '<div id="mobileQrActions">',
      '<a class="primary" href="' + CRM_URL + '" target="_blank" rel="noopener">Abrir CRM</a>',
      '<a href="' + QR_PAGE + '" target="_blank" rel="noopener">Pantalla QR</a>',
      '<button type="button" id="mobileQrCopy">Copiar enlace</button>',
      '<button type="button" id="mobileQrClose">Cerrar</button>',
      '</div>',
      '</div>'
    ].join('');

    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    document.body.appendChild(modal);

    document.getElementById('mobileQrClose').addEventListener('click', closeModal);
    document.getElementById('mobileQrCopy').addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CRM_URL).then(function () {
          if (typeof showToast === 'function') showToast('Enlace del CRM copiado');
        });
      } else {
        window.prompt('Copia este enlace:', CRM_URL);
      }
    });

    return modal;
  }

  function openModal() {
    ensureStyle();
    ensureModal().classList.add('open');
  }

  function closeModal() {
    var modal = document.getElementById('mobileQrModal');
    if (modal) modal.classList.remove('open');
  }

  function ensureButton() {
    if (!document.body || document.getElementById('mobileQrFab')) return;
    ensureStyle();
    var button = document.createElement('button');
    button.id = 'mobileQrFab';
    button.type = 'button';
    button.textContent = 'Conectar celular';
    button.addEventListener('click', openModal);
    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton);
  } else {
    ensureButton();
  }

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeModal();
  });
})();

