/* ══════════════════════════════════
   MÁQUINAS
══════════════════════════════════ */
let maqFilter={search:'',status:''};
function badgeMaq(e){
  const m={disponible:'badge-green',reservada:'badge-rose',mantenimiento:'badge-yellow',fuera_servicio:'badge-red',en_viaje:'badge-blue'};
  const l={disponible:'Disponible',reservada:'Reservada',mantenimiento:'Mantenimiento',fuera_servicio:'Fuera Servicio',en_viaje:'En Viaje de China'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function renderMaquinas(){
  const maqs=(DB.get('maquinas')||[]).filter(m=>{
    const q=maqFilter.search.toLowerCase();
    const ms=!q||(m.codigo+' '+m.nombre+' '+m.categoria+' '+m.ubicacion).toLowerCase().includes(q);
    return ms&&(!maqFilter.status||m.estado===maqFilter.status);
  });
  const tbody=document.getElementById('maqTableBody');
  if(!maqs.length){tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="icon">⚙️</div><h3>Sin resultados</h3></div></td></tr>`;return;}
  tbody.innerHTML=maqs.map(m=>`<tr>
    <td><span style="font-family:monospace;color:var(--accent);font-size:12px">${m.codigo}</span></td>
    <td><span class="bold">${m.nombre}</span></td><td>${m.categoria}</td>
    <td>${m.ubicacion}</td><td>${badgeMaq(m.estado)}</td><td>${fmtDate(m.ultMant)}</td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="showMaqFicha(${m.id})">Ver</button>
      ${canEdit()?`<button class="action-btn" onclick="openMaqModal(${m.id})" style="margin-left:4px">Editar</button>`:''}
    </td></tr>`).join('');
}
function filterMaquinas(v){maqFilter.search=v;renderMaquinas();}
function filterMaqStatus(v){maqFilter.status=v;renderMaquinas();}
function showMaqFicha(id){
  const maqs=DB.get('maquinas')||[];const m=maqs.find(x=>x.id===id);if(!m)return;
  const reservas=(DB.get('reservas')||[]).filter(r=>r.maquinaId===id);
  navigate('maquina-ficha');
  document.getElementById('fichaMaqContent').innerHTML=`
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar maq">⚙️</div>
        <div class="ficha-title"><h2>${m.nombre}</h2><p style="font-family:monospace;color:var(--accent)">${m.codigo}</p></div>
      </div>
      <div class="ficha-actions">
        ${badgeMaq(m.estado)}
        ${canEdit()?`<button class="btn-secondary" onclick="openMaqModal(${m.id})">✏️ Editar</button>`:''}
        ${isSuperAdmin()?`<button class="btn-danger" onclick="deleteMaquina(${m.id})">🗑</button>`:''}
      </div>
    </div>
    <div class="ficha-grid">
      <div class="info-card">
        <h4>🔧 Datos Técnicos</h4>
        ${ir('Código',`<span style="font-family:monospace;color:var(--accent)">${m.codigo}</span>`)}
        ${ir('Nombre',m.nombre)}${ir('Categoría',m.categoria)}${ir('Marca',m.marca||'—')}
        ${ir('Modelo/Tipo',m.modelo||'—')}${ir('N° Serie',m.serie||'—')}${ir('Estado',badgeMaq(m.estado))}
      </div>
      <div class="info-card">
        <h4>📍 Ubicación y Mantenimiento</h4>
        ${ir('País Base',m.deptBase)}${ir('Ubicación actual',m.ubicacion)}
        ${ir('Último mantenimiento',fmtDate(m.ultMant))}${ir('Próximo mantenimiento',fmtDate(m.proxMant))}
      </div>
      <div class="info-card">
        <h4>📅 Reservas (${reservas.length})</h4>
        ${reservas.length?reservas.slice(0,5).map(r=>{
          const op=getOp(r.operadoraId);
          return `<div class="dash-list-item"><div><div class="name">${op?op.nombre+' '+op.apellido:'—'}</div><div class="sub">${fmtDate(r.fechaInicio)} → ${fmtDate(r.fechaFin)}</div></div><div style="display:flex;gap:6px;align-items:center">${badgeRes(r.estado)}<button class="action-btn" onclick="showResFicha(${r.id})">Ver</button></div></div>`;
        }).join(''):`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin reservas registradas.</div>`}
      </div>
      <div class="info-card full">
        <h4>🗒 Observaciones Técnicas</h4>
        <div class="obs-text">${m.obs||'Sin observaciones técnicas.'}</div>
      </div>
    </div>`;
}
function openMaqModal(id){
  document.getElementById('modalMaqTitle').textContent=id?'Editar Máquina':'Nueva Máquina';
  if(id){
    const m=(DB.get('maquinas')||[]).find(x=>x.id===id);if(!m)return;
    sv('maqId',m.id);sv('maqCodigo',m.codigo);sv('maqNombre',m.nombre);sv('maqCategoria',m.categoria);
    sv('maqMarca',m.marca);sv('maqModelo',m.modelo);sv('maqSerie',m.serie);
    sv('maqDeptBase',m.deptBase);sv('maqUbicacion',m.ubicacion);sv('maqEstado',m.estado);
    sv('maqUltMant',m.ultMant);sv('maqProxMant',m.proxMant==='—'?'':m.proxMant);sv('maqObs',m.obs);
  } else {
    const maqs=DB.get('maquinas')||[];const nextN=maqs.length+1;
    ['maqId','maqNombre','maqMarca','maqModelo','maqSerie','maqUbicacion','maqObs'].forEach(f=>sv(f,''));
    sv('maqCodigo','OP-'+String(nextN).padStart(3,'0'));sv('maqDeptBase','Uruguay');
    sv('maqCategoria','Láser Depilación');sv('maqEstado','disponible');sv('maqUltMant',today());sv('maqProxMant','');
  }
  openModal('modalMaq');
}
async function saveMaquina(){
  const id=gv('maqId');
  const payload={
    codigo:gv('maqCodigo').trim(),nombre:gv('maqNombre').trim(),categoria:gv('maqCategoria'),
    ubicacion:gv('maqUbicacion').trim(),estado:gv('maqEstado'),
    serial_num:gv('maqSerie').trim(),
    ult_mant:gv('maqUltMant')||null,prox_mant:gv('maqProxMant')||null,
    obs:gv('maqObs').trim()};
  if(!payload.codigo||!payload.nombre){showToast('⚠️ Código y nombre son obligatorios','warn');return;}
  try{
    if(id){
      await api('/api/maquinas/'+id,{method:'PUT',body:JSON.stringify(payload)});
      showToast('✅ Máquina actualizada');
    }else{
      await api('/api/maquinas',{method:'POST',body:JSON.stringify(payload)});
      showToast('✅ Máquina creada');
    }
    const maqs=await api('/api/maquinas');
    DB.set('maquinas',maqs.map(m=>({id:m.id,codigo:m.codigo,nombre:m.nombre,
      categoria:m.categoria||'',ubicacion:m.ubicacion||'',estado:m.estado||'disponible',
      serial:m.serial_num||'',obs:m.obs||''})));
    closeModal('modalMaq');renderMaquinas();
  }catch(e){showToast('❌ Error: '+e.message,'error');}
}
async function deleteMaquina(id){
  if(!confirm('\u00bfEliminar esta m\u00e1quina?'))return;
  try{
    await api('/api/maquinas/'+id,{method:'DELETE'});
    const maqs=await api('/api/maquinas');
    DB.set('maquinas',maqs.map(m=>({id:m.id,codigo:m.codigo,nombre:m.nombre,
      categoria:m.categoria||'',ubicacion:m.ubicacion||'',estado:m.estado||'disponible',
      serial:m.serial_num||'',obs:m.obs||''})));
    showToast('\ud83d\uddd1 M\u00e1quina eliminada');navigate('maquinas');
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}
