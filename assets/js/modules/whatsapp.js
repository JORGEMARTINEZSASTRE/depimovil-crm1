/* ══════════════════════════════════
   WHATSAPP
══════════════════════════════════ */

/* ── Core helpers ── */
function generarMensaje(plantillaId, operadoraId, ctx){
  const plantillas = DB.get('wa_plantillas')||[];
  const pt = plantillas.find(p=>p.id===plantillaId);
  if(!pt) return '';
  const op = getOp(operadoraId)||{};
  const res = ctx.reservaId ? (DB.get('reservas')||[]).find(r=>r.id===ctx.reservaId)||{} : {};
  const maq = res.maquinaId ? getMaq(res.maquinaId)||{} : {};
  const fechaRef = res.tipo==='jornada' ? res.fechaJornada : res.fechaInicio;
  const vars = {
    nombre: op.nombre||'',
    apellido: op.apellido||'',
    reserva: res.codigo||'',
    maquina: maq.nombre||'',
    fecha: fmtDate(fechaRef)||'',
    monto: ctx.monto ? `${Number(ctx.monto).toLocaleString()} ${ctx.moneda||'UYU'}` : (res.monto ? `${res.monto.toLocaleString()} ${res.moneda||'UYU'}` : ''),
    estado: RES_ESTADOS[res.estado]?.label || res.estado || '',
    departamento: res.deptLogistica || op.departamento || '',
  };
  return pt.mensaje.replace(/\{\{(\w+)\}\}/g, (_,k) => vars[k]||'');
}

function encolarNotificacion(plantillaId, operadoraId, ctx){
  const plantillas = DB.get('wa_plantillas')||[];
  const pt = plantillas.find(p=>p.id===plantillaId);
  if(!pt || !pt.activa) return;
  const op = getOp(operadoraId);
  if(!op) return;
  const notifs = DB.get('wa_notificaciones')||[];
  const newId = Math.max(0,...notifs.map(n=>n.id))+1;
  notifs.push({
    id: newId,
    plantillaId,
    operadoraId,
    reservaId: ctx.reservaId||null,
    estado: 'pendiente',
    mensaje: generarMensaje(plantillaId, operadoraId, ctx),
    ts: new Date().toISOString(),
    tsSent: null,
    numero: op.whatsapp||'',
    // payload listo para API WhatsApp Business
    waPayload: JSON.stringify({
      messaging_product: 'whatsapp',
      to: (op.whatsapp||'').replace(/\D/g,''),
      type: 'text',
      text: {body: generarMensaje(plantillaId, operadoraId, ctx)},
    }),
  });
  DB.set('wa_notificaciones', notifs);
  updateWABadge();
}

async function simularEnvio(id){
  const notifs = DB.get('wa_notificaciones')||[];
  const idx = notifs.findIndex(n=>n.id===id);
  if(idx<0) return;
  const n = notifs[idx];
  if(!n.numero){
    showToast('⚠️ La operadora no tiene WhatsApp cargado','warn');
    return;
  }
  if(!confirm('¿Enviar este WhatsApp real ahora?')) return;
  try{
    const result = await api('/api/webhook/whatsapp/send', {
      method:'POST',
      body:JSON.stringify({telefono:n.numero, mensaje:n.mensaje, contexto:n.plantillaId + (n.reservaId ? ' reserva #' + n.reservaId : '')})
    });
    notifs[idx].messageId = result.messageId || null;
    notifs[idx].simulado = !!result.simulado;
  }catch(e){
    notifs[idx].estado = 'error';
    notifs[idx].error = e.message;
    DB.set('wa_notificaciones', notifs);
    updateWABadge();
    showToast('❌ '+e.message,'error');
    renderWA(waActiveTab);
    return;
  }
  notifs[idx].estado = 'enviada';
  notifs[idx].tsSent = new Date().toISOString();
  DB.set('wa_notificaciones', notifs);
  updateWABadge();
  showToast('💬 WhatsApp enviado');
  renderWA(document.querySelector('.view-tab.active')?.textContent?.toLowerCase().includes('historial') ? 'historial' : 'pendientes');
}

async function simularEnviarTodas(){
  const notifs = DB.get('wa_notificaciones')||[];
  const pend = notifs.filter(n=>n.estado==='pendiente');
  if(!pend.length) return;
  if(!confirm(`¿Enviar ${pend.length} WhatsApp reales ahora?`)) return;
  let count = 0;
  for(const n of pend){
    if(!n.numero) continue;
    try{
      const result = await api('/api/webhook/whatsapp/send', {
        method:'POST',
        body:JSON.stringify({telefono:n.numero, mensaje:n.mensaje, contexto:n.plantillaId + (n.reservaId ? ' reserva #' + n.reservaId : '')})
      });
      n.estado='enviada';
      n.tsSent=new Date().toISOString();
      n.messageId=result.messageId||null;
      n.simulado=!!result.simulado;
      count++;
    }catch(e){
      n.estado='error';
      n.error=e.message;
    }
  }
  DB.set('wa_notificaciones', notifs);
  updateWABadge();
  showToast(`💬 ${count} WhatsApp enviados`);
  renderWA('historial');
}

function limpiarEnviadas(){
  if(!confirm('¿Eliminar todas las notificaciones enviadas del historial?')) return;
  DB.set('wa_notificaciones', (DB.get('wa_notificaciones')||[]).filter(n=>n.estado!=='enviada'));
  updateWABadge();
  showToast('🗑 Historial limpiado');
  renderWA('pendientes');
}

function updateWABadge(){
  const count = (DB.get('wa_notificaciones')||[]).filter(n=>n.estado==='pendiente').length + (DB.get('wa_queue_server')||[]).length;
  const badge = document.getElementById('navBadgeWA');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
  const pendCount = document.getElementById('waPendCount');
  if(pendCount) pendCount.textContent = count>0?`(${count})`:'';
}

async function cargarColaServidorWA(){
  try{
    const queue = await api('/api/webhook/whatsapp/queue');
    DB.set('wa_queue_server', Array.isArray(queue) ? queue : []);
    DB.set('wa_queue_server_error', '');
    return DB.get('wa_queue_server')||[];
  }catch(e){
    DB.set('wa_queue_server_error', e.message);
    return DB.get('wa_queue_server')||[];
  }
}

async function enviarColaServidorWA(id){
  if(!confirm('¿Reintentar enviar este mensaje pendiente del servidor?')) return;
  try{
    await api(`/api/webhook/whatsapp/queue/${id}/send`, {method:'POST'});
    showToast('💬 Mensaje pendiente enviado');
    await cargarColaServidorWA();
    updateWABadge();
    renderWA('pendientes');
  }catch(e){
    showToast('❌ '+e.message, 'error');
  }
}

/* ── Conexión WhatsApp QR ── */
async function renderWAConexion(){
  const el = document.getElementById('waTabContent');
  if(!el) return;

  el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:32px 16px;max-width:480px;margin:0 auto">
    <div id="waConexionStatus" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center">
      <div style="font-size:13px;color:var(--text2)">Consultando estado...</div>
    </div>
    <div id="waQRWrap" style="display:none;flex-direction:column;align-items:center;gap:12px">
      <div style="font-size:13px;color:var(--text2);text-align:center">
        Escaneá con WhatsApp → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong>
      </div>
      <div id="waQRImg" style="background:white;padding:16px;border-radius:14px;box-shadow:var(--shadow)"></div>
      <div style="font-size:12px;color:var(--text3)">El QR expira en ~20 segundos. Si venció, pedí uno nuevo.</div>
      <button class="btn-secondary" onclick="pedirQR()">🔄 Pedir QR nuevo</button>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
      <button class="btn-add" onclick="verificarConexionWA()">🔌 Verificar conexión</button>
      <button class="btn-secondary" onclick="pedirQR()" id="btnPedirQR">📱 Conectar WhatsApp</button>
      ${isSuperAdmin() ? `<button class="btn-secondary" onclick="desconectarWA()" style="color:var(--red);border-color:rgba(224,92,107,.3)">⏏ Desconectar</button>` : ''}
    </div>
    <div style="font-size:12px;color:var(--text3);text-align:center;max-width:380px;line-height:1.6">
      Para cambiar el número vinculado: desconectá primero, luego conectá con el nuevo teléfono.
    </div>
  </div>`;

  await verificarConexionWA();
}

async function verificarConexionWA(){
  const statusEl = document.getElementById('waConexionStatus');
  if(!statusEl) return;
  try {
    const st = await api('/api/webhook/whatsapp/status');
    DB.set('wa_status', st);
    const conectado = st.conectado;
    const modo = st.modo;
    const provider = st.proveedor || '—';
    const realActivo = !!st.envio_real_activo;

    statusEl.innerHTML = `
      <div style="font-size:28px;margin-bottom:8px">${realActivo ? '✅' : modo === 'simulacion' ? '🔵' : '🔴'}</div>
      <div style="font-size:16px;font-weight:700;color:${realActivo ? 'var(--green)' : 'var(--text)'}">
        ${realActivo ? 'WhatsApp conectado' : modo === 'simulacion' ? 'Modo simulación' : 'WhatsApp sin envío real'}
      </div>
      <div style="font-size:12px;color:var(--text3);margin-top:6px">
        Modo: <strong>${modo}</strong> · Proveedor: <strong>${provider}</strong> · Instancia: <strong>${st.instancia||'—'}</strong>
      </div>
      ${realActivo ? `<div style="font-size:12px;color:var(--green);margin-top:8px">Los mensajes automáticos están activos ✓</div>` : ''}
      ${modo === 'simulacion' ? `<div style="font-size:12px;color:var(--blue);margin-top:8px">Los mensajes solo se loguean en el servidor.</div>` : ''}
      ${!realActivo && modo !== 'simulacion' && provider === 'meta' ? `<div style="font-size:12px;color:var(--red);margin-top:8px">Meta WhatsApp no validó el token actual. Renovar el acceso en Meta para enviar mensajes reales.</div>` : ''}
      ${!realActivo && modo !== 'simulacion' && provider === 'evolution' ? `<div style="font-size:12px;color:var(--red);margin-top:8px">Escaneá el QR para vincular un número de WhatsApp.</div>` : ''}
    `;

    // Mostrar botón de QR solo si no está conectado y está en producción
    const btnQR = document.getElementById('btnPedirQR');
    if(btnQR) btnQR.style.display = (!realActivo && provider === 'evolution' && modo !== 'simulacion') ? 'inline-flex' : 'none';

  } catch(e) {
    statusEl.innerHTML = `<div style="color:var(--red)">❌ No se pudo verificar el estado: ${e.message}</div>`;
  }
}

async function pedirQR(){
  const qrWrap = document.getElementById('waQRWrap');
  const qrImg  = document.getElementById('waQRImg');
  if(!qrWrap || !qrImg) return;

  qrWrap.style.display = 'flex';
  qrImg.innerHTML = `<div style="padding:40px;color:var(--text2);font-size:13px">Cargando QR...</div>`;

  try {
    const d = await api('/api/webhook/whatsapp/qr');
    if(d.status === 'conectado') {
      qrWrap.style.display = 'none';
      showToast('✅ WhatsApp ya está conectado');
      await verificarConexionWA();
      return;
    }
    if(d.simulado) {
      qrWrap.style.display = 'none';
      showToast('ℹ️ Servidor en modo simulación — cambiá WA_MODO=produccion en Railway', 'warn');
      return;
    }
    if(d.qrcode) {
      const img = document.createElement('img');
      img.src = d.qrcode;
      img.style.cssText = 'width:240px;height:240px;display:block';
      qrImg.innerHTML = '';
      qrImg.appendChild(img);
      showToast('📱 Escaneá el QR ahora — expira en 20 segundos');
      // Auto-verificar conexión cada 5 segundos
      let intentos = 0;
      const check = setInterval(async () => {
        intentos++;
        try {
          const st = await api('/api/webhook/whatsapp/status');
          if(st.conectado) {
            clearInterval(check);
            qrWrap.style.display = 'none';
            showToast('✅ WhatsApp conectado correctamente');
            await verificarConexionWA();
          }
        } catch(_) {}
        if(intentos >= 12) clearInterval(check); // dejar de verificar después de 60s
      }, 5000);
    } else {
      qrImg.innerHTML = `<div style="padding:20px;color:var(--red);font-size:13px">No se pudo obtener el QR: ${d.error || 'error desconocido'}</div>`;
    }
  } catch(e) {
    qrImg.innerHTML = `<div style="padding:20px;color:var(--red);font-size:13px">Error: ${e.message}</div>`;
  }
}

async function desconectarWA(){
  if(!confirm('¿Desconectar WhatsApp? El número quedará desvinculado.')) return;
  try {
    await fetch(`${(DB.get('wa_status')?.evolution_url||'')}`.replace('undefined','') || '/api/webhook/whatsapp/status', {});
    // Llamar al endpoint de logout de Evolution via nuestro servidor
    const resp = await fetch('/api/webhook/whatsapp/setup', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('dm_jwt') }
    });
    showToast('⏏ WhatsApp desconectado');
  } catch(e) {
    showToast('⚠️ ' + e.message, 'warn');
  }
  await verificarConexionWA();
}

/* ── Render ── */
let waActiveTab = 'conexion';
let waServerQueueLoaded = false;

function switchWaTab(tab, btn){
  waActiveTab = tab;
  if(tab === 'pendientes') waServerQueueLoaded = false;
  document.querySelectorAll('#waTabs .view-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderWA(tab);
}

function renderWA(tab){
  waActiveTab = tab||waActiveTab;
  updateWABadge();
  const notifs = DB.get('wa_notificaciones')||[];
  const el = document.getElementById('waTabContent');
  if(!el) return;

  if(waActiveTab==='conexion'){
    renderWAConexion();
    return;
  }

  if(waActiveTab==='pendientes'){
    if(!waServerQueueLoaded){
      waServerQueueLoaded = true;
      cargarColaServidorWA().then(()=>{ if(waActiveTab==='pendientes') renderWA('pendientes'); });
    }
    const pend = notifs.filter(n=>n.estado==='pendiente').sort((a,b)=>b.ts.localeCompare(a.ts));
    const serverPend = DB.get('wa_queue_server')||[];
    const serverError = DB.get('wa_queue_server_error')||'';
    if(!pend.length && !serverPend.length){
      el.innerHTML=`<div class="empty-state"><div class="icon">✅</div><h3>Sin pendientes</h3><p>No hay notificaciones en cola. Se generan automáticamente al cambiar estados.</p></div>`;
      return;
    }
    el.innerHTML=`
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        ${pend.length?`<button class="btn-add" onclick="simularEnviarTodas()">💬 Enviar locales (${pend.length})</button>`:''}
      </div>
      ${serverError?`<div class="alert-banner warn"><span class="ab-icon">⚠️</span><div><strong>No se pudo leer la cola del servidor</strong> — ${serverError}</div></div>`:''}
      ${serverPend.length?`
        <div class="alert-banner warn"><span class="ab-icon">⏳</span><div><strong>${serverPend.length} mensaje${serverPend.length>1?'s':''} pendiente${serverPend.length>1?'s':''} en servidor</strong> — Se guardaron porque el envío automático no pudo completarse.</div></div>
        <div class="table-container" style="margin-bottom:14px">
          ${serverPend.map(q=>`
            <div class="notif-row">
              <div class="notif-icon" style="background:rgba(224,192,92,0.12)">⏳</div>
              <div class="notif-body">
                <div class="notif-name">${q.op_nombre||''} ${q.op_apellido||''} <span style="font-size:11px;color:var(--text3);font-weight:400">${q.telefono||''}</span></div>
                <div style="font-size:11px;color:var(--accent);margin:2px 0">${q.tipo||'pendiente'} ${q.reserva_codigo?'· '+q.reserva_codigo:''}</div>
                <div class="wa-bubble" style="margin-top:8px;max-width:100%">${String(q.mensaje||'').replace(/\n/g,'<br>')}</div>
                <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
                  <button class="action-btn" onclick="enviarColaServidorWA(${q.id})" style="color:var(--green);border-color:rgba(82,196,138,.3)">Reintentar envío</button>
                </div>
              </div>
              <div class="notif-time">${q.creado_en?fmtDate(String(q.creado_en).split('T')[0]):''}</div>
            </div>`).join('')}
        </div>`:''}
      <div class="table-container">
        ${pend.map(n=>{
          const op=getOp(n.operadoraId);
          const pt=(DB.get('wa_plantillas')||[]).find(p=>p.id===n.plantillaId);
          const res=n.reservaId?(DB.get('reservas')||[]).find(r=>r.id===n.reservaId):null;
          return `<div class="notif-row">
            <div class="notif-icon" style="background:rgba(37,211,102,0.1)">💬</div>
            <div class="notif-body">
              <div class="notif-name">${op?op.nombre+' '+op.apellido:'—'} ${op&&op.whatsapp?`<span style="font-size:11px;color:var(--text3);font-weight:400">${op.whatsapp}</span>`:''}</div>
              <div style="font-size:11px;color:var(--accent);margin:2px 0">${pt?.evento||n.plantillaId} ${res?'· '+res.codigo:''}</div>
              <div class="wa-bubble" style="margin-top:8px;max-width:100%">${n.mensaje.replace(/\n/g,'<br>')}</div>
              <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
                <button class="action-btn" onclick="simularEnvio(${n.id})" style="color:var(--green);border-color:rgba(82,196,138,.3)">Enviar ahora</button>
                <button class="action-btn danger" onclick="eliminarNotif(${n.id})">✕ Descartar</button>
                <button class="action-btn" onclick="verPayload(${n.id})">{ } Payload API</button>
              </div>
            </div>
            <div class="notif-time">${fmtDate(n.ts.split('T')[0])}<br>${n.ts.split('T')[1]?.slice(0,5)||''}</div>
          </div>`;
        }).join('')}
      </div>`;

  } else if(waActiveTab==='historial'){
    const hist = notifs.filter(n=>n.estado!=='pendiente').sort((a,b)=>b.ts.localeCompare(a.ts));
    if(!hist.length){
      el.innerHTML=`<div class="empty-state"><div class="icon">📋</div><h3>Historial vacío</h3><p>Acá aparecerán las notificaciones enviadas.</p></div>`;
      return;
    }
    el.innerHTML=`<div class="table-container">
      ${hist.map(n=>{
        const op=getOp(n.operadoraId);
        const pt=(DB.get('wa_plantillas')||[]).find(p=>p.id===n.plantillaId);
        const isSent = n.estado==='enviada';
        return `<div class="notif-row">
          <div class="notif-icon" style="background:${isSent?'rgba(82,196,138,0.1)':'rgba(224,92,107,0.1)'}">
            ${isSent?'✅':'❌'}
          </div>
          <div class="notif-body">
            <div class="notif-name">${op?op.nombre+' '+op.apellido:'—'}</div>
            <div style="font-size:11px;color:var(--text3);margin:2px 0">${pt?.evento||n.plantillaId}</div>
            <div class="notif-msg">${n.mensaje.split('\n')[0]}</div>
            ${n.error?`<div style="font-size:11px;color:var(--red);margin-top:4px">Error: ${n.error}</div>`:''}
            ${n.tsSent?`<div style="font-size:11px;color:var(--green);margin-top:4px">Enviada: ${fmtDate(n.tsSent.split('T')[0])} ${n.tsSent.split('T')[1]?.slice(0,5)}</div>`:''}
          </div>
          <div class="notif-time">${fmtDate(n.ts.split('T')[0])}</div>
        </div>`;
      }).join('')}
    </div>`;

  } else if(waActiveTab==='plantillas'){
    const plantillas = DB.get('wa_plantillas')||[];
    el.innerHTML=`
      <div style="margin-bottom:16px;font-size:13px;color:var(--text2)">
        Editá los mensajes que se envían automáticamente. Usá las variables <code style="color:var(--accent)">{{nombre}}</code>, <code style="color:var(--accent)">{{reserva}}</code>, etc.
      </div>
      ${plantillas.map(pt=>`
        <div class="plantilla-card">
          <div class="plantilla-header">
            <div>
              <div class="plantilla-event">${pt.evento}</div>
              <div style="margin-top:4px">${pt.activa
                ? `<span class="badge badge-green">● Activa</span>`
                : `<span class="badge badge-gray">○ Desactivada</span>`}</div>
            </div>
            ${canEdit()?`<button class="action-btn" onclick="openPlantillaModal('${pt.id}')">✏️ Editar</button>`:''}
          </div>
          <div class="plantilla-body">${pt.mensaje.replace(/\n/g,'<br>').replace(/\*([^*]+)\*/g,'<strong>$1</strong>')}</div>
        </div>`).join('')}`;
  }
}

function eliminarNotif(id){
  DB.set('wa_notificaciones',(DB.get('wa_notificaciones')||[]).filter(n=>n.id!==id));
  updateWABadge();
  showToast('🗑 Notificación descartada');
  renderWA(waActiveTab);
}

function verPayload(id){
  const n=(DB.get('wa_notificaciones')||[]).find(x=>x.id===id);
  if(!n)return;
  const pretty = JSON.stringify(JSON.parse(n.waPayload||'{}'),null,2);
  // Show in a temp modal / toast
  const existing = document.getElementById('payloadPreview');
  if(existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'payloadPreview';
  div.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';
  div.innerHTML=`<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;max-width:560px;width:100%;padding:24px;max-height:80vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:15px;font-weight:700;color:var(--text)">{ } Payload API WhatsApp Business</h3>
      <button onclick="document.getElementById('payloadPreview').remove()" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer">✕</button>
    </div>
    <pre style="background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:16px;font-size:12px;color:var(--text);overflow-x:auto;line-height:1.6">${pretty}</pre>
    <p style="font-size:12px;color:var(--text3);margin-top:12px">En producción, este payload se envía vía POST a <code style="color:var(--accent)">https://graph.facebook.com/v19.0/{phone-id}/messages</code> con header <code style="color:var(--accent)">Authorization: Bearer {token}</code></p>
  </div>`;
  div.addEventListener('click', e=>{ if(e.target===div) div.remove(); });
  document.body.appendChild(div);
}

/* ── Plantillas CRUD ── */
function openPlantillaModal(id){
  const pt=(DB.get('wa_plantillas')||[]).find(p=>p.id===id); if(!pt)return;
  sv('plantillaId',id);
  sv('plantillaEvento',pt.evento);
  sv('plantillaMensaje',pt.mensaje);
  sv('plantillaActiva',pt.activa?'true':'false');
  document.getElementById('modalPlantillaTitle').textContent=`Plantilla: ${pt.evento}`;
  openModal('modalPlantilla');
}

function savePlantilla(){
  const id=gv('plantillaId');
  const plantillas=DB.get('wa_plantillas')||[];
  const idx=plantillas.findIndex(p=>p.id===id); if(idx<0)return;
  plantillas[idx].mensaje=gv('plantillaMensaje');
  plantillas[idx].activa=gv('plantillaActiva')==='true';
  DB.set('wa_plantillas',plantillas);
  closeModal('modalPlantilla');
  showToast('✅ Plantilla actualizada');
  renderWA('plantillas');
}
