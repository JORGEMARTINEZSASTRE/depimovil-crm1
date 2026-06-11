/* ══ FORMACIÓN — HELPERS: certificaciones, reglas de capacitación, habilitaciones ══ */
// ── Core helpers ──
function getMaterial(id){ return (DB.get('materiales')||[]).find(m=>m.id===parseInt(id)); }
function catPill(cat){
  const cls={'Láser Depilación':'cat-laser','Radiofrecuencia / HIFU':'cat-hifu',
             'Pressoterapia':'cat-presso','Electroestimulación':'cat-electro','General':'cat-laser',
             'Bioseguridad':'cat-fund','Skincare':'cat-fund','Atención al Cliente':'cat-fund',
             'Masajes':'cat-body','Cavitación':'cat-body','Criolipólisis':'cat-body','Emsculpt':'cat-body','Bronceado':'cat-body',
             'Aparatología':'cat-advanced','Láser':'cat-advanced','Nd:YAG':'cat-advanced','Soprano':'cat-advanced',
             'Exilis':'cat-advanced','HydraFacial':'cat-advanced','HIFU':'cat-advanced'};
  return `<span class="cat-pill ${cls[cat]||''}">${CAT_ICONS[cat]||'📋'} ${cat}</span>`;
}
function normCertText(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function materialCertText(m){
  return normCertText([m.titulo,m.categoria,m.desc,m.tipo].filter(Boolean).join(' '));
}
function certMatchesText(cert,text){
  const terms=[cert].concat(CERT_KEYWORDS[cert]||[]).map(normCertText);
  return terms.some(term=>term&&text.includes(term));
}
function certMatchesMaterial(cert,m){
  const text=materialCertText(m);
  if(certMatchesText(cert,text)) return true;
  if(cert==='Láser' && m.categoria==='Láser Depilación') return true;
  if(cert==='HIFU' && m.categoria==='Radiofrecuencia / HIFU') return true;
  if(cert==='Emsculpt' && m.categoria==='Electroestimulación') return true;
  return false;
}
function certMatchesEvaluacion(cert,ev){
  const text=materialCertText({titulo:ev.titulo,categoria:ev.categoria,desc:''});
  if(certMatchesText(cert,text)) return true;
  if(cert==='Láser' && ev.categoria==='Láser Depilación') return true;
  if(cert==='HIFU' && ev.categoria==='Radiofrecuencia / HIFU') return true;
  return false;
}
function certPassesFilter(cert,items,evals){
  if(!matFilter) return true;
  if(cert===matFilter) return true;
  if(items.some(m=>m.categoria===matFilter || certMatchesMaterial(matFilter,m))) return true;
  if(evals.some(ev=>ev.categoria===matFilter || certMatchesEvaluacion(matFilter,ev))) return true;
  return false;
}
function renderCertMaterialRow(m){
  return `<div class="material-row cert-subrow">
    <div class="material-icon">${MAT_ICONS[m.tipo]||'📌'}</div>
    <div class="material-body">
      <div class="material-title">${m.titulo}</div>
      <div class="material-sub">${m.desc||'—'}</div>
    </div>
    <div class="cert-actions">
      <span class="badge ${m.obligatorio==='obligatorio'?'badge-obligatorio':'badge-opcional'}">${m.obligatorio==='obligatorio'?'Obligatorio':'Opcional'}</span>
      <span class="badge ${m.estado==='activo'?'badge-green':'badge-gray'}">${m.estado}</span>
      ${m.url?`<a href="${m.url}" target="_blank" class="action-btn" style="color:var(--blue)">🔗 Ver</a>`:''}
      ${isSuperAdmin()||canEdit()?`<button class="action-btn" onclick="openMaterialModal(${m.id})" style="margin-left:2px">✏️</button>`:''}
    </div>
  </div>`;
}
function certEscapeHTML(value){
  if(typeof escapeHTML==='function') return escapeHTML(value);
  return String(value??'').replace(/[&<>"']/g,function(ch){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
  });
}
function renderCertEvaluacionRow(ev,allResultados){
  const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
  const aprobadasEv=resultados.filter(r=>r.estado==='aprobada').length;
  const opIdActual=getOperadoraIdCapacitacionActual();
  const regla=opIdActual ? validarReglasCapacitacion(opIdActual,ev) : {ok:true,motivos:[]};
  const bloqueada=opIdActual && !regla.ok && !puedeOmitirReglasCapacitacion();
  const accion=puedeTomarEvaluacion()
    ? bloqueada
      ? `<button class="action-btn" disabled title="${certEscapeHTML(regla.motivos.join(' '))}" style="opacity:.55;cursor:not-allowed">Bloqueada</button>`
      : `<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`
    : '';
  return `<div class="material-row cert-subrow">
    <div class="material-icon">🧪</div>
    <div class="material-body">
      <div class="material-title">${ev.titulo}</div>
      <div class="material-sub">${ev.preguntas.length} preguntas multiple choice. Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length}. ${aprobadasEv} aprobadas · ${resultados.length} intentos.${bloqueada?` ${certEscapeHTML(regla.motivos[0]||'Acceso bloqueado por criterio de capacitación.')}`:''}</div>
    </div>
    <div class="cert-actions">
      <span class="badge badge-obligatorio">Obligatorio</span>
      <span class="badge badge-green">${ev.categoria}</span>
      ${accion}
    </div>
  </div>`;
}

function getOperadoraIdCapacitacionActual(){
  if(typeof isOperadoraUser==='function' && isOperadoraUser() && !isSuperAdmin() && !canEdit()){
    return parseInt(currentUser?.operadora_id)||0;
  }
  return 0;
}
function puedeOmitirReglasCapacitacion(){
  return !!(isSuperAdmin() || canEdit());
}
function normalizarFechaCapacitacion(v){
  const raw=String(v||'').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}
function diasEntreFechas(a,b){
  const da=new Date(`${normalizarFechaCapacitacion(a)}T00:00:00`);
  const db=new Date(`${normalizarFechaCapacitacion(b)}T00:00:00`);
  if(Number.isNaN(da.getTime())||Number.isNaN(db.getTime())) return 999;
  return Math.floor((db-da)/(24*60*60*1000));
}
function fechaMasDias(fecha,dias){
  const d=new Date(`${normalizarFechaCapacitacion(fecha)}T00:00:00`);
  if(Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate()+dias);
  return d.toISOString().slice(0,10);
}
function evalCertBaseId(ev){
  return String(ev?.id||'').replace(/-(basico|intermedio|avanzado)$/,'');
}
function evalNivelIndex(ev){
  const id=String(ev?.id||'');
  if(id.endsWith('-basico')) return 0;
  if(id.endsWith('-intermedio')) return 1;
  if(id.endsWith('-avanzado')) return 2;
  const nivel=normCertText(ev?.nivel||'');
  if(nivel.includes('basico')) return 0;
  if(nivel.includes('intermedio')) return 1;
  if(nivel.includes('avanzado')) return 2;
  return 0;
}
function evaluacionesPreviasRequeridas(ev){
  const base=evalCertBaseId(ev);
  const nivel=evalNivelIndex(ev);
  return EVALUACIONES_TECNICAS
    .filter(e=>evalCertBaseId(e)===base && evalNivelIndex(e)<nivel)
    .sort((a,b)=>evalNivelIndex(a)-evalNivelIndex(b));
}
function evaluacionAprobadaPorOperadora(opId,evId){
  return getEvaluacionResultados().some(r=>
    parseInt(r.operadoraId)===parseInt(opId) &&
    r.evaluacionId===evId &&
    r.estado==='aprobada'
  );
}
function capacitacionesAprobadasOperadora(opId){
  return (DB.get('capacitaciones')||[]).filter(c=>
    parseInt(c.operadoraId)===parseInt(opId) &&
    c.resultado==='aprobada'
  );
}
function ultimaCapacitacionAprobada(opId){
  const caps=capacitacionesAprobadasOperadora(opId)
    .map(c=>({fecha:normalizarFechaCapacitacion(c.fecha||c.ts),titulo:c.obs||c.categoria||'capacitación'}))
    .filter(c=>c.fecha)
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return caps[0]||null;
}
function capacitacionesAprobadasEnFecha(opId,fecha){
  const ymd=normalizarFechaCapacitacion(fecha);
  return capacitacionesAprobadasOperadora(opId).filter(c=>normalizarFechaCapacitacion(c.fecha||c.ts)===ymd).length;
}
function validarReglasCapacitacion(opId,evaluacion){
  const motivos=[];
  const hoy=today();
  const previas=evaluacionesPreviasRequeridas(evaluacion);
  const faltantes=previas.filter(ev=>!evaluacionAprobadaPorOperadora(opId,ev.id));
  if(faltantes.length){
    motivos.push(`Debe aprobar primero: ${faltantes.map(ev=>ev.nivel||ev.titulo).join(', ')}.`);
  }
  const ultima=ultimaCapacitacionAprobada(opId);
  if(ultima){
    const pasaron=diasEntreFechas(ultima.fecha,hoy);
    if(pasaron<CAPACITACION_REGLAS.descansoDias){
      const desde=fechaMasDias(ultima.fecha,CAPACITACION_REGLAS.descansoDias);
      motivos.push(`Debe descansar ${CAPACITACION_REGLAS.descansoDias} días entre capacitaciones. Próxima disponible: ${fmtDate(desde)}.`);
    }
  }
  const hechasHoy=capacitacionesAprobadasEnFecha(opId,hoy);
  if(hechasHoy>=CAPACITACION_REGLAS.maxHabilitacionesDia){
    motivos.push(`Máximo diario alcanzado: ${CAPACITACION_REGLAS.maxHabilitacionesDia} habilitaciones/capacitaciones aprobadas en un día.`);
  }
  return {ok:!motivos.length,motivos};
}
function confirmarExcepcionCapacitacion(opId,evaluacion,regla){
  if(regla.ok) return true;
  if(!puedeOmitirReglasCapacitacion()) return false;
  const op=getOp(opId);
  const nombre=op ? `${op.nombre||''} ${op.apellido||''}`.trim() : `operadora #${opId}`;
  return confirm(`Esta capacitación está bloqueada para ${nombre} por criterio interno:\n\n- ${regla.motivos.join('\n- ')}\n\n¿Autorizar excepción administrativa para "${evaluacion.titulo}"?`);
}

// ── Habilitación check ──
function estaHabilitada(operadoraId, categoria){
  const habs=(DB.get('habilitaciones')||[]).filter(
    h=>h.operadoraId===parseInt(operadoraId) && h.categoria===categoria
  );
  const activa=habs.find(h=>h.estado==='activa');
  if(activa) return {ok:true,msg:`Habilitada desde ${fmtDate(activa.fecha)}.`};
  const susp=habs.find(h=>h.estado==='suspendida');
  if(susp) return {ok:false,msg:'Habilitación suspendida.'};
  if(habs.length) return {ok:false,msg:'Habilitación vencida.'};
  return {ok:false,msg:'Sin habilitación para esta categoría.'};
}

function getHabilitacionesByOp(operadoraId){
  return (DB.get('habilitaciones')||[]).filter(h=>h.operadoraId===parseInt(operadoraId));
}
function getCapacitacionesByOp(operadoraId){
  return (DB.get('capacitaciones')||[]).filter(c=>c.operadoraId===parseInt(operadoraId));
}

// ── Materiales ──
let matFilter='';
let matTipoFilter='';
function puedeTomarEvaluacion(){
  return !!(isSuperAdmin() || canEdit() || (typeof isOperadoraUser === 'function' && isOperadoraUser()));
}
