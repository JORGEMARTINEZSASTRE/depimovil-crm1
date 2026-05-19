/* ══════════════════════════════════
   FORMACIÓN — MATERIALES, CAPACITACIONES Y HABILITACIONES
══════════════════════════════════ */

const CAT_ICONS = {
  'Láser Depilación':'⚡','Radiofrecuencia / HIFU':'💜',
  'Pressoterapia':'🌊','Electroestimulación':'⚡','General':'📋',
};
const MAT_ICONS = {manual:'📖',video:'🎬',guia:'📋',protocolo:'⚕️',presentacion:'📊',otro:'📌'};
const CAP_RESULTADO = {aprobada:'✅ Aprobada',pendiente:'⏳ Pendiente',no_aprobada:'❌ No aprobada'};
const HAB_ESTADOS   = {activa:'✅ Activa',suspendida:'⏸ Suspendida',vencida:'⛔ Vencida'};
const HAB_API_CATEGORIAS = {
  'Láser Depilación':'laser_diodo',
  'Radiofrecuencia / HIFU':'hifu',
  'Pressoterapia':'Pressoterapia',
  'Electroestimulación':'electroestimulacion',
};
const EVAL_DEPILACION_LASER = {
  id:'depilacion-definitiva-basico',
  titulo:'Test básico de Depilación Definitiva',
  categoria:'Láser Depilación',
  minimoAprobacion:20,
  preguntas:[
    {q:'¿Cuál es el principal objetivo de la depilación definitiva con láser?',o:['Arrancar el vello desde la raíz','Debilitar progresivamente el folículo piloso','Exfoliar la piel antes del crecimiento','Cambiar el color natural del vello'],c:1},
    {q:'¿Qué estructura absorbe principalmente la energía del láser en el vello?',o:['Colágeno','Melanina','Queratinocito','Glándula sebácea'],c:1},
    {q:'¿En qué fase del crecimiento del vello el tratamiento suele ser más efectivo?',o:['Telógena','Anágena','Catágena','Reposo prolongado'],c:1},
    {q:'¿Por qué se necesitan varias sesiones?',o:['Porque todos los vellos están siempre en anágena','Porque el vello crece en diferentes fases','Porque el láser solo actúa en piel seca','Porque la piel se acostumbra al láser'],c:1},
    {q:'Antes de una sesión, la zona debe estar:',o:['Depilada con cera el mismo día','Rasurada y limpia','Bronceada para ver mejor el vello','Con crema corporal abundante'],c:1},
    {q:'¿Qué método debe evitarse entre sesiones?',o:['Rasurado','Cera o pinza','Limpieza suave','Hidratación indicada'],c:1},
    {q:'¿Cuál es una contraindicación habitual para realizar la sesión?',o:['Vello rasurado','Bronceado reciente o quemadura solar','Piel limpia','Uso de ropa cómoda'],c:1},
    {q:'Si la clienta está usando medicación fotosensibilizante, corresponde:',o:['Subir la potencia','Consultar y posponer si corresponde','Aplicar igual con gel frío','Realizar doble pasada'],c:1},
    {q:'¿Qué debe usarse siempre para proteger los ojos?',o:['Lentes de sol comunes','Protección ocular específica para láser','Algodón sobre los párpados','Ninguna protección si la zona no es facial'],c:1},
    {q:'¿Qué información debe revisarse antes de iniciar el tratamiento?',o:['Solo forma de pago','Ficha, antecedentes y consentimiento informado','Color de uñas','Preferencia musical'],c:1},
    {q:'¿Qué reacción puede ser esperable después de una sesión?',o:['Enrojecimiento leve y sensación de calor','Herida profunda inmediata','Manchas negras obligatorias','Dolor intenso persistente siempre'],c:0},
    {q:'¿Qué se recomienda después de la sesión?',o:['Sol directo sin protección','Evitar calor intenso y usar protección solar','Cera a las 24 horas','Exfoliación agresiva inmediata'],c:1},
    {q:'¿Se debe disparar láser sobre tatuajes?',o:['Sí, siempre','No, se deben evitar y proteger','Solo si el tatuaje es negro','Solo con potencia máxima'],c:1},
    {q:'En fototipos altos o piel más oscura, se debe:',o:['Ignorar el fototipo','Ajustar parámetros y extremar cuidados','Aplicar la misma potencia siempre','No usar gel nunca'],c:1},
    {q:'¿Cuál es una señal para detener la sesión y evaluar?',o:['Ligero olor a vello','Dolor excesivo, ampolla o reacción inusual','Cliente tranquila','Piel rasurada'],c:1},
    {q:'¿Qué debe hacerse con lunares o lesiones sospechosas?',o:['Disparar encima','Evitar la zona y derivar si corresponde','Aumentar frecuencia','Tapar con maquillaje'],c:1},
    {q:'¿Por qué se realiza una evaluación inicial de piel y vello?',o:['Para elegir parámetros y detectar riesgos','Para vender más zonas únicamente','Para evitar registrar datos','Para definir música de cabina'],c:0},
    {q:'¿Qué significa trabajar con parámetros seguros?',o:['Usar siempre el nivel más alto','Ajustar energía, pulso y frecuencia según caso y equipo','Hacer pasadas ilimitadas','Omitir prueba en piel sensible'],c:1},
    {q:'Si una clienta se expuso al sol recientemente, corresponde:',o:['Tratar igual','Evaluar riesgo y reprogramar si es necesario','Aplicar doble gel y continuar','Usar cera antes'],c:1},
    {q:'¿Qué zona requiere especial cuidado por cercanía ocular?',o:['Piernas','Rostro y cejas/periocular','Brazos','Espalda baja'],c:1},
    {q:'¿Cuál es una buena práctica durante la sesión?',o:['No preguntar sensaciones','Mantener comunicación y observar la piel','Tapar la zona y disparar rápido','Cambiar parámetros sin registrar'],c:1},
    {q:'¿Qué dato conviene registrar luego de la sesión?',o:['Solo clima del día','Zona tratada, parámetros, reacción y observaciones','Color de ropa','Tiempo de espera en recepción'],c:1},
    {q:'¿Qué debe explicarse a la clienta sobre resultados?',o:['Que será 100% definitivo en una sesión','Que hay reducción progresiva y puede requerir mantenimiento','Que no importa el ciclo del vello','Que el vello cae todo inmediatamente'],c:1},
    {q:'¿Qué se debe hacer si hay duda sobre una condición médica?',o:['Proceder rápido','Consultar, pedir autorización o derivar antes de tratar','Bajar luz de cabina','Aplicar crema anestésica sin indicación'],c:1},
    {q:'Para aprobar esta habilitación interna, la operadora debe:',o:['Responder sin leer la ficha','Demostrar criterio de seguridad y protocolo','Saber vender promociones únicamente','Elegir cualquier parámetro al azar'],c:1},
  ],
};
const EVAL_PRESOTERAPIA = {
  id:'presoterapia-basico',
  titulo:'Test básico de Presoterapia',
  categoria:'Pressoterapia',
  minimoAprobacion:23,
  preguntas:[
    {q:'¿Qué es la presoterapia?',o:['Un tratamiento con láser','Un sistema de compresión neumática secuencial','Una técnica de peeling químico','Una forma de depilación'],c:1},
    {q:'¿Cuál es uno de los objetivos principales de la presoterapia?',o:['Estimular drenaje linfático y retorno venoso','Broncear la piel','Eliminar tatuajes','Cortar el vello'],c:0},
    {q:'¿Qué sensación suele percibir la persona durante el tratamiento?',o:['Compresión rítmica o presión progresiva','Quemazón intensa obligatoria','Descarga eléctrica fuerte','Dolor punzante permanente'],c:0},
    {q:'¿Qué debe hacerse antes de iniciar una sesión?',o:['Evaluar antecedentes y contraindicaciones','Aplicar ácidos fuertes','Vendar la zona sin revisar','Indicar ayuno estricto'],c:0},
    {q:'¿Cuál es una contraindicación importante?',o:['Piernas cansadas sin patología','Trombosis venosa profunda o sospecha de trombosis','Sensación de retención leve','Uso de crema hidratante'],c:1},
    {q:'En caso de insuficiencia cardíaca descompensada, ¿qué corresponde?',o:['Aplicar más presión','Realizar igual','No realizar sin autorización médica','Hacer solo 5 minutos sin consultar'],c:2},
    {q:'¿Qué se debe hacer si hay infección activa, heridas abiertas o inflamación importante?',o:['Evitar la zona y no realizar si hay riesgo','Aplicar máxima presión','Cubrir con plástico y continuar','Ignorar si no duele'],c:0},
    {q:'¿La presoterapia reemplaza una evaluación médica en patologías circulatorias?',o:['Sí','No','Solo en verano','Depende del color de piel'],c:1},
    {q:'¿Qué debe controlar la operadora durante la sesión?',o:['Comodidad, presión, dolor, mareo o molestias','Solo el reloj','La temperatura ambiente únicamente','Que la persona no hable'],c:0},
    {q:'Si la paciente siente dolor intenso, hormigueo fuerte o malestar, ¿qué se debe hacer?',o:['Continuar','Aumentar presión','Detener o pausar y evaluar','Cambiar de música'],c:2},
    {q:'¿Qué presión debe elegirse al inicio en una persona nueva?',o:['La más alta','Una presión progresiva y tolerable','Cualquier presión','Sin importar antecedentes'],c:1},
    {q:'¿Cuál es una zona habitual de trabajo?',o:['Piernas','Párpados','Cuero cabelludo','Dientes'],c:0},
    {q:'¿Qué recomendación posterior suele ser adecuada?',o:['Hidratación y movimiento suave si corresponde','No tomar agua nunca','Exposición solar intensa obligatoria','Alcohol inmediato'],c:0},
    {q:'¿En embarazo se debe aplicar presoterapia sin consultar?',o:['Sí, siempre','No, requiere criterio profesional/médico según caso','Solo con presión máxima','Es obligatorio en todos los embarazos'],c:1},
    {q:'¿Qué dato debe registrarse en la ficha?',o:['Programa, presión, duración, zona y observaciones','Color de uñas','Canción escuchada','Marca del perfume'],c:0},
    {q:'¿Qué objetivo estético puede acompañar la presoterapia?',o:['Mejorar sensación de pesadez y edema leve','Eliminar lunares','Reemplazar cirugía','Cambiar color de ojos'],c:0},
    {q:'¿Qué debe revisarse en las botas o mangas antes de usarlas?',o:['Higiene, estado general, cierres y conexiones','Que estén perfumadas','Que tengan maquillaje','Que pesen más'],c:0},
    {q:'¿Cómo debe colocarse el accesorio?',o:['Ajustado correctamente, sin pliegues excesivos ni dolor','Lo más apretado posible','Suelto y torcido','Encima de objetos en bolsillos'],c:0},
    {q:'¿Qué condición requiere especial cuidado o derivación?',o:['Varices importantes, dolor, calor o hinchazón unilateral','Piernas normales','Cansancio leve sin otros síntomas','Piel hidratada'],c:0},
    {q:'¿Qué NO debe prometer la operadora?',o:['Resultados progresivos y realistas','Curación de enfermedades circulatorias','Sensación de alivio posible','Tratamiento complementario'],c:1},
    {q:'¿Qué hacer si una pierna está mucho más hinchada, roja o dolorida que la otra?',o:['Aplicar presión alta','No tratar y derivar/consultar','Masajear fuerte','Continuar normal'],c:1},
    {q:'¿Cuál es una buena práctica de higiene?',o:['Limpiar/desinfectar accesorios según protocolo entre pacientes','Usar las botas sin limpiar','Compartir prendas húmedas','Guardar mojado el equipo'],c:0},
    {q:'¿La presoterapia debe adaptarse a cada paciente?',o:['Sí, según condición, tolerancia y objetivo','No, todos igual','Solo según edad','Solo según altura'],c:0},
    {q:'¿Qué conducta es correcta ante una contraindicación o duda?',o:['Realizar igual','Consultar responsable o derivar antes de tratar','Ocultarlo en la ficha','Hacer menos minutos sin avisar'],c:1},
    {q:'¿Qué indica una operadora responsable?',o:['Que la paciente avise cualquier molestia durante la sesión','Que soporte todo dolor','Que no se puede pausar','Que no importa la historia clínica'],c:0},
  ],
};
const EVALUACIONES_TECNICAS = [EVAL_DEPILACION_LASER, EVAL_PRESOTERAPIA];

// ── Core helpers ──
function getMaterial(id){ return (DB.get('materiales')||[]).find(m=>m.id===parseInt(id)); }
function catPill(cat){
  const cls={'Láser Depilación':'cat-laser','Radiofrecuencia / HIFU':'cat-hifu',
             'Pressoterapia':'cat-presso','Electroestimulación':'cat-electro','General':'cat-laser'};
  return `<span class="cat-pill ${cls[cat]||''}">${CAT_ICONS[cat]||'📋'} ${cat}</span>`;
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
function renderMateriales(){
  const mats=(DB.get('materiales')||[]).filter(m=>
    !matFilter || m.categoria===matFilter
  );
  const cats=['Láser Depilación','Radiofrecuencia / HIFU','Pressoterapia','Electroestimulación','General'];

  const bycat=cats.map(cat=>{
    const items=mats.filter(m=>m.categoria===cat);
    if(!items.length) return '';
    return `<div class="table-container" style="margin-bottom:16px">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${catPill(cat)}</div>
        <span style="font-size:12px;color:var(--text3)">${items.filter(m=>m.estado==='activo').length} activos</span>
      </div>
      ${items.map(m=>`<div class="material-row">
        <div class="material-icon">${MAT_ICONS[m.tipo]||'📌'}</div>
        <div class="material-body">
          <div class="material-title">${m.titulo}</div>
          <div class="material-sub">${m.desc||'—'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="badge ${m.obligatorio==='obligatorio'?'badge-obligatorio':'badge-opcional'}">${m.obligatorio==='obligatorio'?'Obligatorio':'Opcional'}</span>
          <span class="badge ${m.estado==='activo'?'badge-green':'badge-gray'}">${m.estado}</span>
          ${m.url?`<a href="${m.url}" target="_blank" class="action-btn" style="color:var(--blue)">🔗 Ver</a>`:''}
          ${isSuperAdmin()||canEdit()?`<button class="action-btn" onclick="openMaterialModal(${m.id})" style="margin-left:2px">✏️</button>`:''}
        </div>
      </div>`).join('')}
    </div>`;
  }).join('');

  document.getElementById('materialesContent').innerHTML = renderEvaluaciones() + (bycat ||
    `<div class="empty-state"><div class="icon">📚</div><h3>Sin materiales</h3></div>`
  );
}
function filterMateriales(cat){ matFilter=cat; renderMateriales(); }

function getEvaluacionResultados(){
  return DB.get('evaluaciones_resultados')||[];
}
function getEvaluacionById(id){
  return EVALUACIONES_TECNICAS.find(e=>e.id===id);
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
    ${EVALUACIONES_TECNICAS.map(ev=>{
      const resultados=allResultados.filter(r=>r.evaluacionId===ev.id);
      const aprobadasEv=resultados.filter(r=>r.estado==='aprobada').length;
      return `<div class="material-row">
      <div class="material-icon">🧪</div>
      <div class="material-body">
        <div class="material-title">${ev.titulo}</div>
        <div class="material-sub">${ev.preguntas.length} preguntas multiple choice. Aprobación: ${ev.minimoAprobacion}/${ev.preguntas.length}. ${aprobadasEv} aprobadas · ${resultados.length} intentos.</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span class="badge badge-obligatorio">Obligatorio</span>
        <span class="badge badge-green">${ev.categoria}</span>
        ${canEdit()?`<button class="action-btn" onclick="openEvaluacionModal('${ev.id}')" style="color:var(--blue)">Tomar evaluación</button>`:''}
      </div>
    </div>`;
    }).join('')}
  </div>`;
}

function openEvaluacionModal(evaluacionId){
  if(!isSuperAdmin()&&!canEdit()){showToast('⚠️ Sin permisos','warn');return;}
  const evaluacion=getEvaluacionById(evaluacionId);
  if(!evaluacion) return;
  const ops=(DB.get('operadoras')||[]).filter(o=>o.estado==='activa');
  document.getElementById('evalId').value=evaluacionId;
  document.getElementById('evalTitulo').textContent=evaluacion.titulo;
  document.getElementById('evalOperadora').innerHTML=
    `<option value="">Seleccionar operadora...</option>`+
    ops.map(o=>`<option value="${o.id}">${o.nombre} ${o.apellido}</option>`).join('');
  document.getElementById('evalResumen').innerHTML=
    `Aprobación mínima: <strong>${evaluacion.minimoAprobacion}/${evaluacion.preguntas.length}</strong>. Si aprueba, queda habilitada para <strong>${evaluacion.categoria}</strong>.`;
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
  openModal('modalEvaluacion');
}

async function saveEvaluacionTecnica(){
  const evaluacion=getEvaluacionById(gv('evalId'));
  if(!evaluacion){showToast('⚠️ Evaluación no encontrada','warn');return;}
  const opId=parseInt(gv('evalOperadora'));
  if(!opId){showToast('⚠️ Seleccioná una operadora','warn');return;}
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
    obs:`${evaluacion.titulo}: ${correctas}/${evaluacion.preguntas.length} (${resultado.porcentaje}%).`,
    responsable:currentUser?.email||'—',
    ts:resultado.ts,
  });
  DB.set('capacitaciones',caps);

  if(aprobada){
    try{
      const saved=await api('/api/operadoras/'+opId+'/habilitaciones',{
        method:'POST',
        body:JSON.stringify({
          equipo_categoria:HAB_API_CATEGORIAS[evaluacion.categoria],
          categoria:evaluacion.categoria,
          estado:'activa',
          fecha_otorgamiento:today(),
          obs:`Habilitación automática por evaluación aprobada: ${correctas}/${evaluacion.preguntas.length}.`,
        })
      });
      const habs=(DB.get('habilitaciones')||[]).filter(h=>!(h.id&&saved.id&&parseInt(h.id)===parseInt(saved.id)));
      habs.push(typeof mapHabilitacion==='function' ? mapHabilitacion(saved) : {
        id:saved.id,operadoraId:opId,categoria:evaluacion.categoria,fecha:today(),estado:'activa',ts:resultado.ts
      });
      DB.set('habilitaciones',habs);
      auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} aprobó ${correctas}/${evaluacion.preguntas.length}`);
      showToast(`✅ Evaluación aprobada (${correctas}/${evaluacion.preguntas.length}). Operadora habilitada.`);
    }catch(e){
      showToast('⚠️ Aprobó, pero no se pudo crear la habilitación: '+e.message,'warn');
    }
  }else{
    auditLog('CREATE','evaluacion',nId,`${op?.nombre||'Op #'+opId} no aprobó ${correctas}/${evaluacion.preguntas.length}`);
    showToast(`❌ No aprobada (${correctas}/${evaluacion.preguntas.length}). No se otorgó habilitación.`,'warn');
  }
  closeModal('modalEvaluacion');
  renderMateriales();
  const fichaEl=document.getElementById('view-operadora-ficha');
  if(fichaEl&&fichaEl.classList.contains('active')) showOpFicha(opId);
}
function saveEvaluacionLaser(){
  return saveEvaluacionTecnica();
}

function openMaterialModal(id){
  document.getElementById('modalMaterialTitle').textContent = id ? 'Editar Material' : 'Nuevo Material';
  if(id){
    const m=getMaterial(id); if(!m)return;
    sv('materialId',m.id); sv('materialTitulo',m.titulo); sv('materialTipo',m.tipo);
    sv('materialCategoria',m.categoria); sv('materialDesc',m.desc||'');
    sv('materialUrl',m.url||''); sv('materialEstado',m.estado); sv('materialObligatorio',m.obligatorio);
  } else {
    sv('materialId',''); sv('materialTitulo',''); sv('materialTipo','manual');
    sv('materialCategoria','General'); sv('materialDesc',''); sv('materialUrl','');
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
  const CATS=['Láser Depilación','Radiofrecuencia / HIFU','Pressoterapia','Electroestimulación'];
  const habs=getHabilitacionesByOp(operadoraId);
  return `<div class="info-card full">
    <h4 style="display:flex;align-items:center;justify-content:space-between">
      ✅ Habilitaciones Técnicas
      ${canEdit()?`<button class="btn-add" style="font-size:12px;padding:5px 10px" onclick="openHabilitacionModal(${operadoraId})">+ Habilitar</button>`:''}
    </h4>
    <div class="hab-grid">
      ${CATS.map(cat=>{
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
