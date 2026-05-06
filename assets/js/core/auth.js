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
  const rl={superadmin:'Super Admin',operaciones:'Administración / Ops',operadora:'Operadora',comercial:'Comercial / CRM'};
  document.getElementById('userName').textContent=currentUser.nombre;
  document.getElementById('userRole').textContent=rl[currentUser.rol]||currentUser.rol;
  document.getElementById('userAvatar').textContent=currentUser.nombre.charAt(0).toUpperCase();
  document.getElementById('topbarRole').textContent=rl[currentUser.rol]||currentUser.rol;
  if(currentUser.rol==='operadora'||currentUser.rol==='transportista'){
    ['btnAddOp','btnAddMaq','btnAddRes','btnAddPago','btnAddEnvio','btnAddLead','adminNav'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.style.display='none';
    });
  }
  updateReservasBadge();
  updatePagosBadge();
  updateWABadge();
  updateEnviosBadge();
  updateMaqBadge();
  updateLeadsBadge();
  navigate('dashboard');
}
