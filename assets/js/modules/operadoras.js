/* ══════════════════════════════════
   OPERADORAS
══════════════════════════════════ */
let opFilter={search:'',status:''};
function badgeOp(e){
  const m={activa:'badge-green',prospecto:'badge-blue',inactiva:'badge-gray',suspendida:'badge-red'};
  const l={activa:'Activa',prospecto:'Prospecto',inactiva:'Inactiva',suspendida:'Suspendida'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function opHas(value){
  if(Array.isArray(value)) return value.length>0;
  if(typeof value==='number') return value>0;
  return String(value||'').trim().length>0;
}
function opYesNo(value){
  return opHas(value)?'<span class="badge badge-green">Sí</span>':'<span class="badge badge-gray">No</span>';
}
function opEquiposResumen(o){
  const equipos=Array.isArray(o.equiposAlquila)?o.equiposAlquila:[];
  if(!equipos.length) return 'Sin máquina cargada';
  return equipos.map(e=>escapeHTML(e.equipo||'')).filter(Boolean).join(', ');
}
function opJornadasTotal(o){
  if(Number.isFinite(Number(o.jornadasTotal))) return Number(o.jornadasTotal)||0;
  return (Array.isArray(o.equiposAlquila)?o.equiposAlquila:[]).reduce((s,e)=>s+(parseInt(e.jornadas||0,10)||0),0);
}
function opActividadTs(o){
  const raw=o.ultimaActividad||o.updatedAt||o.fechaAlta||'';
  const time=raw?new Date(raw).getTime():0;
  return Number.isFinite(time)?time:0;
}
function opActividadLabel(o){
  const raw=o.ultimaActividad||o.updatedAt||o.fechaAlta||'';
  if(!raw)return 'Sin movimiento';
  const time=new Date(raw);
  if(Number.isNaN(time.getTime()))return fmtDate(raw);
  return time.toLocaleDateString('es-UY');
}
function opDocsLocal(id){
  const docs=(DB.get('documentos_operadora')||[]).filter(d=>parseInt(d.operadora_id)===parseInt(id));
  return {
    todos:docs,
    cedulaFrente:docs.some(d=>d.tipo==='cedula'),
    cedulaDorso:docs.some(d=>d.tipo==='cedula_dorso'),
    contratos:docs.filter(d=>d.tipo==='contrato')
  };
}
function opTieneContratoFirmado(id){
  const docs=opDocsLocal(id);
  if(docs.contratos.length)return true;
  return (DB.get('contratos')||[]).some(c=>parseInt(c.operadoraId)===parseInt(id)&&(c.estado==='firmado'||c.firmado||c.firmadoEn));
}
function opHabilitacionesActivas(id){
  return (DB.get('habilitaciones')||[]).filter(h=>parseInt(h.operadoraId)===parseInt(id)&&['activa','activo'].includes(h.estado));
}
function op360Estado(o){
  const id=parseInt(o.id);
  const docs=opDocsLocal(id);
  const reservas=(DB.get('reservas')||[]).filter(r=>parseInt(r.operadoraId)===id);
  const pagos=(DB.get('pagos')||[]).filter(p=>parseInt(p.operadoraId)===id);
  const envios=(DB.get('envios')||[]).filter(e=>parseInt(e.operadoraId)===id);
  const habs=opHabilitacionesActivas(id);
  const datosOk=!!(o.nombre&&o.apellido&&(o.whatsapp||o.telefono)&&o.ciudad&&o.departamento);
  const direcciones=(Array.isArray(o.direccionesEntrega)&&o.direccionesEntrega.length)||o.direccionEntrega;
  const docsOk=docs.cedulaFrente&&docs.cedulaDorso;
  const contratoOk=opTieneContratoFirmado(id);
  const habOk=habs.length>0;
  const deuda=pagos.some(p=>['deuda_vencida','sena_pendiente','pendiente'].includes(p.estado));
  const checks=[
    {key:'datos',label:'Datos básicos',ok:datosOk,detalle:datosOk?'Contacto y ubicación completos':'Falta contacto, ciudad o departamento'},
    {key:'localidades',label:'Localidades / entrega',ok:!!direcciones,detalle:direcciones?'Dirección o localidad de trabajo cargada':'Falta dirección o localidades de trabajo'},
    {key:'documentos',label:'Cédula / DNI',ok:docsOk,detalle:docsOk?'Frente y dorso cargados':'Falta frente o dorso de cédula/DNI'},
    {key:'contrato',label:'Contrato',ok:contratoOk,detalle:contratoOk?'Contrato firmado registrado':'Falta firma de contrato'},
    {key:'habilitacion',label:'Habilitación',ok:habOk,detalle:habOk?habs.map(h=>h.categoria||'Habilitación').join(', '):'Falta habilitación técnica'},
    {key:'pagos',label:'Pagos',ok:!deuda,detalle:deuda?'Tiene pagos pendientes o deuda':'Sin deuda marcada'}
  ];
  const completos=checks.filter(c=>c.ok).length;
  const porcentaje=Math.round((completos/checks.length)*100);
  const faltante=checks.find(c=>!c.ok);
  let accion='Lista para operar';
  let accionHtml='<span class="badge badge-green">Sin acción urgente</span>';
  if(faltante?.key==='datos'||faltante?.key==='localidades'){
    accion='Completar ficha';
    accionHtml=`<button class="action-btn" onclick="openOpModal(${id})">Completar ficha</button>`;
  }else if(faltante?.key==='documentos'){
    accion='Pedir documentos';
    accionHtml=canEdit()?`<button class="action-btn" onclick="pedirFaltantesOperadora(${id})">Pedir documentos</button>`:'<span class="badge badge-yellow">Documentos pendientes</span>';
  }else if(faltante?.key==='contrato'){
    accion='Pedir firma de contrato';
    accionHtml='<button class="action-btn" onclick="navigate(\'revision-operadoras\')">Ir a revisión</button>';
  }else if(faltante?.key==='habilitacion'){
    accion='Registrar habilitación';
    accionHtml=canEdit()?`<button class="action-btn" onclick="openHabilitacionModal(${id})">Registrar habilitación</button>`:'<span class="badge badge-yellow">Habilitación pendiente</span>';
  }else if(faltante?.key==='pagos'){
    accion='Revisar pagos';
    accionHtml='<button class="action-btn" onclick="navigate(\'pagos\')">Ver pagos</button>';
  }
  return {checks,completos,porcentaje,accion,accionHtml,reservas,pagos,envios,habs};
}
function renderOp360Panel(o){
  const st=op360Estado(o);
  const color=st.porcentaje>=80?'var(--green)':(st.porcentaje>=50?'var(--yellow)':'var(--red)');
  return `<div class="info-card full" id="op360Panel_${o.id}">
    <h4>Estado 360 de la operadora</h4>
    <div style="display:grid;grid-template-columns:minmax(180px,260px) 1fr;gap:18px;align-items:start">
      <div>
        <div style="font-size:34px;font-weight:800;color:${color};line-height:1">${st.porcentaje}%</div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${st.porcentaje}%;background:${color}"></div></div>
        <div style="font-size:12px;color:var(--text2);margin-top:8px">${st.completos}/${st.checks.length} puntos completos</div>
        <div style="margin-top:12px;font-size:13px;color:var(--text)"><strong>Próximo paso:</strong> ${escapeHTML(st.accion)}</div>
        <div style="margin-top:8px">${st.accionHtml}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">
        ${st.checks.map(c=>`<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:5px">
            <strong style="font-size:12px;color:var(--text)">${escapeHTML(c.label)}</strong>
            <span class="badge ${c.ok?'badge-green':'badge-yellow'}">${c.ok?'OK':'Pendiente'}</span>
          </div>
          <div style="font-size:11px;color:var(--text3);line-height:1.4">${escapeHTML(c.detalle)}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
      <span class="badge badge-blue">${st.reservas.length} reserva${st.reservas.length===1?'':'s'}</span>
      <span class="badge badge-blue">${st.pagos.length} pago${st.pagos.length===1?'':'s'}</span>
      <span class="badge badge-blue">${st.envios.length} envío${st.envios.length===1?'':'s'}</span>
      <span class="badge badge-blue">${st.habs.length} ${st.habs.length===1?'habilitación':'habilitaciones'}</span>
    </div>
  </div>`;
}
function setOperadorasTableMode(minimo){
  const thead=document.querySelector('#view-operadoras table thead tr');
  if(thead){
    thead.innerHTML=minimo
      ? '<th>Operadora</th><th>Ciudad</th><th>Máquina que alquila</th><th>Preparación / títulos</th><th>Rango</th><th>Jornadas</th><th>Último movimiento</th><th>Acciones</th>'
      : '<th>Nombre</th><th>Gabinete / Actividad</th><th>Ciudad</th><th>Departamento</th><th>Estado</th><th>Nivel</th><th>Último movimiento</th><th>Acciones</th>';
  }
  const share=document.querySelector('#view-operadoras .op-share-card');
  if(share) share.style.display=minimo?'none':'';
  const add=document.getElementById('btnAddOp');
  if(add) add.style.display=canEdit()?'':'none';
}
function renderOperadoras(){
  const minimo=typeof isOperadoraRole==='function'&&isOperadoraRole(currentUser?.rol);
  setOperadorasTableMode(minimo);
  const ops=(DB.get('operadoras')||[]).filter(o=>{
    const q=opFilter.search.toLowerCase();
    const ms=!q||(o.nombre+' '+o.apellido+' '+o.gabinete+' '+o.ciudad+' '+opEquiposResumen(o)+' '+(o.preparacion||'')+' '+(o.titulos||'')).toLowerCase().includes(q);
    return ms&&(!opFilter.status||o.estado===opFilter.status);
  }).sort((a,b)=>opActividadTs(b)-opActividadTs(a)||parseInt(b.id||0,10)-parseInt(a.id||0,10));
  const tbody=document.getElementById('opTableBody');
  if(!ops.length){tbody.innerHTML=`<tr><td colspan="8"><div class="empty-state"><div class="icon">👩‍💼</div><h3>Sin resultados</h3><p>No hay operadoras que coincidan.</p></div></td></tr>`;return;}
  if(minimo){
    tbody.innerHTML=ops.map(o=>{
      const propia=parseInt(o.id)===parseInt(currentUser?.operadora_id);
      const prep=o.preparacion||o.titulos||'';
      return `<tr>
        <td><span class="bold">${escapeHTML(o.nombre)} ${escapeHTML(o.apellido)}</span></td>
        <td>${opYesNo(o.ciudad)} <span style="color:var(--text2);margin-left:6px">${escapeHTML(o.ciudad||'—')}</span></td>
        <td>${opYesNo(o.equiposAlquila)} <span style="color:var(--text2);margin-left:6px">${opEquiposResumen(o)}</span></td>
        <td>${opYesNo(prep)} <span style="color:var(--text2);margin-left:6px">${escapeHTML(prep||'Sin habilitación cargada')}</span></td>
        <td>${opYesNo(o.rangoDepimovil||o.nivel)} <span class="badge badge-blue" style="margin-left:6px">${escapeHTML(o.rangoDepimovil||o.nivel||'—')}</span></td>
        <td>${opYesNo(opJornadasTotal(o))} <span style="color:var(--text2);margin-left:6px">${opJornadasTotal(o)}</span></td>
        <td><span style="font-size:12px;color:var(--text2)">${escapeHTML(opActividadLabel(o))}</span></td>
        <td style="white-space:nowrap">${propia?`<button class="action-btn" onclick="showOpFicha(${o.id})">Mi ficha</button>`:'<span class="badge badge-gray">Perfil mínimo</span>'}</td>
      </tr>`;
    }).join('');
    return;
  }
  tbody.innerHTML=ops.map(o=>`<tr>
    <td><span class="bold">${escapeHTML(o.nombre)} ${escapeHTML(o.apellido)}</span></td>
    <td>${escapeHTML(o.gabinete||'—')}</td><td>${escapeHTML(o.ciudad)}</td><td>${escapeHTML(o.departamento)}</td>
    <td>${badgeOp(o.estado)}</td><td><span style="color:var(--text2)">${o.nivel}</span></td>
    <td><span style="font-size:12px;color:var(--text2)">${escapeHTML(opActividadLabel(o))}</span></td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="showOpFicha(${o.id})">Ver</button>
      ${canEdit()?`<button class="action-btn" onclick="openOpModal(${o.id})" style="margin-left:4px">Editar</button>`:''}
      ${isSuperAdmin()?`<button class="action-btn" onclick="deleteOperadora(${o.id})" style="margin-left:4px;color:var(--red)">Eliminar</button>`:''}
    </td></tr>`).join('');
}
function filterOperadoras(v){opFilter.search=v;renderOperadoras();}
function filterOpStatus(v){opFilter.status=v;renderOperadoras();}
function registroOperadoraLink(){
  return 'https://crm.depimovil.live/alta-operadoras.html';
}
function copyRegistroOperadoraLink(){
  const url = registroOperadoraLink();
  const text = `Hola, te comparto el link para registrarte como operadora en DepiMovil:\n\n${url}\n\nCompleta tus datos y luego el equipo revisa tu alta.`;
  navigator.clipboard.writeText(text)
    .then(()=>showToast('📋 Link de alta copiado'))
    .catch(()=>prompt('Copiá este mensaje:', text));
}
function previewRegistroOperadoraLink(){
  const url = registroOperadoraLink();
  const old = document.getElementById('registroOperadoraPreview');
  if(old) old.remove();
  const div = document.createElement('div');
  div.id = 'registroOperadoraPreview';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:2200;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(4px)';
  div.innerHTML = `<div style="width:100%;max-width:420px;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow);overflow:hidden">
    <div style="padding:26px 24px;text-align:center;background:var(--surface2);border-bottom:1px solid var(--border)">
      <div class="login-logo-mark" style="margin-bottom:12px"></div>
      <h3 style="font-size:18px;color:var(--text);margin:0">Alta de Operadora DepiMovil</h3>
      <p style="font-size:13px;color:var(--text2);margin-top:6px;line-height:1.5">Formulario para completar datos de contacto, experiencia y tratamientos.</p>
    </div>
    <div style="padding:20px 22px">
      <div style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Vista para compartir</div>
      <div style="font-family:monospace;font-size:13px;color:var(--accent);word-break:break-all;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px">${url}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap">
        <button class="btn-secondary" onclick="document.getElementById('registroOperadoraPreview').remove()">Cerrar</button>
        <a class="btn-secondary" href="${url}" target="_blank" rel="noopener">Abrir</a>
        <button class="btn-add" onclick="copyRegistroOperadoraLink()">Copiar link</button>
      </div>
    </div>
  </div>`;
  div.addEventListener('click', e=>{ if(e.target===div) div.remove(); });
  document.body.appendChild(div);
}
function parseOperadoraDirecciones(text, fallbackTipo){
  return String(text||'').split('\n').map((line, idx)=>{
    const parts=line.split('|').map(p=>p.trim());
    return {
      direccion:parts[0]||'',
      localidad:parts[1]||'',
      departamento:parts[2]||'',
      pais:parts[3]||'',
      referencia:parts[4]||'',
      tipo:parts[5]||fallbackTipo||'trabajo',
      principal:idx===0
    };
  }).filter(d=>d.direccion);
}
function formatOperadoraDirecciones(direcciones, direccionEntrega, tipoDireccion){
  const ds=(Array.isArray(direcciones)&&direcciones.length)?direcciones:[];
  const base=ds.length?ds:(direccionEntrega?[{direccion:direccionEntrega,tipo:tipoDireccion||'trabajo',principal:true}]:[]);
  return base.map(d=>[d.direccion,d.localidad,d.departamento,d.pais,d.referencia,d.tipo].filter((v,i)=>i===0||v).join(' | ')).join('\n');
}
function parseOperadoraEquipos(text){
  return String(text||'').split('\n').map(line=>{
    const parts=line.split('|').map(p=>p.trim());
    return {
      equipo:parts[0]||'',
      valor:parseFloat(String(parts[1]||'').replace(',','.'))||0,
      jornadas:parseInt(parts[2]||'0',10)||0,
      obs:parts[3]||''
    };
  }).filter(e=>e.equipo);
}
function formatOperadoraEquipos(equipos){
  return (Array.isArray(equipos)?equipos:[]).map(e=>[e.equipo,e.valor||'',e.jornadas||'',e.obs||''].filter((v,i)=>i===0||v!==''&&v!=null).join(' | ')).join('\n');
}
function mapOperadoraLocal(o){
  const direcciones=Array.isArray(o.direcciones_entrega)?o.direcciones_entrega:[];
  const equipos=Array.isArray(o.equipos_alquila)?o.equipos_alquila:[];
  return {id:o.id,nombre:o.nombre,apellido:o.apellido||'',
    gabinete:o.gabinete||'',ciudad:o.ciudad||'',departamento:o.departamento||'',
    pais:o.pais||'Uruguay',whatsapp:o.whatsapp||'',telefono:o.telefono||'',
    instagramUsuario:o.instagram_usuario||'',email:o.email||'',fechaAlta:o.fecha_alta,estado:o.estado,
    nivel:o.nivel||'Intermedio',obs:o.obs||'',
    direccionEntrega:o.direccion_entrega||direcciones[0]?.direccion||'',tipoDireccion:o.tipo_direccion||direcciones[0]?.tipo||'trabajo',
    direccionesEntrega:direcciones,equiposAlquila:equipos,portalToken:o.portal_token||'',
    ultimaActividad:o.ultima_actividad||o.updated_at||o.created_at||o.fecha_alta||'',updatedAt:o.updated_at||'',createdAt:o.created_at||'',
    preparacion:o.preparacion||'',titulos:o.titulos||'',rangoDepimovil:o.rango_depimovil||o.rangoDepimovil||'',jornadasTotal:o.jornadas_total||o.jornadasTotal||0,
    perfilMinimo:!!o.perfil_minimo};
}
async function pedirFaltantesOperadora(id, obs){
  if(!id)return;
  const nota=obs!=null?obs:prompt('Detalle para enviar por WhatsApp (opcional):','Subir cédula/DNI frente y dorso');
  if(nota===null)return;
  try{
    const data=await api('/api/operadoras/'+id+'/pedir-faltantes',{method:'POST',body:JSON.stringify({obs:nota})});
    const extra=data.codigo_enviado?'WhatsApp enviado':'quedó en cola de WhatsApp';
    showToast('✅ Pedido de faltantes '+extra);
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}
function showOpFicha(id){
  if(typeof isOperadoraRole==='function'&&isOperadoraRole(currentUser?.rol)&&parseInt(id)!==parseInt(currentUser?.operadora_id)){
    showToast('⚠️ No podés ver la ficha de otra operadora','warn');
    return;
  }
  const ops=DB.get('operadoras')||[];const o=ops.find(x=>x.id===id);if(!o)return;
  const reservas=(DB.get('reservas')||[]).filter(r=>r.operadoraId===id);
  const nombreCompleto=escapeHTML(o.nombre+' '+o.apellido);
  const inicialNombre=escapeHTML((o.nombre||'').charAt(0));
  const inicialApellido=escapeHTML((o.apellido||'').charAt(0));
  navigate('operadora-ficha');
  document.getElementById('fichaOpContent').innerHTML=`
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar op">${inicialNombre}${inicialApellido}</div>
        <div class="ficha-title"><h2>${nombreCompleto}</h2><p>${escapeHTML(o.gabinete||'')} · ${escapeHTML(o.ciudad)}, ${escapeHTML(o.departamento)}</p></div>
      </div>
      <div class="ficha-actions">
        ${badgeOp(o.estado)}
        ${typeof canView==='function'&&canView('reservas')?`<button class="btn-add" onclick="openResModalForOperadora(${o.id})">${isOperadoraUser()?'Solicitar reserva':'Nueva reserva'}</button>`:''}
        ${canEdit()?`<button class="btn-secondary" onclick="openOpModal(${o.id})">✏️ Editar</button>`:''}
        ${isSuperAdmin()?`<button class="btn-secondary" onclick="deleteOperadora(${o.id})" style="color:var(--red)">Eliminar</button>`:''}
      </div>
    </div>
    <div class="ficha-grid">
      ${renderOp360Panel(o)}
      <div class="info-card">
        <h4>📋 Datos Personales</h4>
        ${ir('Nombre completo',nombreCompleto)}${ir('Email',escapeHTML(o.email||'—'))}
        ${ir('WhatsApp',escapeHTML(o.whatsapp||'—'))}${ir('Instagram',escapeHTML(o.instagramUsuario?('@'+String(o.instagramUsuario).replace(/^@/,'')):'—'))}
        ${ir('Fecha de alta',fmtDate(o.fechaAlta))}${ir('Estado',badgeOp(o.estado))}
        ${ir('Nivel',`<span class="badge badge-blue">${escapeHTML(o.nivel)}</span>`)}
      </div>
      <div class="info-card">
        <h4>📍 Ubicación & Entrega</h4>
        ${ir('Gabinete',escapeHTML(o.gabinete||'—'))}${ir('Ciudad',escapeHTML(o.ciudad))}
        ${ir('Departamento',escapeHTML(o.departamento))}${ir('País',escapeHTML(o.pais))}
        ${(()=>{
          const direcciones=(o.direccionesEntrega&&o.direccionesEntrega.length)?o.direccionesEntrega:(o.direccionEntrega?[{direccion:o.direccionEntrega,tipo:o.tipoDireccion,principal:true}]:[]);
          if(!direcciones.length)return ir('📦 Direcciones de entrega','<span style="color:var(--red);font-size:12px">⚠️ Sin dirección</span>');
          return ir('📦 Direcciones de entrega',direcciones.map(d=>`<div style="margin-bottom:6px"><span style="color:var(--accent);font-weight:600">${escapeHTML(d.direccion)}</span>${d.localidad?` · ${escapeHTML(d.localidad)}`:''}${d.departamento?` · ${escapeHTML(d.departamento)}`:''}${d.principal?'<span class="badge badge-blue" style="margin-left:8px">Principal</span>':''}</div>`).join(''));
        })()}
      </div>
      <div class="info-card">
        <h4>🧾 Equipos que alquila</h4>
        ${(o.equiposAlquila||[]).length?(o.equiposAlquila||[]).map(e=>`<div class="dash-list-item"><div><div class="name">${escapeHTML(e.equipo)}</div><div class="sub">${parseInt(e.jornadas||0,10)||0} jornada${parseInt(e.jornadas||0,10)===1?'':'s'}${e.obs?' · '+escapeHTML(e.obs):''}</div></div><strong>${(parseFloat(e.valor)||0).toLocaleString()} UYU</strong></div>`).join(''):`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin equipos cargados.</div>`}
      </div>
      <div class="info-card">
        <h4>📅 Reservas (${reservas.length})</h4>
        ${reservas.length?reservas.slice(0,5).map(r=>{
          const maq=getMaq(r.maquinaId);
          return `<div class="dash-list-item"><div><div class="name">${escapeHTML(maq?maq.nombre:'—')}</div><div class="sub">${fmtDate(r.fechaInicio)} → ${fmtDate(r.fechaFin)}</div></div><div style="display:flex;gap:6px;align-items:center">${badgeRes(r.estado)}<button class="action-btn" onclick="showResFicha(${r.id})">Ver</button></div></div>`;
        }).join(''):`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin reservas registradas.</div>`}
      </div>
      <div class="info-card full">
        <h4>📝 Observaciones Internas</h4>
        <div class="obs-text">${escapeHTML(o.obs||'Sin observaciones.')}</div>
      </div>
      ${isSuperAdmin()?`<div class="info-card full">
        <h4>💳 Resumen Financiero</h4>
        ${(()=>{
          const opPagos=(DB.get('pagos')||[]).filter(p=>p.operadoraId===id);
          const deuda=opPagos.filter(p=>p.estado==='deuda_vencida');
          const pendSena=opPagos.filter(p=>p.estado==='sena_pendiente');
          const validados=opPagos.filter(p=>p.estado==='validado');
          const totalSaldo=opPagos.reduce((s,p)=>s+(p.saldoPendiente||0),0);
          if(!opPagos.length) return `<div style="color:var(--text3);font-size:13px;padding:8px 0">Sin pagos registrados. <button class="action-btn" onclick="navigate('pagos')">Ver módulo de pagos</button></div>`;
          return `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px">
            <div class="fin-cell"><div class="fc-label">Total pagos</div><div class="fc-value" style="color:var(--text)">${opPagos.length}</div></div>
            <div class="fin-cell"><div class="fc-label">Saldo pendiente</div><div class="fc-value" style="color:${totalSaldo>0?'var(--yellow)':'var(--green)'}">${totalSaldo.toLocaleString()} UYU</div></div>
            <div class="fin-cell"><div class="fc-label">Validados</div><div class="fc-value" style="color:var(--green)">${validados.length}</div></div>
          </div>
          ${deuda.length?`<div class="alert-banner danger" style="padding:8px 12px"><span class="ab-icon">🚨</span><strong>${deuda.length} deuda${deuda.length>1?'s':''} vencida${deuda.length>1?'s':''}</strong> — Esta operadora tiene deudas sin regularizar.</div>`:''}
          ${pendSena.length?`<div class="alert-banner warn" style="margin-top:8px;padding:8px 12px"><span class="ab-icon">💰</span><strong>${pendSena.length} seña${pendSena.length>1?'s':''} pendiente${pendSena.length>1?'s':''}</strong> — Esperando confirmación de pago.</div>`:''}
          <div style="text-align:right;margin-top:8px"><button class="action-btn" onclick="navigate('pagos')">Ver todos los pagos →</button></div>`;
        })()}
      </div>`:''}
      <div class="info-card full" id="docsPanel_${o.id}">
        <h4 style="display:flex;align-items:center;justify-content:space-between">
          🪪 Documentos & Contrato
          <span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            ${canEdit()?`<button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="pedirFaltantesOperadora(${o.id})">Pedir faltantes</button>`:''}
            ${o.portalToken?`<button class="btn-add" style="font-size:11px;padding:4px 10px" onclick="copyPortalLink('${o.portalToken}')">📋 Copiar Link Portal</button>`:'<span style="font-size:11px;color:var(--text3)">Sin token</span>'}
          </span>
        </h4>
        <div id="docsBody_${o.id}" style="padding:8px 0;color:var(--text3);font-size:13px">Cargando documentos...</div>
      </div>
      ${renderHabPanel(o.id)}
      ${renderCapPanel(o.id)}
    </div>`;
  loadOpDocs(o.id);
  if(typeof startOpDocsAutoRefresh==='function')startOpDocsAutoRefresh(o.id);
}
function openOpModal(id){
  document.getElementById('modalOpTitle').textContent=id?'Editar Operadora':'Nueva Operadora';
  if(id){
    const o=(DB.get('operadoras')||[]).find(x=>x.id===id);if(!o)return;
    sv('opId',o.id);sv('opNombre',o.nombre);sv('opApellido',o.apellido);sv('opGabinete',o.gabinete);
    sv('opCiudad',o.ciudad);sv('opDepartamento',o.departamento);sv('opPais',o.pais);
    sv('opWhatsapp',o.whatsapp);sv('opInstagram',o.instagramUsuario||'');sv('opEmail',o.email);
    sv('opFechaAlta',normalizeDateInput(o.fechaAlta));sv('opEstado',o.estado);sv('opNivel',o.nivel);sv('opObs',o.obs);
    sv('opDireccionesEntrega',formatOperadoraDirecciones(o.direccionesEntrega,o.direccionEntrega,o.tipoDireccion));sv('opTipoDireccion',o.tipoDireccion||'trabajo');
    sv('opEquiposAlquila',formatOperadoraEquipos(o.equiposAlquila));
  } else {
    ['opId','opNombre','opApellido','opGabinete','opCiudad','opDepartamento','opWhatsapp','opInstagram','opEmail','opObs','opDireccionesEntrega','opEquiposAlquila'].forEach(f=>sv(f,''));
    sv('opTipoDireccion','trabajo');
    sv('opPais','Uruguay');sv('opFechaAlta',today());sv('opEstado','prospecto');sv('opNivel','Inicial');
  }
  openModal('modalOp');
}
async function saveOperadora(){
  const id=gv('opId');
  const payload={
    nombre:gv('opNombre').trim(),apellido:gv('opApellido').trim(),gabinete:gv('opGabinete').trim(),
    ciudad:gv('opCiudad').trim(),departamento:gv('opDepartamento').trim(),pais:gv('opPais').trim(),
    whatsapp:gv('opWhatsapp').trim(),instagram_usuario:gv('opInstagram').trim(),email:gv('opEmail').trim(),
    fecha_alta:gv('opFechaAlta'),estado:gv('opEstado'),nivel:gv('opNivel'),obs:gv('opObs').trim(),
    tipo_direccion:gv('opTipoDireccion'),
    direcciones_entrega:parseOperadoraDirecciones(gv('opDireccionesEntrega'),gv('opTipoDireccion')),
    equipos_alquila:parseOperadoraEquipos(gv('opEquiposAlquila'))};
  payload.direccion_entrega=payload.direcciones_entrega[0]?.direccion||'';
  if(!payload.nombre||!payload.apellido){showToast('\u26a0\ufe0f Nombre y apellido son obligatorios','warn');return;}
  try{
    let saved;
    if(id){
      saved=await api('/api/operadoras/'+id,{method:'PUT',body:JSON.stringify(payload)});
      showToast('\u2705 Operadora actualizada');
    }else{
      saved=await api('/api/operadoras',{method:'POST',body:JSON.stringify(payload)});
      showToast('\u2705 Operadora creada');
      const leadId=document._leadConvertiendo;
      if(leadId&&saved.id){
        _completarConversionLead(leadId,saved.id);
        delete document._leadConvertiendo;
        document.getElementById('modalOpTitle').textContent='Nueva Operadora';
        showToast('\ud83c\udf89 Lead convertido en operadora \u2713');
      }
    }
    const ops=await api('/api/operadoras');
    DB.set('operadoras',ops.map(mapOperadoraLocal));
    closeModal('modalOp');renderOperadoras();
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}
async function deleteOperadora(id){
  const ops=DB.get('operadoras')||[];
  const op=ops.find(o=>parseInt(o.id)===parseInt(id));
  const nombre=op?`${op.nombre||''} ${op.apellido||''}`.trim():`operadora #${id}`;
  if(!isSuperAdmin()){
    showToast('Solo el administrador principal puede eliminar operadoras.','warn');
    return;
  }
  if(!confirm(`¿Eliminar definitivamente a ${nombre}? Esta acción quita su ficha y desactiva su usuario de acceso.`))return;
  try{
    await api('/api/operadoras/'+parseInt(id),{method:'DELETE'});
    const actualizadas=await api('/api/operadoras');
    DB.set('operadoras',actualizadas.map(mapOperadoraLocal));
    showToast('✅ Operadora eliminada');
    navigate('operadoras');
    renderOperadoras();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}
