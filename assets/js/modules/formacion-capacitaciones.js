/* ══ FORMACIÓN — CAPACITACIONES Y HABILITACIONES: modales, guardado y paneles ══ */
function openCapacitacionModal(operadoraId){
  if(!isSuperAdmin()&&!canEdit()){showToast('⚠️ Sin permisos','warn');return;}
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  document.getElementById('capOpSelector').innerHTML=
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  if(operadoraId){
    sv('capOperadoraId',operadoraId);
    sv('capOpSelector',operadoraId);
    document.getElementById('capOpWrap').style.display='none';
  } else {
    document.getElementById('capOpWrap').style.display='block';
  }
  sv('capId',''); sv('capFecha',today()); sv('capResultado','aprobada');
  sv('capModalidad','presencial'); sv('capObs','');
  openModal('modalCapacitacion');
}

function saveCapacitacion(){
  const opId=parseInt(gv('capOpSelector')||gv('capOperadoraId'));
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
  const caps=DB.get('capacitaciones')||[];
  const nId=Math.max(0,...caps.map(c=>c.id))+1;
  const op=getOp(opId);
  caps.push({
    id:nId, operadoraId:opId, categoria:gv('capCategoria'),
    fecha:gv('capFecha')||today(), resultado:gv('capResultado'),
    modalidad:gv('capModalidad'), obs:gv('capObs').trim(),
    responsable:currentUser?.email||'—', ts:new Date().toISOString(),
  });
  DB.set('capacitaciones',caps);
  auditLog('CREATE','capacitacion',nId,`${op?.nombre||'Op #'+opId} — ${gv('capCategoria')} — ${gv('capResultado')}`);
  closeModal('modalCapacitacion');
  showToast('✅ Capacitación registrada');
  // Refresh ficha if open
  const fichaEl=document.getElementById('view-operadora-ficha');
  if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
}

// ── Habilitaciones ──
function openHabilitacionModal(operadoraId){
  if(!isSuperAdmin()&&!canEdit()){showToast('⚠️ Sin permisos','warn');return;}
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  document.getElementById('habOpSelector').innerHTML=
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  if(operadoraId){
    sv('habOperadoraId',operadoraId);
    sv('habOpSelector',operadoraId);
    document.getElementById('habOpWrap').style.display='none';
  } else {
    document.getElementById('habOpWrap').style.display='block';
  }
  sv('habId',''); sv('habFecha',today()); sv('habEstado','activa'); sv('habObs','');
  openModal('modalHabilitacion');
}

async function saveHabilitacion(){
  const opId=parseInt(gv('habOpSelector')||gv('habOperadoraId'));
  const cat=gv('habCategoria');
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
  if(!cat){showToast('⚠️ Seleccioná una categoría','warn');return;}
  const op=getOp(opId);
  const payload={
    equipo_categoria:HAB_API_CATEGORIAS[cat]||cat,
    categoria:cat,
    estado:gv('habEstado'),
    fecha_otorgamiento:gv('habFecha')||today(),
    obs:gv('habObs').trim(),
  };
  try{
    const saved=await api('/api/operadoras/'+opId+'/habilitaciones',{method:'POST',body:JSON.stringify(payload)});
    const habs=(DB.get('habilitaciones')||[]).filter(h=>!(h.id&&saved.id&&parseInt(h.id)===parseInt(saved.id)));
    habs.push(mapHabilitacion(saved));
    DB.set('habilitaciones',habs);
    auditLog('CREATE','habilitacion',saved.id,`${op?.nombre||'Op #'+opId} → ${cat}`);
    closeModal('modalHabilitacion');
    showToast(`✅ Habilitada: ${op?.nombre||''} para ${cat}`);
    const fichaEl=document.getElementById('view-operadora-ficha');
    if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
  }catch(e){
    showToast('❌ Error guardando habilitación: '+e.message,'error');
  }
}

// ── Panel HTML helpers for fichas ──
function renderHabPanel(operadoraId){
  const habs=getHabilitacionesByOp(operadoraId);
  const categorias=CERT_NIVELES.flatMap(n=>n.certs);
  return `<div class="info-card full">
    <h4 style="display:flex;align-items:center;justify-content:space-between">
      ✅ Habilitaciones Técnicas
      ${canEdit()?`<button class="btn-add" style="font-size:12px;padding:5px 10px" onclick="openHabilitacionModal(${operadoraId})">+ Habilitar</button>`:''}
    </h4>
    <div class="hab-levels">
      ${CERT_NIVELES.map(nivel=>{
        const activas=nivel.certs.filter(cat=>estaHabilitada(operadoraId,cat).ok).length;
        return `<details class="hab-level" ${activas?'open':''}>
          <summary class="hab-level-summary">
            <span>${nivel.icon} ${nivel.titulo} — ${nivel.subtitulo}</span>
            <span>${activas}/${nivel.certs.length}</span>
          </summary>
          <div class="hab-grid">
            ${nivel.certs.map(cat=>{
              const chk=estaHabilitada(operadoraId,cat);
              const hab=habs.filter(h=>h.categoria===cat).slice(-1)[0];
              return `<div class="hab-card ${chk.ok?'enabled':'disabled-hab'}">
                <div class="hc-cat">${CAT_ICONS[cat]||'📋'} ${cat}</div>
                <div class="hc-status" style="color:${chk.ok?'var(--green)':'var(--red)'}">
                  ${chk.ok?'✅ Habilitada':'❌ Sin habilitación'}
                </div>
                ${hab?`<div class="hc-date">Desde: ${fmtDate(hab.fecha)}</div>`:''}
                ${hab&&hab.estado!=='activa'?`<div class="hc-date" style="color:var(--red)">${HAB_ESTADOS[hab.estado]||hab.estado}</div>`:''}
              </div>`;
            }).join('')}
          </div>
        </details>`;
      }).join('')}
    </div>
    ${habs.some(h=>h.categoria&&!categorias.includes(h.categoria))?`<div class="hab-grid" style="margin-top:10px">
      ${habs.filter(h=>h.categoria&&!categorias.includes(h.categoria)).map(h=>`<div class="hab-card ${h.estado==='activa'?'enabled':'disabled-hab'}">
        <div class="hc-cat">${CAT_ICONS[h.categoria]||'📋'} ${h.categoria}</div>
        <div class="hc-status" style="color:${h.estado==='activa'?'var(--green)':'var(--red)'}">${HAB_ESTADOS[h.estado]||h.estado}</div>
        ${h.fecha?`<div class="hc-date">Desde: ${fmtDate(h.fecha)}</div>`:''}
      </div>`).join('')}
    </div>`:''}
    ${habs.length?`<details style="margin-top:12px"><summary style="font-size:12px;color:var(--text3);cursor:pointer">Ver historial (${habs.length})</summary>
      <div style="margin-top:8px">${habs.sort((a,b)=>b.ts.localeCompare(a.ts)).map(h=>`
        <div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;display:flex;align-items:center;gap:10px">
          ${catPill(h.categoria)}
          <span class="badge ${h.estado==='activa'?'badge-green':h.estado==='suspendida'?'badge-yellow':'badge-red'}">${HAB_ESTADOS[h.estado]||h.estado}</span>
          <span style="color:var(--text3)">${fmtDate(h.fecha)}</span>
          <span style="color:var(--text3)">${h.responsable?.split('@')[0]||''}</span>
        </div>`).join('')}
      </div></details>`:''}
  </div>`;
}

function renderCapPanel(operadoraId){
  const caps=getCapacitacionesByOp(operadoraId).sort((a,b)=>b.ts.localeCompare(a.ts));
  const resColor={aprobada:'var(--green)',pendiente:'var(--yellow)',no_aprobada:'var(--red)'};
  return `<div class="info-card full">
    <h4 style="display:flex;align-items:center;justify-content:space-between">
      📋 Capacitaciones (${caps.length})
      ${canEdit()?`<button class="btn-add" style="font-size:12px;padding:5px 10px" onclick="openCapacitacionModal(${operadoraId})">+ Registrar</button>`:''}
    </h4>
    ${!caps.length?`<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin capacitaciones registradas.</div>`:''}
    ${caps.map(cap=>`<div class="cap-row">
      <div class="cr-head">
        ${catPill(cap.categoria)}
        <span style="font-size:12px;font-weight:700;color:${resColor[cap.resultado]||'var(--text)'}">
          ${CAP_RESULTADO[cap.resultado]||cap.resultado}
        </span>
        <span style="font-size:11px;color:var(--text3)">${fmtDate(cap.fecha)} · ${cap.modalidad}</span>
      </div>
      ${cap.obs?`<div class="cr-body">${cap.obs}</div>`:''}
    </div>`).join('')}
  </div>`;
}

function renderMaqHabPanel(maquinaId){
  const maq=getMaq(maquinaId); if(!maq||!maq.categoria) return '';
  const ops=DB.get('operadoras')||[];
  const habilitadas=ops.filter(o=>estaHabilitada(o.id,maq.categoria).ok);
  return `<div class="info-card full">
    <h4>✅ Operadoras Habilitadas para "${maq.categoria}"</h4>
    ${!habilitadas.length?`<div style="color:var(--text3);font-size:13px;padding:8px 0">Ninguna operadora habilitada para esta categoría.</div>`:''}
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
      ${habilitadas.map(o=>`<button class="action-btn" onclick="showOpFicha(${o.id})" style="display:flex;align-items:center;gap:6px">
        <span style="font-size:12px">👩</span> ${o.nombre} ${o.apellido}
      </button>`).join('')}
    </div>
  </div>`;
}

// ── Helper render evaluaciones con agrupamiento por certificación ──
