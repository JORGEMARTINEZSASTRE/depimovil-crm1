/* ══════════════════════════════════
   USUARIOS INTERNOS (solo administradores)
   Alta, edición, baja y reactivación del personal del CRM.
══════════════════════════════════ */
const USUARIO_ROLES_INTERNOS={
  administrador:'Administrador',
  operaciones:'Administración / Ops',
  coordinadora:'Coordinadora',
  comercial:'Comercial / CRM'
};
const USUARIO_ROLES_LISTA=['superadmin','administrador','operaciones','comercial','coordinadora'];
let _usuariosCache=[];
let _usuarioEditId=null;

function _esYo(u){
  return typeof currentUser!=='undefined'&&currentUser&&Number(currentUser.id)===Number(u.id);
}

async function renderUsuarios(){
  const tbody=document.getElementById('usuariosTableBody');if(!tbody)return;
  tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><p>Cargando…</p></div></td></tr>';
  try{
    const rows=(await api('/api/permisos/usuarios')).filter(u=>USUARIO_ROLES_LISTA.includes(u.rol));
    rows.sort((a,b)=>(a.status==='activo'?0:1)-(b.status==='activo'?0:1));
    _usuariosCache=rows;
    if(!rows.length){
      tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="icon">👥</div><h3>Sin usuarios internos</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML=rows.map(u=>{
      const activo=u.status==='activo';
      const yo=_esYo(u);
      const acciones=activo
        ?`<button class="action-btn" onclick="openUsuarioModal(${u.id})">✏️ Editar</button>
           ${yo?'':`<button class="action-btn danger" onclick="eliminarUsuario(${u.id})">🗑 Eliminar</button>`}`
        :`<button class="action-btn" onclick="reactivarUsuario(${u.id})">↩️ Reactivar</button>`;
      return `<tr${activo?'':' style="opacity:.55"'}>
        <td>${escapeHTML(u.nombre||'')}${yo?' <span style="color:var(--text3);font-size:12px">(vos)</span>':''}</td>
        <td>${escapeHTML(u.email||'')}</td>
        <td><span class="badge badge-blue">${escapeHTML(ROLE_LABELS[u.rol]||u.rol)}</span></td>
        <td>${activo?'<span class="badge badge-green">Activo</span>':'<span class="badge badge-gray">Inactivo</span>'}</td>
        <td style="white-space:nowrap;text-align:right">${acciones}</td>
      </tr>`;
    }).join('');
  }catch(e){
    tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><p>No se pudieron cargar los usuarios: '+escapeHTML(e.message)+'</p></div></td></tr>';
  }
}

function openUsuarioModal(id){
  const u=id?_usuariosCache.find(x=>Number(x.id)===Number(id)):null;
  _usuarioEditId=u?u.id:null;
  const modal=document.getElementById('modalUsuario');
  const rolActual=u?(u.rol==='superadmin'?'administrador':u.rol):'operaciones';
  const sel=document.getElementById('usrRol');
  sel.innerHTML=Object.entries(USUARIO_ROLES_INTERNOS)
    .map(([k,v])=>`<option value="${k}"${k===rolActual?' selected':''}>${escapeHTML(v)}</option>`).join('');
  sel.disabled=!!(u&&_esYo(u));
  sv('usrNombre',u?u.nombre||'':'');
  sv('usrEmail',u?u.email||'':'');
  sv('usrWhatsapp',u?u.whatsapp||'':'');
  sv('usrPassword','');
  const pass=document.getElementById('usrPassword');
  if(pass){
    pass.placeholder=u?'Dejar vacío para no cambiarla':'Mínimo 8 caracteres';
    const lbl=pass.closest('.form-field')?.querySelector('label');
    if(lbl)lbl.innerHTML=u?'Nueva contraseña':'Contraseña temporal <span style="color:var(--red)">*</span>';
  }
  const h=modal.querySelector('.modal-head h3');if(h)h.textContent=u?'Editar usuario':'Nuevo usuario interno';
  const btn=modal.querySelector('.modal-foot .btn-add');if(btn)btn.textContent=u?'💾 Guardar cambios':'💾 Crear usuario';
  openModal('modalUsuario');
}

async function saveUsuario(){
  const payload={
    nombre:gv('usrNombre').trim(),
    email:gv('usrEmail').trim().toLowerCase(),
    whatsapp:gv('usrWhatsapp').trim(),
    password:gv('usrPassword'),
    rol:gv('usrRol')
  };
  const editando=!!_usuarioEditId;
  if(!payload.nombre||!payload.email||!payload.rol||(!editando&&!payload.password)){
    showToast('⚠️ '+(editando?'Nombre, email y rol son obligatorios':'Nombre, email, contraseña y rol son obligatorios'),'warn');
    return;
  }
  if(payload.password&&payload.password.length<8){
    showToast('⚠️ La contraseña debe tener al menos 8 caracteres','warn');
    return;
  }
  try{
    if(editando){
      const u=_usuariosCache.find(x=>Number(x.id)===Number(_usuarioEditId));
      if(u&&u.rol==='superadmin'&&payload.rol==='administrador')payload.rol='superadmin';
      await api('/api/permisos/usuarios/'+_usuarioEditId,{method:'PUT',body:JSON.stringify(payload)});
      showToast('✅ Usuario actualizado: '+payload.nombre);
    }else{
      await api('/api/auth/register',{method:'POST',body:JSON.stringify(payload)});
      showToast('✅ Usuario creado: '+payload.nombre);
    }
    closeModal('modalUsuario');
    _usuarioEditId=null;
    renderUsuarios();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}

async function eliminarUsuario(id){
  const u=_usuariosCache.find(x=>Number(x.id)===Number(id));if(!u)return;
  if(!confirm(`¿Eliminar a ${u.nombre}?\n\nYa no va a poder entrar al CRM.`))return;
  try{
    const r=await api('/api/permisos/usuarios/'+id,{method:'DELETE'});
    showToast(r&&r.desactivado
      ?'✅ '+u.nombre+' quedó desactivado (tiene historial, se conserva)'
      :'✅ Usuario eliminado: '+u.nombre);
    renderUsuarios();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}

async function reactivarUsuario(id){
  const u=_usuariosCache.find(x=>Number(x.id)===Number(id));if(!u)return;
  if(!confirm(`¿Reactivar a ${u.nombre}?`))return;
  try{
    await api('/api/permisos/usuarios/'+id+'/reactivar',{method:'POST'});
    showToast('✅ Usuario reactivado: '+u.nombre);
    renderUsuarios();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}
