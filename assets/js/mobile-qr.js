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
