/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
let currentUser=null;

function switchLoginMode(mode){
  const adminPanel=document.getElementById('loginAdminPanel');
  const whatsappPanel=document.getElementById('loginWhatsappPanel');
  const tabAdmin=document.getElementById('tabLoginAdmin');
  const tabWhatsapp=document.getElementById('tabLoginWhatsapp');
  const err=document.getElementById('loginError');
  if(adminPanel) adminPanel.style.display = mode === 'admin' ? '' : 'none';
  if(whatsappPanel) whatsappPanel.style.display = mode === 'whatsapp' ? '' : 'none';
  if(tabAdmin) tabAdmin.classList.toggle('active', mode === 'admin');
  if(tabWhatsapp) tabWhatsapp.classList.toggle('active', mode === 'whatsapp');
  if(err) err.style.display = 'none';
}

function configureLoginEntry(){
  const params=new URLSearchParams(window.location.search);
  const internal=params.get('admin')==='1'||window.location.hash==='#admin';
  const tabs=document.getElementById('loginTabs');
  if(tabs) tabs.style.display=internal?'':'none';
  switchLoginMode(internal?'admin':'whatsapp');
}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass=document.getElementById('loginPass').value;
  const err=document.getElementById('loginError');
  err.style.display='none';
  try{
    const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password:pass})});
    TOKEN.set(data.token);
    currentUser={id:data.user.id,nombre:data.user.nombre,email:data.user.email,
      rol:data.user.rol,operadora_id:data.user.operadora_id,transportista_id:data.user.transportista_id,whatsapp:data.user.whatsapp};
    await loadAllData();
    startApp();
  }catch(e){
    err.textContent='Email o contraseña incorrectos';
    err.style.display='block';
  }
}

async function requestWhatsappCode(){
  const err=document.getElementById('loginError');
  err.style.display='none';
  const whatsapp=document.getElementById('waLoginPhone').value.trim();
  const rol='operadora';
  const btn=document.getElementById('waRequestBtn');
  btn.disabled=true; btn.textContent='Enviando código...';
  try{
    const data=await api('/api/auth/whatsapp/request',{method:'POST',body:JSON.stringify({whatsapp,rol})});
    document.getElementById('waCodeGroup').style.display='';
    document.getElementById('waVerifyBtn').style.display='';
    btn.textContent='Reenviar código';
    showToast(data.codigo_enviado ? '📱 Código enviado por WhatsApp' : '⏳ Código generado. Lo reintentaremos por WhatsApp.');
  }catch(e){
    err.textContent=e.message||'No se pudo enviar el código';
    err.style.display='block';
    btn.textContent='Enviar código por WhatsApp';
  }finally{
    btn.disabled=false;
  }
}

async function verifyWhatsappCode(){
  const err=document.getElementById('loginError');
  err.style.display='none';
  const whatsapp=document.getElementById('waLoginPhone').value.trim();
  const rol='operadora';
  const codigo=document.getElementById('waLoginCode').value.trim();
  const btn=document.getElementById('waVerifyBtn');
  btn.disabled=true; btn.textContent='Validando...';
  try{
    const data=await api('/api/auth/whatsapp/verify',{method:'POST',body:JSON.stringify({whatsapp,rol,codigo})});
    TOKEN.set(data.token);
    currentUser={id:data.user.id,nombre:data.user.nombre,email:data.user.email,
      rol:data.user.rol,operadora_id:data.user.operadora_id,transportista_id:data.user.transportista_id,whatsapp:data.user.whatsapp};
    await loadAllData();
    startApp();
  }catch(e){
    err.textContent=e.message||'Código incorrecto';
    err.style.display='block';
    btn.disabled=false; btn.textContent='Ingresar con código';
  }
}

function openOperadoraRegistro(){
  document.getElementById('modalRegistroOperadora').classList.add('open');
  const waPhone=document.getElementById('waLoginPhone');
  const regPhone=document.getElementById('regOpWhatsapp');
  if(waPhone && regPhone && waPhone.value.trim() && !regPhone.value.trim()){
    regPhone.value=waPhone.value.trim();
  }
}

function openOperadoraRegistroFromLink(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('registro') !== 'operadora') return;
  switchLoginMode('whatsapp');
  const rol = document.getElementById('waLoginRol');
  if(rol) rol.value = 'operadora';
  setTimeout(openOperadoraRegistro, 100);
}

function toggleRegistroTrabajoExtra(){
  const wrap=document.getElementById('regOpTrabajoExtraWrap');
  const value=document.getElementById('regOpTrabajoNoEstetico').value;
  wrap.style.display=value==='si'?'':'none';
}

function getCheckedValues(name){
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el=>el.value);
}

function registroCumpleValido(dia, mes){
  if(!dia && !mes) return true;
  const d=parseInt(dia,10);
  const m=parseInt(mes,10);
  if(!d||!m||m<1||m>12) return false;
  const max=[31,29,31,30,31,30,31,31,30,31,30,31][m-1];
  return d>=1&&d<=max;
}

async function submitOperadoraRegistro(){
  const err=document.getElementById('loginError');
  err.style.display='none';
  const btn=document.getElementById('regOpSubmitBtn');
  const payload={
    nombre:document.getElementById('regOpNombre').value.trim(),
    apellido:document.getElementById('regOpApellido').value.trim(),
    whatsapp:document.getElementById('regOpWhatsapp').value.trim(),
    documento:document.getElementById('regOpDocumento').value.replace(/\D/g,''),
    cumpleanos_dia:document.getElementById('regOpCumpleDia').value.trim(),
    cumpleanos_mes:document.getElementById('regOpCumpleMes').value,
    instagram_usuario:document.getElementById('regOpInstagram').value.trim(),
    gabinete:document.getElementById('regOpEstetica').value.trim(),
    ciudad:document.getElementById('regOpCiudad').value.trim(),
    departamento:document.getElementById('regOpDepartamento').value.trim(),
    lugares_trabajo:document.getElementById('regOpLugares').value.trim(),
    experiencia:document.getElementById('regOpExperiencia').value,
    tratamientos:getCheckedValues('regTratamientos'),
    tratamientos_otros:document.getElementById('regOpTratamientosOtros').value.trim(),
    trabajo_no_estetico:document.getElementById('regOpTrabajoNoEstetico').value==='si',
    trabajo_no_estetico_detalle:document.getElementById('regOpTrabajoExtra').value.trim()
  };
  if(!payload.nombre||!payload.apellido||!payload.whatsapp||!payload.documento||!payload.ciudad){
    showToast('⚠️ Nombre, apellido, WhatsApp, cédula/DNI y ciudad son obligatorios','warn');
    return;
  }
  if(!registroCumpleValido(payload.cumpleanos_dia,payload.cumpleanos_mes)){
    showToast('⚠️ Indicá un cumpleaños válido con día y mes, sin año','warn');
    return;
  }
  btn.disabled=true;
  btn.textContent='Creando registro...';
  try{
    const data=await api('/api/auth/operadora/register',{method:'POST',body:JSON.stringify(payload)});
    closeModal('modalRegistroOperadora');
    switchLoginMode('whatsapp');
    const rol=document.getElementById('waLoginRol');
    if(rol) rol.value='operadora';
    document.getElementById('waLoginPhone').value=data.whatsapp||payload.whatsapp;
    document.getElementById('waCodeGroup').style.display='none';
    document.getElementById('waVerifyBtn').style.display='none';
    document.getElementById('waRequestBtn').textContent='Pedir código por WhatsApp';
    if(data.ya_habilitada){
      showToast('✅ Ya estás dada de alta. Pedí el código por WhatsApp para ingresar.');
    }else if(data.pendiente_autorizacion){
      showToast('✅ Registro recibido. Te avisamos por WhatsApp cuando administración lo autorice.');
    }else if(data.codigo_enviado){
      document.getElementById('waCodeGroup').style.display='';
      document.getElementById('waVerifyBtn').style.display='';
      document.getElementById('waRequestBtn').textContent='Reenviar código';
      showToast('✅ Registro creado. Te enviamos el código por WhatsApp.');
    }else{
      showToast('✅ Registro creado. El código quedó en reintento automático por WhatsApp.');
    }
  }catch(e){
    err.textContent=e.message||'No se pudo crear el registro';
    err.style.display='block';
    showToast('❌ '+err.textContent,'error');
  }finally{
    btn.disabled=false;
    btn.textContent='Crear registro';
  }
}

function doLogout(){
  TOKEN.del();currentUser=null;
  document.getElementById('app').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
}
async function tryRestoreSession(){
  // Auto-login por portal token (link enviado por WA al aprobar)
  const params=new URLSearchParams(window.location.search);
  const ptoken=params.get('ptoken');
  if(ptoken){
    try{
      const data=await api('/api/auth/portal-login',{method:'POST',body:JSON.stringify({token:ptoken})});
      TOKEN.set(data.token);
      currentUser={id:data.user.id,nombre:data.user.nombre,email:data.user.email,
        rol:data.user.rol,operadora_id:data.user.operadora_id,transportista_id:data.user.transportista_id,whatsapp:data.user.whatsapp};
      // Limpiar token de la URL sin recargar
      const url=new URL(window.location.href);
      url.searchParams.delete('ptoken');
      window.history.replaceState({},'',url.toString());
      await loadAllData();
      startApp();
      return;
    }catch(e){
      const err=document.getElementById('loginError');
      if(err){err.textContent='El link de acceso ya no es válido. Pedí uno nuevo escribiéndonos por WhatsApp.';err.style.display='block';}
    }
  }
  const token=TOKEN.get();if(!token)return;
  try{
    const data=await api('/api/auth/me');
    currentUser={id:data.id,nombre:data.nombre,email:data.email,
      rol:data.rol,operadora_id:data.operadora_id,transportista_id:data.transportista_id,whatsapp:data.whatsapp};
    await loadAllData();
    startApp();
  }catch(e){TOKEN.del();}
}
function startApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='block';
  document.getElementById('userName').textContent=currentUser.nombre;
  document.getElementById('userRole').textContent=typeof getRoleLabel==='function'?getRoleLabel():currentUser.rol;
  document.getElementById('userAvatar').textContent=currentUser.nombre.charAt(0).toUpperCase();
  document.getElementById('topbarRole').textContent=typeof getRoleLabel==='function'?getRoleLabel():currentUser.rol;
  if(typeof applyRoleUI==='function') applyRoleUI();
  updateReservasBadge();
  updatePagosBadge();
  if(typeof updateCajaBadge==='function') updateCajaBadge();
  if(typeof updateComprasBadge==='function') updateComprasBadge();
  if(typeof updateVentasMaquinasBadge==='function') updateVentasMaquinasBadge();
  updateWABadge();
  updateEnviosBadge();
  updateMaqBadge();
  updateLeadsBadge();
  if(typeof updateRevisionOperadorasBadge==='function') updateRevisionOperadorasBadge();
  if(typeof applyRoleUI==='function') applyRoleUI();
  navigate((typeof canView==='function'&&canView('dashboard'))?'dashboard':'envios');
  // Chequeo periódico de sesión (cada 2 minutos)
  if(window._sessionCheckInterval) clearInterval(window._sessionCheckInterval);
  window._sessionCheckInterval=setInterval(async()=>{
    try{ await api('/api/auth/me'); }
    catch(e){ if(e?.status===401||String(e).includes('401')){ clearInterval(window._sessionCheckInterval); logout(); } }
  }, 2*60*1000);
}
