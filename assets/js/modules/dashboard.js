/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function setDashboardFilterValue(view, selector, value){
  const el=document.querySelector(`#view-${view} ${selector}`);
  if(el)el.value=value||'';
}
function dashboardStatNavigate(kind){
  if(kind==='operadoras'){
    if(typeof opFilter==='object'){opFilter.search='';opFilter.status='activa';}
    navigate('operadoras');
    setDashboardFilterValue('operadoras','.search-input','');
    setDashboardFilterValue('operadoras','select.filter-select','activa');
    return;
  }
  if(kind==='maquinas'){
    if(typeof maqFilter==='object'){maqFilter.search='';maqFilter.status='disponible';}
    navigate('maquinas');
    setDashboardFilterValue('maquinas','.search-input','');
    setDashboardFilterValue('maquinas','select.filter-select','disponible');
    return;
  }
  if(kind==='reservas'){
    if(typeof resFilter==='object'){resFilter.search='';resFilter.estado='confirmada';resFilter.tipo='';resFilter.control='';}
    navigate('reservas');
    setDashboardFilterValue('reservas','.search-input','');
    setDashboardFilterValue('reservas','#filterResStatus','confirmada');
    setDashboardFilterValue('reservas','#filterResTipo','');
    setDashboardFilterValue('reservas','#filterResControl','');
    return;
  }
  if(kind==='pagos'){
    if(typeof pagoFilter==='object'){pagoFilter.search='';pagoFilter.estado='pendientes';}
    navigate('pagos');
    setDashboardFilterValue('pagos','.search-input','');
    setDashboardFilterValue('pagos','#filterPagoStatus','pendientes');
    return;
  }
  if(kind==='leads'){
    if(typeof leadFilter==='object'){leadFilter.search='';leadFilter.estado='';leadFilter.fuente='';}
    navigate('leads');
    setDashboardFilterValue('leads','.search-input','');
    setDashboardFilterValue('leads','#filterLeadStatus','');
    setDashboardFilterValue('leads','#filterLeadFuente','');
    return;
  }
  if(kind==='envios'){
    if(typeof envioFilter==='object'){envioFilter.search='';envioFilter.estado='';}
    navigate('envios');
    setDashboardFilterValue('envios','.search-input','');
    setDashboardFilterValue('envios','#filterEnvioStatus','');
  }
}

function fechaMasDias(fecha, dias){
  const d=new Date((fecha||today())+'T12:00:00');
  d.setDate(d.getDate()+dias);
  return d.toISOString().split('T')[0];
}
function dashboardDateOnly(value){
  if(!value)return '';
  if(typeof normalizeDateInput==='function')return normalizeDateInput(value);
  return String(value).slice(0,10);
}
function dashboardAgeDays(value,hoy){
  const f=dashboardDateOnly(value);
  if(!f)return 0;
  return Math.max(0,daysDiff(f,hoy));
}
function dashboardMaqAction(id,status){
  return `if(typeof maqFilter==='object'){maqFilter.search='';maqFilter.status='${status||''}'};navigate('maquinas');setTimeout(()=>showMaqFicha(${id}),50)`;
}

function dashAction(label, onclick){
  return `<button class="action-btn" onclick="${onclick}">${label}</button>`;
}

function dashboardAutomationOpenAction(t){
  const entity=String(t.entity||'');
  const id=parseInt(t.entity_id||t.entityId||0);
  if(!id)return '';
  if(entity==='operadora')return `navigate('operadoras');setTimeout(()=>showOpFicha(${id}),50)`;
  if(entity==='reserva')return `navigate('reservas');setTimeout(()=>showResFicha(${id}),50)`;
  if(entity==='pago')return `navigate('pagos');setTimeout(()=>showPagoFicha(${id}),50)`;
  if(entity==='envio')return `navigate('envios');setTimeout(()=>showEnvioFicha(${id}),50)`;
  if(entity==='maquina')return dashboardMaqAction(id,'');
  return '';
}

function dashboardAutomationTargetView(t){
  const entity=String(t.entity||'');
  if(entity==='operadora')return 'operadoras';
  if(entity==='reserva')return 'reservas';
  if(entity==='pago')return 'pagos';
  if(entity==='envio')return 'envios';
  if(entity==='maquina')return 'maquinas';
  return '';
}

function dashboardCanSeeAutomationTask(t){
  const role=typeof getAccessRole==='function'?getAccessRole():'';
  if(['superadmin','administrador'].includes(role))return true;
  if(role==='comercial'&&t.area!=='comercial')return false;
  if(role==='operaciones'&&!['logistica','operaciones','administracion'].includes(t.area))return false;
  const view=dashboardAutomationTargetView(t);
  return !view || (typeof canView==='function'&&canView(view));
}

function dashboardAutomationItem(t,hoy){
  const due=dashboardDateOnly(t.due_at||t.dueAt);
  const vencida=due&&due<hoy;
  const actionOpen=dashboardAutomationOpenAction(t);
  const action=[
    actionOpen?dashAction('Abrir',actionOpen):'',
    dashAction('Resolver',`resolverAutomationTask(${parseInt(t.id)})`)
  ].filter(Boolean).join('');
  return {
    priority:vencida?'alta':'media',
    icon:vencida?'⚠️':'⚡',
    title:t.title||'Tarea automática',
    sub:[due?`Vence ${fmtDate(due)}`:'Sin vencimiento',t.detail||''].filter(Boolean).join(' · '),
    action
  };
}

async function resolverAutomationTask(id){
  if(!id)return;
  try{
    await api('/api/automatizaciones/tasks/'+id,{method:'PATCH',body:JSON.stringify({status:'resuelta'})});
    DB.set('automation_tasks',(DB.get('automation_tasks')||[]).filter(t=>parseInt(t.id)!==parseInt(id)));
    showToast('✅ Tarea resuelta');
    renderDashboard();
  }catch(e){
    showToast('⚠️ '+e.message,'warn');
  }
}

function dashTaskItem(t){
  const cls=t.priority==='alta'?'daily-task alta':t.priority==='media'?'daily-task media':'daily-task';
  return `<div class="${cls}">
    <div class="daily-task-icon">${t.icon||'•'}</div>
    <div class="daily-task-body">
      <div class="daily-task-title">${escapeHTML(t.title||'')}</div>
      <div class="daily-task-sub">${escapeHTML(t.sub||'')}</div>
    </div>
    <div class="daily-task-action">${t.action||''}</div>
  </div>`;
}

function dashboardDailyItems({reservas,pagos,envios,leads,maqs,hoy,puedeVerPagos}){
  const automationTasks=(DB.get('automation_tasks')||[])
    .filter(t=>(t.status||'pendiente')==='pendiente')
    .filter(dashboardCanSeeAutomationTask)
    .sort((a,b)=>String(a.due_at||a.created_at||'').localeCompare(String(b.due_at||b.created_at||'')));
  const automationAlta=automationTasks.filter(t=>{
    const due=dashboardDateOnly(t.due_at);
    return due&&due<=hoy;
  }).map(t=>dashboardAutomationItem(t,hoy));
  const automationComercial=automationTasks.filter(t=>{
    const due=dashboardDateOnly(t.due_at);
    return (!due||due>hoy)&&t.area==='comercial';
  }).map(t=>dashboardAutomationItem(t,hoy));
  const automationOperaciones=automationTasks.filter(t=>{
    const due=dashboardDateOnly(t.due_at);
    return (!due||due>hoy)&&['logistica','operaciones','administracion'].includes(t.area);
  }).map(t=>dashboardAutomationItem(t,hoy));
  const activeRes=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado));
  const closedLeadStates=['ganado','perdido','cliente_activa'];
  const senasPend=puedeVerPagos?pagos.filter(p=>
    p.estado==='sena_pendiente' || ((p.senaRequerida||0)>0 && (p.senaAbonada||0)<(p.senaRequerida||0))
  ):[];
  const saldosPend=puedeVerPagos?pagos.filter(p=>
    (p.saldoPendiente||0)>0 && !['validado','cancelado'].includes(p.estado)
  ):[];
  const leadsCalientes=leads.filter(l=>
    Number(l.whatsappScore||0)>=45 || ['pendiente_sena','reserva_confirmada'].includes(l.estado)
  ).sort((a,b)=>(Number(b.whatsappScore||0)-Number(a.whatsappScore||0)) || (b.id-a.id));
  const leadsVencidos=leads.filter(l=>
    l.proxFecha && l.proxFecha<=hoy && !closedLeadStates.includes(l.estado)
  ).sort((a,b)=>(a.proxFecha||'').localeCompare(b.proxFecha||''));
  const reservasProximas=activeRes.filter(r=>{
    const f=r.tipo==='jornada'?r.fechaJornada:r.fechaInicio;
    return f && f>=hoy && daysDiff(hoy,f)<=2;
  }).sort((a,b)=>((a.fechaJornada||a.fechaInicio||'').localeCompare(b.fechaJornada||b.fechaInicio||'')));
  const reservasVencidas=activeRes.filter(r=>r.fechaFin&&r.fechaFin<hoy);
  const enviosSalida=envios.filter(e=>
    ['pendiente_envio','preparando'].includes(e.estado) && e.fechaEnvioEst && e.fechaEnvioEst<=fechaMasDias(hoy,1)
  ).sort((a,b)=>(a.fechaEnvioEst||'').localeCompare(b.fechaEnvioEst||''));
  const retiros=envios.filter(e=>
    e.estado==='retiro_pendiente' || (e.estado==='entregado' && e.fechaRetiroEst && e.fechaRetiroEst<=hoy)
  ).sort((a,b)=>(a.fechaRetiroEst||'').localeCompare(b.fechaRetiroEst||''));
  const viajerasPendientes=maqs.filter(m=>m.puestaPuntoEstado==='pendiente')
    .map(m=>({...m,diasGestion:dashboardAgeDays(m.puestaPuntoAsignadaEn,hoy)}))
    .sort((a,b)=>b.diasGestion-a.diasGestion);
  const viajerasTecnico=maqs.filter(m=>m.tecnicoEstado==='en_tecnico')
    .map(m=>({...m,diasTecnico:dashboardAgeDays(m.tecnicoSalidaEn,hoy)}))
    .sort((a,b)=>b.diasTecnico-a.diasTecnico);

  const alta=[
    ...automationAlta.slice(0,4),
    ...senasPend.slice(0,4).map(p=>{
      const op=getOp(p.operadoraId);
      const falta=Math.max(0,(p.senaRequerida||0)-(p.senaAbonada||0));
      return {priority:'alta',icon:'💳',title:'Seña pendiente',sub:`${op?op.nombre+' '+op.apellido:'Operadora'} · faltan ${falta.toLocaleString()} ${p.moneda||'UYU'}`,action:dashAction('Abrir',`showPagoFicha(${p.id})`)};
    }),
    ...reservasVencidas.slice(0,3).map(r=>{
      const op=getOp(r.operadoraId); const maq=getMaq(r.maquinaId);
      return {priority:'alta',icon:'⏰',title:'Reserva vencida sin cierre',sub:`${r.codigo} · ${maq?maq.nombre:'Máquina'} · ${op?op.nombre+' '+op.apellido:'Operadora'}`,action:dashAction('Ver',`showResFicha(${r.id})`)};
    }),
    ...leadsVencidos.slice(0,3).map(l=>({priority:'alta',icon:'📞',title:'Seguimiento vencido',sub:`${l.nombre} ${l.apellido||''} · ${l.proxAccion||'Sin acción'}`,action:dashAction('Ver',`showLeadFicha(${l.id})`)})),
    ...viajerasTecnico.filter(m=>m.diasTecnico>=7).slice(0,3).map(m=>({priority:'alta',icon:'🛠',title:'Máquina en técnico demorada',sub:`${m.codigo} · ${m.nombre} · ${m.diasTecnico} día${m.diasTecnico!==1?'s':''}`,action:dashAction('Ver',dashboardMaqAction(m.id,'fuera_servicio'))})),
  ];

  const comercial=[
    ...automationComercial.slice(0,4),
    ...leadsCalientes.slice(0,5).map(l=>({priority:'media',icon:'🔥',title:'Lead caliente',sub:`${l.nombre} ${l.apellido||''} · ${LEAD_ESTADOS[l.estado]?.label||l.estado} · score ${Number(l.whatsappScore||0)}`,action:dashAction('Ver',`showLeadFicha(${l.id})`)})),
    ...saldosPend.slice(0,4).map(p=>{
      const op=getOp(p.operadoraId);
      return {priority:'media',icon:'💰',title:'Saldo pendiente',sub:`${op?op.nombre+' '+op.apellido:'Operadora'} · ${(p.saldoPendiente||0).toLocaleString()} ${p.moneda||'UYU'}`,action:dashAction('Pago',`showPagoFicha(${p.id})`)};
    }),
  ];

  const operaciones=[
    ...automationOperaciones.slice(0,5),
    ...reservasProximas.slice(0,4).map(r=>{
      const op=getOp(r.operadoraId); const maq=getMaq(r.maquinaId); const f=r.tipo==='jornada'?r.fechaJornada:r.fechaInicio;
      return {priority:'media',icon:'📅',title:'Reserva próxima',sub:`${fmtDate(f)} · ${maq?maq.nombre:'Máquina'} · ${op?op.nombre+' '+op.apellido:'Operadora'}`,action:dashAction('Ver',`showResFicha(${r.id})`)};
    }),
    ...enviosSalida.slice(0,4).map(e=>{
      const op=getOp(e.operadoraId);
      return {priority:'media',icon:'🚚',title:'Preparar / enviar equipo',sub:`${fmtDate(e.fechaEnvioEst)} · ${op?op.nombre+' '+op.apellido:'Operadora'} · ${e.departamento||''}`,action:dashAction('Envío',`showEnvioFicha(${e.id})`)};
    }),
    ...retiros.slice(0,4).map(e=>{
      const op=getOp(e.operadoraId);
      return {priority:'alta',icon:'↩️',title:'Retiro pendiente',sub:`${fmtDate(e.fechaRetiroEst)} · ${op?op.nombre+' '+op.apellido:'Operadora'} · ${e.departamento||''}`,action:dashAction('Ver',`showEnvioFicha(${e.id})`)};
    }),
    ...viajerasPendientes.slice(0,5).map(m=>({priority:m.diasGestion>=1?'alta':'media',icon:'🧼',title:'Puesta a punto pendiente',sub:`${m.codigo} · ${m.nombre} · ${m.diasGestion} día${m.diasGestion!==1?'s':''}`,action:dashAction('Ver',dashboardMaqAction(m.id,'mantenimiento'))})),
    ...viajerasTecnico.filter(m=>m.diasTecnico<7).slice(0,4).map(m=>({priority:'media',icon:'🛠',title:'En técnico',sub:`${m.codigo} · ${m.nombre} · ${m.diasTecnico} día${m.diasTecnico!==1?'s':''}`,action:dashAction('Ver',dashboardMaqAction(m.id,'fuera_servicio'))})),
  ];

  return {alta,comercial,operaciones,totales:{senasPend,leadsCalientes,reservasProximas,enviosSalida,retiros,saldosPend,viajerasPendientes,viajerasTecnico,automationTasks}};
}

function renderDailyPanel(items){
  const empty='<div class="daily-empty">Sin pendientes fuertes en esta categoría.</div>';
  return `<div class="dash-card daily-panel" style="grid-column:1/-1">
    <div class="daily-panel-head">
      <div>
        <h3>📌 Hoy hay que atender</h3>
        <div class="daily-panel-sub">Prioridades comerciales, cobros, reservas, envíos, retiros y automatizaciones.</div>
      </div>
      <div class="daily-panel-actions">
        ${dashAction('Leads',`dashboardStatNavigate('leads')`)}
        ${dashAction('Pagos',`dashboardStatNavigate('pagos')`)}
        ${dashAction('Envíos',`dashboardStatNavigate('envios')`)}
      </div>
    </div>
    <div class="daily-grid">
      <div class="daily-col"><h4>Alta prioridad</h4>${items.alta.length?items.alta.slice(0,8).map(dashTaskItem).join(''):empty}</div>
      <div class="daily-col"><h4>Comercial</h4>${items.comercial.length?items.comercial.slice(0,8).map(dashTaskItem).join(''):empty}</div>
      <div class="daily-col"><h4>Operaciones</h4>${items.operaciones.length?items.operaciones.slice(0,8).map(dashTaskItem).join(''):empty}</div>
    </div>
  </div>`;
}

function renderDashboardOperadora(){
  const todasMaqs = DB.get('maquinas')||[];
  const op = (DB.get('operadoras')||[]).find(o=>parseInt(o.id)===parseInt(currentUser?.operadora_id));
  const misReservas = (DB.get('reservas')||[]).filter(r=>parseInt(r.operadoraId)===parseInt(currentUser?.operadora_id));
  const hoy = today();

  // Ciudades de la operadora
  const ciudades = [];
  if(op){
    if(op.ciudad) ciudades.push(op.ciudad);
    const dirs = Array.isArray(op.direccionesEntrega)?op.direccionesEntrega:(op.direcciones_entrega?JSON.parse(op.direcciones_entrega||'[]'):[]);
    dirs.forEach(d=>{ if(d.ciudad&&!ciudades.includes(d.ciudad)) ciudades.push(d.ciudad); if(d.localidad&&!ciudades.includes(d.localidad)) ciudades.push(d.localidad); });
  }

  // Máquinas disponibles en sus ciudades
  const maqsDisp = todasMaqs.filter(m=>{
    if(m.estado!=='disponible') return false;
    if(!ciudades.length) return true;
    const maqLoc = (m.ubicacion||m.ciudad||m.deptBase||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    return ciudades.some(c=>maqLoc.includes(c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')));
  });

  // Reservas activas propias
  const resActivas = misReservas.filter(r=>['confirmada','activa','en_curso','solicitud_recibida','pendiente_aprobacion'].includes(r.estado));
  const resFuturas = misReservas.filter(r=>['confirmada','activa'].includes(r.estado)&&r.fechaFin&&r.fechaFin>=hoy).sort((a,b)=>(a.fechaInicio||'').localeCompare(b.fechaInicio||''));

  // HTML del dashboard operadora
  const nombre = currentUser?.nombre?.split(' ')[0] || 'Operadora';
  const ciudadesLabel = ciudades.length ? ciudades.join(' · ') : 'Sin ciudad registrada';

  document.getElementById('dashAlerts').innerHTML='';
  document.getElementById('statsGrid').innerHTML='';

  document.getElementById('dashboardGrid').innerHTML=`
    <div style="grid-column:1/-1;background:linear-gradient(135deg,var(--accent) 0%,#7b5ea7 100%);border-radius:16px;padding:28px 24px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <div>
        <div style="font-size:22px;font-weight:800;margin-bottom:4px">¡Hola, ${escapeHTML(nombre)}! 👋</div>
        <div style="opacity:.85;font-size:14px">📍 ${escapeHTML(ciudadesLabel)}</div>
        <div style="opacity:.75;font-size:13px;margin-top:4px">${resActivas.length} reserva${resActivas.length!==1?'s':''} activa${resActivas.length!==1?'s':''}</div>
      </div>
      <button onclick="openResModal()" style="background:#fff;color:var(--accent);border:none;border-radius:12px;padding:14px 24px;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.15)">
        🛒 Reservar Equipo Ahora
      </button>
    </div>

    <div class="dash-card" style="grid-column:1/-1">
      <h3>⚙️ Máquinas Disponibles en tu Ciudad</h3>
      ${ciudades.length===0?`<div style="color:var(--text2);font-size:13px">Completá tu ciudad en tu perfil para ver las máquinas disponibles cerca tuyo.</div>`:
        maqsDisp.length===0?`<div style="color:var(--text2);font-size:13px">No hay máquinas disponibles en ${escapeHTML(ciudadesLabel)} por el momento. Te avisaremos cuando haya una.</div>`:
        `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:4px">
          ${maqsDisp.map(m=>{
            const foto = m.fotoUrl||m.foto_url||'';
            return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;cursor:pointer" onclick="openResModal(null,${m.id})">
              <div style="width:68px;height:68px;border-radius:10px;background:var(--surface);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:30px">
                ${foto?`<img src="${escapeAttr(foto)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='⚙️'">`:'⚙️'}
              </div>
              <div style="font-size:13px;font-weight:700;margin-bottom:3px">${escapeHTML(m.nombre)}</div>
              <div style="font-size:11px;color:var(--text2);margin-bottom:8px">${escapeHTML(m.categoria||'')}</div>
              <div style="background:var(--accent);color:#fff;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:700">
                + Reservar
              </div>
            </div>`;
          }).join('')}
        </div>`
      }
    </div>

    ${resFuturas.length?`<div class="dash-card" style="grid-column:1/-1">
      <h3>📅 Mis Reservas Activas</h3>
      ${resFuturas.map(r=>{
        const maq=getMaq(r.maquinaId);
        const foto=maq?.fotoUrl||maq?.foto_url||'';
        const fecha=r.tipo==='jornada'?r.fechaJornada:r.fechaInicio;
        return `<div class="dash-list-item" style="cursor:pointer" onclick="showResFicha(${r.id})">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">
              ${foto?`<img src="${escapeAttr(foto)}" style="width:100%;height:100%;object-fit:cover">`:'⚙️'}
            </div>
            <div>
              <div class="name">${maq?escapeHTML(maq.nombre):'Máquina'}</div>
              <div class="sub">${escapeHTML(r.codigo)} · ${fmtDate(fecha)}${r.deptLogistica?' · '+escapeHTML(r.deptLogistica):''}</div>
            </div>
          </div>
          ${badgeRes(r.estado)}
        </div>`;
      }).join('')}
    </div>`:''}
  `;
}

function renderDashboard(){
  if(isOperadoraUser()){ renderDashboardOperadora(); return; }
  const ops=DB.get('operadoras')||[];
  const maqs=DB.get('maquinas')||[];
  const reservas=DB.get('reservas')||[];
  const pagos=DB.get('pagos')||[];
  const envios=DB.get('envios')||[];
  const mantenimientos=DB.get('mantenimientos')||[];
  const hoy=today();
  if(typeof updateMantenimientosBadge==='function')updateMantenimientosBadge();

  // ── Alertas ──
  const proxVencer=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin>=hoy&&daysDiff(hoy,r.fechaFin)<=5);
  const vencidas=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)&&r.fechaFin&&r.fechaFin<hoy);
  const mantProx=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant>=hoy&&daysDiff(hoy,m.proxMant)<=7);
  const mantVenc=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant<hoy&&m.estado!=='fuera_servicio');
  const mantRegProx=typeof getMantEstado==='function'?mantenimientos.filter(m=>getMantEstado(m)==='próximo'):[];
  const mantRegVenc=typeof getMantEstado==='function'?mantenimientos.filter(m=>getMantEstado(m)==='vencido'):[];
  const deudasVenc=pagos.filter(p=>p.estado==='deuda_vencida');
  const envTransito=envios.filter(e=>e.estado==='en_transito');
  const puedeVerPagos=typeof canView==='function'&&canView('pagos');
  const puedeVerMant=typeof canView==='function'&&canView('mantenimientos');
  const leads=DB.get('leads')||[];
  const dailyItems=dashboardDailyItems({reservas,pagos,envios,leads,maqs,hoy,puedeVerPagos});
  const viajerasPendDemoradas=dailyItems.totales.viajerasPendientes.filter(m=>m.diasGestion>=1);
  const viajerasTecnicoDemoradas=dailyItems.totales.viajerasTecnico.filter(m=>m.diasTecnico>=7);

  let alertsHTML='';
  const esOperadora=isOperadoraUser();
  if(!esOperadora&&viajerasPendDemoradas.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">🧼</span><div><strong>${viajerasPendDemoradas.length} máquina${viajerasPendDemoradas.length>1?'s':''} viajera${viajerasPendDemoradas.length>1?'s':''} pendiente${viajerasPendDemoradas.length>1?'s':''} de puesta a punto</strong> hace más de 24 hs. <button class="action-btn" style="margin-left:8px" onclick="dashboardStatNavigate('maquinas')">Ver →</button></div></div>`;
  if(!esOperadora&&viajerasTecnicoDemoradas.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🛠</span><div><strong>${viajerasTecnicoDemoradas.length} máquina${viajerasTecnicoDemoradas.length>1?'s':''} en técnico demorada${viajerasTecnicoDemoradas.length>1?'s':''}</strong> por más de 7 días. <button class="action-btn" style="margin-left:8px" onclick="dashboardStatNavigate('maquinas')">Ver →</button></div></div>`;
  if(vencidas.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🚨</span><div><strong>${vencidas.length} reserva${vencidas.length>1?'s':''} vencida${vencidas.length>1?'s':''}</strong> — Requieren atención. <button class="action-btn" style="margin-left:8px" onclick="navigate('reservas')">Ver →</button></div></div>`;
  if(!esOperadora&&puedeVerPagos&&deudasVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">💳</span><div><strong>${deudasVenc.length} deuda${deudasVenc.length>1?'s':''} vencida${deudasVenc.length>1?'s':''}</strong> — Operadoras con pagos pendientes. <button class="action-btn" style="margin-left:8px" onclick="navigate('pagos')">Ver →</button></div></div>`;
  if(!esOperadora&&puedeVerMant&&mantRegVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🔧</span><div><strong>${mantRegVenc.length} mantenimiento${mantRegVenc.length>1?'s':''} vencido${mantRegVenc.length>1?'s':''}</strong>. <button class="action-btn" style="margin-left:8px" onclick="navigate('mantenimientos')">Ver →</button></div></div>`;
  else if(!esOperadora&&mantVenc.length) alertsHTML+=`<div class="alert-banner danger"><span class="ab-icon">🔧</span><div><strong>${mantVenc.length} máquina${mantVenc.length>1?'s':''} con mantenimiento vencido</strong>. <button class="action-btn" style="margin-left:8px" onclick="navigate('maquinas')">Ver →</button></div></div>`;
  if(proxVencer.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⏰</span><div><strong>${proxVencer.length} reserva${proxVencer.length>1?'s':''}</strong> vence${proxVencer.length>1?'n':''} en ≤5 días. <button class="action-btn" style="margin-left:8px" onclick="navigate('reservas')">Ver →</button></div></div>`;
  if(!esOperadora&&puedeVerMant&&mantRegProx.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⚙️</span><div><strong>${mantRegProx.length} mantenimiento${mantRegProx.length>1?'s':''} próximo${mantRegProx.length>1?'s':''}</strong> (≤30 días). <button class="action-btn" style="margin-left:8px" onclick="navigate('mantenimientos')">Ver →</button></div></div>`;
  else if(!esOperadora&&mantProx.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⚙️</span><div><strong>${mantProx.length} máquina${mantProx.length>1?'s':''} con mantenimiento próximo</strong> (≤7 días). <button class="action-btn" style="margin-left:8px" onclick="navigate('maquinas')">Ver →</button></div></div>`;
  if(!esOperadora&&envTransito.length) alertsHTML+=`<div class="alert-banner info"><span class="ab-icon">🚚</span><div><strong>${envTransito.length} envío${envTransito.length>1?'s':''} en tránsito</strong> — Pendientes de confirmación de entrega. <button class="action-btn" style="margin-left:8px" onclick="navigate('envios')">Ver →</button></div></div>`;
  document.getElementById('dashAlerts').innerHTML=alertsHTML;

  const statsData=[
    {icon:'👩‍💼',label:'Operadoras Activas',value:ops.filter(o=>o.estado==='activa').length,color:'#d4a96a',bg:'rgba(212,169,106,0.1)',trend:`${ops.length} total · ${ops.filter(o=>o.estado==='prospecto').length} prospectos`,action:'operadoras'},
    {icon:'⚙️',label:'Máquinas Disponibles',value:maqs.filter(m=>m.estado==='disponible').length,color:'#52c48a',bg:'rgba(82,196,138,0.1)',trend:`${maqs.length} total · ${maqs.filter(m=>m.estado==='mantenimiento').length} en mant.`,action:'maquinas'},
    {icon:'📅',label:'Reservas Confirmadas',value:reservas.filter(r=>r.estado==='confirmada').length,color:'#9b7fe8',bg:'rgba(155,127,232,0.1)',trend:`${reservas.filter(r=>r.estado==='solicitud_recibida').length} solicitudes sin revisar`,action:'reservas'},
  ];
  if(puedeVerPagos) statsData.push(
    {icon:'💳',label:'Pagos Pendientes',value:pagos.filter(p=>['pendiente','sena_pendiente'].includes(p.estado)).length,color:'#e0c05c',bg:'rgba(224,192,92,0.1)',trend:`${deudasVenc.length} deuda${deudasVenc.length!==1?'s':''} vencida${deudasVenc.length!==1?'s':''}`,action:'pagos'}
  );
  if(puedeVerPagos && !isOperadoraUser()) statsData.push(
    {icon:'💳',label:'Pagos Pendientes',value:pagos.filter(p=>['pendiente','sena_pendiente'].includes(p.estado)).length,color:'#e0c05c',bg:'rgba(224,192,92,0.1)',trend:`${deudasVenc.length} deuda${deudasVenc.length!==1?'s':''} vencida${deudasVenc.length!==1?'s':''}`,action:'pagos'}
  );
  if(!isOperadoraUser()){
    statsData.push(
      {icon:'🔥',label:'Leads Calientes',value:dailyItems.totales.leadsCalientes.length,color:'#ff9f43',bg:'rgba(255,159,67,0.1)',trend:`${dailyItems.totales.senasPend.length} seña${dailyItems.totales.senasPend.length!==1?'s':''} pendiente${dailyItems.totales.senasPend.length!==1?'s':''}`,action:'leads'},
      {icon:'↩️',label:'Retiros Pendientes',value:dailyItems.totales.retiros.length,color:'#5c8fe0',bg:'rgba(92,143,224,0.1)',trend:`${dailyItems.totales.enviosSalida.length} salida${dailyItems.totales.enviosSalida.length!==1?'s':''} próxima${dailyItems.totales.enviosSalida.length!==1?'s':''}`,action:'envios'},
      {icon:'🧼',label:'Viajeras a Preparar',value:dailyItems.totales.viajerasPendientes.length,color:'#e0c05c',bg:'rgba(224,192,92,0.1)',trend:`${dailyItems.totales.viajerasTecnico.length} en técnico`,action:'maquinas'}
    );
  }
  document.getElementById('statsGrid').innerHTML=statsData.map(s=>`
    <button type="button" class="stat-card stat-card-link" onclick="dashboardStatNavigate('${s.action}')" aria-label="Abrir ${escapeAttr(s.label)}">
      <div class="stat-card-icon" style="background:${s.bg}">${s.icon}</div>
      <h3 style="color:${s.color}">${s.value}</h3>
      <p>${escapeHTML(s.label)}</p>
      ${s.trend?`<div class="trend" style="color:${s.color};opacity:.7">${s.trend}</div>`:''}
    </button>`).join('');

  const recRes=reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)).slice().sort((a,b)=>{
    const fa=a.fechaJornada||a.fechaInicio||''; const fb=b.fechaJornada||b.fechaInicio||'';
    return fb.localeCompare(fa);
  }).slice(0,5);
  const alertMaq=maqs.filter(m=>m.estado==='mantenimiento'||m.estado==='fuera_servicio');
  const mantProxMaq=maqs.filter(m=>m.proxMant&&m.proxMant!=='—'&&m.proxMant>=hoy&&daysDiff(hoy,m.proxMant)<=14).sort((a,b)=>a.proxMant.localeCompare(b.proxMant));

  document.getElementById('dashboardGrid').innerHTML=`
    ${renderDailyPanel(dailyItems)}
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
