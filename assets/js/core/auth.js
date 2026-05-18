/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
let currentUser=null;

function switchLoginMode(mode){
  document.getElementById('loginAdminPanel').style.display = mode === 'admin' ? '' : 'none';
  document.getElementById('loginWhatsappPanel').style.display = mode === 'whatsapp' ? '' : 'none';
  document.getElementById('tabLoginAdmin').classList.toggle('active', mode === 'admin');
  document.getElementById('tabLoginWhatsapp').classList.toggle('active', mode === 'whatsapp');
  document.getElementById('loginDemoBox').style.display = mode === 'admin' ? '' : 'none';
  document.getElementById('loginError').style.display = 'none';
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
  const rol=document.getElementById('waLoginRol').value;
  const btn=document.getElementById('waRequestBtn');
  btn.disabled=true; btn.textContent='Enviando código...';
  try{
    await api('/api/auth/whatsapp/request',{method:'POST',body:JSON.stringify({whatsapp,rol})});
    document.getElementById('waCodeGroup').style.display='';
    document.getElementById('waVerifyBtn').style.display='';
    btn.textContent='Reenviar código';
    showToast('📱 Código enviado por WhatsApp');
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
  const rol=document.getElementById('waLoginRol').value;
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

async function submitOperadoraRegistro(){
  const err=document.getElementById('loginError');
  err.style.display='none';
  const btn=document.getElementById('regOpSubmitBtn');
  const payload={
    nombre:document.getElementById('regOpNombre').value.trim(),
    apellido:document.getElementById('regOpApellido').value.trim(),
    whatsapp:document.getElementById('regOpWhatsapp').value.trim(),
    documento:document.getElementById('regOpDocumento').value.replace(/\D/g,''),
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
  btn.disabled=true;
  btn.textContent='Creando registro...';
  try{
    const data=await api('/api/auth/operadora/register',{method:'POST',body:JSON.stringify(payload)});
    closeModal('modalRegistroOperadora');
    switchLoginMode('whatsapp');
    document.getElementById('waLoginRol').value='operadora';
    document.getElementById('waLoginPhone').value=data.whatsapp||payload.whatsapp;
    showToast('✅ Registro creado. Ahora pedí el código de WhatsApp para ingresar.');
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
}
