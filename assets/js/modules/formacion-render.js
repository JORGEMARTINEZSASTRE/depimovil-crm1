/* ══ FORMACIÓN — RENDER: materiales y certificaciones (UI) ══ */
function renderMateriales(){
  const mats=(DB.get('materiales')||[]).filter(m=>!matTipoFilter || matTipoFilter==='test' || m.tipo===matTipoFilter);
  const evals=(!matTipoFilter || matTipoFilter==='test') ? EVALUACIONES_TECNICAS : [];
  const allResultados=getEvaluacionResultados();
  const intentos=allResultados.length;
  const aprobadas=allResultados.filter(r=>r.estado==='aprobada').length;
  const niveles=CERT_NIVELES.map((nivel,nivelIndex)=>{
    const certs=nivel.certs.map(cert=>{
      const items=matTipoFilter==='test' ? [] : mats.filter(m=>certMatchesMaterial(cert,m));
      const evs=evals.filter(ev=>certMatchesEvaluacion(cert,ev));
      if(!certPassesFilter(cert,items,evs)) return '';
      const total=items.length+evs.length;
      return `<details class="cert-item">
        <summary class="cert-item-summary">
          <span class="cert-item-title">${cert}</span>
          <span class="cert-count">${total ? `${total} contenido${total===1?'':'s'}` : 'Sin contenido cargado'}</span>
        </summary>
        <div class="cert-item-body">
          ${evs.map(ev=>renderCertEvaluacionRow(ev,allResultados)).join('')}
          ${items.map(renderCertMaterialRow).join('')}
          ${!total?`<div class="cert-empty">
            <span>Preparado para cargar materiales, videos o tests de ${cert}.</span>
            ${isSuperAdmin()||canEdit()?`<button class="action-btn" onclick="openMaterialModal(null,'${cert}')">+ Agregar material</button>`:''}
          </div>`:''}
        </div>
      </details>`;
    }).filter(Boolean).join('');
    if(!certs) return '';
    return `<details class="cert-level" ${nivelIndex===0?'open':''}>
      <summary class="cert-level-summary">
        <span class="cert-level-icon">${nivel.icon}</span>
        <span>
          <span class="cert-level-title">${nivel.titulo}</span>
          <span class="cert-level-subtitle">${nivel.subtitulo}</span>
        </span>
        <span class="cert-level-total">${nivel.certs.length} certificaciones</span>
      </summary>
      <div class="cert-level-body">${certs}</div>
    </details>`;
  }).filter(Boolean).join('');
  const header=`<div class="cert-overview">
    <div>
      <div class="cert-overview-title">Mapa de certificaciones DepiMóvil</div>
      <div class="cert-overview-sub">Niveles colapsables con certificaciones individuales, tests y materiales asociados.</div>
    </div>
    <div class="cert-overview-stats">
      <span>${aprobadas} aprobadas</span>
      <span>${intentos} intentos</span>
    </div>
  </div>`;
  document.getElementById('materialesContent').innerHTML = header + (niveles ||
    `<div class="empty-state"><div class="icon">📚</div><h3>Sin certificaciones para el filtro seleccionado</h3></div>`
  );
}
function filterMateriales(cat){ matFilter=cat; renderMateriales(); }
function filterMaterialesTipo(tipo){ matTipoFilter=tipo || ''; renderMateriales(); }

function openMaterialModal(id,categoriaSugerida){
  document.getElementById('modalMaterialTitle').textContent = id ? 'Editar Material' : 'Nuevo Material';
  if(id){
    const m=getMaterial(id); if(!m)return;
    sv('materialId',m.id); sv('materialTitulo',m.titulo); sv('materialTipo',m.tipo);
    sv('materialCategoria',m.categoria); sv('materialDesc',m.desc||'');
    sv('materialUrl',m.url||''); sv('materialEstado',m.estado); sv('materialObligatorio',m.obligatorio);
  } else {
    sv('materialId',''); sv('materialTitulo',''); sv('materialTipo','manual');
    sv('materialCategoria',categoriaSugerida||'General'); sv('materialDesc',''); sv('materialUrl','');
    sv('materialEstado','activo'); sv('materialObligatorio','obligatorio');
  }
  openModal('modalMaterial');
}

function saveMaterial(){
  const titulo=gv('materialTitulo').trim();
  if(!titulo){showToast('⚠️ El título es obligatorio','warn');return;}
  const mats=DB.get('materiales')||[];
  const id=gv('materialId');
  const data={titulo,tipo:gv('materialTipo'),categoria:gv('materialCategoria'),
    desc:gv('materialDesc').trim(),url:gv('materialUrl').trim(),
    estado:gv('materialEstado'),obligatorio:gv('materialObligatorio')};
  if(id){
    const ii=mats.findIndex(m=>m.id===parseInt(id));
    mats[ii]={...mats[ii],...data};
    auditLog('UPDATE','material',parseInt(id),titulo);
    showToast('✅ Material actualizado');
  } else {
    const nId=Math.max(0,...mats.map(m=>m.id))+1;
    mats.push({id:nId,...data,creadoEn:today()});
    auditLog('CREATE','material',nId,titulo);
    showToast('✅ Material creado');
  }
  DB.set('materiales',mats);
  closeModal('modalMaterial');
  renderMateriales();
}

// ── Capacitaciones ──
function renderCertificacionGroup(allResultados, evs, color, icono, titulo){
  const nivelBadge = {Básico:'badge-green',Intermedio:'badge-yellow',Avanzado:'badge-red'};
  const aprobadas = evs.filter(ev=>allResultados.some(r=>r.evaluacionId===ev.id&&r.estado==='aprobada')).length;
  const completo = aprobadas === evs.length;
  const rows = evs.map(ev=>{
    const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
    const aprobada=resultados.some(r=>r.estado==='aprobada');
    const intentos=resultados.length;
    return `<div class="material-row" style="padding-left:24px;border-left:3px solid ${aprobada?'var(--green)':'var(--border)'}">
      <div class="material-icon">${aprobada?'✅':'🧪'}</div>
      <div class="material-body">
        <div class="material-title">${ev.titulo}</div>
        <div class="material-sub">${ev.preguntas.length} preguntas · Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length} · ${aprobada?'<strong style=\'color:var(--green)\'>Aprobada ✅</strong>':'Pendiente'} · ${intentos} intentos</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="badge ${nivelBadge[ev.nivel]||'badge-green'}">${ev.nivel||''}</span>
        ${puedeTomarEvaluacion()?`<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`:''}
      </div>
    </div>`;
  }).join('');
  const uid = titulo.replace(/\s+/g,'_');
  return `<div style="border-left:4px solid ${color};margin:0">
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:var(--bg2,#f8f8f8)"
         onclick="toggleCertGroup('${uid}')">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">${icono} ${titulo} — 3 Niveles</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">
          ${completo?'<strong style="color:var(--green)">¡Certificación completa!</strong>':`${aprobadas}/3 niveles aprobados. El nivel 3 otorga habilitación y certificado.`}
        </div>
      </div>
      <span id="arrow_${uid}" style="font-size:16px;transition:transform .2s">▶</span>
    </div>
    <div id="group_${uid}" style="display:none">${rows}</div>
  </div>`;
}
function toggleCertGroup(uid){
  const el=document.getElementById('group_'+uid);
  const ar=document.getElementById('arrow_'+uid);
  if(!el) return;
  const open=el.style.display!=='none';
  el.style.display=open?'none':'block';
  if(ar) ar.style.transform=open?'':'rotate(90deg)';
}
function renderEvaluacionesRows(allResultados){
  const laser = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('laser-'));
  const hifu  = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('hifu-'));
  const otros = EVALUACIONES_TECNICAS.filter(e => !e.id.startsWith('laser-') && !e.id.startsWith('hifu-') && !e.id.startsWith('ndyag-') && !e.id.startsWith('exilis-') && !e.id.startsWith('emsculpt-') && !e.id.startsWith('hydrafacial-') && !e.id.startsWith('soprano-') && !e.id.startsWith('bronceado-') && !e.id.startsWith('aparatologia-') && !e.id.startsWith('masajes-') && !e.id.startsWith('cavitacion-') && !e.id.startsWith('skincare-') && !e.id.startsWith('criolipolisis-') && !e.id.startsWith('atencion-') && !e.id.startsWith('bioseguridad-') && !e.id.startsWith('rf-') && !e.id.startsWith('gestion-') && !e.id.startsWith('coaching-'));

  const nivelBadge = {Básico:'badge-green',Intermedio:'badge-yellow',Avanzado:'badge-red'};

  const rowsOtros = otros.map(ev=>{
    const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
    const aprobadas=resultados.filter(r=>r.estado==='aprobada').length;
    return `<div class="material-row">
      <div class="material-icon">🧪</div>
      <div class="material-body">
        <div class="material-title">${ev.titulo}</div>
        <div class="material-sub">${ev.preguntas.length} preguntas. Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length}. ${aprobadas} aprobadas · ${resultados.length} intentos.</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="badge badge-obligatorio">Obligatorio</span>
        <span class="badge badge-green">${ev.categoria}</span>
        ${puedeTomarEvaluacion()?`<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`:''}
      </div>
    </div>`;
  }).join('');

  const ndyag        = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('ndyag-'));
  const soprano      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('soprano-'));
  const exilis       = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('exilis-'));
  const emsculpt     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('emsculpt-'));
  const hydrafacial  = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('hydrafacial-'));
  const bronceado    = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('bronceado-'));
  const aparatologia = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('aparatologia-'));
  const masajes      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('masajes-'));
  const cavitacion   = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('cavitacion-'));
  const skincare     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('skincare-'));
  const criolipolisis= EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('criolipolisis-'));
  const atencion     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('atencion-'));
  const bioseguridad = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('bioseguridad-'));
  const rf           = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('rf-'));
  const gestion      = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('gestion-'));
  const coaching     = EVALUACIONES_TECNICAS.filter(e => e.id.startsWith('coaching-'));

  // Agrupador de nivel
  function renderNivelCategoria(uid, titulo, subtitulo, color, grupos){
    const rows = grupos.map(g => renderCertificacionGroup(allResultados, g.evs, g.color, g.icono, g.nombre)).join('');
    return `<div style="border:2px solid ${color};border-radius:12px;margin-bottom:12px;overflow:hidden">
      <div style="background:${color};padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer"
           onclick="toggleCertGroup('nivel_${uid}')">
        <div>
          <div style="font-size:14px;font-weight:700;color:#fff">${titulo}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:2px">${subtitulo}</div>
        </div>
        <span id="arrow_nivel_${uid}" style="font-size:18px;color:#fff;transition:transform .2s">▶</span>
      </div>
      <div id="group_nivel_${uid}" style="display:none">${rows}</div>
    </div>`;
  }

  return rowsOtros
    + renderNivelCategoria('1', '📚 Nivel 1 — Fundamentos', 'Bases para cualquier operadora: higiene, piel y atención al cliente', '#455a64', [
        {evs:bioseguridad,  color:'#558b2f', icono:'🛡️', nombre:'Certificación Bioseguridad e Higiene'},
        {evs:skincare,      color:'#ad1457', icono:'✨', nombre:'Certificación Skincare y Cuidado de la Piel'},
        {evs:atencion,      color:'#f57f17', icono:'📋', nombre:'Certificación Atención al Cliente y Ventas'},
        {evs:gestion,       color:'#00695c', icono:'📊', nombre:'Certificación Gestión de Agenda y Administración'},
        {evs:coaching,      color:'#5e35b1', icono:'🧘', nombre:'Certificación Coaching de Bienestar y Hábitos Saludables'},
      ])
    + renderNivelCategoria('2', '💆 Nivel 2 — Técnicas Corporales', 'Masajes, drenaje, reducción y bronceado', '#4527a0', [
        {evs:masajes,       color:'#6a1b9a', icono:'💆', nombre:'Certificación Masajes y Drenaje Linfático'},
        {evs:cavitacion,    color:'#0288d1', icono:'🌊', nombre:'Certificación Cavitación Ultrasónica'},
        {evs:criolipolisis, color:'#00acc1', icono:'❄️', nombre:'Certificación Criolipólisis'},
        {evs:emsculpt,      color:'#2e7d32', icono:'💪', nombre:'Certificación Emsculpt'},
        {evs:bronceado,     color:'#f9a825', icono:'🌟', nombre:'Certificación Bronceado Orgánico'},
      ])
    + renderNivelCategoria('3', '🏅 Nivel 3 — Aparatología Avanzada', 'Equipos de alta tecnología: láser, HIFU, RF y más', '#1a237e', [
        {evs:aparatologia,  color:'#37474f', icono:'🏅', nombre:'Certificación en Aparatología Estética'},
        {evs:rf,            color:'#7b1fa2', icono:'📡', nombre:'Certificación Radiofrecuencia Corporal y Facial'},
        {evs:laser,         color:'#1976d2', icono:'⚡', nombre:'Certificación Depilación Láser'},
        {evs:ndyag,         color:'#0097a7', icono:'🔵', nombre:'Certificación Nd:YAG'},
        {evs:soprano,       color:'#c62828', icono:'🔴', nombre:'Certificación Soprano Titanium ICE'},
        {evs:exilis,        color:'#e65100', icono:'🔶', nombre:'Certificación Exilis Elite'},
        {evs:hydrafacial,   color:'#00838f', icono:'💧', nombre:'Certificación HydraFacial'},
        {evs:hifu,          color:'#9c27b0', icono:'💜', nombre:'Certificación HIFU'},
      ]);
}
