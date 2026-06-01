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
async function savePerfil(){
  const nuevoNombre=gv('perfilNombre').trim();
  const passActual=gv('perfilPassActual');
  const passNueva=gv('perfilPassNueva');
  const passConf=gv('perfilPassConfirm');
  if(!nuevoNombre){showToast('⚠️ El nombre no puede estar vacío','warn');return;}
  if(passNueva||passActual||passConf){
    if(!passActual){showToast('⚠️ Ingresá la contraseña actual','warn');return;}
    if(passNueva.length<8){showToast('⚠️ Nueva contraseña: mínimo 8 caracteres','warn');return;}
    if(passNueva!==passConf){showToast('❌ Las contraseñas nuevas no coinciden','warn');return;}
  }

  try{
    const updated=await api('/api/auth/me',{method:'PUT',body:JSON.stringify({nombre:nuevoNombre})});
    currentUser={...currentUser,nombre:updated.nombre};
    if(passNueva){
      await api('/api/auth/password',{method:'PUT',body:JSON.stringify({
        current_password:passActual,
        new_password:passNueva
      })});
      showToast('✅ Nombre y contraseña actualizados');
    }else{
      showToast('✅ Nombre actualizado');
    }
    document.getElementById('userName').textContent=currentUser.nombre;
    document.getElementById('userAvatar').textContent=currentUser.nombre.charAt(0).toUpperCase();
    closeModal('modalPerfil');
  }catch(e){
    showToast('❌ '+(e.message||'No se pudo actualizar el perfil'),'error');
  }
}
