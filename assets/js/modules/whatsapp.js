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
  const count = (DB.get('wa_notificaciones')||[]).filter(n=>n.estado==='pendiente').length;
  const badge = document.getElementById('navBadgeWA');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
  const pendCount = document.getElementById('waPendCount');
  if(pendCount) pendCount.textContent = count>0?`(${count})`:'';
}

/* ── Render ── */
let waActiveTab = 'pendientes';

function switchWaTab(tab, btn){
  waActiveTab = tab;
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

  if(waActiveTab==='pendientes'){
    const pend = notifs.filter(n=>n.estado==='pendiente').sort((a,b)=>b.ts.localeCompare(a.ts));
    if(!pend.length){
      el.innerHTML=`<div class="empty-state"><div class="icon">✅</div><h3>Sin pendientes</h3><p>No hay notificaciones en cola. Se generan automáticamente al cambiar estados.</p></div>`;
      return;
    }
    el.innerHTML=`
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn-add" onclick="simularEnviarTodas()">💬 Enviar todas (${pend.length})</button>
      </div>
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
