/* ══════════════════════════════════
   ENVÍOS
══════════════════════════════════ */
const ENVIO_ESTADOS = {
  pendiente_envio: {label:'Pendiente Envío', badge:'badge-gray',   icon:'📦'},
  preparando:      {label:'Preparando',      badge:'badge-yellow', icon:'🔧'},
  en_transito:     {label:'En Tránsito',     badge:'badge-blue',   icon:'🚚'},
  entregado:       {label:'Entregado',       badge:'badge-green',  icon:'✅'},
  retiro_pendiente:{label:'Retiro Pendiente',badge:'badge-rose',   icon:'⏳'},
  retirado:        {label:'Retirado',        badge:'badge-teal',   icon:'🔄'},
  cancelado:       {label:'Cancelado',       badge:'badge-red',    icon:'❌'},
};
const ENVIO_STEPS = ['pendiente_envio','preparando','en_transito','entregado','retiro_pendiente','retirado'];

function badgeEnvio(e){
  const st=ENVIO_ESTADOS[e];
  if(!st) return `<span class="badge badge-gray">${e}</span>`;
  return `<span class="badge ${st.badge}">${st.icon} ${st.label}</span>`;
}

function getEnvio(id){return (DB.get('envios')||[]).find(e=>e.id===parseInt(id));}

let envioFilter={search:'',estado:''};

function renderEnvios(){
  const envios=DB.get('envios')||[];
  const hoy=today();

  // Alertas
  const enTransito=envios.filter(e=>e.estado==='en_transito');
  const retiroPend=envios.filter(e=>e.estado==='retiro_pendiente'||
    (e.estado==='entregado'&&e.fechaRetiroEst&&e.fechaRetiroEst<hoy));
  let alertsHTML='';
  if(enTransito.length) alertsHTML+=`<div class="alert-banner info"><span class="ab-icon">🚚</span><strong>${enTransito.length} envío${enTransito.length>1?'s':''} en tránsito</strong> — Pendientes de confirmación de entrega.</div>`;
  if(retiroPend.length) alertsHTML+=`<div class="alert-banner warn"><span class="ab-icon">⏳</span><strong>${retiroPend.length} retiro${retiroPend.length>1?'s':''} pendiente${retiroPend.length>1?'s':''}</strong> — Coordinar retiro de equipos.</div>`;
  document.getElementById('enviosAlerts').innerHTML=alertsHTML;

  const filtered=envios.filter(e=>{
    const q=envioFilter.search.toLowerCase();
    const op=getOp(e.operadoraId); const maq=getMaq(e.maquinaId);
    const ms=!q||e.codigo.toLowerCase().includes(q)
      ||(op&&(op.nombre+' '+op.apellido).toLowerCase().includes(q))
      ||(maq&&maq.nombre.toLowerCase().includes(q))
      ||e.departamento.toLowerCase().includes(q);
    return ms&&(!envioFilter.estado||e.estado===envioFilter.estado);
  }).sort((a,b)=>b.id-a.id);

  const tbody=document.getElementById('enviosTableBody');
  if(!filtered.length){
    tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="icon">🚚</div><h3>Sin envíos</h3><p>Los envíos se crean automáticamente al confirmar reservas con bloqueo logístico.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML=filtered.map(e=>{
    const op=getOp(e.operadoraId); const maq=getMaq(e.maquinaId);
    const res=(DB.get('reservas')||[]).find(r=>r.id===e.reservaId);
    return `<tr>
      <td><span style="font-family:monospace;color:var(--accent);font-size:11px">${e.codigo}</span></td>
      <td><span class="bold">${op?op.nombre+' '+op.apellido:'—'}</span></td>
      <td>${maq?maq.nombre:'—'}</td>
      <td>${res?`<button class="action-btn" onclick="showResFicha(${res.id})">${res.codigo}</button>`:'—'}</td>
      <td>${e.departamento||'—'}</td>
      <td>${fmtDate(e.fechaEnvioEst)}</td>
      <td>${fmtDate(e.fechaRetiroEst)}</td>
      <td>${badgeEnvio(e.estado)}</td>
      <td style="white-space:nowrap">
        <button class="action-btn" onclick="showEnvioFicha(${e.id})">Ver</button>
        ${canEdit()?`<button class="action-btn" onclick="openEnvioModal(0,${e.id})" style="margin-left:4px">Editar</button>`:''}
      </td></tr>`;
  }).join('');
}

function filterEnvios(v){envioFilter.search=v;renderEnvios();}
function filterEnvioEstado(v){envioFilter.estado=v;renderEnvios();}

function showEnvioFicha(id){
  const e=getEnvio(id); if(!e)return;
  const op=getOp(e.operadoraId); const maq=getMaq(e.maquinaId);
  const res=(DB.get('reservas')||[]).find(r=>r.id===e.reservaId);
  const st=ENVIO_ESTADOS[e.estado]||{};
  const curStep=ENVIO_STEPS.indexOf(e.estado);

  navigate('envio-ficha');
  document.getElementById('fichaEnvioContent').innerHTML=`
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar" style="background:linear-gradient(135deg,#3a6fd8,#1a3a80)">${st.icon||'🚚'}</div>
        <div class="ficha-title">
          <h2>${e.codigo}</h2>
          <p>${op?op.nombre+' '+op.apellido:'—'} · ${maq?maq.nombre:'—'}</p>
        </div>
      </div>
      <div class="ficha-actions">
        ${badgeEnvio(e.estado)}
        ${canEdit()?`<button class="btn-secondary" onclick="openEnvioModal(0,${e.id})">✏️ Editar</button>`:''}
        ${isSuperAdmin()?`<button class="btn-danger" onclick="deleteEnvio(${e.id})">🗑</button>`:''}
      </div>
    </div>

    <!-- Tracking visual -->
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px;overflow-x:auto">
      <h4 style="font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:16px">📍 Estado del Envío</h4>
      <div style="display:flex;gap:0;min-width:500px">
        ${ENVIO_STEPS.map((s,i)=>{
          const stS=ENVIO_ESTADOS[s];
          const isDone=i<curStep; const isActive=i===curStep;
          return `<div style="flex:1;text-align:center;position:relative">
            ${i>0?`<div style="position:absolute;top:15px;left:-50%;width:100%;height:2px;background:${isDone||isActive?'var(--accent)':'var(--border)'};z-index:0"></div>`:''}
            <div style="width:32px;height:32px;border-radius:50%;margin:0 auto 8px;
              background:${isActive?'var(--accent)':isDone?'rgba(82,196,138,0.2)':'var(--surface2)'};
              border:2px solid ${isActive?'var(--accent)':isDone?'var(--green)':'var(--border)'};
              display:flex;align-items:center;justify-content:center;font-size:14px;
              position:relative;z-index:1;box-shadow:${isActive?'0 0 0 4px rgba(212,169,106,0.15)':'none'}">
              ${isDone?'✓':stS.icon}
            </div>
            <div style="font-size:10px;font-weight:600;color:${isActive?'var(--accent)':isDone?'var(--green)':'var(--text3)'};padding:0 4px">${stS.label}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="ficha-grid">
      <div class="info-card">
        <h4>📋 Datos del Envío</h4>
        ${ir('Código',`<span style="font-family:monospace;color:var(--accent)">${e.codigo}</span>`)}
        ${ir('Operadora',op?`<button class="action-btn" onclick="showOpFicha(${e.operadoraId})">${op.nombre} ${op.apellido}</button>`:'—')}
        ${ir('Máquina',maq?`<button class="action-btn" onclick="showMaqFicha(${e.maquinaId})">${maq.nombre} (${maq.codigo})</button>`:'—')}
        ${ir('Reserva',res?`<button class="action-btn" onclick="showResFicha(${e.reservaId})">${res.codigo}</button>`:'—')}
        ${ir('Estado',badgeEnvio(e.estado))}
      </div>
      <div class="info-card">
        <h4>📅 Fechas y Logística</h4>
        ${ir('Departamento',`<strong>${e.departamento||'—'}</strong>`)}
        ${ir('Dirección',e.direccion||'—')}
        ${ir('Transportista',e.transportista||'—')}
        ${ir('N° Seguimiento',e.tracking?`<code style="color:var(--accent);font-size:12px">${e.tracking}</code>`:'—')}
        ${ir('Envío estimado',fmtDate(e.fechaEnvioEst))}
        ${ir('Envío real',e.fechaEnvioReal?`<span style="color:var(--green)">${fmtDate(e.fechaEnvioReal)}</span>`:'—')}
        ${ir('Retiro estimado',fmtDate(e.fechaRetiroEst))}
        ${ir('Retiro real',e.fechaRetiroReal?`<span style="color:var(--green)">${fmtDate(e.fechaRetiroReal)}</span>`:'—')}
      </div>
      <div class="info-card full">
        <h4>📝 Observaciones</h4>
        <div class="obs-text">${e.obs||'Sin observaciones.'}</div>
      </div>
    </div>`;
}

function openEnvioModal(reservaIdPrefill, envioId){
  const reservas=DB.get('reservas')||[];
  document.getElementById('envioReservaId').innerHTML=
    '<option value="">— Seleccionar reserva —</option>'+
    reservas.filter(r=>['confirmada','aprobada'].includes(r.estado))
      .map(r=>{
        const op=getOp(r.operadoraId);
        return `<option value="${r.id}">${r.codigo} — ${op?op.nombre+' '+op.apellido:''} · ${r.deptLogistica||'sin depto'}</option>`;
      }).join('');

  document.getElementById('modalEnvioTitle').textContent=envioId?'Editar Envío':'Nuevo Envío';
  document.getElementById('envioInfoWrap').style.display='none';

  if(envioId){
    const e=getEnvio(envioId); if(!e)return;
    sv('envioId',e.id); sv('envioReservaId',e.reservaId); sv('envioEstado',e.estado);
    sv('envioFechaEnvioEst',e.fechaEnvioEst||''); sv('envioFechaEnvioReal',e.fechaEnvioReal||'');
    sv('envioFechaRetiroEst',e.fechaRetiroEst||''); sv('envioFechaRetiroReal',e.fechaRetiroReal||'');
    sv('envioTransportista',e.transportista||''); sv('envioTracking',e.tracking||'');
    sv('envioDireccion',e.direccion||''); sv('envioObs',e.obs||'');
    onEnvioReservaChange();
  } else {
    sv('envioId',''); sv('envioReservaId',reservaIdPrefill||'');
    sv('envioEstado','pendiente_envio');
    ['envioFechaEnvioEst','envioFechaEnvioReal','envioFechaRetiroEst','envioFechaRetiroReal',
     'envioTransportista','envioTracking','envioDireccion','envioObs'].forEach(f=>sv(f,''));
    if(reservaIdPrefill) onEnvioReservaChange();
  }
  openModal('modalEnvio');
}

function onEnvioReservaChange(){
  const resId=parseInt(gv('envioReservaId'));
  const wrap=document.getElementById('envioInfoWrap');
  const text=document.getElementById('envioInfoText');
  if(!resId){wrap.style.display='none';return;}
  const res=(DB.get('reservas')||[]).find(r=>r.id===resId); if(!res){wrap.style.display='none';return;}
  const op=getOp(res.operadoraId); const maq=getMaq(res.maquinaId);
  text.innerHTML=`<strong>${op?op.nombre+' '+op.apellido:'—'}</strong> · ${maq?maq.nombre:'—'} · Depto: <strong>${res.deptLogistica||'sin asignar'}</strong>`;
  wrap.style.display='block';
  // Pre-fill departamento if empty
  if(!gv('envioDireccion') && res.deptLogistica) sv('envioDireccion', res.deptLogistica);
  // Auto-calc retiro from reserva fechaFin + dias despues
  if(!gv('envioFechaRetiroEst') && res.fechaFin){
    const regla=getReglaLogistica(res.deptLogistica||'');
    const retiro=new Date(res.fechaFin+'T12:00:00');
    retiro.setDate(retiro.getDate()+regla.diasDespues+1);
    sv('envioFechaRetiroEst', retiro.toISOString().split('T')[0]);
  }
}

async function saveEnvio(){
  const id=gv('envioId');
  const payload={
    reserva_id:parseInt(gv('envioReservaId'))||null,
    operadora_id:parseInt(gv('envioOperadoraId')),
    maquina_id:parseInt(gv('envioMaquinaId')),
    departamento:gv('envioDepartamento').trim(),
    direccion:gv('envioDireccion').trim(),
    transportista:gv('envioTransportista').trim(),
    tracking:gv('envioTracking').trim(),
    estado:gv('envioEstado'),
    fecha_envio_est:gv('envioFechaEnvioEst')||null,
    fecha_envio_real:gv('envioFechaEnvioReal')||null,
    fecha_retiro_est:gv('envioFechaRetiroEst')||null,
    fecha_retiro_real:gv('envioFechaRetiroReal')||null,
    costo_envio:parseFloat(gv('envioCostoEnvio'))||0,
    costo_retiro:parseFloat(gv('envioCostoRetiro'))||0,
    moneda:gv('envioMoneda')||'UYU',
    obs:gv('envioObs').trim()};
  if(!payload.operadora_id||!payload.maquina_id){showToast('\u26a0\ufe0f Operadora y m\u00e1quina son obligatorios','warn');return;}
  try{
    if(id){
      await api('/api/envios/'+id,{method:'PUT',body:JSON.stringify(payload)});
      showToast('\u2705 Env\u00edo actualizado');
    }else{
      await api('/api/envios',{method:'POST',body:JSON.stringify(payload)});
      showToast('\u2705 Env\u00edo creado');
    }
    const envios=await api('/api/envios');
    DB.set('envios',envios.map(e=>({id:e.id,codigo:e.codigo,reservaId:e.reserva_id,
      operadoraId:e.operadora_id,maquinaId:e.maquina_id,
      departamento:e.departamento||'',direccion:e.direccion||'',
      transportista:e.transportista||'',tracking:e.tracking||'',
      estado:e.estado||'pendiente',
      fechaEnvioEst:e.fecha_envio_est||'',fechaEnvioReal:e.fecha_envio_real||'',
      fechaRetiroEst:e.fecha_retiro_est||'',fechaRetiroReal:e.fecha_retiro_real||'',
      costoEnvio:parseFloat(e.costo_envio)||0,costoRetiro:parseFloat(e.costo_retiro)||0,
      moneda:e.moneda||'UYU',obs:e.obs||''})));
    closeModal('modalEnvio');renderEnvios();updateEnviosBadge();
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}

function crearEnvioDesdeReserva(r){
  if(!r.bloqueLogistico) return;
  const envios=DB.get('envios')||[];
  if(envios.some(e=>e.reservaId===r.id)) return; // ya existe
  const regla=getReglaLogistica(r.deptLogistica||'');
  const retiro=new Date((r.fechaFin||r.fechaJornada)+'T12:00:00');
  retiro.setDate(retiro.getDate()+regla.diasDespues+1);
  const newId=Math.max(0,...envios.map(e=>e.id))+1;
  envios.push({
    id:newId, codigo:'ENV-'+String(newId).padStart(3,'0'),
    reservaId:r.id, operadoraId:r.operadoraId, maquinaId:r.maquinaId,
    departamento:r.deptLogistica||'',
    direccion:r.deptLogistica||'',transportista:'',tracking:'',
    fechaEnvioEst:r.fechaInicio,fechaEnvioReal:'',
    fechaRetiroEst:retiro.toISOString().split('T')[0],fechaRetiroReal:'',
    estado:'pendiente_envio',
    obs:'Creado automáticamente al confirmar reserva '+r.codigo,
    creadaEn:today(),
  });
  DB.set('envios',envios);
  updateEnviosBadge();
  showToast('🚚 Envío creado automáticamente: ENV-'+String(newId).padStart(3,'0'));
}

async function deleteEnvio(id){
  if(!confirm('\u00bfEliminar este env\u00edo?'))return;
  try{
    await api('/api/envios/'+id,{method:'DELETE'});
    const envios=await api('/api/envios');
    DB.set('envios',envios.map(e=>({id:e.id,codigo:e.codigo,reservaId:e.reserva_id,
      operadoraId:e.operadora_id,maquinaId:e.maquina_id,
      departamento:e.departamento||'',direccion:e.direccion||'',
      transportista:e.transportista||'',tracking:e.tracking||'',
      estado:e.estado||'pendiente',
      fechaEnvioEst:e.fecha_envio_est||'',fechaEnvioReal:e.fecha_envio_real||'',
      fechaRetiroEst:e.fecha_retiro_est||'',fechaRetiroReal:e.fecha_retiro_real||'',
      costoEnvio:parseFloat(e.costo_envio)||0,costoRetiro:parseFloat(e.costo_retiro)||0,
      moneda:e.moneda||'UYU',obs:e.obs||''})));
    showToast('\ud83d\uddd1 Env\u00edo eliminado');navigate('envios');updateEnviosBadge();
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}

function updateEnviosBadge(){
  const envios=DB.get('envios')||[];
  const count=envios.filter(e=>['en_transito','retiro_pendiente'].includes(e.estado)).length;
  const badge=document.getElementById('navBadgeEnvios');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}

function updateMaqBadge(){
  const maqs=DB.get('maquinas')||[];
  const hoy=today();
  const count=maqs.filter(m=>
    m.estado==='mantenimiento'||m.estado==='fuera_servicio'||
    (m.proxMant&&m.proxMant!=='—'&&m.proxMant<hoy)
  ).length;
  const badge=document.getElementById('navBadgeMaq');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}
