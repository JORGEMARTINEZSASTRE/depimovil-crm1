/* ══════════════════════════════════
   MÁQUINAS
══════════════════════════════════ */
let maqFilter={search:'',status:''};

// ── ROI por máquina ──
function _calcRoiMaquina(maqId){
  const pagos      = DB.get('pagos')||[];
  const reservas   = DB.get('reservas')||[];
  const compras    = DB.get('compras')||[];
  const movsCaja   = DB.get('caja_movimientos')||[];

  // Reservas de esta máquina
  const resIds = new Set(reservas.filter(r=>r.maquinaId===maqId).map(r=>r.id));

  // Ingresos: pagos validados ligados a reservas de esta máquina (UYU)
  const pagosValidos = pagos.filter(p=>p.estado==='validado' && resIds.has(p.reservaId) && p.moneda==='UYU');
  const ingresos = pagosValidos.reduce((s,p)=>s+(p.montoTotal||0),0);

  // Egresos: compras asignadas a esta máquina
  const egresosCompras = compras
    .filter(c=>c.maquinaId===maqId && c.moneda==='UYU')
    .reduce((s,c)=>s+(c.total||0),0);

  // Egresos: movimientos de caja ligados a esta máquina
  const egresosCaja = movsCaja
    .filter(m=>m.maquinaId===maqId && m.tipo==='egreso' && m.moneda==='UYU')
    .reduce((s,m)=>s+(m.monto||0),0);

  const egresos = egresosCompras + egresosCaja;
  const roi     = ingresos - egresos;
  const roiPct  = egresos>0 ? Math.round((roi/egresos)*100) : null;

  return {ingresos, egresos, roi, roiPct,
    cantReservas: resIds.size,
    cantPagos: pagosValidos.length};
}

function _roiColor(roi){
  if(roi>0)  return 'var(--green)';
  if(roi<0)  return 'var(--red)';
  return 'var(--text3)';
}

function _renderRoiRanking(){
  const el=document.getElementById('maqRoiRanking');
  if(!el) return;
  const puedeVer=typeof canView==='function'&&canView('pagos');
  if(!puedeVer){el.innerHTML='';return;}

  const maqs=DB.get('maquinas')||[];
  if(!maqs.length){el.innerHTML='';return;}

  const data=maqs.map(m=>({...m,..._calcRoiMaquina(m.id)}))
    .sort((a,b)=>b.roi-a.roi);

  const maxIng=Math.max(...data.map(d=>d.ingresos),1);

  el.innerHTML=`
  <div class="dash-card roi-ranking-card" style="margin-bottom:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <h3 style="margin:0">📈 Rentabilidad por Máquina</h3>
      <span style="font-size:11px;color:var(--text3)">Ingresos cobrados vs. egresos (UYU)</span>
    </div>
    ${data.map((m,i)=>{
      const barW=maxIng>0?Math.round((m.ingresos/maxIng)*100):0;
      const roiTxt=m.roiPct!==null?(m.roiPct>=0?`+${m.roiPct}%`:`${m.roiPct}%`):'—';
      return `
      <div class="roi-row" onclick="showMaqFicha(${m.id})">
        <div class="roi-rank">${i+1}</div>
        <div class="roi-info">
          <div class="roi-name">${m.nombre} <span style="font-family:monospace;color:var(--accent);font-size:11px">${m.codigo}</span></div>
          <div class="roi-bar-wrap">
            <div class="roi-bar" style="width:${barW}%;background:${_roiColor(m.roi)}"></div>
          </div>
        </div>
        <div class="roi-nums">
          <div style="color:var(--green);font-weight:700">${m.ingresos>0?_fmtMonto(m.ingresos):'$0'}</div>
          <div style="color:var(--text3);font-size:11px">▼ ${m.egresos>0?_fmtMonto(m.egresos):'$0'}</div>
        </div>
        <div class="roi-badge" style="color:${_roiColor(m.roi)};background:${m.roi>=0?'rgba(82,196,138,0.1)':'rgba(224,92,107,0.1)'}">
          ${roiTxt}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function badgeMaq(e){
  const m={disponible:'badge-green',reservada:'badge-rose',mantenimiento:'badge-yellow',fuera_servicio:'badge-red',en_viaje:'badge-blue'};
  const l={disponible:'Disponible',reservada:'Reservada',mantenimiento:'Mantenimiento',fuera_servicio:'Fuera Servicio',en_viaje:'En Viaje de China'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function renderMaquinas(){
  _renderRoiRanking();
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
      ${(()=>{
        if(!(typeof canView==='function'&&canView('pagos'))) return '';
        const r=_calcRoiMaquina(m.id);
        const roiColor=_roiColor(r.roi);
        const roiPctTxt=r.roiPct!==null?(r.roiPct>=0?`+${r.roiPct}%`:`${r.roiPct}%`):'Sin egresos registrados';
        return `<div class="info-card">
          <h4>📈 Rentabilidad (ROI)</h4>
          ${ir('Ingresos cobrados',`<strong style="color:var(--green)">${r.ingresos>0?_fmtMonto(r.ingresos):'$0 UYU'}</strong>`)}
          ${ir('Egresos totales',`<strong style="color:var(--red)">${r.egresos>0?_fmtMonto(r.egresos):'$0 UYU'}</strong>`)}
          ${ir('Resultado neto',`<strong style="color:${roiColor};font-size:16px">${r.roi>=0?'+':''}${_fmtMonto(r.roi)}</strong>`)}
          ${ir('Retorno sobre inversión',`<span style="color:${roiColor};font-weight:700">${roiPctTxt}</span>`)}
          ${ir('Reservas / Pagos cobrados',`${r.cantReservas} reservas · ${r.cantPagos} pagos`)}
        </div>`;
      })()}
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
