/* ══ FORMACIÓN — EVALUACIONES: timer, intentos, modal de test y guardado ══ */
function getEvaluacionResultados(){
  return DB.get('evaluaciones_resultados')||[];
}
function getEvaluacionById(id){
  return EVALUACIONES_TECNICAS.find(e=>e.id===id);
}

async function emitirCertificadoOperadora(opId, resultado, evaluacion){
  try{
    const resp=await api('/api/operadoras/'+opId+'/certificados',{
      method:'POST',
      body:JSON.stringify({
        categoria:evaluacion.categoria,
        evaluacion_id:evaluacion.id,
        evaluacion_titulo:evaluacion.titulo,
        resultado_id:resultado.id,
        correctas:resultado.correctas,
        total:resultado.total,
        porcentaje:resultado.porcentaje,
      })
    });
    const docs=DB.get('documentos_certificados')||[];
    if(resp.documento){
      DB.set('documentos_certificados',[resp.documento,...docs.filter(d=>parseInt(d.id)!==parseInt(resp.documento.id))]);
    }
    if(resp.whatsapp?.enviado){
      showToast('🏅 Certificado emitido y enviado por WhatsApp');
    }else if(resp.whatsapp?.omitido){
      showToast('🏅 Certificado ya emitido; WhatsApp no duplicado');
    }else if(resp.whatsapp?.error){
      showToast('🏅 Certificado emitido. WhatsApp pendiente: '+resp.whatsapp.error,'warn');
    }else{
      showToast('🏅 Certificado emitido y WhatsApp en cola');
    }
    return resp;
  }catch(e){
    showToast('⚠️ La habilitación quedó activa, pero no se pudo emitir/enviar el certificado: '+e.message,'warn');
    return null;
  }
}

function renderEvaluaciones(){
  const allResultados=getEvaluacionResultados();
  const intentos=allResultados.length;
  const aprobadas=allResultados.filter(r=>r.estado==='aprobada').length;
  return `<div class="table-container" style="margin-bottom:16px">
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">📝 Evaluaciones Técnicas</div>
        <div style="font-size:12px;color:var(--text3);margin-top:3px">Tests internos de habilitación técnica. Al aprobar, registra capacitación y habilitación automática.</div>
      </div>
      <span style="font-size:12px;color:var(--text3)">${aprobadas} aprobadas · ${intentos} intentos</span>
    </div>
    ${renderEvaluacionesRows(allResultados)}
  </div>`;
}


// ── Control de intentos y temporizador de evaluación ──
const EVAL_MAX_INTENTOS = 3;
const EVAL_BLOQUEO_HORAS = 24;

function getEvalTiempoMinutos(evaluacion){
  // 1 minuto por pregunta
  return evaluacion.preguntas ? evaluacion.preguntas.length : 12;
}
let evalTimer = null;
let evalTiempoRestante = 0;

function getEvalIntentosKey(opId, evalId){ return `eval_intentos_${opId}_${evalId}`; }
function getEvalBloqueKey(opId, evalId){ return `eval_bloqueo_${opId}_${evalId}`; }

function getEvalEstado(opId, evalId){
  const bloqueoKey = getEvalBloqueKey(opId, evalId);
  const intentosKey = getEvalIntentosKey(opId, evalId);
  const bloqueoData = DB.get(bloqueoKey);
  if(bloqueoData){
    const bloqueoTs = new Date(bloqueoData.ts);
    const ahora = new Date();
    const diffHoras = (ahora - bloqueoTs) / (1000*60*60);
    if(diffHoras < EVAL_BLOQUEO_HORAS){
      const restoMin = Math.ceil((EVAL_BLOQUEO_HORAS - diffHoras) * 60);
      const restoHoras = Math.floor(restoMin / 60);
      const restoMinutos = restoMin % 60;
      return { bloqueado: true, intentos: bloqueoData.intentos, restoHoras, restoMinutos };
    } else {
      // Bloqueo expirado, resetear
      DB.set(intentosKey, 0);
      DB.set(bloqueoKey, null);
    }
  }
  const intentos = parseInt(DB.get(intentosKey) || 0);
  return { bloqueado: false, intentos };
}

function registrarIntentoEval(opId, evalId){
  const intentosKey = getEvalIntentosKey(opId, evalId);
  const bloqueoKey = getEvalBloqueKey(opId, evalId);
  const intentos = (parseInt(DB.get(intentosKey) || 0)) + 1;
  DB.set(intentosKey, intentos);
  if(intentos >= EVAL_MAX_INTENTOS){
    DB.set(bloqueoKey, { ts: new Date().toISOString(), intentos });
  }
  return intentos;
}

function resetearIntentosEval(opId, evalId){
  DB.set(getEvalIntentosKey(opId, evalId), 0);
  DB.set(getEvalBloqueKey(opId, evalId), null);
}

function iniciarTimerEval(){
  clearInterval(evalTimer);
  evalTiempoRestante = (window._evalTiempoMinutos || 10) * 60;
  actualizarTimerUI();
  evalTimer = setInterval(function(){
    evalTiempoRestante--;
    actualizarTimerUI();
    if(evalTiempoRestante <= 0){
      clearInterval(evalTimer);
      showToast('⏰ Tiempo agotado. El test se enviará automáticamente.','warn');
      setTimeout(function(){ saveEvaluacionTecnica(); }, 1500);
    }
  }, 1000);
}

function detenerTimerEval(){
  clearInterval(evalTimer);
  evalTimer = null;
}

function actualizarTimerUI(){
  const el = document.getElementById('evalTimerDisplay');
  if(!el) return;
  const m = Math.floor(evalTiempoRestante / 60);
  const s = evalTiempoRestante % 60;
  const texto = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  el.textContent = texto;
  el.style.color = evalTiempoRestante <= 60 ? '#e53935' : evalTiempoRestante <= 180 ? '#f57f17' : 'var(--text)';
  el.style.fontWeight = evalTiempoRestante <= 60 ? '700' : '600';
}

function openEvaluacionModal(evaluacionId){
  if(!puedeTomarEvaluacion()){showToast('⚠️ Sin permisos','warn');return;}
  const evaluacion=getEvaluacionById(evaluacionId);
  if(!evaluacion) return;
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  const isOpUser=typeof isOperadoraUser==='function'&&isOperadoraUser()&&!isSuperAdmin()&&!canEdit();
  const opId=isOpUser ? parseInt(currentUser?.operadora_id) : 0;
  const opActual=opId ? (getOp(opId)||ops.find(o=>parseInt(o.id)===opId)) : null;
  if(isOpUser&&!opId){showToast('⚠️ Tu usuario no tiene ficha de operadora vinculada','warn');return;}
  if(isOpUser){
    const regla=validarReglasCapacitacion(opId,evaluacion);
    if(!regla.ok){
      showToast('⚠️ '+regla.motivos[0],'warn');
      return;
    }
  }
  // Verificar intentos y bloqueo
  const checkOpId = opId || 0;
  if(checkOpId){
    const estado = getEvalEstado(checkOpId, evaluacionId);
    if(estado.bloqueado){
      showToast(`🔒 Alcanzaste el límite de ${EVAL_MAX_INTENTOS} intentos. Podés volver a intentar en ${estado.restoHoras}h ${estado.restoMinutos}min.`,'warn');
      return;
    }
    const intentosRestantes = EVAL_MAX_INTENTOS - estado.intentos;
    if(estado.intentos > 0){
      showToast(`ℹ️ Intentos disponibles: ${intentosRestantes} de ${EVAL_MAX_INTENTOS}`,'info');
    }
  }
  document.getElementById('evalId').value=evaluacionId;
  document.getElementById('evalTitulo').textContent=evaluacion.titulo;
  const evalOpWrap=document.getElementById('evalOperadora')?.closest('.form-field');
  if(evalOpWrap) evalOpWrap.style.display=isOpUser?'none':'';
  document.getElementById('evalOperadora').innerHTML=isOpUser
    ? `<option value="${opId}" selected>${opActual ? `${opActual.nombre||''} ${opActual.apellido||''}`.trim() : 'Mi ficha'}</option>`
    : `<option value="">Seleccionar operadora...</option>`+
      ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  const estadoActual = checkOpId ? getEvalEstado(checkOpId, evaluacionId) : {intentos:0};
  const intentosRestantes = EVAL_MAX_INTENTOS - estadoActual.intentos;
  document.getElementById('evalResumen').innerHTML=
    `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>Aprobación mínima: <strong>${evaluacion.minimoAprobacion}/${evaluacion.preguntas.length}</strong>. Si aprueba, queda habilitada para <strong>${evaluacion.categoria}</strong>.</div>
      <div style="display:flex;align-items:center;gap:16px">
        <div style="font-size:12px;color:var(--text3)">Intentos: <strong style="color:${intentosRestantes<=1?'#e53935':'var(--text)'}">${intentosRestantes}/${EVAL_MAX_INTENTOS}</strong></div>
        <div style="font-size:12px;color:var(--text3)">⏱ Tiempo: <strong id="evalTimerDisplay" style="font-size:15px;color:var(--text)">${String(window._evalTiempoMinutos||10).padStart(2,'0')}:00</strong></div>
      </div>
    </div>`;
  document.getElementById('evalPreguntas').innerHTML=evaluacion.preguntas.map((p,i)=>`
    <div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px">${i+1}. ${p.q}</div>
      <div style="display:grid;gap:7px">
        ${p.o.map((op,j)=>`<label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--text2);line-height:1.35;cursor:pointer">
          <input type="radio" name="eval_q_${i}" value="${j}" style="margin-top:2px"/>
          <span>${op}</span>
        </label>`).join('')}
      </div>
    </div>`).join('');
  window._evalTiempoMinutos = getEvalTiempoMinutos(evaluacion);
  openModal('modalEvaluacion');
  iniciarTimerEval();
}

async function saveEvaluacionTecnica(){
  detenerTimerEval();
  const evaluacion=getEvaluacionById(gv('evalId'));
  if(!evaluacion){showToast('⚠️ Evaluación no encontrada','warn');return;}
  const opId=parseInt(gv('evalOperadora'));
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
  // Registrar intento
  const intentoActual = registrarIntentoEval(opId, evaluacion.id);
  const reglaCapacitacion=validarReglasCapacitacion(opId,evaluacion);
  const excepcionAdministrativa=!reglaCapacitacion.ok && confirmarExcepcionCapacitacion(opId,evaluacion,reglaCapacitacion);
  if(!reglaCapacitacion.ok && !excepcionAdministrativa){
    showToast('⚠️ '+reglaCapacitacion.motivos[0],'warn');
    return;
  }
  let correctas=0;
  const respuestas=[];
  for(let i=0;i<evaluacion.preguntas.length;i++){
    const checked=document.querySelector(`input[name="eval_q_${i}"]:checked`);
    if(!checked){showToast(`⚠️ Falta responder la pregunta ${i+1}`,'warn');return;}
    const valor=parseInt(checked.value);
    respuestas.push(valor);
    if(valor===evaluacion.preguntas[i].c) correctas++;
  }
  const aprobada=correctas>=evaluacion.minimoAprobacion;
  const op=getOp(opId);
  const resultados=getEvaluacionResultados();
  const nId=Math.max(0,...resultados.map(r=>parseInt(r.id)||0))+1;
  const resultado={
    id:nId,
    evaluacionId:evaluacion.id,
    titulo:evaluacion.titulo,
    operadoraId:opId,
    categoria:evaluacion.categoria,
    fecha:today(),
    correctas,
    total:evaluacion.preguntas.length,
    porcentaje:Math.round((correctas/evaluacion.preguntas.length)*100),
    estado:aprobada?'aprobada':'no_aprobada',
    respuestas,
    responsable:currentUser?.email||'—',
    ts:new Date().toISOString(),
  };
  resultados.push(resultado);
  DB.set('evaluaciones_resultados',resultados);

  const caps=DB.get('capacitaciones')||[];
  const capId=Math.max(0,...caps.map(c=>parseInt(c.id)||0))+1;
  caps.push({
    id:capId,
    operadoraId:opId,
    categoria:evaluacion.categoria,
    fecha:today(),
    resultado:aprobada?'aprobada':'no_aprobada',
    modalidad:'evaluacion',
    obs:`${evaluacion.titulo}: ${correctas}/${evaluacion.preguntas.length} (${resultado.porcentaje}%).${excepcionAdministrativa?' Excepción administrativa autorizada.':''}`,
    responsable:currentUser?.email||'—',
    ts:resultado.ts,
  });
  DB.set('capacitaciones',caps);

  // Evaluaciones HIFU: solo nivel avanzado habilita y certifica; básico e intermedio solo informe
  const esHIFU = evaluacion.id.startsWith('hifu-');
  const esLaser = evaluacion.id.startsWith('laser-');
  const esNdYAG = evaluacion.id.startsWith('ndyag-');
  const esExilis = evaluacion.id.startsWith('exilis-');
  const esEmsculpt = evaluacion.id.startsWith('emsculpt-');
  const esHydrafacial = evaluacion.id.startsWith('hydrafacial-');
  const esSoprano = evaluacion.id.startsWith('soprano-');
  const esBronceado = evaluacion.id.startsWith('bronceado-');
  const esAparatologia = evaluacion.id.startsWith('aparatologia-');
  const esMasajes = evaluacion.id.startsWith('masajes-');
  const esCavitacion = evaluacion.id.startsWith('cavitacion-');
  const esSkincare = evaluacion.id.startsWith('skincare-');
  const esCriolipolisis = evaluacion.id.startsWith('criolipolisis-');
  const esAtencion = evaluacion.id.startsWith('atencion-');
  const esBioseguridad = evaluacion.id.startsWith('bioseguridad-');
  const esRF = evaluacion.id.startsWith('rf-');
  const esGestion = evaluacion.id.startsWith('gestion-');
  const esCoaching = evaluacion.id.startsWith('coaching-');
  const esHabilitante = (!esHIFU && !esLaser && !esNdYAG && !esExilis && !esEmsculpt && !esHydrafacial && !esSoprano && !esBronceado && !esAparatologia && !esMasajes && !esCavitacion && !esSkincare && !esCriolipolisis && !esAtencion && !esBioseguridad && !esRF && !esGestion && !esCoaching) || ['hifu-avanzado','laser-avanzado','ndyag-avanzado','exilis-avanzado','emsculpt-avanzado','hydrafacial-avanzado','soprano-avanzado','bronceado-avanzado','aparatologia-avanzado','masajes-avanzado','cavitacion-avanzado','skincare-avanzado','criolipolisis-avanzado','atencion-avanzado','bioseguridad-avanzado','rf-avanzado','gestion-avanzado','coaching-avanzado'].includes(evaluacion.id);

  if(aprobada && esHabilitante){
    try{
      const saved=await api('/api/operadoras/'+opId+'/habilitaciones',{
        method:'POST',
        body:JSON.stringify({
          equipo_categoria:HAB_API_CATEGORIAS[evaluacion.categoria],
          categoria:evaluacion.categoria,
          estado:'activa',
          fecha_otorgamiento:today(),
          obs:`Habilitación automática por evaluación aprobada: ${correctas}/${evaluacion.preguntas.length}.${excepcionAdministrativa?' Excepción administrativa autorizada.':''}`,
        })
      });
      const habs=(DB.get('habilitaciones')||[]).filter(h=>!(h.id&&saved.id&&parseInt(h.id)===parseInt(saved.id)));
      habs.push(typeof mapHabilitacion==='function' ? mapHabilitacion(saved) : {
        id:saved.id,operadoraId:opId,categoria:evaluacion.categoria,fecha:today(),estado:'activa',ts:resultado.ts
      });
      DB.set('habilitaciones',habs);
      auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${correctas}/${evaluacion.preguntas.length}`);
      resetearIntentosEval(opId, evaluacion.id);
      showToast(`✅ Evaluación aprobada (${correctas}/${evaluacion.preguntas.length}). Operadora habilitada.`);
      await emitirCertificadoOperadora(opId,resultado,evaluacion);
    }catch(e){
      showToast('⚠️ Aprobó, pero no se pudo crear la habilitación: '+e.message,'warn');
    }
  }else if(aprobada && (esHIFU || esLaser || esNdYAG || esExilis || esEmsculpt || esHydrafacial || esSoprano || esBronceado || esAparatologia || esMasajes || esCavitacion || esSkincare || esCriolipolisis || esAtencion || esBioseguridad || esRF || esGestion || esCoaching)){
    // Niveles básico e intermedio: solo informe, sin habilitación
    resetearIntentosEval(opId, evaluacion.id);
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${evaluacion.titulo} ${correctas}/${evaluacion.preguntas.length}`);
    const nivel = evaluacion.nivel || '';
    const cert = esHIFU ? 'HIFU' : esNdYAG ? 'Nd:YAG' : esExilis ? 'Exilis Elite' : esEmsculpt ? 'Emsculpt' : esHydrafacial ? 'HydraFacial' : esSoprano ? 'Soprano Titanium ICE' : esBronceado ? 'Bronceado Orgánico' : esAparatologia ? 'Aparatología Estética' : esMasajes ? 'Masajes y Drenaje Linfático' : esCavitacion ? 'Cavitación Ultrasónica' : esSkincare ? 'Skincare y Cuidado de la Piel' : esCriolipolisis ? 'Criolipólisis' : esAtencion ? 'Atención al Cliente y Ventas en Estética' : esBioseguridad ? 'Bioseguridad e Higiene en Estética' : esRF ? 'Radiofrecuencia Corporal y Facial' : esGestion ? 'Gestión de Agenda y Administración' : esCoaching ? 'Coaching de Bienestar y Hábitos Saludables' : 'Depilación Láser';
    showToast(`✅ Nivel ${nivel} aprobado (${correctas}/${evaluacion.preguntas.length}). Para obtener la habilitación ${cert} debés completar los 3 niveles.`);
  }else{
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} no aprobó ${correctas}/${evaluacion.preguntas.length}`);
    const intentosRestantesPost = EVAL_MAX_INTENTOS - intentoActual;
    if(intentosRestantesPost <= 0){
      showToast(`❌ No aprobada (${correctas}/${evaluacion.preguntas.length}). Agotaste los ${EVAL_MAX_INTENTOS} intentos. Podés volver a intentar en ${EVAL_BLOQUEO_HORAS} horas.`,'warn');
    } else {
      showToast(`❌ No aprobada (${correctas}/${evaluacion.preguntas.length}). Te quedan ${intentosRestantesPost} intento(s) antes del bloqueo de ${EVAL_BLOQUEO_HORAS}h.`,'warn');
    }
  }
  detenerTimerEval();
  closeModal('modalEvaluacion');
  renderMateriales();
  const fichaEl=document.getElementById('view-operadora-ficha');
  if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
}
function saveEvaluacionLaser(){
  return saveEvaluacionTecnica();
}

function openEvaluacionFromHash(){
  const hash = String(window.location.hash || '');
  const match = hash.match(/^#test=([^&]+)/);
  if(!match) return false;
  const evaluacionId = decodeURIComponent(match[1] || '');
  const evaluacion = getEvaluacionById(evaluacionId);
  if(!evaluacion) return false;
  if(typeof navigate === 'function') navigate('materiales');
  window.history.replaceState({},'',window.location.pathname + window.location.search);
  setTimeout(function(){ openEvaluacionModal(evaluacionId); }, 250);
  return true;
}

