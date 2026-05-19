/* ══════════════════════════════════
   AUTOMATIZACION DE RESERVAS
══════════════════════════════════ */
function getRevisionOp(operadoraId){
  return (DB.get('revision_operadoras')||[]).find(r=>parseInt(r.operadora_id)===parseInt(operadoraId));
}

function getDocsOp(operadoraId){
  return (DB.get('documentos_operadora')||[]).filter(d=>parseInt(d.operadora_id)===parseInt(operadoraId));
}

function tieneCedulaCompleta(operadoraId){
  const docs=getDocsOp(operadoraId);
  return docs.some(d=>d.tipo==='cedula') && docs.some(d=>d.tipo==='cedula_dorso');
}

function tieneContratoFirmadoReserva(r){
  const docs=getDocsOp(r.operadoraId);
  const docContrato=docs.some(d=>d.tipo==='contrato' && parseInt(d.maquina_id)===parseInt(r.maquinaId));
  const contratos=(DB.get('contratos')||[]);
  const contratoCrm=contratos.some(c=>
    parseInt(c.operadoraId)===parseInt(r.operadoraId) &&
    parseInt(c.maquinaId)===parseInt(r.maquinaId) &&
    (c.firmado || c.estado==='firmado')
  );
  return docContrato || contratoCrm;
}

function validarReservaAutomatica(reservaLike){
  const r=typeof reservaLike==='object' ? reservaLike : (DB.get('reservas')||[]).find(x=>x.id===parseInt(reservaLike));
  const bloqueos=[]; const avisos=[];
  if(!r) return {puede:false,bloqueos:['Reserva no encontrada'],avisos:[],estado:'bloqueada',motivo:'Reserva no encontrada'};

  const op=getOp(r.operadoraId);
  const maq=getMaq(r.maquinaId);

  if(!op) bloqueos.push('Falta operadora vinculada');
  else {
    if(op.estado!=='activa') bloqueos.push(`Operadora en estado ${op.estado}`);
    const revision=getRevisionOp(op.id);
    if(revision && revision.requiere_revision_admin && revision.revision_admin_estado!=='aprobada'){
      bloqueos.push(`Registro de operadora pendiente: ${revision.revision_admin_estado}`);
    }
    if(!tieneCedulaCompleta(op.id)) bloqueos.push('Falta cédula/DNI frente y dorso');
  }

  if(!maq) bloqueos.push('Falta máquina vinculada');
  else {
    const disp=checkDisponibilidad(r.maquinaId,r.fechaInicio,r.fechaFin,r.id,r.deptLogistica||'');
    if(!disp.ok) bloqueos.push(disp.msg.replace(/^[^A-Za-zÁÉÍÓÚáéíóú]+/,''));
  }

  if(op && maq && !tieneContratoFirmadoReserva(r)) bloqueos.push('Falta contrato firmado para esta máquina');

  const pagos=(DB.get('pagos')||[]).filter(p=>parseInt(p.reservaId)===parseInt(r.id));
  if(op && typeof tieneDeudaVencida==='function' && tieneDeudaVencida(op.id)){
    bloqueos.push('La operadora tiene deuda vencida');
  }
  const pagoConSena=pagos.find(p=>(p.senaRequerida||0)>0);
  if(pagoConSena && (pagoConSena.senaAbonada||0)<(pagoConSena.senaRequerida||0)){
    const falta=(pagoConSena.senaRequerida||0)-(pagoConSena.senaAbonada||0);
    bloqueos.push(`Seña pendiente: faltan ${falta.toLocaleString()} ${pagoConSena.moneda}`);
  }
  if(!pagos.length && (r.monto||0)>0) avisos.push('No hay pago/seña registrado todavía');
  if(!r.deptLogistica) avisos.push('Falta departamento logístico');
  if(!r.bloqueLogistico && r.deptLogistica) avisos.push('Revisar si requiere bloqueo logístico/envío');

  const puede=!bloqueos.length;
  const estado=puede ? (avisos.length?'revisar':'lista') : 'bloqueada';
  return {
    puede,
    bloqueos,
    avisos,
    estado,
    motivo: bloqueos[0] || avisos[0] || 'Sin bloqueos operativos detectados.'
  };
}

function reservaPuedeConfirmarse(reservaId){
  const v=validarReservaAutomatica(reservaId);
  return {puede:v.puede, motivo:v.motivo, bloqueos:v.bloqueos, avisos:v.avisos, estado:v.estado};
}

function renderReservaAutomatizacionBadge(r){
  const v=validarReservaAutomatica(r);
  if(v.estado==='lista') return '<span class="badge badge-green">Lista</span>';
  if(v.estado==='revisar') return '<span class="badge badge-yellow">Revisar</span>';
  return `<span class="badge badge-red">${v.bloqueos.length} bloqueo${v.bloqueos.length!==1?'s':''}</span>`;
}

function renderReservaAutomatizacionPanel(r){
  const v=validarReservaAutomatica(r);
  const color=v.estado==='lista'?'green':(v.estado==='revisar'?'yellow':'red');
  const title=v.estado==='lista'?'Automatización lista':(v.estado==='revisar'?'Requiere revisión':'Reserva bloqueada');
  const items=[...v.bloqueos.map(x=>({tipo:'bloqueo',txt:x})),...v.avisos.map(x=>({tipo:'aviso',txt:x}))];
  const acciones=renderReservaAccionesAutomaticas(r,v);
  return `<div class="alert-banner ${color==='red'?'danger':(color==='yellow'?'warn':'')}" style="${color==='green'?'background:rgba(82,196,138,0.08);border:1px solid rgba(82,196,138,0.2);color:var(--green)':''}">
    <span class="ab-icon">${color==='green'?'✅':(color==='yellow'?'⚠️':'⛔')}</span>
    <div>
      <strong>${title}</strong> — ${v.motivo}
      ${items.length?`<ul class="auto-check-list">${items.map(i=>`<li class="${i.tipo}">${i.txt}</li>`).join('')}</ul>`:''}
      ${acciones}
    </div>
  </div>`;
}

function renderReservaAccionesAutomaticas(r,v){
  const acciones=[];
  if(v.estado==='lista'&&r.estado!=='confirmada'){
    acciones.push(`<button class="action-btn" onclick="confirmarReservaAutomatica(${r.id})">Confirmar reserva</button>`);
  }
  if(v.bloqueos.some(x=>x.includes('cédula')||x.includes('DNI'))){
    acciones.push(`<button class="action-btn" onclick="navigate('documentos')">Ver documentos</button>`);
  }
  if(v.bloqueos.some(x=>x.includes('contrato'))){
    acciones.push(`<button class="action-btn" onclick="openContratoModal()">Crear contrato</button>`);
  }
  if(v.bloqueos.some(x=>x.includes('Seña'))||v.avisos.some(x=>x.includes('pago'))){
    acciones.push(`<button class="action-btn" onclick="openPagoModal(${r.id})">Registrar pago</button>`);
  }
  if(v.avisos.some(x=>x.includes('bloqueo logístico'))){
    acciones.push(`<button class="action-btn" onclick="openResModal(${r.id})">Activar logística</button>`);
  }
  if(!acciones.length)return '';
  return `<div class="auto-actions">${acciones.join('')}</div>`;
}

function getReservasAutomationStats(){
  const reservas=(DB.get('reservas')||[]).filter(r=>ESTADOS_ACTIVOS.includes(r.estado));
  return reservas.reduce((acc,r)=>{
    const st=validarReservaAutomatica(r).estado;
    acc[st]=(acc[st]||0)+1;
    acc.total+=1;
    return acc;
  },{total:0,lista:0,revisar:0,bloqueada:0});
}

function renderReservasAutomationSummary(){
  const el=document.getElementById('reservasAutoResumen');
  if(!el)return;
  const s=getReservasAutomationStats();
  el.innerHTML=`
    <button class="fin-cell auto-filter-card" onclick="filterResControl('bloqueada');sv('filterResControl','bloqueada')"><div class="fc-label">Bloqueadas</div><div class="fc-value" style="color:var(--red)">${s.bloqueada}</div></button>
    <button class="fin-cell auto-filter-card" onclick="filterResControl('revisar');sv('filterResControl','revisar')"><div class="fc-label">A revisar</div><div class="fc-value" style="color:var(--yellow)">${s.revisar}</div></button>
    <button class="fin-cell auto-filter-card" onclick="filterResControl('lista');sv('filterResControl','lista')"><div class="fc-label">Listas</div><div class="fc-value" style="color:var(--green)">${s.lista}</div></button>
    <button class="fin-cell auto-filter-card" onclick="filterResControl('');sv('filterResControl','')"><div class="fc-label">Reservas activas</div><div class="fc-value">${s.total}</div></button>`;
}

async function confirmarReservaAutomatica(id){
  const reservas=DB.get('reservas')||[];
  const idx=reservas.findIndex(r=>parseInt(r.id)===parseInt(id));
  if(idx<0)return;
  const v=validarReservaAutomatica(reservas[idx]);
  if(!v.puede){showToast('⛔ No se puede confirmar: '+v.motivo,'warn');return;}
  if(!confirm('¿Confirmar esta reserva automática como lista?'))return;
  try{
    await api(`/api/reservas/${id}/estado`,{method:'PATCH',body:JSON.stringify({estado:'confirmada',motivo:'Confirmación automática: controles completos'})});
    reservas[idx].estado='confirmada';
    DB.set('reservas',reservas);
    if(reservas[idx].bloqueLogistico&&typeof syncEnviosDesdeServidor==='function')await syncEnviosDesdeServidor();
    if(typeof encolarNotificacion==='function')encolarNotificacion('reserva_confirmada', reservas[idx].operadoraId, {reservaId:id, monto:reservas[idx].monto, moneda:reservas[idx].moneda});
    showToast('✅ Reserva confirmada automáticamente');
    updateReservasBadge();
    if(document.getElementById('view-reserva-ficha')?.classList.contains('active'))showResFicha(id);
    else renderReservas();
  }catch(e){showToast('⛔ '+e.message,'warn');}
}

function renderReservaModalAutomatizacion(){
  const el=document.getElementById('resAutomatizacion');
  if(!el) return;
  const opId=parseInt(gv('resOperadoraId'));
  const maqId=parseInt(gv('resMaquinaId'));
  const tipo=gv('resTipo');
  const fecha=tipo==='jornada'?gv('resFechaJornada'):gv('resFechaInicio');
  if(!opId||!maqId||!fecha){el.style.display='none';return;}
  const temp={
    id:parseInt(gv('resId'))||0,
    operadoraId:opId,
    maquinaId:maqId,
    tipo,
    fechaJornada:tipo==='jornada'?gv('resFechaJornada'):'',
    fechaInicio:tipo==='jornada'?gv('resFechaJornada'):gv('resFechaInicio'),
    fechaFin:tipo==='jornada'?gv('resFechaJornada'):gv('resFechaFin'),
    estado:gv('resEstado'),
    deptLogistica:gv('resDeptLogistica'),
    bloqueLogistico:gv('resBloqueLogistico')==='true',
    monto:parseFloat(gv('resMonto'))||0
  };
  el.style.display='block';
  el.innerHTML=renderReservaAutomatizacionPanel(temp);
}

function updateReservasAutomatizacionBadge(){
  const reservas=(DB.get('reservas')||[]).filter(r=>ESTADOS_ACTIVOS.includes(r.estado));
  const bloqueadas=reservas.filter(r=>validarReservaAutomatica(r).estado==='bloqueada').length;
  return bloqueadas;
}
