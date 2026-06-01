/* ══════════════════════════════════
   RESERVAS — Estados, badges, helpers
══════════════════════════════════ */
const RES_ESTADOS = {
  solicitud_recibida:  {label:'Solicitud Recibida',  badge:'badge-gray',   icon:'📥'},
  pendiente_aprobacion:{label:'Pendiente Aprobación',badge:'badge-yellow',  icon:'⏳'},
  aprobada:            {label:'Aprobada',             badge:'badge-purple', icon:'✅'},
  confirmada:          {label:'Confirmada',           badge:'badge-blue',   icon:'🔒'},
  rechazada:           {label:'Rechazada',            badge:'badge-red',    icon:'❌'},
  cancelada:           {label:'Cancelada',            badge:'badge-red',    icon:'🚫'},
  reprogramada:        {label:'Reprogramada',         badge:'badge-rose',   icon:'🔄'},
};
const ESTADOS_ACTIVOS = ['solicitud_recibida','pendiente_aprobacion','aprobada','confirmada'];

function badgeRes(e){
  const st=RES_ESTADOS[e];
  if(!st) return `<span class="badge badge-gray">${e}</span>`;
  return `<span class="badge ${st.badge}">${st.icon} ${st.label}</span>`;
}
function badgeResTipo(t){
  const m={mensual:'badge-purple',semanal:'badge-blue',jornada:'badge-rose'};
  const l={mensual:'Mensual',semanal:'Semanal',jornada:'Jornada'};
  return `<span class="badge ${m[t]||'badge-gray'}">${l[t]||t}</span>`;
}
function getOp(id){return (DB.get('operadoras')||[]).find(o=>o.id===parseInt(id));}
function getMaq(id){return (DB.get('maquinas')||[]).find(m=>m.id===parseInt(id));}

/* Disponibilidad — considera bloqueos logísticos */
function getReglaLogistica(departamento){
  const reglas = DB.get('reglas_logisticas')||[];
  const r = reglas.find(x=>x.departamento===departamento);
  if(r && r.activa) return r;
  return {diasAntes:2, diasDespues:2, mismoDia:false}; // default
}

function calcularRangoBloqueo(fechaInicio, fechaFin, departamento){
  // Guardar contra fechas nulas o inválidas
  if(!fechaInicio || !fechaFin) return {bloqueDesde:fechaInicio||'', bloqueHasta:fechaFin||'', diasAntes:2, diasDespues:2};
  const regla = getReglaLogistica(departamento);
  if(regla.mismoDia) return {bloqueDesde:fechaInicio, bloqueHasta:fechaFin};
  const desde = new Date(fechaInicio+'T12:00:00');
  const hasta  = new Date(fechaFin+'T12:00:00');
  if(isNaN(desde.getTime()) || isNaN(hasta.getTime())) return {bloqueDesde:fechaInicio, bloqueHasta:fechaFin, diasAntes:2, diasDespues:2};
  desde.setDate(desde.getDate() - regla.diasAntes);
  hasta.setDate(hasta.getDate() + regla.diasDespues);
  return {
    bloqueDesde: desde.toISOString().split('T')[0],
    bloqueHasta: hasta.toISOString().split('T')[0],
    diasAntes: regla.diasAntes,
    diasDespues: regla.diasDespues,
  };
}

function checkDisponibilidad(maquinaId, fechaInicio, fechaFin, excluirResId, departamento){
  const maq=getMaq(maquinaId);
  if(!maq) return {ok:false,msg:'Máquina no encontrada.'};
  if(maq.tipoOperativo==='solo_venta') return {ok:false,msg:`⛔ "${maq.nombre}" está marcada como solo venta y no se puede alquilar.`};
  if(maq.estado==='mantenimiento') return {ok:false,msg:`⚠️ "${maq.nombre}" está en mantenimiento.`};
  if(maq.estado==='fuera_servicio') return {ok:false,msg:`⛔ "${maq.nombre}" está fuera de servicio.`};
  if(!fechaInicio||!fechaFin) return {ok:true,msg:''};

  // Rango real considerando bloqueo logístico del solicitante
  const miRango = calcularRangoBloqueo(fechaInicio, fechaFin, departamento||'');

  const reservas = DB.get('reservas')||[];
  const conflictos = reservas.filter(r=>{
    if(r.maquinaId!==parseInt(maquinaId)) return false;
    if(excluirResId&&r.id===parseInt(excluirResId)) return false;
    if(!ESTADOS_ACTIVOS.includes(r.estado)) return false;
    // Rango real de la reserva existente
    const suRango = calcularRangoBloqueo(r.fechaInicio, r.fechaFin, r.deptLogistica||'');
    // Overlap entre rangos reales
    return miRango.bloqueDesde <= suRango.bloqueHasta && miRango.bloqueHasta >= suRango.bloqueDesde;
  });

  if(conflictos.length){
    const c=conflictos[0]; const op=getOp(c.operadoraId);
    const sr=calcularRangoBloqueo(c.fechaInicio,c.fechaFin,c.deptLogistica||'');
    return {ok:false,msg:`⛔ Conflicto logístico: la máquina tiene bloqueo entre ${fmtDate(sr.bloqueDesde)} y ${fmtDate(sr.bloqueHasta)} (${c.codigo}${op?' — '+op.nombre:''}).`};
  }

  // Informe de bloqueo propio
  const regla = getReglaLogistica(departamento||'');
  const bloqMsg = regla.mismoDia
    ? `✅ Disponible. Regla ágil: bloqueo solo el día de jornada.`
    : `✅ Disponible. Bloqueo: ${miRango.diasAntes||2}d antes (${fmtDate(miRango.bloqueDesde)}) + ${miRango.diasDespues||2}d después (${fmtDate(miRango.bloqueHasta)}).`;
  return {ok:true, msg:bloqMsg, rango:miRango};
}

function getAlertas(){
  const reservas=DB.get('reservas')||[]; const hoy=today();
  return {
    urgentes:reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin<hoy),
    proximas:reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin>=hoy&&daysDiff(hoy,r.fechaFin)<=5),
    sinAprobacion:reservas.filter(r=>r.estado==='solicitud_recibida'),
  };
}

/* Listado */
let resFilter={search:'',estado:'',tipo:'',control:''};

function renderReservasOperadoraPanel(reservas){
  if(!isOperadoraUser())return '';
  const activas=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado));
  const proximas=activas.slice().sort((a,b)=>(a.fechaJornada||a.fechaInicio||'').localeCompare(b.fechaJornada||b.fechaInicio||'')).slice(0,4);
  return `<div class="table-container" style="margin-bottom:16px">
    <div class="table-header">
      <div>
        <h3>📌 Mis reservas activas</h3>
        <p style="font-size:13px;color:var(--text2);margin-top:4px">Tus solicitudes y reservas aprobadas aparecen acá primero.</p>
      </div>
      <button class="btn-add" onclick="openResModal()">+ Solicitar reserva</button>
    </div>
    ${activas.length?`
      <div class="docs-summary-grid" style="margin-bottom:12px">
        <div class="docs-summary-card"><div class="label">Activas</div><div class="value">${activas.length}</div></div>
        <div class="docs-summary-card"><div class="label">Solicitudes</div><div class="value">${activas.filter(r=>r.estado==='solicitud_recibida').length}</div></div>
        <div class="docs-summary-card"><div class="label">Confirmadas</div><div class="value">${activas.filter(r=>r.estado==='confirmada').length}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        ${proximas.map(r=>{
          const maq=getMaq(r.maquinaId);
          const fecha=r.tipo==='jornada'?r.fechaJornada:r.fechaInicio;
          return `<button class="dash-list-item" style="text-align:left;width:100%;cursor:pointer" onclick="showResFicha(${r.id})">
            <div><div class="name">${escapeHTML(maq?maq.nombre:'Máquina')}</div><div class="sub">${escapeHTML(r.codigo)} · ${fmtDate(fecha)}</div></div>
            ${badgeRes(r.estado)}
          </button>`;
        }).join('')}
      </div>`:`<div class="empty-state" style="padding:22px"><div class="icon">📅</div><h3>Sin reservas activas</h3><p>Usá “Solicitar reserva” para pedir una máquina.</p></div>`}
  </div>`;
}

function renderReservas(){
  const todasReservas=DB.get('reservas')||[]; const hoy=today();
  const reservas=isOperadoraUser()
    ? todasReservas.filter(r=>parseInt(r.operadoraId)===parseInt(currentUser?.operadora_id))
    : todasReservas;
  const alertas=getAlertas();
  if(typeof renderReservasAutomationSummary==='function')renderReservasAutomationSummary();
  let alertsHTML='';
  if(alertas.urgentes.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🚨</span><div><strong>${alertas.urgentes.length} reserva${alertas.urgentes.length>1?'s':''} vencida${alertas.urgentes.length>1?'s':''}</strong> — Actualizá el estado.</div></div>`;
  if(alertas.sinAprobacion.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">📥</span><div><strong>${alertas.sinAprobacion.length} solicitud${alertas.sinAprobacion.length>1?'es':''} sin revisar</strong> — Requieren aprobación o rechazo.</div></div>`;
  if(alertas.proximas.length) alertsHTML+=`<div class="alert-banner info"><span class="ab-icon">⏰</span><div><strong>${alertas.proximas.length} reserva${alertas.proximas.length>1?'s':''}</strong> vence${alertas.proximas.length>1?'n':''} en los próximos 5 días.</div></div>`;
  if(typeof updateReservasAutomatizacionBadge==='function'){
    const bloqueadas=updateReservasAutomatizacionBadge();
    if(bloqueadas) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⛔</span><div><strong>${bloqueadas} reserva${bloqueadas>1?'s':''} bloqueada${bloqueadas>1?'s':''}</strong> — Revisá documentos, contrato, pagos o logística antes de confirmar.</div></div>`;
  }
  document.getElementById('resAlerts').innerHTML=renderReservasOperadoraPanel(reservas)+alertsHTML;

  const filtered=reservas.filter(r=>{
    const q=resFilter.search.toLowerCase();
    const op=getOp(r.operadoraId); const maq=getMaq(r.maquinaId);
    const ms=!q||r.codigo.toLowerCase().includes(q)||(op&&(op.nombre+' '+op.apellido).toLowerCase().includes(q))||(maq&&maq.nombre.toLowerCase().includes(q));
    const control=typeof validarReservaAutomatica==='function'?validarReservaAutomatica(r).estado:'';
    return ms&&(!resFilter.estado||r.estado===resFilter.estado)&&(!resFilter.tipo||r.tipo===resFilter.tipo)&&(!resFilter.control||control===resFilter.control);
  }).sort((a,b)=>{
    const fa=a.fechaJornada||a.fechaInicio||''; const fb=b.fechaJornada||b.fechaInicio||'';
    return fb.localeCompare(fa);
  });

  const tbody=document.getElementById('resTableBody');
  if(!filtered.length){tbody.innerHTML=`<tr><td colspan="10"><div class="empty-state"><div class="icon">📅</div><h3>Sin reservas</h3><p>No hay reservas que coincidan. ${isOperadoraUser()?'<button class="btn-add" onclick="openResModal()" style="margin-left:8px">+ Solicitar reserva</button>':''}</p></div></td></tr>`;return;}

  tbody.innerHTML=filtered.map(r=>{
    const op=getOp(r.operadoraId); const maq=getMaq(r.maquinaId);
    const fechaDisplay=r.tipo==='jornada'?r.fechaJornada:r.fechaInicio;
    const isVencida=ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin<hoy;
    return `<tr style="${isVencida?'background:rgba(224,92,107,0.04)':''}">
      <td><span style="font-family:monospace;color:var(--accent);font-size:11px">${r.codigo}</span></td>
      <td><span class="bold">${op?op.nombre+' '+op.apellido:'—'}</span><br><span style="font-size:11px;color:var(--text3)">${op?op.ciudad:''}</span></td>
      <td>${maq?maq.nombre:'—'}<br><span style="font-size:11px;color:var(--text3)">${maq?maq.codigo:''}</span></td>
      <td>${badgeResTipo(r.tipo)}</td>
      <td>${isVencida?`<span style="color:var(--red)">${fmtDate(fechaDisplay)}</span>`:fmtDate(fechaDisplay)}</td>
      <td>${r.tipo!=='jornada'?(isVencida?`<span style="color:var(--red)">${fmtDate(r.fechaFin)} ⚠️</span>`:fmtDate(r.fechaFin)):'—'}</td>
      <td><span style="font-size:12px;color:var(--text2)">${r.deptLogistica||'—'}</span></td>
      <td>${typeof renderReservaAutomatizacionBadge==='function'?renderReservaAutomatizacionBadge(r):'—'}</td>
      <td>${badgeRes(r.estado)}</td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="showResFicha(${r.id})">Ver</button>
        ${canEdit()?`<button class="action-btn" onclick="abrirCambioEstado(${r.id})" style="margin-left:4px">Estado</button>`:''}
      </td></tr>`;
  }).join('');
}
function filterReservas(v){resFilter.search=v;renderReservas();}
function filterResEstado(v){resFilter.estado=v;renderReservas();}
function filterResTipo(v){resFilter.tipo=v;renderReservas();}
function filterResControl(v){resFilter.control=v;renderReservas();}

/* Ficha */
function showResFicha(id){
  const r=(DB.get('reservas')||[]).find(x=>x.id===id); if(!r)return;
  const op=getOp(r.operadoraId); const maq=getMaq(r.maquinaId);
  const hist=(DB.get('reservas_historial')||[]).filter(h=>h.reservaId===id).sort((a,b)=>b.ts.localeCompare(a.ts));
  const hoy=today();
  const isVencida=ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin<hoy;
  const diasRestantes=r.fechaFin&&r.fechaFin>=hoy?daysDiff(hoy,r.fechaFin):null;
  const st=RES_ESTADOS[r.estado]||{};
  navigate('reserva-ficha');
  document.getElementById('fichaResContent').innerHTML=`
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar rsv">${st.icon||'📅'}</div>
        <div class="ficha-title"><h2>${r.codigo}</h2><p>${op?op.nombre+' '+op.apellido:'—'} · ${maq?maq.nombre:'—'}</p></div>
      </div>
      <div class="ficha-actions">
        ${badgeRes(r.estado)}
        ${canEdit()?`<button class="btn-secondary" onclick="openResModal(${r.id})">✏️ Editar</button>`:''}
        ${canEdit()?`<button class="btn-secondary" onclick="abrirCambioEstado(${r.id})">🔄 Cambiar Estado</button>`:''}
        ${isSuperAdmin()?`<button class="btn-danger" onclick="deleteReserva(${r.id})">🗑</button>`:''}
      </div>
    </div>
    ${isVencida?`<div class="alert-banner danger"><span class="ab-icon">🚨</span><strong>Reserva vencida</strong> — La fecha de fin ya pasó. Actualizá el estado.</div>`:''}
    ${diasRestantes!==null&&diasRestantes<=5&&!isVencida?`<div class="alert-banner warn"><span class="ab-icon">⏰</span><strong>Vence en ${diasRestantes} día${diasRestantes!==1?'s':''}</strong> — Coordiná renovación o cierre.</div>`:''}
    ${r.estado==='solicitud_recibida'?`<div class="alert-banner info"><span class="ab-icon">📥</span><strong>Solicitud pendiente de revisión</strong> — Aprobá o rechazá esta reserva.</div>`:''}
    ${(()=>{
      const viab = reservaPuedeConfirmarse(r.id);
      if(viab.puede) return `<div class="alert-banner" style="background:rgba(82,196,138,0.08);border:1px solid rgba(82,196,138,0.2)"><span class="ab-icon">✅</span><strong>Lista para confirmar</strong> — ${viab.motivo}</div>`;
      if(['aprobada','pendiente_aprobacion','solicitud_recibida'].includes(r.estado))
        return `<div class="alert-banner warn"><span class="ab-icon">⚙️</span><strong>Pendiente para confirmar:</strong> ${viab.motivo}</div>`;
      return '';
    })()}
    ${typeof renderReservaAutomatizacionPanel==='function'?renderReservaAutomatizacionPanel(r):''}
    <div class="ficha-grid">
      <div class="info-card">
        <h4>📋 Datos de la Reserva</h4>
        ${ir('Código',`<span style="font-family:monospace;color:var(--accent)">${r.codigo}</span>`)}
        ${ir('Operadora',op?`<button class="action-btn" onclick="showOpFicha(${r.operadoraId})">${op.nombre} ${op.apellido} — ${op.ciudad}</button>`:'—')}
        ${ir('Máquina',maq?`<button class="action-btn" onclick="showMaqFicha(${r.maquinaId})">${maq.nombre} (${maq.codigo})</button>`:'—')}
        ${ir('Tipo',badgeResTipo(r.tipo))}
        ${ir('Estado',badgeRes(r.estado))}
        ${ir('Registrada',fmtDate(r.creadaEn))}
      </div>
      <div class="info-card">
        <h4>📆 Período</h4>
        ${r.tipo==='jornada'
          ?ir('Fecha de Jornada',`<strong>${fmtDate(r.fechaJornada)}</strong>`)
          :ir('Fecha Inicio',fmtDate(r.fechaInicio))+ir('Fecha Fin',isVencida?`<span style="color:var(--red)">${fmtDate(r.fechaFin)} ⚠️</span>`:fmtDate(r.fechaFin))
        }
        ${diasRestantes!==null?ir('Días restantes',`<span style="color:var(--green);font-weight:700">${diasRestantes} días</span>`):''}
        ${ir('Monto',r.monto?`<strong>${r.monto.toLocaleString()} ${r.moneda}</strong>`:'—')}
      </div>
      <div class="info-card">
        <h4>🚚 Estado Logístico</h4>
        ${(()=>{
          const rango = calcularRangoBloqueo(r.fechaInicio, r.fechaFin, r.deptLogistica||'');
          const regla = getReglaLogistica(r.deptLogistica||'');
          return ir('Depto. Logístico', r.deptLogistica||'—')
            + ir('Tipo de bloqueo', regla.mismoDia
              ? `<span class="badge badge-green">⚡ Ágil / Mismo día</span>`
              : `<span class="badge badge-blue">📦 Extendido</span>`)
            + (regla.mismoDia ? '' :
              ir('Días bloqueados antes', regla.diasAntes+'d')
              + ir('Días bloqueados después', regla.diasDespues+'d'))
            + ir('Bloqueo desde', `<strong>${fmtDate(rango.bloqueDesde)}</strong>`)
            + ir('Bloqueo hasta', `<strong>${fmtDate(rango.bloqueHasta)}</strong>`);
        })()}
        ${r.bloqueLogistico
          ? `<div class="alert-banner warn" style="margin-top:10px;padding:8px 12px"><span class="ab-icon">⚙️</span> Bloqueo logístico activo</div>`
          : ''}
      </div>
      <div class="info-card">
        <h4>💳 Estado Financiero</h4>
        ${(()=>{
          const pagos = (DB.get('pagos')||[]).filter(p=>p.reservaId===r.id);
          if(!pagos.length) return `<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin pagos registrados. <button class="action-btn" onclick="openPagoModal(${r.id})">+ Registrar pago</button></div>`;
          const pago = pagos[pagos.length-1];
          const progreso = pago.montoTotal>0 ? Math.round((pago.senaAbonada/pago.montoTotal)*100) : 0;
          return ir('Estado pago', badgePago(pago.estado))
            + ir('Monto total', `${(pago.montoTotal||0).toLocaleString()} ${pago.moneda}`)
            + ir('Seña requerida', `${(pago.senaRequerida||0).toLocaleString()} ${pago.moneda}`)
            + ir('Seña abonada', `<span style="color:var(--green);font-weight:700">${(pago.senaAbonada||0).toLocaleString()} ${pago.moneda}</span>`)
            + ir('Saldo pendiente', `<span style="color:${pago.saldoPendiente>0?'var(--yellow)':'var(--green)'}"><strong>${(pago.saldoPendiente||0).toLocaleString()} ${pago.moneda}</strong></span>`)
            + `<div style="margin-top:8px">
                <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Progreso del pago</div>
                <div class="progress-wrap"><div class="progress-bar" style="width:${progreso}%;background:var(--green)"></div></div>
                <div style="font-size:11px;color:var(--text2);margin-top:4px">${progreso}% abonado</div>
               </div>`;
        })()}
        ${tieneDeudaVencida(r.operadoraId)
          ? `<div class="alert-banner danger" style="margin-top:10px;padding:8px 12px"><span class="ab-icon">🚨</span> Esta operadora tiene <strong>deuda vencida</strong></div>`
          : ''}
      </div>
      <div class="info-card">
        <h4>📝 Observaciones</h4>
        <div class="obs-text">${r.notas||'Sin observaciones.'}</div>
      </div>
      <div class="info-card full">
        <h4>🚚 Envío Vinculado</h4>
        ${(()=>{
          const envios=(DB.get('envios')||[]).filter(e=>e.reservaId===r.id);
          if(!envios.length) return `<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin envío registrado. ${canEdit()?`<button class="action-btn" onclick="openEnvioModal(${r.id})">+ Crear envío</button>`:'Sin envío creado.'}</div>`;
          return envios.map(e=>`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text)">${e.codigo}</div>
                <div style="font-size:12px;color:var(--text2);margin-top:2px">${e.departamento} — ${e.transportista||'Sin transportista'}</div>
                <div style="font-size:12px;color:var(--text3);margin-top:1px">Envío est.: ${fmtDate(e.fechaEnvioEst)} · Retiro est.: ${fmtDate(e.fechaRetiroEst)}</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                ${badgeEnvio(e.estado)}
                <button class="action-btn" onclick="showEnvioFicha(${e.id})">Ver</button>
              </div>
            </div>`).join('');
        })()}
      </div>
      ${renderReservaIncidenciasPlaceholder(r)}
      <div class="info-card full">
        <h4>🧾 Historial de estados</h4>
        ${hist.length
          ?`<ul class="timeline">${hist.map(h=>{const stH=RES_ESTADOS[h.estadoNuevo]||{};return `<li class="timeline-item">
            <div class="timeline-dot" style="background:var(--accent)">${stH.icon||'→'}</div>
            <div class="timeline-content">
              <div class="tc-head">
                <span class="tc-title">${RES_ESTADOS[h.estadoPrevio]?.label||h.estadoPrevio||'Creación'} → ${stH.label||h.estadoNuevo}</span>
                <span class="tc-date">${fmtDate(h.ts.split('T')[0])} ${h.ts.split('T')[1]?.slice(0,5)||''}</span>
              </div>
              ${h.motivo?`<div class="tc-body">${h.motivo}</div>`:''}
              <div class="tc-body" style="color:var(--text3);font-size:11px">${h.usuario}</div>
            </div></li>`;}).join('')}</ul>`
          :`<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin cambios de estado registrados.</div>`}
      </div>
    </div>`;
  cargarReservaIncidencias(r);
}

function renderReservaIncidenciasPlaceholder(r){
  const puedeCrear=(canEdit()||currentUser?.rol==='transportista'||isOperadoraUser())&&r.maquinaId;
  return `<div class="info-card full">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <h4>🚨 Incidencias técnicas de esta reserva</h4>
      ${puedeCrear?`<button class="btn-secondary" onclick="openIncidenciaMaquinaModal(${r.maquinaId},${r.id})">Registrar incidencia</button>`:''}
    </div>
    <div id="resIncidenciasBox-${r.id}" class="machine-incident-box">
      <div class="machine-ops-empty">Cargando incidencias...</div>
    </div>
  </div>`;
}

async function cargarReservaIncidencias(r){
  const box=document.getElementById('resIncidenciasBox-'+r.id);
  if(!box)return;
  if(!r.maquinaId){
    box.innerHTML='<div class="machine-ops-empty">Reserva sin máquina vinculada.</div>';
    return;
  }
  try{
    const rows=await api('/api/maquinas/'+r.maquinaId+'/incidencias');
    const relacionadas=rows.filter(i=>parseInt(i.reserva_id)===parseInt(r.id));
    if(!relacionadas.length){
      box.innerHTML='<div class="machine-ops-empty">Sin incidencias registradas para esta reserva.</div>';
      return;
    }
    box.innerHTML=relacionadas.map(i=>`<div class="machine-incident-row ${i.bloquea_reservas&&['abierta','en_revision'].includes(i.estado)?'blocking':''}">
      <div class="machine-incident-head">
        <div><strong>${escapeHTML(typeof incidenciaTipoLabel==='function'?incidenciaTipoLabel(i.tipo):i.tipo)}</strong> ${typeof incidenciaGravedadBadge==='function'?incidenciaGravedadBadge(i.gravedad):escapeHTML(i.gravedad)} ${typeof incidenciaEstadoBadge==='function'?incidenciaEstadoBadge(i.estado):escapeHTML(i.estado)} ${i.bloquea_reservas?'<span class="badge badge-red">Bloquea reservas</span>':''}</div>
        <small>${fmtDate(i.created_at)}${i.reportado_por_email?' · '+escapeHTML(i.reportado_por_email):''}</small>
      </div>
      <div class="machine-incident-desc">${escapeHTML(i.descripcion||'')}</div>
      <div class="machine-incident-meta">
        ${i.evidencia_url?`<a href="${escapeAttr(i.evidencia_url)}" target="_blank" rel="noopener">Ver evidencia</a>`:''}
      </div>
      ${i.resolucion?`<div class="machine-incident-resolution">Resolución: ${escapeHTML(i.resolucion)}</div>`:''}
      ${canEdit()&&['abierta','en_revision'].includes(i.estado)?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="action-btn" onclick="actualizarIncidenciaMaquina(${r.maquinaId},${i.id},'en_revision')">Marcar en revisión</button>
        <button class="action-btn" onclick="actualizarIncidenciaMaquina(${r.maquinaId},${i.id},'resuelta')">Cerrar resuelta</button>
        <button class="action-btn" onclick="actualizarIncidenciaMaquina(${r.maquinaId},${i.id},'descartada')">Descartar</button>
      </div>`:''}
    </div>`).join('');
  }catch(e){
    box.innerHTML='<div class="machine-ops-empty">No se pudieron cargar las incidencias de esta reserva.</div>';
  }
}

/* Modal nueva / editar */
function reservaMaquinaOption(m, opId){
  const ciudadOk=opId?validarCiudadReservaLocal(opId,m.id):{ok:true};
  const disabled=(m.estado==='mantenimiento'||m.estado==='fuera_servicio'||m.tipoOperativo==='solo_venta'||!ciudadOk.ok)?'disabled style="color:var(--text3)"':'';
  const lbl={disponible:'Disponible',reservada:'Reservada',mantenimiento:'⚠️ Mantenimiento',fuera_servicio:'⛔ Fuera servicio'}[m.estado]||m.estado;
  const uso=m.tipoOperativo==='solo_venta'?' · Solo venta':m.tipoOperativo==='base_ciudad'?` · Base ${m.ciudadBase||m.ubicacion||''}`:'';
  const motivo=!ciudadOk.ok?` · ${ciudadOk.msg}`:'';
  return `<option value="${m.id}" ${disabled}>${m.codigo} — ${m.nombre} [${lbl}${uso}${motivo}]</option>`;
}

function filterMaquinasReservaByOperadora(){
  const opId=parseInt(gv('resOperadoraId'))||0;
  document.getElementById('resMaquinaId').innerHTML=
    '<option value="">— Seleccionar máquina disponible —</option>'+
    (DB.get('maquinas')||[]).map(m=>reservaMaquinaOption(m,opId)).join('');
  onResSelectionChange();
}

function filterOperadorasReservaByDepto(){
  const dept=gv('resDeptoFilter');
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa'&&(!dept||o.departamento===dept));
  document.getElementById('resOperadoraId').innerHTML=
    '<option value="">— Seleccionar operadora activa —</option>'+
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido} — ${o.ciudad} (${o.departamento})</option>`).join('');
  filterMaquinasReservaByOperadora();
}

function openResModalForOperadora(opId){
  const op=getOp(opId);
  if(!op){showToast('⚠️ Operadora no encontrada','warn');return;}
  if(isOperadoraUser()&&parseInt(currentUser?.operadora_id)!==parseInt(opId)){
    showToast('⚠️ No podés reservar por otra operadora','warn');
    return;
  }
  openResModal();
  sv('resOperadoraId',opId);
  if(op.departamento)sv('resDeptLogistica',op.departamento);
  const montoEl=document.getElementById('resMonto');
  if(montoEl)montoEl.dataset.autoPrecio='1';
  filterMaquinasReservaByOperadora();
  onResSelectionChange();
}

function openResModal(id){
  if(id&&isOperadoraUser()){
    showToast('⚠️ Para cambiar una reserva escribinos por WhatsApp','warn');
    return;
  }
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  document.getElementById('resOperadoraId').innerHTML=
    '<option value="">— Seleccionar operadora activa —</option>'+
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido} — ${o.ciudad} (${o.departamento})</option>`).join('');
  document.getElementById('resMaquinaId').innerHTML='<option value="">— Seleccionar máquina disponible —</option>';
  document.getElementById('modalResTitle').textContent=id?'Editar Reserva':(isOperadoraUser()?'Solicitar Reserva':'Nueva Reserva');
  document.getElementById('resDisponibilidad').style.display='none';
  const deptLogistica=document.getElementById('resDeptLogistica');
  if(deptLogistica)deptLogistica.disabled=false;
  const montoEl=document.getElementById('resMonto');
  if(montoEl)montoEl.dataset.autoPrecio='';
  if(montoEl){
    montoEl.readOnly=!puedeEditarPrecioReserva();
    montoEl.title=puedeEditarPrecioReserva()?'':'El precio lo define administración desde la ficha de la operadora';
  }
  const monedaEl=document.getElementById('resMoneda');
  if(monedaEl)monedaEl.disabled=!puedeEditarPrecioReserva();
  const precioHint=document.getElementById('resPrecioHint');
  if(precioHint)precioHint.textContent='';
  const opField=document.getElementById('resOperadoraField');
  const estadoField=document.getElementById('resEstadoField');
  if(opField)opField.style.display=isOperadoraUser()?'none':'';
  if(estadoField)estadoField.style.display=isOperadoraUser()?'none':'';
  let selectedMaquinaId='';
  if(id){
    const r=(DB.get('reservas')||[]).find(x=>x.id===id); if(!r)return;
    selectedMaquinaId=r.maquinaId;
    sv('resId',r.id); sv('resOperadoraId',r.operadoraId); sv('resMaquinaId',r.maquinaId);
    sv('resTipo',r.tipo); sv('resEstado',r.estado);
    sv('resFechaJornada',r.fechaJornada||''); sv('resFechaInicio',r.fechaInicio||''); sv('resFechaFin',r.fechaFin||'');
    sv('resDeptLogistica',r.deptLogistica||''); sv('resBloqueLogistico',r.bloqueLogistico?'true':'false');
    sv('resMonto',r.monto||''); sv('resMoneda',r.moneda||'UYU'); sv('resNotas',r.notas||'');
    if(montoEl)montoEl.dataset.autoPrecio='0';
  } else {
    sv('resId',''); sv('resOperadoraId',''); sv('resMaquinaId','');
    sv('resTipo','jornada'); sv('resEstado','solicitud_recibida');
    sv('resFechaJornada',today()); sv('resFechaInicio',''); sv('resFechaFin','');
    sv('resDeptLogistica',''); sv('resBloqueLogistico','false');
    sv('resMonto',''); sv('resMoneda','UYU'); sv('resNotas','');
    if(montoEl)montoEl.dataset.autoPrecio='1';
    if(isOperadoraUser()&&currentUser?.operadora_id){
      sv('resOperadoraId',currentUser.operadora_id);
      const op=getOp(currentUser.operadora_id);
      if(op?.departamento)sv('resDeptLogistica',op.departamento);
    }
  }
  filterMaquinasReservaByOperadora();
  if(selectedMaquinaId)sv('resMaquinaId',selectedMaquinaId);
  onResTipoChange();
  openModal('modalRes');
}

function reservaMaquinaFotoUrl(m){
  if(typeof maquinaPhotoUrl==='function')return maquinaPhotoUrl(m);
  const url=m?.fotoUrl||m?.foto_url||'';
  if(!url)return '';
  if(/^https?:\/\//.test(url))return url;
  return window.location.origin+url;
}
function normalizarCiudadReserva(v){
  return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function normalizarTextoReserva(v){
  return normalizarCiudadReserva(v).replace(/[^a-z0-9]+/g,' ').trim();
}
function precioReservaParaMaquina(opId,maqId){
  const op=getOp(opId);
  const maq=getMaq(maqId);
  if(!op||!maq)return null;
  const tarifas=Array.isArray(op.equiposAlquila)?op.equiposAlquila:[];
  const claves=[
    normalizarTextoReserva(maq.nombre),
    normalizarTextoReserva(maq.categoria),
    normalizarTextoReserva(maq.codigo)
  ].filter(Boolean);
  const tarifa=tarifas.find(t=>{
    const equipo=normalizarTextoReserva(t.equipo||t.nombre||t.categoria);
    if(!equipo)return false;
    return claves.some(k=>k&&((equipo.includes(k)||k.includes(equipo))));
  });
  const valor=parseFloat(tarifa?.valor);
  if(!Number.isFinite(valor)||valor<=0)return null;
  return {valor,tarifa};
}
function puedeEditarPrecioReserva(){
  return !isOperadoraUser() && (typeof canEdit==='function' ? canEdit() : true);
}
function marcarPrecioReservaManual(){
  const montoEl=document.getElementById('resMonto');
  if(isOperadoraUser()){
    if(montoEl)montoEl.dataset.autoPrecio='1';
    actualizarPrecioReservaDesdeMaquina();
    return;
  }
  if(montoEl)montoEl.dataset.autoPrecio='0';
}
function actualizarPrecioReservaDesdeMaquina(){
  const montoEl=document.getElementById('resMonto');
  const hint=document.getElementById('resPrecioHint');
  if(!montoEl)return;
  const montoActual=montoEl.value;
  const auto=isOperadoraUser()||montoEl.dataset.autoPrecio!=='0'||montoActual==='';
  const precio=precioReservaParaMaquina(parseInt(gv('resOperadoraId'))||0,parseInt(gv('resMaquinaId'))||0);
  if(precio&&auto){
    montoEl.value=precio.valor;
    montoEl.dataset.autoPrecio='1';
  }
  if(hint){
    if(precio)hint.textContent=isOperadoraUser()
      ? `Precio definido por administración: ${precio.valor} ${gv('resMoneda')||'UYU'}`
      : `Precio sugerido desde la ficha: ${precio.valor} ${gv('resMoneda')||'UYU'}`;
    else hint.textContent=gv('resMaquinaId')?'Sin precio cargado para esta máquina en la ficha de la operadora.':'';
  }
}
function validarCiudadReservaLocal(opId,maqId){
  const op=getOp(opId);
  const maq=getMaq(maqId);
  if(!op||!maq)return {ok:true};
  if(maq.tipoOperativo==='solo_venta')return {ok:false,msg:'Máquina marcada como solo venta: no disponible para alquiler'};
  const opLocalidades=typeof localidadesOperadora==='function'?localidadesOperadora(op):[normalizarCiudadReserva(op.ciudad)].filter(Boolean);
  const maqCiudad=typeof localidadMaquina==='function'?localidadMaquina(maq):normalizarCiudadReserva(maq.tipoOperativo==='base_ciudad'?(maq.ciudadBase||maq.ubicacion):(maq.ciudad||maq.ubicacion));
  if(opLocalidades.length&&maqCiudad&&!opLocalidades.includes(maqCiudad)){
    return {ok:false,msg:'Máquina no disponible para las localidades declaradas por la operadora'};
  }
  if(!opLocalidades.length){
    return {ok:false,msg:'La operadora no tiene localidades/direcciones declaradas para alquilar máquinas'};
  }
  return {ok:true};
}
function renderReservaMaquinaPreview(maquinaId){
  const wrap=document.getElementById('resMaquinaPreviewWrap');if(!wrap)return;
  const m=getMaq(maquinaId);
  if(!m){wrap.style.display='none';wrap.innerHTML='';return;}
  const foto=reservaMaquinaFotoUrl(m);
  const nombre=escapeHTML(m.nombre||'Máquina');
  const codigo=escapeHTML(m.codigo||'');
  const categoria=escapeHTML(m.categoria||'');
  const ubicacion=escapeHTML(m.ubicacion||'');
  const uso=m.tipoOperativo==='solo_venta'?' · Solo venta':m.tipoOperativo==='base_ciudad'?` · Base ${escapeHTML(m.ciudadBase||m.ubicacion||'')}`:' · Viajera';
  const estado=badgeMaq(m.estado);
  wrap.style.display='block';
  wrap.innerHTML=`
    <div class="reservation-machine-preview">
      ${foto
        ?`<button type="button" class="reservation-machine-thumb" onclick="openImageLightbox('${escapeAttr(foto)}','${escapeAttr(m.nombre||'Máquina')}')" title="Ampliar foto">
            <img src="${escapeAttr(foto)}" alt="${escapeAttr(m.nombre||'Máquina')}"/>
          </button>`
        :`<div class="reservation-machine-thumb empty">⚙️</div>`}
      <div class="reservation-machine-info">
        <div class="reservation-machine-title">${nombre}</div>
        <div class="reservation-machine-meta">${codigo}${categoria?' · '+categoria:''}${ubicacion?' · '+ubicacion:''}${uso}</div>
      </div>
      <div class="reservation-machine-state">${estado}</div>
    </div>`;
}

function onResTipoChange(){
  const tipo=gv('resTipo');
  const j=tipo==='jornada';
  document.getElementById('campoJornada').style.display=j?'':'none';
  document.getElementById('campoInicio').style.display=j?'none':'';
  document.getElementById('campoFin').style.display=j?'none':'';
  if(!j) autoCalcFechaFin();
  onResSelectionChange();
}

function autoCalcFechaFin(){
  const inicio=gv('resFechaInicio'); if(!inicio)return;
  const tipo=gv('resTipo');
  const d=new Date(inicio+'T12:00:00');
  if(tipo==='mensual'){d.setMonth(d.getMonth()+1);d.setDate(d.getDate()-1);}
  else if(tipo==='semanal'){d.setDate(d.getDate()+6);}
  else{sv('resFechaFin',inicio);return;}
  sv('resFechaFin',d.toISOString().split('T')[0]);
  onResSelectionChange();
}

function onResSelectionChange(){
  const maqId=gv('resMaquinaId'); const tipo=gv('resTipo');
  renderReservaMaquinaPreview(maqId);
  actualizarPrecioReservaDesdeMaquina();
  const fi=tipo==='jornada'?gv('resFechaJornada'):gv('resFechaInicio');
  const ff=tipo==='jornada'?gv('resFechaJornada'):gv('resFechaFin');
  const excluir=gv('resId');
  const dept=gv('resDeptLogistica');
  const divDisp=document.getElementById('resDisponibilidad');
  const msgEl=document.getElementById('resDisponibilidadMsg');
  if(!maqId||!fi){divDisp.style.display='none';if(typeof renderReservaModalAutomatizacion==='function')renderReservaModalAutomatizacion();return;}
  const chk=checkDisponibilidad(parseInt(maqId),fi,ff||fi,excluir,dept);
  const ciudadOk=validarCiudadReservaLocal(gv('resOperadoraId'),maqId);
  if(!ciudadOk.ok){
    divDisp.style.display='block';
    msgEl.innerHTML=`<div class="avail-err">${ciudadOk.msg}</div>`;
    if(typeof renderReservaModalAutomatizacion==='function')renderReservaModalAutomatizacion();
    return;
  }
  divDisp.style.display='block';
  msgEl.innerHTML=`<div class="${chk.ok?'avail-ok':'avail-err'}">${chk.msg}</div>`;
  if(typeof renderReservaModalAutomatizacion==='function')renderReservaModalAutomatizacion();
}

async function saveReserva(){
  // Prevenir doble submit
  const btnGuardar = document.querySelector('#modalRes .btn-add, #modalRes button[onclick*="saveReserva"]');
  if(btnGuardar){if(btnGuardar._saving)return; btnGuardar._saving=true; btnGuardar.disabled=true;}
  const liberarBotonReserva=()=>{if(btnGuardar){btnGuardar._saving=false;btnGuardar.disabled=false;}};
  const reservas=DB.get('reservas')||[]; const id=gv('resId');
  const opId=parseInt(gv('resOperadoraId')); const maqId=parseInt(gv('resMaquinaId'));
  const tipo=gv('resTipo');
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');liberarBotonReserva();return;}
  if(!maqId){showToast('⚠️ Seleccioná una máquina','warn');liberarBotonReserva();return;}
  const op=getOp(opId);
  if(op&&['suspendida','inactiva'].includes(op.estado)){
    showToast(`⛔ La operadora ${op.nombre} ${op.apellido} está ${op.estado} y no puede generar reservas.`,'warn');liberarBotonReserva();return;
  }
  const ciudadOk=validarCiudadReservaLocal(opId,maqId);
  if(!ciudadOk.ok){
    showToast('⛔ '+ciudadOk.msg,'warn');liberarBotonReserva();return;
  }
  let fechaJornada='',fechaInicio='',fechaFin='';
  if(tipo==='jornada'){
    fechaJornada=gv('resFechaJornada');
    if(!fechaJornada){showToast('⚠️ Ingresá la fecha de jornada','warn');liberarBotonReserva();return;}
    fechaInicio=fechaFin=fechaJornada;
  } else {
    fechaInicio=gv('resFechaInicio'); fechaFin=gv('resFechaFin');
    if(!fechaInicio||!fechaFin){showToast('⚠️ Completá las fechas de inicio y fin','warn');liberarBotonReserva();return;}
  }
  let montoReserva=parseFloat(gv('resMonto'))||0;
  let monedaReserva=gv('resMoneda')||'UYU';
  if(isOperadoraUser()){
    const precio=precioReservaParaMaquina(opId,maqId);
    montoReserva=precio?precio.valor:0;
    monedaReserva='UYU';
    sv('resMonto',montoReserva||'');
    sv('resMoneda',monedaReserva);
  }
  const payload={
    operadora_id:opId,maquina_id:maqId,tipo,
    fecha_jornada:fechaJornada||undefined,fecha_inicio:fechaInicio,fecha_fin:fechaFin,
    estado:isOperadoraUser()?'solicitud_recibida':gv('resEstado'),dept_logistica:gv('resDeptLogistica'),
    bloque_logistico:isOperadoraUser()?false:gv('resBloqueLogistico')==='true',
    monto:montoReserva,moneda:monedaReserva,notas:gv('resNotas').trim(),
  };
  if(payload.estado==='confirmada'&&typeof validarReservaAutomatica==='function'){
    const temp={id:parseInt(id)||0,operadoraId:opId,maquinaId:maqId,tipo,fechaJornada,fechaInicio,fechaFin,
      estado:payload.estado,deptLogistica:payload.dept_logistica,bloqueLogistico:payload.bloque_logistico,monto:payload.monto};
    const validacion=validarReservaAutomatica(temp);
    if(!validacion.puede){
      showToast('⛔ No se puede confirmar: '+validacion.motivo,'warn');
      liberarBotonReserva();
      return;
    }
  }
  try{
    const saved=id
      ?await api(`/api/reservas/${id}`,{method:'PUT',body:JSON.stringify(payload)})
      :await api('/api/reservas',{method:'POST',body:JSON.stringify(payload)});
    const mapped=mapReserva(saved);
    if(id){
      const idx=reservas.findIndex(x=>x.id===parseInt(id));
      if(idx>=0)reservas[idx]=mapped; else reservas.push(mapped);
    } else {
      reservas.push(mapped);
    }
    // Guardar en caché ANTES de encolar notificación para que generarMensaje tenga los datos
    DB.set('reservas',reservas);
    if(mapped.estado==='confirmada'&&mapped.bloqueLogistico&&typeof syncEnviosDesdeServidor==='function')await syncEnviosDesdeServidor();
    if(!id && typeof encolarNotificacion==='function'){
      const map={solicitud_recibida:'reserva_nueva',aprobada:'reserva_aprobada',confirmada:'reserva_confirmada',rechazada:'reserva_rechazada',cancelada:'reserva_rechazada'};
      if(map[mapped.estado]) encolarNotificacion(map[mapped.estado], mapped.operadoraId, {reservaId:mapped.id, monto:mapped.monto, moneda:mapped.moneda});
    }
    showToast(id?'✅ Reserva actualizada':'✅ Reserva creada · '+saved.codigo);
    closeModal('modalRes'); renderReservas(); updateReservasBadge();
  }catch(e){showToast('⛔ '+e.message,'warn');}
  finally{if(btnGuardar){btnGuardar._saving=false; btnGuardar.disabled=false;}}
}

/* Cambio de estado */
function abrirCambioEstado(id){
  const r=(DB.get('reservas')||[]).find(x=>x.id===id); if(!r)return;
  sv('resEstadoId',id); sv('resEstadoNuevo',r.estado); sv('resEstadoMotivo','');
  document.getElementById('resEstadoActualBadge').innerHTML=badgeRes(r.estado);
  openModal('modalResEstado');
}
async function confirmarCambioEstadoRes(){
  const id=parseInt(gv('resEstadoId')); const nuevoEstado=gv('resEstadoNuevo'); const motivo=gv('resEstadoMotivo').trim();
  if(!motivo){showToast('⚠️ Ingresá el motivo del cambio','warn');return;}
  const reservas=DB.get('reservas')||[];
  const idx=reservas.findIndex(x=>x.id===id); if(idx<0)return;
  const prevEstado=reservas[idx].estado;
  if(prevEstado===nuevoEstado){showToast('⚠️ El estado es igual al actual','warn');return;}
  if(nuevoEstado==='confirmada'&&typeof validarReservaAutomatica==='function'){
    const validacion=validarReservaAutomatica(reservas[idx]);
    if(!validacion.puede){
      showToast('⛔ No se puede confirmar: '+validacion.motivo,'warn');
      return;
    }
  }
  try{
    await api(`/api/reservas/${id}/estado`,{method:'PATCH',body:JSON.stringify({estado:nuevoEstado,motivo})});
    reservas[idx].estado=nuevoEstado;
    DB.set('reservas',reservas);
    if(nuevoEstado==='confirmada'&&reservas[idx].bloqueLogistico&&typeof syncEnviosDesdeServidor==='function')await syncEnviosDesdeServidor();
    if(typeof encolarNotificacion==='function'){
      const map={solicitud_recibida:'reserva_nueva',aprobada:'reserva_aprobada',confirmada:'reserva_confirmada',rechazada:'reserva_rechazada',cancelada:'reserva_rechazada'};
      if(map[nuevoEstado]) encolarNotificacion(map[nuevoEstado], reservas[idx].operadoraId, {reservaId:id, monto:reservas[idx].monto, moneda:reservas[idx].moneda});
    }
    closeModal('modalResEstado');
    showToast(`🔄 Estado: ${RES_ESTADOS[nuevoEstado]?.label||nuevoEstado}`);
    updateReservasBadge();
    if(document.getElementById('view-reserva-ficha').classList.contains('active')) showResFicha(id);
    else if(document.getElementById('view-reservas').classList.contains('active')) renderReservas();
    else renderDashboard();
  }catch(e){showToast('⛔ '+e.message,'warn');}
}
function addHistorial(reservaId,estadoPrevio,estadoNuevo,motivo){
  const hist=DB.get('reservas_historial')||[];
  hist.push({reservaId,estadoPrevio,estadoNuevo,motivo,ts:new Date().toISOString(),usuario:currentUser?currentUser.email:'—'});
  DB.set('reservas_historial',hist);
}
async function deleteReserva(id){
  if(!confirm('¿Eliminar esta reserva? No se puede deshacer.'))return;
  try{
    await api(`/api/reservas/${id}`,{method:'DELETE'});
    DB.set('reservas',(DB.get('reservas')||[]).filter(r=>r.id!==id));
    showToast('🗑 Reserva eliminada'); navigate('reservas'); updateReservasBadge();
  }catch(e){showToast('⛔ '+e.message,'warn');}
}
function updateReservasBadge(){
  const alertas=getAlertas(); const count=alertas.urgentes.length+alertas.sinAprobacion.length;
  const badge=document.getElementById('navBadgeReservas');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}

/* Calendario */
let calYear=new Date().getFullYear(), calMonth=new Date().getMonth();
let calMachineFilter='';
let calLayerFilter='todas';
let calIncidenciasCache={key:'',rows:[]};

function calDateKey(d){return d.toISOString().split('T')[0];}
function calAddDays(dateStr,days){
  const d=new Date((dateStr||today())+'T12:00:00');
  d.setDate(d.getDate()+days);
  return calDateKey(d);
}
function calEachDay(start,end,cb){
  if(!start)return;
  let cur=new Date(start+'T12:00:00');
  const limit=new Date((end||start)+'T12:00:00');
  let guard=0;
  while(cur<=limit&&guard<370){
    cb(calDateKey(cur));
    cur.setDate(cur.getDate()+1);
    guard++;
  }
}
function calReservaInicio(r){return r.tipo==='jornada'?(r.fechaJornada||r.fechaInicio):r.fechaInicio;}
function calReservaFin(r){return r.tipo==='jornada'?(r.fechaJornada||r.fechaFin||r.fechaInicio):r.fechaFin||r.fechaInicio||r.fechaJornada;}
function calMonthRange(){
  const desde=`${calYear}-${String(calMonth+1).padStart(2,'0')}-01`;
  const hasta=calDateKey(new Date(calYear,calMonth+1,0,12));
  return {desde,hasta};
}
function calOverlapsMonth(start,end){
  const {desde,hasta}=calMonthRange();
  return start&&start<=hasta&&(end||start)>=desde;
}
function calMaqName(id){
  const m=getMaq(parseInt(id));
  return m?`${m.codigo||''} ${m.nombre||''}`.trim():'Sin máquina';
}
function calEventAction(ev){
  if(ev.kind==='reserva'||ev.reservaId)return `showResFicha(${ev.reservaId})`;
  if(ev.kind==='mantenimiento'&&ev.maquinaId)return `showMaqFicha(${ev.maquinaId})`;
  if(ev.kind==='incidencia'&&ev.maquinaId)return `showMaqFicha(${ev.maquinaId})`;
  if(ev.maquinaId)return `showMaqFicha(${ev.maquinaId})`;
  return '';
}
function calEventClass(ev){
  if(ev.kind==='reserva')return ev.estado||'solicitud_recibida';
  return `cal-type-${ev.kind}`;
}
function calEventLabel(ev){
  if(ev.kind==='reserva')return ev.short||ev.codigo||'Reserva';
  if(ev.kind==='bloqueo')return ev.short||'Bloqueo';
  if(ev.kind==='mantenimiento')return ev.short||'Mant.';
  if(ev.kind==='puesta_punto')return ev.short||'Puesta a punto';
  if(ev.kind==='incidencia')return ev.short||'Incidencia';
  if(ev.kind==='no_operativa')return ev.short||'No operativa';
  return ev.title||'Evento';
}
function calEventOrder(ev){
  return {incidencia:0,no_operativa:1,mantenimiento:2,puesta_punto:3,reserva:4,bloqueo:5}[ev.kind]??9;
}
async function cargarCalendarioIncidencias(){
  if(typeof api!=='function')return [];
  const maqs=DB.get('maquinas')||[];
  const key=maqs.map(m=>m.id).join(',')+'|'+calYear+'-'+calMonth;
  if(calIncidenciasCache.key===key)return calIncidenciasCache.rows;
  const settled=await Promise.allSettled(maqs.map(m=>api('/api/maquinas/'+m.id+'/incidencias').then(rows=>(rows||[]).map(i=>({...i,maquinaId:m.id})))));
  const rows=[];
  settled.forEach(r=>{if(r.status==='fulfilled')rows.push(...r.value);});
  calIncidenciasCache={key,rows};
  return rows;
}
function buildCalendarioEventos(incidencias){
  const reservas=DB.get('reservas')||[];
  const maqs=DB.get('maquinas')||[];
  const mantenimientos=DB.get('mantenimientos')||[];
  const {desde,hasta}=calMonthRange();
  const eventos=[];
  const addEvent=ev=>{
    if(!ev.start)return;
    ev.end=ev.end||ev.start;
    if(!calOverlapsMonth(ev.start,ev.end))return;
    if(calMachineFilter&&String(ev.maquinaId||'')!==String(calMachineFilter))return;
    if(calLayerFilter!=='todas'&&ev.kind!==calLayerFilter)return;
    eventos.push(ev);
  };
  reservas.forEach(r=>{
    const start=calReservaInicio(r), end=calReservaFin(r);
    if(!start||['cancelada','rechazada'].includes(r.estado))return;
    const op=getOp(r.operadoraId);
    addEvent({
      kind:'reserva',start,end,maquinaId:r.maquinaId,reservaId:r.id,estado:r.estado,codigo:r.codigo,
      title:`${r.codigo||'Reserva'} · ${op?op.nombre+' '+op.apellido:'Sin operadora'} · ${calMaqName(r.maquinaId)}`,
      sub:`${fmtDate(start)}${end&&end!==start?' → '+fmtDate(end):''}`,
      short:op?op.nombre:r.codigo
    });
    const rango=calcularRangoBloqueo(start,end,r.deptLogistica||'');
    if(r.bloqueLogistico&&rango.bloqueDesde&&rango.bloqueHasta){
      addEvent({
        kind:'bloqueo',start:rango.bloqueDesde,end:rango.bloqueHasta,maquinaId:r.maquinaId,reservaId:r.id,
        title:`Bloqueo logístico · ${r.codigo||'Reserva'} · ${calMaqName(r.maquinaId)}`,
        sub:`${r.deptLogistica||'Sin depto.'} · ${fmtDate(rango.bloqueDesde)} → ${fmtDate(rango.bloqueHasta)}`,
        short:'Logística'
      });
    }
  });
  mantenimientos.forEach(m=>{
    if(!m.proximoVencimiento)return;
    const estado=typeof getMantEstado==='function'?getMantEstado(m):m.estado;
    if(!['vencido','próximo'].includes(estado))return;
    addEvent({
      kind:'mantenimiento',start:m.proximoVencimiento,end:m.proximoVencimiento,maquinaId:m.maquinaId,
      title:`Mantenimiento ${estado} · ${calMaqName(m.maquinaId)}`,
      sub:`${typeof mantTipoLabel==='function'?mantTipoLabel(m.tipo):m.tipo} · ${fmtDate(m.proximoVencimiento)}`,
      short:estado==='vencido'?'Mant. vencido':'Mant. próximo'
    });
  });
  maqs.forEach(m=>{
    if(m.puestaPuntoEstado==='pendiente'){
      addEvent({
        kind:'puesta_punto',start:m.puestaPuntoAsignadaEn?normalizeDateInput(m.puestaPuntoAsignadaEn):desde,end:hasta,maquinaId:m.id,
        title:`Puesta a punto pendiente · ${calMaqName(m.id)}`,
        sub:`${maquinaGestionDias(m.puestaPuntoAsignadaEn)} día${maquinaGestionDias(m.puestaPuntoAsignadaEn)!==1?'s':''} en gestión`,
        short:'Puesta a punto'
      });
    }
    if(['mantenimiento','fuera_servicio','en_viaje'].includes(m.estado)||m.tecnicoEstado==='en_tecnico'){
      addEvent({
        kind:'no_operativa',start:normalizeDateInput(m.tecnicoSalidaEn||m.updatedAt||m.ultMant)||desde,end:hasta,maquinaId:m.id,
        title:`${badgeTxt(m.estado)} · ${calMaqName(m.id)}`,
        sub:m.tecnicoEstado==='en_tecnico'?`En técnico${m.tecnicoNombre?' · '+m.tecnicoNombre:''}`:'No disponible para reservas',
        short:m.tecnicoEstado==='en_tecnico'?'En técnico':badgeTxt(m.estado)
      });
    }
  });
  (incidencias||[]).filter(i=>['abierta','en_revision'].includes(i.estado)).forEach(i=>{
    const start=normalizeDateInput(i.created_at)||desde;
    addEvent({
      kind:'incidencia',start,end:hasta,maquinaId:i.maquinaId||i.maquina_id,reservaId:i.reserva_id,
      title:`Incidencia ${i.gravedad||''} · ${calMaqName(i.maquinaId||i.maquina_id)}`,
      sub:`${typeof incidenciaTipoLabel==='function'?incidenciaTipoLabel(i.tipo):i.tipo} · ${i.descripcion||''}`,
      short:i.bloquea_reservas?'Incidencia bloquea':'Incidencia'
    });
  });
  return eventos.sort((a,b)=>calEventOrder(a)-calEventOrder(b)||String(a.start).localeCompare(String(b.start)));
}
function renderCalendarioStats(eventos){
  const reservas=eventos.filter(e=>e.kind==='reserva').length;
  const bloqueos=eventos.filter(e=>e.kind==='bloqueo').length;
  const tecnicos=eventos.filter(e=>['mantenimiento','puesta_punto','incidencia','no_operativa'].includes(e.kind)).length;
  const criticos=eventos.filter(e=>e.kind==='incidencia'||e.kind==='no_operativa').length;
  return `<div class="calendar-summary">
    <button type="button" class="calendar-stat" onclick="setCalLayer('reserva')"><span>Reservas</span><strong>${reservas}</strong></button>
    <button type="button" class="calendar-stat" onclick="setCalLayer('bloqueo')"><span>Bloqueos logísticos</span><strong>${bloqueos}</strong></button>
    <button type="button" class="calendar-stat warn" onclick="setCalLayer('mantenimiento')"><span>Mantenimiento</span><strong>${eventos.filter(e=>e.kind==='mantenimiento').length}</strong></button>
    <button type="button" class="calendar-stat danger" onclick="setCalLayer('incidencia')"><span>Incidencias</span><strong>${criticos}</strong></button>
    <button type="button" class="calendar-stat" onclick="setCalLayer('todas')"><span>Total capas</span><strong>${eventos.length}</strong></button>
  </div>`;
}
function renderCalendarioAgenda(eventos){
  const visibles=eventos.filter(e=>e.end>=calMonthRange().desde&&e.start<=calMonthRange().hasta).slice(0,18);
  if(!visibles.length)return `<div class="calendar-agenda"><h4>Agenda por máquina</h4><div class="machine-ops-empty">Sin eventos para este filtro.</div></div>`;
  return `<div class="calendar-agenda">
    <h4>Agenda por máquina</h4>
    ${visibles.map(e=>{
      const action=calEventAction(e);
      return `<button type="button" class="calendar-agenda-row ${e.kind}" ${action?`onclick="${action}"`:''}>
        <span class="calendar-agenda-dot"></span>
        <span class="calendar-agenda-body">
          <strong>${escapeHTML(e.title||'Evento')}</strong>
          <small>${escapeHTML(e.sub||'')} · ${escapeHTML(calMaqName(e.maquinaId))}</small>
        </span>
        <span class="calendar-agenda-date">${fmtDate(e.start)}${e.end&&e.end!==e.start?' → '+fmtDate(e.end):''}</span>
      </button>`;
    }).join('')}
  </div>`;
}
function calendarioFiltrosHTML(){
  const maqs=DB.get('maquinas')||[];
  return `<div class="calendar-toolbar">
    <div class="calendar-filter">
      <label>Máquina</label>
      <select onchange="setCalMachine(this.value)" value="${escapeAttr(calMachineFilter)}">
        <option value="">Todas</option>
        ${maqs.map(m=>`<option value="${m.id}" ${String(calMachineFilter)===String(m.id)?'selected':''}>${escapeHTML(m.codigo||'')} — ${escapeHTML(m.nombre||'')}</option>`).join('')}
      </select>
    </div>
    <div class="calendar-filter">
      <label>Capa</label>
      <select onchange="setCalLayer(this.value)">
        ${[
          ['todas','Todas las capas'],['reserva','Reservas'],['bloqueo','Bloqueos logísticos'],['mantenimiento','Mantenimientos'],['puesta_punto','Puesta a punto'],['incidencia','Incidencias'],['no_operativa','No operativas']
        ].map(([v,l])=>`<option value="${v}" ${calLayerFilter===v?'selected':''}>${l}</option>`).join('')}
      </select>
    </div>
  </div>`;
}

async function renderCalendario(){
  const incidencias=await cargarCalendarioIncidencias();
  const eventos=buildCalendarioEventos(incidencias);
  const hoy=today();
  const firstDay=new Date(calYear,calMonth,1);
  const lastDay=new Date(calYear,calMonth+1,0);
  const startDow=(firstDay.getDay()+6)%7;
  const totalDays=lastDay.getDate();
  const mesNombre=firstDay.toLocaleDateString('es-UY',{month:'long',year:'numeric'});

  const dateMap={};
  eventos.forEach(ev=>{
    calEachDay(ev.start,ev.end,key=>{
      if(key<calMonthRange().desde||key>calMonthRange().hasta)return;
      if(!dateMap[key])dateMap[key]=[];
      dateMap[key].push(ev);
    });
  });

  const legendHTML=[
    ['reserva','Reservas'],['bloqueo','Bloqueo logístico'],['mantenimiento','Mantenimiento'],['puesta_punto','Puesta a punto'],['incidencia','Incidencia abierta'],['no_operativa','No operativa']
  ].map(([k,l])=>`<div class="cal-legend-item"><div class="cal-legend-dot cal-event cal-type-${k}"></div>${l}</div>`).join('');

  let cells='';
  for(let i=0;i<startDow;i++) cells+=`<div class="cal-day other-month"><div class="cal-day-num"></div></div>`;
  for(let d=1;d<=totalDays;d++){
    const dateStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday=dateStr===hoy;
    const dayEvents=(dateMap[dateStr]||[]).sort((a,b)=>calEventOrder(a)-calEventOrder(b));
    const evHTML=dayEvents.slice(0,4).map(ev=>{
      const action=calEventAction(ev);
      return `<div class="cal-event ${calEventClass(ev)}" ${action?`onclick="${action}"`:''} title="${escapeAttr(ev.title||'')}">${escapeHTML(calEventLabel(ev))}</div>`;
    }).join('');
    const more=dayEvents.length>4?`<div style="font-size:10px;color:var(--text3);padding:1px 4px">+${dayEvents.length-4} más</div>`:'';
    const critical=dayEvents.some(e=>['incidencia','no_operativa'].includes(e.kind));
    cells+=`<div class="cal-day${isToday?' today':''}${dayEvents.length?' has-events':''}${critical?' has-critical':''}">
      <div class="cal-day-num">${d}</div>${evHTML}${more}</div>`;
  }
  const used=startDow+totalDays;
  const remain=(7-used%7)%7;
  for(let i=0;i<remain;i++) cells+=`<div class="cal-day other-month"><div class="cal-day-num"></div></div>`;

  document.getElementById('calWrap').innerHTML=`
    <div class="calendar-head-panel">
      <div>
        <h2>Calendario operativo</h2>
        <p>Reservas, bloqueos logísticos, mantenimiento e incidencias por máquina.</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button class="btn-add" onclick="openResModal()">+ Nueva Reserva</button>
        <button class="btn-secondary" onclick="navigate('reservas')" style="font-size:13px">☰ Ver Listado</button>
      </div>
    </div>
    ${renderCalendarioStats(eventos)}
    ${calendarioFiltrosHTML()}
    <div class="calendar-layout">
      <div class="cal-wrap">
        <div class="cal-header">
          <button class="cal-nav-btn" onclick="calPrev()">‹</button>
          <h3>${mesNombre.charAt(0).toUpperCase()+mesNombre.slice(1)}</h3>
          <div style="display:flex;gap:8px">
            <button class="cal-nav-btn" onclick="calHoy()">Hoy</button>
            <button class="cal-nav-btn" onclick="calNext()">›</button>
          </div>
        </div>
        <div class="cal-grid">
          ${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
          ${cells}
        </div>
        <div class="cal-legend">${legendHTML}</div>
      </div>
      ${renderCalendarioAgenda(eventos)}
    </div>`;
}
function calPrev(){calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendario();}
function calNext(){calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendario();}
function calHoy(){calYear=new Date().getFullYear();calMonth=new Date().getMonth();renderCalendario();}
function setCalMachine(v){calMachineFilter=v;renderCalendario();}
function setCalLayer(v){calLayerFilter=v||'todas';renderCalendario();}
