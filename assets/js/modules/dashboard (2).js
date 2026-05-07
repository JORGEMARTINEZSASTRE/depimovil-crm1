/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function renderDashboard(){
  const ops=DB.get('operadoras')||[];
  const maqs=DB.get('maquinas')||[];
  const reservas=DB.get('reservas')||[];
  const pagos=DB.get('pagos')||[];
  const envios=DB.get('envios')||[];
  const hoy=today();

  // ── Alertas ──
  const proxVencer=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin>=hoy&&daysDiff(hoy,r.fechaFin)<=5);
  const vencidas=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin<hoy);
  const mantProx=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant>=hoy&&daysDiff(hoy,m.proxMant)<=7);
  const mantVenc=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant<hoy&&m.estado!=='fuera_servicio');
  const deudasVenc=pagos.filter(p=>p.estado==='deuda_vencida');
  const envTransito=envios.filter(e=>e.estado==='en_transito');

  let alertsHTML='';
  if(vencidas.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🚨</span><div><strong>${vencidas.length} reserva${vencidas.length>1?'s':''} vencida${vencidas.length>1?'s':''}</strong> — Requieren atención. <button class="action-btn" style="margin-left:8px" onclick="navigate('reservas')">Ver →</button></div></div>`;
  if(deudasVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">💳</span><div><strong>${deudasVenc.length} deuda${deudasVenc.length>1?'s':''} vencida${deudasVenc.length>1?'s':''}</strong> — Operadoras con pagos pendientes. <button class="action-btn" style="margin-left:8px" onclick="navigate('pagos')">Ver →</button></div></div>`;
  if(mantVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🔧</span><div><strong>${mantVenc.length} máquina${mantVenc.length>1?'s':''} con mantenimiento vencido</strong>. <button class="action-btn" style="margin-left:8px" onclick="navigate('maquinas')">Ver →</button></div></div>`;
  if(proxVencer.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⏰</span><div><strong>${proxVencer.length} reserva${proxVencer.length>1?'s':''}</strong> vence${proxVencer.length>1?'n':''} en ≤5 días. <button class="action-btn" style="margin-left:8px" onclick="navigate('reservas')">Ver →</button></div></div>`;
  if(mantProx.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⚙️</span><div><strong>${mantProx.length} máquina${mantProx.length>1?'s':''} con mantenimiento próximo</strong> (≤7 días). <button class="action-btn" style="margin-left:8px" onclick="navigate('maquinas')">Ver →</button></div></div>`;
  if(envTransito.length) alertsHTML+=`<div class="alert-banner info"><span class="ab-icon">🚚</span><div><strong>${envTransito.length} envío${envTransito.length>1?'s':''} en tránsito</strong> — Pendientes de confirmación de entrega. <button class="action-btn" style="margin-left:8px" onclick="navigate('envios')">Ver →</button></div></div>`;
  document.getElementById('dashAlerts').innerHTML=alertsHTML;

  const statsData=[
    {icon:'👩‍💼',label:'Operadoras Activas',value:ops.filter(o=>o.estado==='activa').length,color:'#d4a96a',bg:'rgba(212,169,106,0.1)',trend:`${ops.length} total · ${ops.filter(o=>o.estado==='prospecto').length} prospectos`},
    {icon:'⚙️',label:'Máquinas Disponibles',value:maqs.filter(m=>m.estado==='disponible').length,color:'#52c48a',bg:'rgba(82,196,138,0.1)',trend:`${maqs.length} total · ${maqs.filter(m=>m.estado==='mantenimiento').length} en mant.`},
    {icon:'📅',label:'Reservas Confirmadas',value:reservas.filter(r=>r.estado==='confirmada').length,color:'#9b7fe8',bg:'rgba(155,127,232,0.1)',trend:`${reservas.filter(r=>r.estado==='solicitud_recibida').length} solicitudes sin revisar`},
    {icon:'💳',label:'Pagos Pendientes',value:pagos.filter(p=>['pendiente','sena_pendiente'].includes(p.estado)).length,color:'#e0c05c',bg:'rgba(224,192,92,0.1)',trend:`${deudasVenc.length} deuda${deudasVenc.length!==1?'s':''} vencida${deudasVenc.length!==1?'s':''}`},
  ];
  document.getElementById('statsGrid').innerHTML=statsData.map(s=>`
    <div class="stat-card">
      <div class="stat-card-icon" style="background:${s.bg}">${s.icon}</div>
      <h3 style="color:${s.color}">${s.value}</h3>
      <p>${s.label}</p>
      ${s.trend?`<div class="trend" style="color:${s.color};opacity:.7">${s.trend}</div>`:''}
    </div>`).join('');

  const recRes=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)).slice().sort((a,b)=>{
    const fa=a.fechaJornada||a.fechaInicio||''; const fb=b.fechaJornada||b.fechaInicio||'';
    return fb.localeCompare(fa);
  }).slice(0,5);
  const alertMaq=maqs.filter(m=>m.estado==='mantenimiento'||m.estado==='fuera_servicio');
  const mantProxMaq=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant>=hoy&&daysDiff(hoy,m.proxMant)<=14).sort((a,b)=>a.proxMant.localeCompare(b.proxMant));

  document.getElementById('dashboardGrid').innerHTML=`
    <div class="dash-card">
      <h3>📅 Reservas Activas</h3>
      ${recRes.length?recRes.map(r=>{
        const op=getOp(r.operadoraId);const maq=getMaq(r.maquinaId);
        const fechaRef=r.tipo==='jornada'?r.fechaJornada:r.fechaInicio;
        return `<div class="dash-list-item">
          <div><div class="name">${op?op.nombre+' '+op.apellido:'—'}</div>
          <div class="sub">${maq?maq.nombre:'—'} · ${fmtDate(fechaRef)}</div></div>
          <div>${badgeRes(r.estado)}</div></div>`;
      }).join(''):`<div class="dash-list-item"><div class="name" style="color:var(--text2)">Sin reservas activas</div></div>`}
      <div style="text-align:right;margin-top:12px">
        <button class="action-btn" onclick="navigate('reservas')">Ver todas →</button></div>
    </div>
    <div class="dash-card">
      <h3>⚙️ Máquinas — Estado y Mantenimiento</h3>
      ${alertMaq.length?alertMaq.slice(0,3).map(m=>`
        <div class="dash-list-item">
          <div><div class="name">${m.nombre}</div><div class="sub">${m.codigo} · ${m.ubicacion}</div></div>
          <div>${badgeMaq(m.estado)}</div></div>`).join('')
        :`<div class="dash-list-item"><div class="name" style="color:var(--green)">✅ Todas operativas</div></div>`}
      ${mantProxMaq.length?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">🔧 Próximo Mantenimiento</div>
        ${mantProxMaq.slice(0,3).map(m=>{
          const dias=daysDiff(hoy,m.proxMant);
          return `<div class="dash-list-item">
            <div><div class="name">${m.nombre}</div></div>
            <span class="maint-chip ${dias<=3?'urgent':'soon'}">en ${dias}d</span>
          </div>`;
        }).join('')}
      </div>`:''}
      <div style="text-align:right;margin-top:12px">
        <button class="action-btn" onclick="navigate('maquinas')">Ver todas →</button></div>
    </div>
    <div class="dash-card">
      <h3>🚚 Envíos en Curso</h3>
      ${envios.filter(e=>['en_transito','preparando','pendiente_envio'].includes(e.estado)).slice(0,4).map(e=>{
        const op=getOp(e.operadoraId);
        return `<div class="dash-list-item">
          <div><div class="name">${op?op.nombre+' '+op.apellido:'—'}</div>
          <div class="sub">${e.departamento} · ${fmtDate(e.fechaEnvioEst)}</div></div>
          <div>${badgeEnvio(e.estado)}</div></div>`;
      }).join('')||`<div class="dash-list-item"><div class="name" style="color:var(--text2)">Sin envíos en curso</div></div>`}
      <div style="text-align:right;margin-top:12px">
        <button class="action-btn" onclick="navigate('envios')">Ver todos →</button></div>
    </div>
    <div class="dash-card">
      <h3>💬 WhatsApp Pendientes</h3>
      ${(()=>{const waPend=(DB.get('wa_notificaciones')||[]).filter(n=>n.estado==='pendiente');
        if(!waPend.length) return `<div class="dash-list-item"><div class="name" style="color:var(--green)">✅ Cola vacía</div></div>`;
        return waPend.slice(0,4).map(n=>{const op=getOp(n.operadoraId);const pt=(DB.get('wa_plantillas')||[]).find(p=>p.id===n.plantillaId);
          return `<div class="dash-list-item"><div><div class="name">${op?op.nombre+' '+op.apellido:'—'}</div><div class="sub">${pt?.evento||n.plantillaId}</div></div>
          <button class="action-btn" onclick="simularEnvio(${n.id});renderDashboard()" style="color:var(--green);border-color:rgba(82,196,138,.3)">Enviar</button></div>`;}).join('');
      })()}
      <div style="text-align:right;margin-top:12px">
        <button class="action-btn" onclick="navigate('whatsapp')">Ver centro →</button></div>
    </div>
    <div class="dash-card">
      <h3>🎯 Leads — Pipeline</h3>
      ${(()=>{
        const leads=DB.get('leads')||[];
        const activos=leads.filter(l=>!['ganado','perdido'].includes(l.estado));
        if(!activos.length) return '<div class="dash-list-item"><div class="name" style="color:var(--text2)">Sin leads activos</div></div>';
        return activos.slice(0,5).map(l=>'<div class="dash-list-item"><div><div class="name">'+l.nombre+' '+l.apellido+'</div><div class="sub">'+(l.gabinete||l.ciudad||'—')+'</div></div><div>'+badgeLead(l.estado)+'</div></div>').join('');
      })()}
      <div style="text-align:right;margin-top:12px">
        <button class="action-btn" onclick="navigate('leads')">Ver todos →</button></div>
    </div>
    <div class="dash-card" style="grid-column:1/-1">
      <h3>📊 Distribución por Estado</h3>
      <div style="display:flex;flex-wrap:wrap;gap:32px;margin-top:8px">
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700">Operadoras</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['activa','prospecto','inactiva','suspendida'].map(st=>`<div style="display:flex;align-items:center;gap:6px;font-size:13px">${badgeOp(st)}<span style="color:var(--text2)">${ops.filter(o=>o.estado===st).length}</span></div>`).join('')}
          </div></div>
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700">Máquinas</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['disponible','reservada','mantenimiento','fuera_servicio','en_viaje'].map(st=>`<div style="display:flex;align-items:center;gap:6px;font-size:13px">${badgeMaq(st)}<span style="color:var(--text2)">${maqs.filter(m=>m.estado===st).length}</span></div>`).join('')}
          </div></div>
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700">Reservas</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${Object.entries(RES_ESTADOS).map(([k,v])=>`<div style="display:flex;align-items:center;gap:6px;font-size:13px"><span class="badge ${v.badge}">${v.icon} ${v.label}</span><span style="color:var(--text2)">${reservas.filter(r=>r.estado===k).length}</span></div>`).join('')}
          </div></div>
        <div><div style="font-size:11px;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.6px;font-weight:700">Envíos</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${Object.entries(ENVIO_ESTADOS).map(([k,v])=>`<div style="display:flex;align-items:center;gap:6px;font-size:13px"><span class="badge ${v.badge}">${v.icon} ${v.label}</span><span style="color:var(--text2)">${envios.filter(e=>e.estado===k).length}</span></div>`).join('')}
          </div></div>
      </div>
    </div>`;
}
