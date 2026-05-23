/* ══════════════════════════════════
   OPERADORAS
══════════════════════════════════ */
let opFilter={search:'',status:''};
function badgeOp(e){
  const m={activa:'badge-green',prospecto:'badge-blue',inactiva:'badge-gray',suspendida:'badge-red'};
  const l={activa:'Activa',prospecto:'Prospecto',inactiva:'Inactiva',suspendida:'Suspendida'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function renderOperadoras(){
  const ops=(DB.get('operadoras')||[]).filter(o=>{
    const q=opFilter.search.toLowerCase();
    const ms=!q||(o.nombre+' '+o.apellido+' '+o.gabinete+' '+o.ciudad).toLowerCase().includes(q);
    return ms&&(!opFilter.status||o.estado===opFilter.status);
  });
  const tbody=document.getElementById('opTableBody');
  if(!ops.length){tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="icon">👩‍💼</div><h3>Sin resultados</h3><p>No hay operadoras que coincidan.</p></div></td></tr>`;return;}
  tbody.innerHTML=ops.map(o=>`<tr>
    <td><span class="bold">${o.nombre} ${o.apellido}</span></td>
    <td>${o.gabinete||'—'}</td><td>${o.ciudad}</td><td>${o.departamento}</td>
    <td>${badgeOp(o.estado)}</td><td><span style="color:var(--text2)">${o.nivel}</span></td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="showOpFicha(${o.id})">Ver</button>
      ${canEdit()?`<button class="action-btn" onclick="openOpModal(${o.id})" style="margin-left:4px">Editar</button>`:''}
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
    direccionesEntrega:direcciones,equiposAlquila:equipos,portalToken:o.portal_token||''};
}
function showOpFicha(id){
  if(typeof isOperadoraRole==='function'&&isOperadoraRole(currentUser?.rol)&&parseInt(id)!==parseInt(currentUser?.operadora_id)){
    showToast('⚠️ No podés ver la ficha de otra operadora','warn');
    return;
  }
  const ops=DB.get('operadoras')||[];const o=ops.find(x=>x.id===id);if(!o)return;
  const reservas=(DB.get('reservas')||[]).filter(r=>r.operadoraId===id);
  navigate('operadora-ficha');
  document.getElementById('fichaOpContent').innerHTML=`
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar op">${o.nombre.charAt(0)}${o.apellido.charAt(0)}</div>
        <div class="ficha-title"><h2>${o.nombre} ${o.apellido}</h2><p>${o.gabinete||''} · ${o.ciudad}, ${o.departamento}</p></div>
      </div>
      <div class="ficha-actions">
        ${badgeOp(o.estado)}
        ${canEdit()?`<button class="btn-secondary" onclick="openOpModal(${o.id})">✏️ Editar</button>`:''}
      </div>
    </div>
    <div class="ficha-grid">
      <div class="info-card">
        <h4>📋 Datos Personales</h4>
        ${ir('Nombre completo',o.nombre+' '+o.apellido)}${ir('Email',o.email||'—')}
        ${ir('WhatsApp',o.whatsapp||'—')}${ir('Instagram',o.instagramUsuario?('@'+String(o.instagramUsuario).replace(/^@/,'')):'—')}
        ${ir('Fecha de alta',fmtDate(o.fechaAlta))}${ir('Estado',badgeOp(o.estado))}
        ${ir('Nivel',`<span class="badge badge-blue">${o.nivel}</span>`)}
      </div>
      <div class="info-card">
        <h4>📍 Ubicación & Entrega</h4>
        ${ir('Gabinete',o.gabinete||'—')}${ir('Ciudad',o.ciudad)}
        ${ir('Departamento',o.departamento)}${ir('País',o.pais)}
        ${(()=>{
          const direcciones=(o.direccionesEntrega&&o.direccionesEntrega.length)?o.direccionesEntrega:(o.direccionEntrega?[{direccion:o.direccionEntrega,tipo:o.tipoDireccion,principal:true}]:[]);
          if(!direcciones.length)return ir('📦 Direcciones de entrega','<span style="color:var(--red);font-size:12px">⚠️ Sin dirección</span>');
          return ir('📦 Direcciones de entrega',direcciones.map(d=>`<div style="margin-bottom:6px"><span style="color:var(--accent);font-weight:600">${d.direccion}</span>${d.localidad?` · ${d.localidad}`:''}${d.departamento?` · ${d.departamento}`:''}${d.principal?'<span class="badge badge-blue" style="margin-left:8px">Principal</span>':''}</div>`).join(''));
        })()}
      </div>
      <div class="info-card">
        <h4>🧾 Equipos que alquila</h4>
        ${(o.equiposAlquila||[]).length?(o.equiposAlquila||[]).map(e=>`<div class="dash-list-item"><div><div class="name">${e.equipo}</div><div class="sub">${e.jornadas||0} jornada${parseInt(e.jornadas||0,10)===1?'':'s'}${e.obs?' · '+e.obs:''}</div></div><strong>${(parseFloat(e.valor)||0).toLocaleString()} UYU</strong></div>`).join(''):`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin equipos cargados.</div>`}
      </div>
      <div class="info-card">
        <h4>📅 Reservas (${reservas.length})</h4>
        ${reservas.length?reservas.slice(0,5).map(r=>{
          const maq=getMaq(r.maquinaId);
          return `<div class="dash-list-item"><div><div class="name">${maq?maq.nombre:'—'}</div><div class="sub">${fmtDate(r.fechaInicio)} → ${fmtDate(r.fechaFin)}</div></div><div style="display:flex;gap:6px;align-items:center">${badgeRes(r.estado)}<button class="action-btn" onclick="showResFicha(${r.id})">Ver</button></div></div>`;
        }).join(''):`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin reservas registradas.</div>`}
      </div>
      <div class="info-card full">
        <h4>📝 Observaciones Internas</h4>
        <div class="obs-text">${o.obs||'Sin observaciones.'}</div>
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
          🪨 Documentos & Contrato
          ${o.portalToken?`<button class="btn-add" style="font-size:11px;padding:4px 10px" onclick="copyPortalLink('${o.portalToken}')">📋 Copiar Link Portal</button>`:'<span style="font-size:11px;color:var(--text3)">Sin token</span>'}
        </h4>
        <div id="docsBody_${o.id}" style="padding:8px 0;color:var(--text3);font-size:13px">Cargando documentos...</div>
      </div>
      ${renderHabPanel(o.id)}
      ${renderCapPanel(o.id)}
    </div>`;
  loadOpDocs(o.id);
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
  showToast('La eliminación de operadoras está deshabilitada. Cambiá el estado a Inactiva o Suspendida.','warn');
}
