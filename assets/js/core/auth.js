/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
let currentUser=null;

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass=document.getElementById('loginPass').value;
  const err=document.getElementById('loginError');
  err.style.display='none';
  try{
    const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password:pass})});
    TOKEN.set(data.token);
    currentUser={id:data.user.id,nombre:data.user.nombre,email:data.user.email,
      rol:data.user.rol,operadora_id:data.user.operadora_id};
    await loadAllData();
    startApp();
  }catch(e){
    err.textContent='Email o contraseña incorrectos';
    err.style.display='block';
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
      rol:data.rol,operadora_id:data.operadora_id};
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
  if(currentUser.rol==='operadora'){
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
