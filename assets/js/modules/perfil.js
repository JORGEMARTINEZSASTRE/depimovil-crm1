/* ══════════════════════════════════
   PERFIL DE USUARIO
══════════════════════════════════ */
function openPerfilModal(){
  if(!currentUser) return;
  sv('perfilNombre', currentUser.nombre);
  sv('perfilEmail', currentUser.email);
  sv('perfilPassActual',''); sv('perfilPassNueva',''); sv('perfilPassConfirm','');
  document.getElementById('perfilAvatar').textContent = currentUser.nombre.charAt(0).toUpperCase();
  document.getElementById('perfilNombreDisplay').textContent = currentUser.nombre;
  document.getElementById('perfilEmailDisplay').textContent = currentUser.email;
  const roles={superadmin:'Super Admin',operaciones:'Administración / Ops',operadora:'Operadora'};
  document.getElementById('perfilRolDisplay').innerHTML=`<span class="badge badge-blue">${roles[currentUser.rol]||currentUser.rol}</span>`;
  openModal('modalPerfil');
}
function savePerfil(){
  const nuevoNombre=gv('perfilNombre').trim();
  const passActual=gv('perfilPassActual');
  const passNueva=gv('perfilPassNueva');
  const passConf=gv('perfilPassConfirm');
  if(!nuevoNombre){showToast('⚠️ El nombre no puede estar vacío','warn');return;}
  const users=DB.get('users')||[];
  const idx=users.findIndex(u=>u.id===currentUser.id);
  if(idx<0){showToast('❌ Usuario no encontrado','warn');return;}
  users[idx].nombre=nuevoNombre;
  if(passNueva||passActual){
    if(users[idx].pass!==passActual){showToast('❌ Contraseña actual incorrecta','warn');return;}
    if(passNueva.length<5){showToast('⚠️ Nueva contraseña: mínimo 5 caracteres','warn');return;}
    if(passNueva!==passConf){showToast('❌ Las contraseñas nuevas no coinciden','warn');return;}
    users[idx].pass=passNueva;
    showToast('✅ Nombre y contraseña actualizados');
  } else {
    showToast('✅ Nombre actualizado');
  }
  DB.set('users',users);
  currentUser=users[idx];
  document.getElementById('userName').textContent=currentUser.nombre;
  document.getElementById('userAvatar').textContent=currentUser.nombre.charAt(0).toUpperCase();
  auditLog('UPDATE','usuario',currentUser.id,'Perfil actualizado');
  closeModal('modalPerfil');
}
