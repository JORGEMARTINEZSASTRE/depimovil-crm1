/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */

// ── Helpers financieros ──
function _mesPrefix(offset=0){
  const d=new Date();
  d.setDate(1);
  d.setMonth(d.getMonth()+offset);
  return d.toISOString().slice(0,7); // 'YYYY-MM'
}

function _fmtMonto(n,moneda='UYU'){
  if(n>=1000000) return (n/1000000).toFixed(1)+'M '+moneda;
  if(n>=1000)    return (n/1000).toFixed(1)+'k '+moneda;
  return n.toLocaleString()+' '+moneda;
}

function _tendencia(actual,anterior){
  if(!anterior) return {txt:'Primer mes',color:'var(--text3)',icon:'—'};
  const pct=Math.round(((actual-anterior)/anterior)*100);
  if(pct>0)  return {txt:`+${pct}% vs mes ant.`,color:'var(--green)',icon:'▲'};
  if(pct<0)  return {txt:`${pct}% vs mes ant.`,color:'var(--red)',icon:'▼'};
  return {txt:'igual que mes ant.',color:'var(--text3)',icon:'→'};
}

function _renderFinKpis(pagos, movsCaja, puedeVer){
  const el=document.getElementById('finKpisGrid');
  if(!el) return;
  if(!puedeVer){ el.innerHTML=''; return; }

  const mesCurrent=_mesPrefix(0);
  const mesAnterior=_mesPrefix(-1);

  // Ingresos cobrados (pagos validados) — solo UYU por simplicidad
  const cobradosMes     = pagos.filter(p=>p.estado==='validado'&&(p.fechaPago||'').startsWith(mesCurrent));
  const cobradosMesAnt  = pagos.filter(p=>p.estado==='validado'&&(p.fechaPago||'').startsWith(mesAnterior));
  const ingMes    = cobradosMes.reduce((s,p)=>s+(p.moneda==='UYU'?p.montoTotal||0:0),0);
  const ingMesAnt = cobradosMesAnt.reduce((s,p)=>s+(p.moneda==='UYU'?p.montoTotal||0:0),0);
  const tendIng   = _tendencia(ingMes, ingMesAnt);

  // Pendiente de cobro total
  const pendTotal = pagos
    .filter(p=>['pendiente','sena_pendiente','sena_abonada'].includes(p.estado)&&p.moneda==='UYU')
    .reduce((s,p)=>s+(p.saldoPendiente||p.montoTotal||0),0);

  // Deuda vencida en $
  const deudaMonto = pagos
    .filter(p=>p.estado==='deuda_vencida'&&p.moneda==='UYU')
    .reduce((s,p)=>s+(p.saldoPendiente||p.montoTotal||0),0);

  // Ingresos vs Egresos de caja del mes
  const movsMes = (movsCaja||[]).filter(m=>(m.fecha||'').startsWith(mesCurrent));
  const cajIngreso = movsMes.filter(m=>m.tipo==='ingreso'&&m.moneda==='UYU').reduce((s,m)=>s+(m.monto||0),0);
  const cajEgreso  = movsMes.filter(m=>m.tipo==='egreso' &&m.moneda==='UYU').reduce((s,m)=>s+(m.monto||0),0);
  const balance    = cajIngreso - cajEgreso;
  const balColor   = balance>=0?'var(--green)':'var(--red)';

  // Nombre del mes
  const [yy,mm]=mesCurrent.split('-');
  const nombreMes=new Date(+yy,+mm-1,1).toLocaleString('es',{month:'long',year:'numeric'});

  el.innerHTML=`
  <div class="dash-card fin-kpi-card" style="grid-column:1/-1;margin-bottom:0">
    <div class="fin-kpi-header">
      <h3 style="margin:0">💰 Resumen Financiero — <span style="color:var(--accent);text-transform:capitalize">${nombreMes}</span></h3>
      <button class="action-btn" onclick="navigate('pagos')">Ver pagos →</button>
    </div>
    <div class="fin-kpi-grid">
      <div class="fin-kpi-item">
        <div class="fin-kpi-label">Cobrado este mes</div>
        <div class="fin-kpi-value" style="color:var(--green)">${_fmtMonto(ingMes)}</div>
        <div class="fin-kpi-trend" style="color:${tendIng.color}">${tendIng.icon} ${tendIng.txt}</div>
      </div>
      <div class="fin-kpi-item">
        <div class="fin-kpi-label">Mes anterior</div>
        <div class="fin-kpi-value" style="color:var(--text2)">${_fmtMonto(ingMesAnt)}</div>
        <div class="fin-kpi-trend" style="color:var(--text3)">${cobradosMesAnt.length} pago${cobradosMesAnt.length!==1?'s':''}</div>
      </div>
      <div class="fin-kpi-item">
        <div class="fin-kpi-label">Pendiente de cobro</div>
        <div class="fin-kpi-value" style="color:var(--yellow)">${_fmtMonto(pendTotal)}</div>
        <div class="fin-kpi-trend" style="color:var(--text3)">${pagos.filter(p=>['pendiente','sena_pendiente','sena_abonada'].includes(p.estado)).length} pago${pagos.filter(p=>['pendiente','sena_pendiente','sena_abonada'].includes(p.estado)).length!==1?'s':''}</div>
      </div>
      <div class="fin-kpi-item">
        <div class="fin-kpi-label">Deuda vencida</div>
        <div class="fin-kpi-value" style="color:${deudaMonto>0?'var(--red)':'var(--green)'}">${deudaMonto>0?_fmtMonto(deudaMonto):'$0'}</div>
        <div class="fin-kpi-trend" style="color:var(--text3)">${pagos.filter(p=>p.estado==='deuda_vencida').length} operadora${pagos.filter(p=>p.estado==='deuda_vencida').length!==1?'s':''}</div>
      </div>
      <div class="fin-kpi-item fin-kpi-balance">
        <div class="fin-kpi-label">Balance caja (mes)</div>
        <div class="fin-kpi-value" style="color:${balColor}">${balance>=0?'+':''}${_fmtMonto(balance)}</div>
        <div class="fin-kpi-trend" style="color:var(--text3)">▲ ${_fmtMonto(cajIngreso)} · ▼ ${_fmtMonto(cajEgreso)}</div>
      </div>
    </div>
  </div>`;
}

function renderDashboard(){
  const ops=DB.get('operadoras')||[];
  const maqs=DB.get('maquinas')||[];
  const reservas=DB.get('reservas')||[];
  const pagos=DB.get('pagos')||[];
  const envios=DB.get('envios')||[];
  const movsCaja=DB.get('caja_movimientos')||[];
  const hoy=today();

  // ── Alertas ──
  const proxVencer=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin>=hoy&&daysDiff(hoy,r.fechaFin)<=5);
  const vencidas=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin<hoy);
  const mantProx=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant>=hoy&&daysDiff(hoy,m.proxMant)<=7);
  const mantVenc=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant<hoy&&m.estado!=='fuera_servicio');
  const deudasVenc=pagos.filter(p=>p.estado==='deuda_vencida');
  const envTransito=envios.filter(e=>e.estado==='en_transito');
  const puedeVerPagos=typeof canView==='function'&&canView('pagos');

  let alertsHTML='';
  if(vencidas.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🚨</span><div><strong>${vencidas.length} reserva${vencidas.length>1?'s':''} vencida${vencidas.length>1?'s':''}</strong> — Requieren atención. <button class="action-btn" style="margin-left:8px" onclick="navigate('reservas')">Ver →</button></div></div>`;
  if(puedeVerPagos&&deudasVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">💳</span><div><strong>${deudasVenc.length} deuda${deudasVenc.length>1?'s':''} vencida${deudasVenc.length>1?'s':''}</strong> — Operadoras con pagos pendientes. <button class="action-btn" style="margin-left:8px" onclick="navigate('pagos')">Ver →</button></div></div>`;
  if(mantVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🔧</span><div><strong>${mantVenc.length} máquina${mantVenc.length>1?'s':''} con mantenimiento vencido</strong>. <button class="action-btn" style="margin-left:8px" onclick="navigate('maquinas')">Ver →</button></div></div>`;
  if(proxVencer.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⏰</span><div><strong>${proxVencer.length} reserva${proxVencer.length>1?'s':''}</strong> vence${proxVencer.length>1?'n':''} en ≤5 días. <button class="action-btn" style="margin-left:8px" onclick="navigate('reservas')">Ver →</button></div></div>`;
  if(mantProx.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⚙️</span><div><strong>${mantProx.length} máquina${mantProx.length>1?'s':''} con mantenimiento próximo</strong> (≤7 días). <button class="action-btn" style="margin-left:8px" onclick="navigate('maquinas')">Ver →</button></div></div>`;
  if(envTransito.length) alertsHTML+=`<div class="alert-banner info"><span class="ab-icon">🚚</span><div><strong>${envTransito.length} envío${envTransito.length>1?'s':''} en tránsito</strong> — Pendientes de confirmación de entrega. <button class="action-btn" style="margin-left:8px" onclick="navigate('envios')">Ver →</button></div></div>`;

  // ── Alertas operadoras inactivas ──
  if(typeof _calcMetricasOp === 'function'){
    const opsActivas = ops.filter(o=>o.estado==='activa');
    const perdidas   = opsActivas.filter(o=>{ const m=_calcMetricasOp(o.id); return m.diasInactiva!==null&&m.diasInactiva>90; });
    const inactivas  = opsActivas.filter(o=>{ const m=_calcMetricasOp(o.id); return m.diasInactiva!==null&&m.diasInactiva>60&&m.diasInactiva<=90; });
    const tibias     = opsActivas.filter(o=>{ const m=_calcMetricasOp(o.id); return m.diasInactiva!==null&&m.diasInactiva>30&&m.diasInactiva<=60; });
    if(perdidas.length)  alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🔴</span><div><strong>${perdidas.length} operadora${perdidas.length>1?'s':''} perdida${perdidas.length>1?'s':''}</strong> — Sin reservas hace más de 90 días. <button class="action-btn" style="margin-left:8px" onclick="navigate('operadoras')">Reactivar →</button></div></div>`;
    if(inactivas.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">🟠</span><div><strong>${inactivas.length} operadora${inactivas.length>1?'s':''} inactiva${inactivas.length>1?'s':''}</strong> — Sin reservas entre 60 y 90 días. <button class="action-btn" style="margin-left:8px" onclick="navigate('operadoras')">Ver →</button></div></div>`;
    if(tibias.length)    alertsHTML+=`<div class="alert-banner info"><span class="ab-icon">🟡</span><div><strong>${tibias.length} operadora${tibias.length>1?'s':''} tibia${tibias.length>1?'s':''}</strong> — Sin reservas entre 30 y 60 días. Buen momento para contactar. <button class="action-btn" style="margin-left:8px" onclick="navigate('operadoras')">Ver →</button></div></div>`;
  }

  document.getElementById('dashAlerts').innerHTML=alertsHTML;

  const statsData=[
    {icon:'👩‍💼',label:'Operadoras Activas',value:ops.filter(o=>o.estado==='activa').length,color:'#d4a96a',bg:'rgba(212,169,106,0.1)',trend:`${ops.length} total · ${ops.filter(o=>o.estado==='prospecto').length} prospectos`},
    {icon:'⚙️',label:'Máquinas Disponibles',value:maqs.filter(m=>m.estado==='disponible').length,color:'#52c48a',bg:'rgba(82,196,138,0.1)',trend:`${maqs.length} total · ${maqs.filter(m=>m.estado==='mantenimiento').length} en mant.`},
    {icon:'📅',label:'Reservas Confirmadas',value:reservas.filter(r=>r.estado==='confirmada').length,color:'#9b7fe8',bg:'rgba(155,127,232,0.1)',trend:`${reservas.filter(r=>r.estado==='solicitud_recibida').length} solicitudes sin revisar`},
  ];
  if(puedeVerPagos) statsData.push(
    {icon:'💳',label:'Pagos Pendientes',value:pagos.filter(p=>['pendiente','sena_pendiente'].includes(p.estado)).length,color:'#e0c05c',bg:'rgba(224,192,92,0.1)',trend:`${deudasVenc.length} deuda${deudasVenc.length!==1?'s':''} vencida${deudasVenc.length!==1?'s':''}`}
  );
  document.getElementById('statsGrid').innerHTML=statsData.map(s=>`
    <div class="stat-card">
      <div class="stat-card-icon" style="background:${s.bg}">${s.icon}</div>
      <h3 style="color:${s.color}">${s.value}</h3>
      <p>${s.label}</p>
      ${s.trend?`<div class="trend" style="color:${s.color};opacity:.7">${s.trend}</div>`:''}
    </div>`).join('');

  // ── KPIs Financieros ──
  _renderFinKpis(pagos, movsCaja, puedeVerPagos);

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
      <h3>👩‍💼 Operadoras — Atención requerida</h3>
      ${(()=>{
        if(typeof _calcMetricasOp !== 'function') return '<div class="dash-list-item"><div class="name" style="color:var(--text2)">—</div></div>';
        const opsActivas = ops.filter(o=>o.estado==='activa');
        const necesitan  = opsActivas
          .map(o=>({...o,..._calcMetricasOp(o.id)}))
          .filter(o=>o.diasInactiva!==null&&o.diasInactiva>30)
          .sort((a,b)=>b.diasInactiva-a.diasInactiva)
          .slice(0,5);
        if(!necesitan.length) return `<div class="dash-list-item"><div class="name" style="color:var(--green)">✅ Todas activas — Ninguna inactiva</div></div>`;
        return necesitan.map(o=>{
          const niv=_nivelActividadOp(o.diasInactiva,o.totalReservas);
          return `<div class="dash-list-item">
            <div>
              <div class="name">${o.nombre} ${o.apellido}</div>
              <div class="sub">${o.gabinete||o.ciudad||'—'} · ${o.diasInactiva}d sin reservar</div>
            </div>
            <span style="color:${niv.color};font-weight:700;font-size:12px">${niv.icon} ${niv.txt}</span>
          </div>`;
        }).join('');
      })()}
      <div style="text-align:right;margin-top:12px">
        <button class="action-btn" onclick="navigate('operadoras')">Ver todas →</button>
      </div>
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
