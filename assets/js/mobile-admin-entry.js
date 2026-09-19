/* DepiMovil CRM - entrada movil de administrador */
(function () {
  var params = new URLSearchParams(window.location.search || '');
  var wantsAdmin = params.get('mobile_admin') === '1' || params.get('login') === 'admin';

  // Antes esto se guardaba en localStorage y despues aparecia SIEMPRE en
  // ese navegador, sin manera de sacarlo desde la pantalla. Ahora solo
  // aparece si se pide en la URL, y se borra la preferencia vieja para
  // que a quien le quedo pegada se le arregle solo.
  try {
    localStorage.removeItem('depimovil_preferred_login');
  } catch (_) {}

  if (!wantsAdmin) return;

  function textOf(el) {
    return String((el && el.textContent) || '').toLowerCase();
  }

  function show(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute('hidden');
    el.style.display = '';
    el.style.visibility = 'visible';
    el.style.opacity = '1';
  }

  function hide(el) {
    if (!el || el.id === 'depimovilAdminEntry') return;
    el.style.display = 'none';
  }

  function closestBlock(el) {
    var node = el;
    while (node && node !== document.body) {
      var tag = String(node.tagName || '').toLowerCase();
      if (tag === 'form' || tag === 'section' || tag === 'article') return node;
      if (node.classList && (
        node.classList.contains('card') ||
        node.classList.contains('panel') ||
        node.classList.contains('login-card') ||
        node.classList.contains('auth-card') ||
        node.classList.contains('modal-body')
      )) return node;
      node = node.parentElement;
    }
    return el && el.parentElement;
  }

  function findLoginAction() {
    var controls = Array.prototype.slice.call(document.querySelectorAll('button,input[type="submit"],a'));
    return controls.find(function (el) {
      if (el.id === 'depimovilAdminSubmit') return false;
      if (el.closest && el.closest('#depimovilAdminEntry')) return false;
      if (el.disabled) return false;
      var txt = textOf(el);
      var id = String(el.id || '').toLowerCase();
      var onclick = String(el.getAttribute('onclick') || '').toLowerCase();
      var cls = String(el.className || '').toLowerCase();
      var visible = el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
      return (
        txt.indexOf('ingresar') !== -1 ||
        txt.indexOf('iniciar') !== -1 ||
        txt.indexOf('entrar') !== -1 ||
        id.indexOf('login') !== -1 ||
        onclick.indexOf('login') !== -1 ||
        cls.indexOf('login') !== -1
      ) && visible && txt.indexOf('codigo') === -1 && txt.indexOf('código') === -1;
    });
  }

  function hideWrongEntrances() {
    Array.prototype.slice.call(document.querySelectorAll('a,button')).forEach(function (el) {
      if (el.closest && el.closest('.sidebar-nav, .view, .topbar')) return;
      var txt = textOf(el);
      var href = String(el.getAttribute('href') || '').toLowerCase();
      var bad =
        txt.indexOf('pedir codigo') !== -1 ||
        txt.indexOf('pedir código') !== -1 ||
        txt.indexOf('codigo') !== -1 ||
        txt.indexOf('código') !== -1 ||
        txt.indexOf('dame de alta') !== -1 ||
        txt.indexOf('alta') !== -1 ||
        txt.indexOf('operadora') !== -1 ||
        href.indexOf('alta-operadoras') !== -1;
      if (bad) hide(el);
    });
  }

  function ensureAdminCard() {
    if (document.getElementById('depimovilAdminEntry')) return document.getElementById('depimovilAdminEntry');

    var card = document.createElement('section');
    card.id = 'depimovilAdminEntry';
    card.innerHTML = [
      '<style>',
      '#depimovilAdminEntry{display:grid;gap:12px;width:min(420px,calc(100% - 24px));margin:18px auto;padding:18px;',
      'border:1px solid rgba(15,118,110,.26);border-radius:10px;background:#fff;box-shadow:0 14px 34px rgba(15,23,42,.14);color:#1f2933}',
      '#depimovilAdminEntry h2{margin:0;font-size:22px;letter-spacing:0}',
      '#depimovilAdminEntry p{margin:0;color:#64748b;line-height:1.45}',
      '#depimovilAdminEntry label{font-size:13px;font-weight:800;color:#475569}',
      '#depimovilAdminEntry input{width:100%;min-height:46px;border:1px solid #d8d1c3;border-radius:7px;padding:0 11px;background:#fff;color:#1f2933}',
      '#depimovilAdminEntry button{min-height:46px;border:0;border-radius:7px;background:#0f766e;color:white;font-weight:900;cursor:pointer}',
      '#depimovilAdminEntry .field{display:grid;gap:6px}',
      '</style>',
      '<h2>Ingreso administrador</h2>',
      '<p>Entra con el mismo usuario y contraseña que usas en la computadora.</p>',
      '<div class="field" id="depimovilAdminEmailSlot"><label>Usuario o email</label></div>',
      '<div class="field" id="depimovilAdminPassSlot"><label>Contraseña</label></div>',
      '<button type="button" id="depimovilAdminSubmit">Ingresar como administrador</button>'
    ].join('');

    var loginRoot = document.querySelector('#loginScreen,#loginModal,.login,.auth,.login-container,.auth-container') || document.body;
    loginRoot.insertBefore(card, loginRoot.firstChild);
    return card;
  }

  function moveInput(input, slotId) {
    var slot = document.getElementById(slotId);
    if (!input || !slot || slot.contains(input)) return;
    show(input);
    input.style.display = 'block';
    input.style.width = '100%';
    slot.appendChild(input);
  }

  function submitAdminLogin() {
    var email = document.getElementById('loginEmail') || document.querySelector('input[type="email"],input[name="email"],input[name="usuario"]');
    var pass = document.getElementById('loginPass') || document.querySelector('input[type="password"]');

    [email, pass].forEach(function (input) {
      if (!input) return;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    if (typeof window.doLogin === 'function') {
      window.doLogin();
      return;
    }

    if (typeof doLogin === 'function') {
      doLogin();
      return;
    }

    var form = (email && email.form) || (pass && pass.form);
    if (form) {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        return;
      }
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return;
    }

    var action = findLoginAction();
    if (action) {
      action.click();
      return;
    }

    if (pass) {
      var event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      pass.dispatchEvent(event);
    }
  }

  function preferAdminLogin() {
    var role = document.getElementById('waLoginRol');
    if (role) role.value = 'admin';

    var email = document.getElementById('loginEmail') || document.querySelector('input[type="email"],input[name="email"],input[name="usuario"]');
    var pass = document.getElementById('loginPass') || document.querySelector('input[type="password"]');

    if (email) {
      email.placeholder = 'usuario administrador';
      email.autocomplete = 'username';
      show(closestBlock(email));
      show(email);
    }

    if (pass) {
      pass.autocomplete = 'current-password';
      show(closestBlock(pass));
      show(pass);
    }

    hideWrongEntrances();
    ensureAdminCard();
    moveInput(email, 'depimovilAdminEmailSlot');
    moveInput(pass, 'depimovilAdminPassSlot');

    var submit = document.getElementById('depimovilAdminSubmit');
    if (submit && !submit.__depimovilBound) {
      submit.__depimovilBound = true;
      submit.addEventListener('click', submitAdminLogin);
    }

    if (email && document.activeElement === document.body) {
      try { email.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preferAdminLogin);
  } else {
    preferAdminLogin();
  }

  var tries = 0;
  var timer = setInterval(function () {
    preferAdminLogin();
    tries += 1;
    if (tries > 40) clearInterval(timer);
  }, 250);
})();
