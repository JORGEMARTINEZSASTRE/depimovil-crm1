// ============================================================
// MÓDULO: TRANSPORTISTAS — DepiMóvil CRM
// ============================================================

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = localStorage.getItem('dm_jwt');
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

// ─────────────────────────────────────────────
// CONSTANTES Y ESTADO
// ─────────────────────────────────────────────
const API = location.protocol === 'file:' ? 'https://crm.depimovil.live/api' : '/api';
const DEPTOS = [
  'Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores',
  'Florida','Lavalleja','Maldonado','Montevideo','Paysandú','Río Negro',
  'Rivera','Rocha','Salto','San José','Soriano','Tacuarembó','Treinta y Tres'
];

let transportistaActual = null;

// ─────────────────────────────────────────────
// INICIALIZACIÓN DEL MÓDULO
// ─────────────────────────────────────────────
function initTransportistas() {
  renderListaTransportistas();
}

// ─────────────────────────────────────────────
// 1. LISTA DE TRANSPORTISTAS
// ─────────────────────────────────────────────
async function renderListaTransportistas() {
  const contenedor = document.getElementById('modulo-transportistas');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="modulo-header">
      <div>
        <h2>Transportistas</h2>
        <p class="modulo-sub" id="trans-count">Cargando…</p>
      </div>
      <button class="btn-primary" onclick="abrirFormNuevoTransportista()">+ Nuevo</button>
    </div>
    <div id="lista-transportistas">
      <div class="loading-state">Cargando transportistas…</div>
    </div>
  `;

  try {
    const res = await fetch(`${API}/transportistas`, { headers: apiHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    document.getElementById('trans-count').textContent = `${data.length} activos`;
    document.getElementById('lista-transportistas').innerHTML = data.length
      ? data.map(t => cardTransportista(t)).join('')
      : '<div class="empty-state">No hay transportistas cargados</div>';
  } catch (e) {
    document.getElementById('lista-transportistas').innerHTML =
      '<div class="error-state">Error al cargar transportistas</div>';
  }
}

function cardTransportista(t) {
  const iniciales = t.nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  const esEmpresa = t.tipo === 'empresa';
  const deps = (t.departamentos || []).slice(0,4).map(d =>
    `<span class="dep-pill">${d}</span>`).join('') +
    (t.departamentos?.length > 4 ? `<span class="dep-pill">+${t.departamentos.length - 4}</span>` : '');

  return `
    <div class="trans-card" onclick="abrirFichaTransportista(${t.id})">
      <div class="trans-avatar ${esEmpresa ? 'av-empresa' : 'av-persona'}">${iniciales}</div>
      <div class="trans-info">
        <div class="trans-name-row">
          <span class="trans-nombre">${t.nombre}</span>
          <span class="badge ${esEmpresa ? 'badge-empresa' : 'badge-persona'}">${esEmpresa ? 'Empresa' : 'Persona física'}</span>
          <span class="badge badge-activo">Activo</span>
        </div>
        <div class="trans-meta">Ciclo ${t.ciclo_pago} · $${t.tarifa_envio_chica} chica · $${t.tarifa_envio_grande} grande</div>
        <div class="trans-deps">${deps}</div>
      </div>
      <div class="trans-arrow">›</div>
    </div>`;
}

// ─────────────────────────────────────────────
// 2. FICHA DEL TRANSPORTISTA
// ─────────────────────────────────────────────
async function abrirFichaTransportista(id) {
  const contenedor = document.getElementById('modulo-transportistas');
  contenedor.innerHTML = `<div class="loading-state">Cargando ficha…</div>`;

  try {
    const [tRes, enviosRes, incidentesRes, pagosRes] = await Promise.all([
      fetch(`${API}/transportistas/${id}`, { headers: apiHeaders() }),
      fetch(`${API}/transportistas/${id}/envios`, { headers: apiHeaders() }),
      fetch(`${API}/transportistas/${id}/incidentes`, { headers: apiHeaders() }),
      fetch(`${API}/transportistas/${id}/pagos`, { headers: apiHeaders() }),
    ]);
    const t       = await tRes.json();
    const envios  = await enviosRes.json();
    const incs    = await incidentesRes.json();
    const pagos   = await pagosRes.json();

    transportistaActual = t;
    contenedor.innerHTML = htmlFicha(t, envios, incs, pagos);
  } catch (e) {
    contenedor.innerHTML = `<div class="error-state">Error al cargar la ficha. <a onclick="renderListaTransportistas()">Volver</a></div>`;
  }
}

function htmlFicha(t, envios, incs, pagos) {
  const iniciales = t.nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  const esEmpresa = t.tipo === 'empresa';
  const totalEnvios = envios.length;
  const entregados  = envios.filter(e => e.fecha_entrega && e.fecha_salida);
  const promDias    = entregados.length
    ? (entregados.reduce((s,e) => s + e.tiempo_entrega_dias, 0) / entregados.length).toFixed(1)
    : '—';

  return `
    <div class="ficha-header">
      <button class="btn-back" onclick="renderListaTransportistas()">← Volver</button>
      <div class="ficha-actions">
        <button class="btn-sec" onclick="abrirWhatsAppTransportista(${t.id})">WhatsApp</button>
        <button class="btn-sec" onclick="abrirFormEditarTransportista(${t.id})">Editar</button>
        <button class="btn-primary" onclick="abrirFormNuevoEnvio(${t.id})">+ Nuevo envío</button>
      </div>
    </div>

    <!-- ENCABEZADO -->
    <div class="ficha-card">
      <div class="ficha-ident">
        <div class="trans-avatar lg ${esEmpresa ? 'av-empresa' : 'av-persona'}">${iniciales}</div>
        <div>
          <div class="ficha-nombre">${t.nombre}
            <span class="badge ${esEmpresa ? 'badge-empresa' : 'badge-persona'}">${esEmpresa ? 'Empresa' : 'Persona física'}</span>
            <span class="badge badge-activo">Activo</span>
          </div>
          <div class="ficha-sub">Ciclo de pago: ${t.ciclo_pago}</div>
        </div>
      </div>
      <div class="ficha-rows">
        <div class="ficha-row"><span class="fr-label">WhatsApp</span><span class="fr-val">${t.whatsapp || '—'}</span></div>
        <div class="ficha-row"><span class="fr-label">Dirección</span><span class="fr-val">${t.direccion || '—'}</span></div>
        <div class="ficha-row"><span class="fr-label">Departamentos</span>
          <span class="fr-val">${(t.departamentos || []).map(d => `<span class="dep-pill">${d}</span>`).join('') || '—'}</span>
        </div>
        ${t.notas ? `<div class="ficha-row"><span class="fr-label">Notas</span><span class="fr-val muted">${t.notas}</span></div>` : ''}
      </div>
    </div>

    <!-- TARIFAS -->
    <div class="ficha-card">
      <div class="section-label">Tarifas</div>
      <div class="tarifa-grid">
        <div class="tarifa-item"><div class="t-lbl">Envío chica</div><div class="t-val">$${t.tarifa_envio_chica}</div></div>
        <div class="tarifa-item"><div class="t-lbl">Envío grande</div><div class="t-val">$${t.tarifa_envio_grande}</div></div>
        <div class="tarifa-item"><div class="t-lbl">Puesta a punto máquina chica</div><div class="t-val">$${t.tarifa_limpieza_chica || 0}</div></div>
        <div class="tarifa-item"><div class="t-lbl">Puesta a punto máquina grande</div><div class="t-val">$${t.tarifa_limpieza_grande || 0}</div></div>
      </div>
    </div>

    <!-- RENDIMIENTO -->
    <div class="ficha-card">
      <div class="section-label">Rendimiento</div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-num">${totalEnvios}</div><div class="stat-lbl">Envíos totales</div></div>
        <div class="stat-box"><div class="stat-num">${promDias}</div><div class="stat-lbl">Días promedio</div></div>
        <div class="stat-box"><div class="stat-num ${incs.length > 0 ? 'num-danger' : ''}">${incs.length}</div><div class="stat-lbl">Incidentes</div></div>
      </div>
    </div>

    <!-- HISTORIAL DE ENVÍOS -->
    <div class="ficha-card">
      <div class="section-label">Historial de envíos</div>
      ${envios.length ? envios.slice(0,5).map(e => htmlEnvioRow(e)).join('') : '<div class="empty-state">Sin envíos registrados</div>'}
      ${envios.length > 5 ? `<button class="btn-link" onclick="verTodosEnvios(${t.id})">Ver todos (${envios.length}) →</button>` : ''}
    </div>

    <!-- INCIDENTES -->
    <div class="ficha-card">
      <div class="section-label-row">
        <div class="section-label">Incidentes</div>
        <button class="btn-link" onclick="abrirFormNuevoIncidente(${t.id})">+ Registrar</button>
      </div>
      ${incs.length ? incs.map(i => `
        <div class="incidente-row">
          <span class="inc-fecha">${formatFecha(i.fecha)}</span>
          <span class="inc-desc">${i.descripcion}</span>
          ${i.resuelto ? '<span class="badge-resuelto">Resuelto</span>' : '<span class="badge-pendiente">Pendiente</span>'}
        </div>`).join('') : '<div class="empty-state">Sin incidentes registrados</div>'}
    </div>

    <!-- HONORARIOS -->
    <div class="ficha-card">
      <div class="section-label-row">
        <div class="section-label">Honorarios</div>
        <button class="btn-link" onclick="abrirFormLiquidacion(${t.id})">+ Nueva liquidación</button>
      </div>
      ${pagos.length ? pagos.slice(0,3).map(p => htmlPagoRow(p)).join('') : '<div class="empty-state">Sin liquidaciones registradas</div>'}
    </div>
  `;
}

function htmlEnvioRow(e) {
  const dot = e.estado === 'entregado' ? 'dot-verde' : e.estado === 'en_transito' ? 'dot-azul' : 'dot-rojo';
  const rastreo = e.tiene_rastreo && e.numero_rastreo
    ? `<span class="rastreo-badge">${e.numero_rastreo}</span>`
    : '<span class="rastreo-sin">Sin rastreo</span>';
  const notif = e.rastreo_notificado
    ? '<span class="notif-ok">Notificada ✓</span>'
    : `<button class="btn-notif" onclick="abrirPanelRastreo(${e.id})">Notificar</button>`;

  return `
    <div class="envio-row">
      <div class="envio-dot ${dot}"></div>
      <div class="envio-info">
        <div class="envio-header">
          <span class="envio-maquina">${e.maquina_nombre || 'Máquina'} · ${e.tipo_envio}</span>
          <span class="envio-fecha">${formatFecha(e.fecha_salida)}</span>
        </div>
        <div class="envio-detalle">
          ${e.departamento_destino || ''} · ${e.tipo_maquina} · $${e.costo_total}
          ${e.incluye_limpieza ? '+ puesta a punto de la máquina' : ''}
          &nbsp;${rastreo}&nbsp;${notif}
        </div>
      </div>
    </div>`;
}

function htmlPagoRow(p) {
  const badge = p.estado === 'pagado'
    ? `<span class="badge-pagado">Pagado ${formatFecha(p.fecha_pago)}</span>`
    : '<span class="badge-pendiente">Pendiente</span>';
  return `
    <div class="pago-row">
      <div class="pago-periodo">${formatFecha(p.periodo_desde)} — ${formatFecha(p.periodo_hasta)}
        <span class="pago-meta">${p.total_envios} envíos · ${p.total_limpiezas} puestas a punto</span>
      </div>
      <div class="pago-right">
        <span class="pago-monto">$${p.monto_total}</span>
        ${badge}
        ${p.estado === 'pendiente' ? `<button class="btn-link" onclick="marcarPagado(${p.id})">Marcar pagado</button>` : ''}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// 3. PANEL DE RASTREO CON CLAUDE VISION
// ─────────────────────────────────────────────
function abrirPanelRastreo(envioId) {
  const modal = document.createElement('div');
  modal.id = 'modal-rastreo';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Número de rastreo</span>
        <button onclick="cerrarModalRastreo()" class="btn-close">✕</button>
      </div>

      <div id="rastreo-phase-scan">
        <div class="scan-zone" id="scan-zone-modal" onclick="document.getElementById('scan-file-input').click()">
          <div class="scan-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="4" height="4" rx="1"/>
              <rect x="19" y="19" width="2" height="2" rx="0.5"/>
            </svg>
          </div>
          <div class="scan-text">Fotografiá el recibo</div>
          <div class="scan-sub">Claude detecta el número automáticamente</div>
        </div>
        <input type="file" id="scan-file-input" accept="image/*" capture="environment"
               style="display:none" onchange="procesarRecibo(this, ${envioId})">

        <div class="divider-or"><div class="div-line"></div><span>o ingresalo a mano</span><div class="div-line"></div></div>
        <label class="field-label">Número de rastreo</label>
        <input type="text" id="rastreo-manual" placeholder="Ej: 9234 8712 3456 78"
               oninput="actualizarPreviewRastreo()" class="input-mono">

        <label class="field-label" style="margin-top:12px">Mensaje adicional para la operadora</label>
        <textarea id="rastreo-msg" placeholder="Ej: Tu máquina salió hoy, llega en 2-3 días hábiles."
                  oninput="actualizarPreviewRastreo()"></textarea>
      </div>

      <div id="rastreo-phase-loading" style="display:none">
        <img id="rastreo-img-preview" class="recibo-preview" src="" alt="Recibo">
        <div class="scanning-state">
          <div class="spinner-sm"></div> Claude está leyendo el recibo…
        </div>
      </div>

      <div id="rastreo-phase-result" style="display:none">
        <img id="rastreo-img-preview-2" class="recibo-preview" src="" alt="Recibo">
        <div id="rastreo-result-box"></div>
        <button class="btn-link" onclick="resetearRastreo()">Volver a escanear</button>
      </div>

      <div id="preview-wpp" style="display:none;margin-top:14px">
        <div class="field-label">Vista previa WhatsApp</div>
        <div class="preview-bubble" id="wpp-preview-text"></div>
        <button class="btn-primary full-width" style="margin-top:10px"
                onclick="enviarRastreo(${envioId})">
          Enviar por WhatsApp ↗
        </button>
        <button class="btn-sec full-width" style="margin-top:8px"
                onclick="guardarRastreoSinEnviar(${envioId})">
          Guardar sin enviar
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  actualizarPreviewRastreo();
}

async function procesarRecibo(input, envioId) {
  if (!input.files[0]) return;
  const file = input.files[0];
  const url = URL.createObjectURL(file);
  document.getElementById('rastreo-img-preview').src = url;
  document.getElementById('rastreo-img-preview-2').src = url;
  document.getElementById('rastreo-phase-scan').style.display = 'none';
  document.getElementById('rastreo-phase-loading').style.display = 'block';

  const b64 = await fileToBase64(file);
  const numero = await detectarNumeroRastreo(b64, file.type);

  document.getElementById('rastreo-phase-loading').style.display = 'none';
  document.getElementById('rastreo-phase-result').style.display = 'block';

  const resultBox = document.getElementById('rastreo-result-box');
  if (numero) {
    window._rastreoDetectado = numero;
    resultBox.innerHTML = `
      <div class="detected-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <div>
          <div class="det-lbl">Número detectado</div>
          <div class="det-num">${numero}</div>
        </div>
      </div>`;
    document.getElementById('rastreo-manual').value = numero;
    document.getElementById('preview-wpp').style.display = 'block';
    actualizarPreviewRastreo();
  } else {
    resultBox.innerHTML = `
      <div class="error-box">No se detectó el número. Ingresalo a mano:</div>
      <input type="text" id="rastreo-manual-post" class="input-mono" style="margin-top:8px;width:100%"
             placeholder="Ej: 9234 8712 3456 78" oninput="manualPostInput(this.value)">`;
  }
}

function manualPostInput(v) {
  window._rastreoDetectado = v;
  if (v.length > 3) {
    document.getElementById('preview-wpp').style.display = 'block';
    actualizarPreviewRastreo();
  }
}

async function detectarNumeroRastreo(b64, mimeType) {
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: 'Sos un asistente de logística. Extraé el número de rastreo de un recibo de transporte uruguayo (OCA, Correo, DAC, Turismar, JT, Agencia Central u otro). Respondé SOLO con el número, sin texto extra. Si no encontrás uno claro, respondé: NO_ENCONTRADO',
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: b64 } },
            { type: 'text', text: 'Extraé el número de rastreo.' }
          ]
        }]
      })
    });
    const data = await resp.json();
    const txt = data.content?.[0]?.text?.trim() || 'NO_ENCONTRADO';
    return txt === 'NO_ENCONTRADO' ? null : txt;
  } catch { return null; }
}

function actualizarPreviewRastreo() {
  const num = window._rastreoDetectado
    || document.getElementById('rastreo-manual')?.value?.trim()
    || '';
  const msg = document.getElementById('rastreo-msg')?.value?.trim() || '';
  const operadoraNombre = transportistaActual?.operadora_nombre || 'Hola';

  if (!num && !msg) return;
  document.getElementById('preview-wpp').style.display = 'block';

  let texto = `Hola! 👋\nTu máquina ya está en camino.\n\n`;
  if (num) texto += `📦 Rastreo: *${num}*\n\n`;
  if (msg) texto += `${msg}\n\n`;
  texto += `_DepiMóvil_`;

  document.getElementById('wpp-preview-text').innerHTML =
    texto.replace(/\n/g,'<br>').replace(/\*(.*?)\*/g,'<strong>$1</strong>').replace(/_(.*?)_/g,'<em>$1</em>');
}

async function enviarRastreo(envioId) {
  const num = window._rastreoDetectado
    || document.getElementById('rastreo-manual')?.value?.trim() || '';
  const msg = document.getElementById('rastreo-msg')?.value?.trim() || '';

  try {
    await fetch(`${API}/envios/${envioId}/rastreo`, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({
        numero_rastreo: num,
        rastreo_notificado: true,
        fecha_notificacion: new Date().toISOString(),
        mensaje_operadora: msg
      })
    });
    cerrarModalRastreo();
    mostrarToast('Rastreo guardado y operadora notificada ✓');
    abrirFichaTransportista(transportistaActual?.id);
  } catch {
    mostrarToast('Error al guardar. Intentá de nuevo.', 'error');
  }
}

async function guardarRastreoSinEnviar(envioId) {
  const num = window._rastreoDetectado
    || document.getElementById('rastreo-manual')?.value?.trim() || '';
  await fetch(`${API}/envios/${envioId}/rastreo`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ numero_rastreo: num, rastreo_notificado: false })
  });
  cerrarModalRastreo();
  mostrarToast('Número de rastreo guardado');
}

function resetearRastreo() {
  window._rastreoDetectado = null;
  document.getElementById('rastreo-phase-result').style.display = 'none';
  document.getElementById('rastreo-phase-loading').style.display = 'none';
  document.getElementById('rastreo-phase-scan').style.display = 'block';
  document.getElementById('scan-file-input').value = '';
  document.getElementById('preview-wpp').style.display = 'none';
}

function cerrarModalRastreo() {
  document.getElementById('modal-rastreo')?.remove();
  window._rastreoDetectado = null;
}

// ─────────────────────────────────────────────
// 4. FORMULARIOS CRUD
// ─────────────────────────────────────────────
function abrirFormNuevoTransportista() {
  abrirFormTransportista(null);
}

async function abrirFormEditarTransportista(id) {
  const res = await fetch(`${API}/transportistas/${id}`, { headers: apiHeaders() });
  const t = await res.json();
  abrirFormTransportista(t);
}

function abrirFormTransportista(t) {
  const esEdicion = !!t;
  const deps = t?.departamentos || [];
  const modal = document.createElement('div');
  modal.id = 'modal-form-transportista';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:760px">
      <div class="modal-header">
        <span class="modal-title">${esEdicion ? 'Editar' : 'Nuevo'} transportista</span>
        <button onclick="document.getElementById('modal-form-transportista').remove()" class="btn-close">✕</button>
      </div>
      <form onsubmit="guardarTransportista(event, ${t?.id || 'null'})">
        <div class="ficha-card" style="margin-bottom:14px">
          <div class="section-label">Datos principales</div>
          <div class="form-grid">
            <div>
              <label class="field-label">Tipo *</label>
              <select id="f-tipo" required>
                <option value="empresa" ${t?.tipo==='empresa'?'selected':''}>Empresa</option>
                <option value="persona_fisica" ${t?.tipo==='persona_fisica'?'selected':''}>Persona física</option>
              </select>
            </div>
            <div>
              <label class="field-label">Nombre *</label>
              <input type="text" id="f-nombre" required value="${t?.nombre||''}" placeholder="Ej: DAC, El Norteño, Sintia">
            </div>
          </div>
        </div>

        <div class="ficha-card" style="margin-bottom:14px">
          <div class="section-label">Contacto y ubicación</div>
          <div class="form-grid">
            <div>
              <label class="field-label">WhatsApp</label>
              <input type="text" id="f-whatsapp" value="${t?.whatsapp||''}" placeholder="09X XXX XXX">
            </div>
            <div>
              <label class="field-label">Ciclo de pago</label>
              <select id="f-ciclo">
                <option value="mensual" ${t?.ciclo_pago==='mensual'?'selected':''}>Mensual</option>
                <option value="semanal" ${t?.ciclo_pago==='semanal'?'selected':''}>Semanal</option>
              </select>
            </div>
          </div>
          <label class="field-label" style="margin-top:12px">Dirección</label>
          <textarea id="f-direccion" style="min-height:96px" placeholder="Dirección completa, ciudad, referencia de retiro/entrega">${t?.direccion||''}</textarea>
        </div>

        <div class="ficha-card" style="margin-bottom:14px">
          <div class="section-label">Cobertura</div>
          <div class="deps-grid" id="deps-grid">
            ${DEPTOS.map(d => `
              <label class="dep-check">
                <input type="checkbox" value="${d}" ${deps.includes(d)?'checked':''}>
                ${d}
              </label>`).join('')}
          </div>
        </div>

        <div class="ficha-card" style="margin-bottom:14px">
          <div class="section-label">Tarifas</div>
          <div class="tarifa-grid">
            <div>
              <label class="field-label">Envío chica ($)</label>
              <input type="number" id="f-env-chica" value="${t?.tarifa_envio_chica||0}" min="0">
            </div>
            <div>
              <label class="field-label">Envío grande ($)</label>
              <input type="number" id="f-env-grande" value="${t?.tarifa_envio_grande||0}" min="0">
            </div>
            <div>
              <label class="field-label">Puesta a punto máquina chica ($)</label>
              <input type="number" id="f-limp-chica" value="${t?.tarifa_limpieza_chica||0}" min="0">
            </div>
            <div>
              <label class="field-label">Puesta a punto máquina grande ($)</label>
              <input type="number" id="f-limp-grande" value="${t?.tarifa_limpieza_grande||0}" min="0">
            </div>
          </div>
          <label class="dep-check" style="margin-top:12px">
            <input type="checkbox" id="f-sin-rastreo" ${t?.sin_rastreo_siempre?'checked':''}>
            Este transportista nunca provee número de rastreo
          </label>
        </div>

        <div class="ficha-card" style="margin-bottom:14px">
          <div class="section-label">Notas internas</div>
          <textarea id="f-notas" placeholder="Observaciones generales">${t?.notas||''}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:16px">
          <button type="submit" class="btn-primary" style="flex:1">
            ${esEdicion ? 'Guardar cambios' : 'Crear transportista'}
          </button>
          ${esEdicion ? `<button type="button" class="btn-danger"
            onclick="confirmarEliminarTransportista(${t.id})">Eliminar</button>` : ''}
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
}

async function guardarTransportista(e, id) {
  e.preventDefault();
  const deps = [...document.querySelectorAll('#deps-grid input:checked')].map(el => el.value);
  const body = {
    tipo:                   document.getElementById('f-tipo').value,
    nombre:                 document.getElementById('f-nombre').value.trim(),
    telefono:               '',
    whatsapp:               document.getElementById('f-whatsapp').value.trim(),
    direccion:              document.getElementById('f-direccion').value.trim(),
    ciclo_pago:             document.getElementById('f-ciclo').value,
    departamentos:          deps,
    tarifa_envio_chica:     parseFloat(document.getElementById('f-env-chica').value)||0,
    tarifa_envio_grande:    parseFloat(document.getElementById('f-env-grande').value)||0,
    tarifa_limpieza_chica:  parseFloat(document.getElementById('f-limp-chica').value)||0,
    tarifa_limpieza_grande: parseFloat(document.getElementById('f-limp-grande').value)||0,
    sin_rastreo_siempre:    document.getElementById('f-sin-rastreo').checked,
    notas:                  document.getElementById('f-notas').value.trim(),
  };

  const url    = id ? `${API}/transportistas/${id}` : `${API}/transportistas`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: apiHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const txt = await res.text().catch(()=>'');
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    document.getElementById('modal-form-transportista').remove();
    mostrarToast(id ? 'Transportista actualizado ✓' : 'Transportista creado ✓');
    renderListaTransportistas();
  } catch(err) {
    console.error('Error guardarTransportista:', err);
    mostrarToast('Error al guardar', 'error');
  }
}

// ─────────────────────────────────────────────
// 5. NUEVO ENVÍO
// ─────────────────────────────────────────────
async function abrirFormNuevoEnvio(transportistaId) {
  const resM = await fetch(`${API}/maquinas`, { headers: apiHeaders() });
  const resR = await fetch(`${API}/reservas?estado=activa`, { headers: apiHeaders() });
  const maquinas = await resM.json();
  const reservas = await resR.json();
  const t = transportistaActual;

  const modal = document.createElement('div');
  modal.id = 'modal-form-envio';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Nuevo envío — ${t?.nombre}</span>
        <button onclick="document.getElementById('modal-form-envio').remove()" class="btn-close">✕</button>
      </div>
      <form onsubmit="guardarEnvio(event, ${transportistaId})">
        <label class="field-label">Reserva vinculada</label>
        <select id="env-reserva" onchange="autocompletarEnvio(this.value)">
          <option value="">— Sin reserva —</option>
          ${reservas.map(r => `<option value="${r.id}">#${r.id} · ${r.operadora_nombre} · ${r.maquina_nombre}</option>`).join('')}
        </select>

        <label class="field-label">Máquina</label>
        <select id="env-maquina" required>
          <option value="">Seleccioná</option>
          ${maquinas.map(m => `<option value="${m.id}" data-tipo="${m.tipo}">${m.nombre}</option>`).join('')}
        </select>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="field-label">Tipo de envío</label>
            <select id="env-tipo">
              <option value="ida">Ida</option>
              <option value="vuelta">Vuelta</option>
            </select>
          </div>
          <div>
            <label class="field-label">Tamaño máquina</label>
            <select id="env-tamano" onchange="actualizarCostosEnvio()">
              <option value="chica">Chica</option>
              <option value="grande">Grande</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="field-label">Fecha de salida</label>
            <input type="date" id="env-salida" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div>
            <label class="field-label">Departamento destino</label>
            <select id="env-depto">
              ${DEPTOS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
        </div>

        <label class="dep-check" style="margin-top:10px">
          <input type="checkbox" id="env-limpieza" onchange="actualizarCostosEnvio()">
          Incluye puesta a punto de la máquina
        </label>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
          <div>
            <label class="field-label">Costo envío ($)</label>
            <input type="number" id="env-costo" value="${t?.tarifa_envio_chica||0}" min="0">
          </div>
          <div>
            <label class="field-label">Costo puesta a punto ($)</label>
            <input type="number" id="env-costo-limp" value="0" min="0" disabled>
          </div>
        </div>

        <div id="env-total-row" style="text-align:right;font-size:13px;margin-top:6px;color:var(--text2)">
          Total: <strong id="env-total">$${t?.tarifa_envio_chica||0}</strong>
        </div>

        <label class="field-label">Observación</label>
        <textarea id="env-obs" placeholder="Notas adicionales del envío"></textarea>

        <button type="submit" class="btn-primary full-width" style="margin-top:16px">Crear envío</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
}

function actualizarCostosEnvio() {
  const t = transportistaActual;
  if (!t) return;
  const tamano = document.getElementById('env-tamano').value;
  const limpieza = document.getElementById('env-limpieza').checked;
  const costoEnv = tamano === 'chica' ? t.tarifa_envio_chica : t.tarifa_envio_grande;
  const costoLimp = limpieza ? (tamano === 'chica' ? t.tarifa_limpieza_chica : t.tarifa_limpieza_grande) : 0;
  document.getElementById('env-costo').value = costoEnv;
  document.getElementById('env-costo-limp').value = costoLimp;
  document.getElementById('env-costo-limp').disabled = !limpieza;
  document.getElementById('env-total').textContent = `$${costoEnv + costoLimp}`;
}

async function guardarEnvio(e, transportistaId) {
  e.preventDefault();
  const body = {
    transportista_id:    transportistaId,
    reserva_id:          document.getElementById('env-reserva').value || null,
    maquina_id:          document.getElementById('env-maquina').value,
    tipo_envio:          document.getElementById('env-tipo').value,
    tipo_maquina:        document.getElementById('env-tamano').value,
    departamento_destino:document.getElementById('env-depto').value,
    fecha_salida:        document.getElementById('env-salida').value,
    incluye_limpieza:    document.getElementById('env-limpieza').checked,
    costo_envio:         parseFloat(document.getElementById('env-costo').value)||0,
    costo_limpieza:      parseFloat(document.getElementById('env-costo-limp').value)||0,
    tiene_rastreo:       !transportistaActual?.sin_rastreo_siempre,
    observacion:         document.getElementById('env-obs').value.trim(),
    estado:              'en_transito',
  };
  try {
    const res = await fetch(`${API}/envios`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error();
    document.getElementById('modal-form-envio').remove();
    mostrarToast('Envío registrado ✓');
    abrirFichaTransportista(transportistaId);
  } catch {
    mostrarToast('Error al crear el envío', 'error');
  }
}

// ─────────────────────────────────────────────
// 6. INCIDENTES
// ─────────────────────────────────────────────
function abrirFormNuevoIncidente(transportistaId) {
  const modal = document.createElement('div');
  modal.id = 'modal-incidente';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Registrar incidente</span>
        <button onclick="document.getElementById('modal-incidente').remove()" class="btn-close">✕</button>
      </div>
      <form onsubmit="guardarIncidente(event, ${transportistaId})">
        <label class="field-label">Fecha</label>
        <input type="date" id="inc-fecha" value="${new Date().toISOString().split('T')[0]}">
        <label class="field-label">Descripción *</label>
        <textarea id="inc-desc" required placeholder="Describí el problema ocurrido"></textarea>
        <button type="submit" class="btn-primary full-width" style="margin-top:16px">Guardar incidente</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
}

async function guardarIncidente(e, transportistaId) {
  e.preventDefault();
  const body = {
    transportista_id: transportistaId,
    fecha:            document.getElementById('inc-fecha').value,
    descripcion:      document.getElementById('inc-desc').value.trim(),
  };
  await fetch(`${API}/transportistas/${transportistaId}/incidentes`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body)
  });
  document.getElementById('modal-incidente').remove();
  mostrarToast('Incidente registrado');
  abrirFichaTransportista(transportistaId);
}

// ─────────────────────────────────────────────
// 7. LIQUIDACIÓN DE HONORARIOS
// ─────────────────────────────────────────────
function abrirFormLiquidacion(transportistaId) {
  const hoy = new Date();
  const primeroDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDeMes  = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).toISOString().split('T')[0];

  const modal = document.createElement('div');
  modal.id = 'modal-liquidacion';
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">Nueva liquidación</span>
        <button onclick="document.getElementById('modal-liquidacion').remove()" class="btn-close">✕</button>
      </div>
      <form onsubmit="guardarLiquidacion(event, ${transportistaId})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="field-label">Período desde</label>
            <input type="date" id="liq-desde" value="${primeroDeMes}">
          </div>
          <div>
            <label class="field-label">Período hasta</label>
            <input type="date" id="liq-hasta" value="${ultimoDeMes}">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="field-label">Total envíos</label>
            <input type="number" id="liq-env" value="0" min="0">
          </div>
          <div>
            <label class="field-label">Total puestas a punto</label>
            <input type="number" id="liq-limp" value="0" min="0">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label class="field-label">Monto envíos ($)</label>
            <input type="number" id="liq-monto-env" value="0" min="0">
          </div>
          <div>
            <label class="field-label">Monto puestas a punto ($)</label>
            <input type="number" id="liq-monto-limp" value="0" min="0">
          </div>
        </div>
        <label class="field-label">Notas</label>
        <textarea id="liq-notas" placeholder="Observaciones del período"></textarea>
        <button type="submit" class="btn-primary full-width" style="margin-top:16px">Crear liquidación</button>
      </form>
    </div>`;
  document.body.appendChild(modal);
}

async function guardarLiquidacion(e, transportistaId) {
  e.preventDefault();
  const montoEnv  = parseFloat(document.getElementById('liq-monto-env').value)||0;
  const montoLimp = parseFloat(document.getElementById('liq-monto-limp').value)||0;
  const body = {
    transportista_id: transportistaId,
    periodo_desde:    document.getElementById('liq-desde').value,
    periodo_hasta:    document.getElementById('liq-hasta').value,
    total_envios:     parseInt(document.getElementById('liq-env').value)||0,
    total_limpiezas:  parseInt(document.getElementById('liq-limp').value)||0,
    monto_envios:     montoEnv,
    monto_limpiezas:  montoLimp,
    notas:            document.getElementById('liq-notas').value.trim(),
  };
  await fetch(`${API}/transportistas/${transportistaId}/pagos`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body)
  });
  document.getElementById('modal-liquidacion').remove();
  mostrarToast('Liquidación creada ✓');
  abrirFichaTransportista(transportistaId);
}

async function marcarPagado(pagoId) {
  await fetch(`${API}/transportistas/pagos/${pagoId}`, {
    method: 'PUT',
    headers: apiHeaders(),
    body: JSON.stringify({ estado: 'pagado', fecha_pago: new Date().toISOString().split('T')[0] })
  });
  mostrarToast('Pago registrado ✓');
  abrirFichaTransportista(transportistaActual?.id);
}

// ─────────────────────────────────────────────
// 8. UTILIDADES
// ─────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function formatFecha(f) {
  if (!f) return '—';
  const d = new Date(f);
  return d.toLocaleDateString('es-UY', { day:'2-digit', month:'short', year:'numeric' });
}

function mostrarToast(msg, tipo='ok') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
