/* ══════════════════════════════════
   PAGOS
══════════════════════════════════ */
const PAGO_ESTADOS = {
  pendiente:     {label:'Pendiente',      badge:'badge-gray',   icon:'⏳'},
  sena_pendiente:{label:'Seña Pendiente', badge:'badge-yellow', icon:'💰'},
  sena_abonada:  {label:'Seña Abonada',   badge:'badge-blue',   icon:'✅'},
  validado:      {label:'Validado',       badge:'badge-green',  icon:'🔒'},
  rechazado:     {label:'Rechazado',      badge:'badge-red',    icon:'❌'},
  deuda_vencida: {label:'Deuda Vencida',  badge:'badge-red',    icon:'🚨'},
};

function badgePago(e){
  const st = PAGO_ESTADOS[e];
  if(!st) return `<span class="badge badge-gray">${e}</span>`;
  return `<span class="badge ${st.badge}">${st.icon} ${st.label}</span>`;
}

function tieneDeudaVencida(operadoraId){
  const pagos = DB.get('pagos')||[];
  return pagos.some(p => p.operadoraId===parseInt(operadoraId) && p.estado==='deuda_vencida');
}

function reservaPuedeConfirmarse(reservaId){
  const r = (DB.get('reservas')||[]).find(x=>x.id===reservaId);
  if(!r) return {puede:false, motivo:'Reserva no encontrada'};
  const pagos = (DB.get('pagos')||[]).filter(p=>p.reservaId===reservaId);

  // Check deuda vencida del operador
  if(tieneDeudaVencida(r.operadoraId)){
    const op = getOp(r.operadoraId);
    return {puede:false, motivo:`La operadora ${op?.nombre||''} tiene deuda vencida sin regularizar.`};
  }

  // Check seña obligatoria
  const pagoConSena = pagos.find(p=>p.senaRequerida>0);
  if(pagoConSena && pagoConSena.senaAbonada < pagoConSena.senaRequerida){
    const falta = pagoConSena.senaRequerida - pagoConSena.senaAbonada;
    return {puede:false, motivo:`Seña pendiente: faltan ${falta.toLocaleString()} ${pagoConSena.moneda} para liberar.`};
  }

  return {puede:true, motivo:'Sin bloqueos financieros detectados.'};
}

let pagoFilter = {search:'', estado:''};

function renderPagos(){
  const pagos = DB.get('pagos')||[];
  const hoy = today();

  // Alertas
  const deudas = pagos.filter(p=>p.estado==='deuda_vencida');
  const senasPend = pagos.filter(p=>p.estado==='sena_pendiente');
  let alertsHTML = '';
  if(deudas.length) alertsHTML += `<div class="alert-banner danger"><span class="ab-icon">🚨</span><strong>${deudas.length} deuda${deudas.length>1?'s':''} vencida${deudas.length>1?'s':''}</strong> — Requieren atención inmediata.</div>`;
  if(senasPend.length) alertsHTML += `<div class="alert-banner warn"><span class="ab-icon">💰</span><strong>${senasPend.length} seña${senasPend.length>1?'s':''} pendiente${senasPend.length>1?'s':''}</strong> — Esperando confirmación.</div>`;
  document.getElementById('pagosAlerts').innerHTML = alertsHTML;

  // Summary financiero
  const totalPendiente = pagos.filter(p=>['pendiente','sena_pendiente','sena_abonada'].includes(p.estado))
    .reduce((s,p)=>s+(p.saldoPendiente||0),0);
  const totalValidado = pagos.filter(p=>p.estado==='validado').reduce((s,p)=>s+(p.montoTotal||0),0);
  const totalSenas = pagos.filter(p=>p.senaAbonada>0).reduce((s,p)=>s+(p.senaAbonada||0),0);
  document.getElementById('finSummary').innerHTML = `
    <div class="fin-cell"><div class="fc-label">Saldo Pendiente</div><div class="fc-value" style="color:var(--yellow)">${totalPendiente.toLocaleString()} UYU</div></div>
    <div class="fin-cell"><div class="fc-label">Señas Cobradas</div><div class="fc-value" style="color:var(--blue)">${totalSenas.toLocaleString()} UYU</div></div>
    <div class="fin-cell"><div class="fc-label">Total Validado</div><div class="fc-value" style="color:var(--green)">${totalValidado.toLocaleString()} UYU</div></div>`;

  const filtered = pagos.filter(p=>{
    const q = pagoFilter.search.toLowerCase();
    const op = getOp(p.operadoraId); const res = (DB.get('reservas')||[]).find(r=>r.id===p.reservaId);
    const ms = !q || p.codigo.toLowerCase().includes(q)
      || (op&&(op.nombre+' '+op.apellido).toLowerCase().includes(q))
      || (res&&res.codigo.toLowerCase().includes(q));
    return ms && (!pagoFilter.estado || p.estado===pagoFilter.estado);
  }).sort((a,b)=>b.id-a.id);

  const tbody = document.getElementById('pagosTableBody');
  if(!filtered.length){
    tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="icon">💳</div><h3>Sin pagos</h3><p>No hay pagos que coincidan.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p=>{
    const op = getOp(p.operadoraId);
    const res = (DB.get('reservas')||[]).find(r=>r.id===p.reservaId);
    const progreso = p.montoTotal>0 ? Math.round(((p.senaAbonada||0)/p.montoTotal)*100) : 0;
    return `<tr>
      <td><span style="font-family:monospace;color:var(--accent);font-size:11px">${p.codigo}</span></td>
      <td><span class="bold">${op?op.nombre+' '+op.apellido:'—'}</span></td>
      <td>${res?`<button class="action-btn" onclick="showResFicha(${res.id})">${res.codigo}</button>`:'—'}</td>
      <td><span style="font-size:12px;color:var(--text2);text-transform:capitalize">${p.tipo||'—'}</span></td>
      <td><strong>${(p.montoTotal||0).toLocaleString()}</strong> ${p.moneda}</td>
      <td>${p.senaRequerida>0
        ? `<span style="color:var(--blue)">${(p.senaAbonada||0).toLocaleString()} / ${p.senaRequerida.toLocaleString()}</span>`
        : `<span style="color:var(--text3)">—</span>`}</td>
      <td><span style="color:${p.saldoPendiente>0?'var(--yellow)':'var(--green)'}"><strong>${(p.saldoPendiente||0).toLocaleString()}</strong></span></td>
      <td>${badgePago(p.estado)}</td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="showPagoFicha(${p.id})">Ver</button>
        ${canEdit()?`<button class="action-btn" onclick="openPagoModal(0,${p.id})" style="margin-left:4px">Editar</button>`:''}
      </td></tr>`;
  }).join('');
}

function filterPagos(v){pagoFilter.search=v;renderPagos();}
function filterPagoEstado(v){pagoFilter.estado=v;renderPagos();}

function showPagoFicha(id){
  const p = (DB.get('pagos')||[]).find(x=>x.id===id); if(!p)return;
  const op = getOp(p.operadoraId);
  const res = (DB.get('reservas')||[]).find(r=>r.id===p.reservaId);
  const hist = (DB.get('pagos_historial')||[]).filter(h=>h.pagoId===id).sort((a,b)=>b.ts.localeCompare(a.ts));
  const progreso = p.montoTotal>0 ? Math.round(((p.senaAbonada||0)/p.montoTotal)*100) : 0;

  // Status bar steps
  const steps = [
    {key:'pendiente',label:'Pendiente'},
    {key:'sena_pendiente',label:'Seña req.'},
    {key:'sena_abonada',label:'Seña abonada'},
    {key:'validado',label:'Validado'},
  ];
  const isRechazado = ['rechazado','deuda_vencida'].includes(p.estado);
  const curIdx = steps.findIndex(s=>s.key===p.estado);

  const statusBar = `<div class="pago-status-bar">
    ${steps.map((s,i)=>{
      let cls = i < curIdx ? 'done' : i === curIdx ? 'active' : '';
      if(isRechazado && i === curIdx) cls = 'rejected';
      return `<div class="pago-step ${cls}">${s.label}</div>`;
    }).join('')}
    ${isRechazado ? `<div class="pago-step rejected" style="flex:0.5">${PAGO_ESTADOS[p.estado]?.label}</div>` : ''}
  </div>`;

  navigate('pago-ficha');
  document.getElementById('fichaPagoContent').innerHTML = `
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar" style="background:linear-gradient(135deg,var(--blue),#2050a0)">${PAGO_ESTADOS[p.estado]?.icon||'💳'}</div>
        <div class="ficha-title">
          <h2>${p.codigo}</h2>
          <p>${op?op.nombre+' '+op.apellido:'—'} · ${res?res.codigo:'—'}</p>
        </div>
      </div>
      <div class="ficha-actions">
        ${badgePago(p.estado)}
        ${canEdit()?`<button class="btn-secondary" onclick="openPagoModal(0,${p.id})">✏️ Editar</button>`:''}
        ${isSuperAdmin()?`<button class="btn-danger" onclick="deletePago(${p.id})">🗑</button>`:''}
      </div>
    </div>
    ${statusBar}
    <div class="ficha-grid">
      <div class="info-card">
        <h4>📋 Datos del Pago</h4>
        ${ir('Código',`<span style="font-family:monospace;color:var(--accent)">${p.codigo}</span>`)}
        ${ir('Operadora',op?`<button class="action-btn" onclick="showOpFicha(${p.operadoraId})">${op.nombre} ${op.apellido}</button>`:'—')}
        ${ir('Reserva',res?`<button class="action-btn" onclick="showResFicha(${p.reservaId})">${res.codigo}</button>`:'—')}
        ${ir('Tipo',p.tipo||'—')} ${ir('Estado',badgePago(p.estado))}
        ${ir('Fecha pago',fmtDate(p.fechaPago))}
        ${ir('Comprobante',p.comprobante||'—')}
      </div>
      <div class="info-card">
        <h4>💰 Detalle Financiero</h4>
        ${ir('Monto Total',`<strong>${(p.montoTotal||0).toLocaleString()} ${p.moneda}</strong>`)}
        ${ir('Seña Requerida',`${(p.senaRequerida||0).toLocaleString()} ${p.moneda}`)}
        ${ir('Seña Abonada',`<span style="color:var(--green);font-weight:700">${(p.senaAbonada||0).toLocaleString()} ${p.moneda}</span>`)}
        ${ir('Saldo Pendiente',`<span style="color:${p.saldoPendiente>0?'var(--yellow)':'var(--green)'}"><strong>${(p.saldoPendiente||0).toLocaleString()} ${p.moneda}</strong></span>`)}
        <div style="margin-top:12px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:6px;font-weight:700">PROGRESO DEL COBRO</div>
          <div class="progress-wrap"><div class="progress-bar" style="width:${progreso}%;background:${progreso>=100?'var(--green)':'var(--blue)'}"></div></div>
          <div style="font-size:12px;color:var(--text2);margin-top:6px">${progreso}% abonado</div>
        </div>
      </div>
      <div class="info-card full">
        <h4>📝 Observaciones</h4>
        <div class="obs-text">${p.obs||'Sin observaciones.'}</div>
      </div>
      ${hist.length?`<div class="info-card full">
        <h4>🕐 Historial (${hist.length})</h4>
        <ul class="timeline">${hist.map(h=>`<li class="timeline-item">
          <div class="timeline-dot" style="background:var(--blue)">${PAGO_ESTADOS[h.estadoNuevo]?.icon||'→'}</div>
          <div class="timeline-content">
            <div class="tc-head">
              <span class="tc-title">${PAGO_ESTADOS[h.estadoPrevio]?.label||h.estadoPrevio||'Creación'} → ${PAGO_ESTADOS[h.estadoNuevo]?.label||h.estadoNuevo}</span>
              <span class="tc-date">${fmtDate(h.ts.split('T')[0])} ${h.ts.split('T')[1]?.slice(0,5)||''}</span>
            </div>
            ${h.motivo?`<div class="tc-body">${h.motivo}</div>`:''}
          </div></li>`).join('')}</ul>
      </div>`:''}
    </div>`;
}

function openPagoModal(reservaIdPrefill, pagoId){
  // Populate reservas select
  const reservas = DB.get('reservas')||[];
  document.getElementById('pagoReservaId').innerHTML =
    '<option value="">— Seleccionar reserva —</option>' +
    reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)||r.estado==='confirmada')
      .map(r=>{
        const op=getOp(r.operadoraId);
        return `<option value="${r.id}">${r.codigo} — ${op?op.nombre+' '+op.apellido:''} (${r.tipo==='jornada'?fmtDate(r.fechaJornada):fmtDate(r.fechaInicio)})</option>`;
      }).join('');

  document.getElementById('modalPagoTitle').textContent = pagoId ? 'Editar Pago' : 'Registrar Pago';
  document.getElementById('pagoOpInfo').style.display='none';
  document.getElementById('pagoSaldoWrap').style.display='none';

  if(pagoId){
    const p=(DB.get('pagos')||[]).find(x=>x.id===pagoId); if(!p)return;
    sv('pagoId',p.id); sv('pagoReservaId',p.reservaId); sv('pagoTipo',p.tipo);
    sv('pagoEstado',p.estado); sv('pagoMontoTotal',p.montoTotal||'');
    sv('pagoMoneda',p.moneda||'UYU'); sv('pagoSenaRequerida',p.senaRequerida||'');
    sv('pagoSenaAbonada',p.senaAbonada||''); sv('pagoFecha',p.fechaPago||'');
    sv('pagoComprobante',p.comprobante||''); sv('pagoObs',p.obs||'');
    onPagoReservaChange(); calcSaldoPago();
  } else {
    sv('pagoId',''); sv('pagoReservaId',reservaIdPrefill||'');
    sv('pagoTipo','jornada'); sv('pagoEstado','pendiente');
    sv('pagoMontoTotal',''); sv('pagoMoneda','UYU');
    sv('pagoSenaRequerida',''); sv('pagoSenaAbonada','');
    sv('pagoFecha',today()); sv('pagoComprobante',''); sv('pagoObs','');
    if(reservaIdPrefill) onPagoReservaChange();
  }
  openModal('modalPago');
}

function onPagoReservaChange(){
  const resId = parseInt(gv('pagoReservaId'));
  const infoEl = document.getElementById('pagoOpInfo');
  const infoText = document.getElementById('pagoOpInfoText');
  if(!resId){infoEl.style.display='none';return;}
  const res = (DB.get('reservas')||[]).find(r=>r.id===resId);
  if(!res){infoEl.style.display='none';return;}
  const op = getOp(res.operadoraId);
  const hasDeuda = tieneDeudaVencida(res.operadoraId);
  infoText.innerHTML = `<span style="color:var(--text3)">Reserva:</span> ${res.codigo} · 
    <span style="color:var(--text3)">Operadora:</span> <strong>${op?op.nombre+' '+op.apellido:'—'}</strong> · 
    <span style="color:var(--text3)">Depto:</span> ${res.deptLogistica||'—'}
    ${hasDeuda?` <span class="badge badge-red" style="margin-left:8px">🚨 Deuda Vencida</span>`:''}`;
  infoEl.style.display='block';
  // Pre-fill monto from reserva
  if(!gv('pagoMontoTotal') && res.monto) sv('pagoMontoTotal', res.monto);
  if(!gv('pagoMoneda') && res.moneda) sv('pagoMoneda', res.moneda);
  calcSaldoPago();
}

function calcSaldoPago(){
  const total = parseFloat(gv('pagoMontoTotal'))||0;
  const senaAb = parseFloat(gv('pagoSenaAbonada'))||0;
  const saldo = total - senaAb;
  const wrapEl = document.getElementById('pagoSaldoWrap');
  const saldoEl = document.getElementById('pagoSaldoText');
  if(total>0){
    const pct = Math.round((senaAb/total)*100);
    wrapEl.style.display='block';
    saldoEl.innerHTML = `Saldo pendiente: <strong style="color:${saldo>0?'var(--yellow)':'var(--green)'}">${saldo.toLocaleString()}</strong> · Seña: ${pct}% abonada`;
  } else {
    wrapEl.style.display='none';
  }
}

async function savePago(){
  const pagos = DB.get('pagos')||[];
  const id = gv('pagoId');
  const resId = parseInt(gv('pagoReservaId'));
  if(!resId){showToast('⚠️ Seleccioná una reserva','warn');return;}
  const res = (DB.get('reservas')||[]).find(r=>r.id===resId);
  if(!res){showToast('⚠️ Reserva no encontrada','warn');return;}

  const montoTotal = parseFloat(gv('pagoMontoTotal'))||0;
  const senaReq = parseFloat(gv('pagoSenaRequerida'))||0;
  const senaAb  = parseFloat(gv('pagoSenaAbonada'))||0;
  const data = {
    reservaId: resId,
    operadoraId: res.operadoraId,
    tipo: gv('pagoTipo'),
    estado: gv('pagoEstado'),
    montoTotal, moneda: gv('pagoMoneda'),
    senaRequerida: senaReq, senaAbonada: senaAb,
    saldoPendiente: Math.max(0, montoTotal - senaAb),
    fechaPago: gv('pagoFecha'),
    comprobante: gv('pagoComprobante').trim(),
    obs: gv('pagoObs').trim(),
  };

  const apiPayload = {
    reserva_id: data.reservaId, operadora_id: data.operadoraId,
    tipo: data.tipo, estado: data.estado,
    monto_total: data.montoTotal, moneda: data.moneda,
    sena_requerida: data.senaRequerida, sena_abonada: data.senaAbonada,
    saldo_pendiente: data.saldoPendiente,
    fecha_pago: data.fechaPago||null, comprobante: data.comprobante, obs: data.obs
  };
  try {
    let saved;
    if(id){
      saved = await api('/api/pagos/'+id, {method:'PUT', body:JSON.stringify(apiPayload)});
      showToast('✅ Pago actualizado');
    } else {
      saved = await api('/api/pagos', {method:'POST', body:JSON.stringify(apiPayload)});
      showToast('✅ Pago registrado · '+(saved.codigo||''));
    }
    // Recargar pagos desde API
    const allPagos = await api('/api/pagos');
    const pagosMapeados = allPagos.map(p=>({id:p.id, codigo:p.codigo, reservaId:p.reserva_id,
      operadoraId:p.operadora_id, tipo:p.tipo, estado:p.estado,
      montoTotal:parseFloat(p.monto_total)||0, moneda:p.moneda||'UYU',
      senaRequerida:parseFloat(p.sena_requerida)||0, senaAbonada:parseFloat(p.sena_abonada)||0,
      saldoPendiente:parseFloat(p.saldo_pendiente)||0,
      fechaPago:p.fecha_pago, comprobante:p.comprobante||'', obs:p.obs||'',
      creadaEn:p.created_at?.split('T')[0]||''}));
    DB.set('pagos', pagosMapeados);
    const pagoCaja = pagosMapeados.find(p=>parseInt(p.id)===parseInt(saved.id||id));
    if(typeof sincronizarCajaDesdePago==='function'){
      const creados = sincronizarCajaDesdePago(pagoCaja);
      if(creados) showToast(`✅ Caja actualizada: ${creados} ingreso${creados>1?'s':''}`);
    }
  } catch(e) { showToast('❌ Error: '+e.message,'error'); return; }
  // Auto-encolar notificación WhatsApp
  const mapPagoPlantilla={validado:'pago_validado',sena_pendiente:'sena_pendiente'};
  if(mapPagoPlantilla[data.estado]){
    encolarNotificacion(mapPagoPlantilla[data.estado], data.operadoraId, {reservaId:data.reservaId, monto:data.montoTotal, moneda:data.moneda});
  }
  closeModal('modalPago');
  renderPagos();
  updatePagosBadge();
}

async function deletePago(id){
  if(!confirm('¿Eliminar este pago?'))return;
  try{
    await api('/api/pagos/'+id,{method:'DELETE'});
    const allPagos = await api('/api/pagos');
    DB.set('pagos', allPagos.map(p=>({id:p.id, codigo:p.codigo, reservaId:p.reserva_id,
      operadoraId:p.operadora_id, tipo:p.tipo, estado:p.estado,
      montoTotal:parseFloat(p.monto_total)||0, moneda:p.moneda||'UYU',
      senaRequerida:parseFloat(p.sena_requerida)||0, senaAbonada:parseFloat(p.sena_abonada)||0,
      saldoPendiente:parseFloat(p.saldo_pendiente)||0,
      fechaPago:p.fecha_pago, comprobante:p.comprobante||'', obs:p.obs||'',
      creadaEn:p.created_at?.split('T')[0]||''})));
    showToast('🗑 Pago eliminado');navigate('pagos');updatePagosBadge();
  }catch(e){showToast('❌ Error: '+e.message,'error');}
}

function updatePagosBadge(){
  const pagos=DB.get('pagos')||[];
  const count=pagos.filter(p=>['deuda_vencida','sena_pendiente'].includes(p.estado)).length;
  const badge=document.getElementById('navBadgePagos');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}
