/* ══════════════════════════════════
   USUARIOS INTERNOS (solo administradores)
   Alta de personal del CRM: coordinadora, operaciones, comercial.
══════════════════════════════════ */
const USUARIO_ROLES_INTERNOS={
  coordinadora:'Coordinadora',
  operaciones:'Administración / Ops',
  comercial:'Comercial / CRM'
};
const USUARIO_ROLES_LISTA=['superadmin','administrador','operaciones','comercial','coordinadora'];

async function renderUsuarios(){
  const tbody=document.getElementById('usuariosTableBody');if(!tbody)return;
  tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><p>Cargando…</p></div></td></tr>';
  try{
    const rows=(await api('/api/permisos/usuarios')).filter(u=>USUARIO_ROLES_LISTA.includes(u.rol));
    if(!rows.length){
      tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="icon">👥</div><h3>Sin usuarios internos</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML=rows.map(u=>`<tr>
      <td>${escapeHTML(u.nombre||'')}</td>
      <td>${escapeHTML(u.email||'')}</td>
      <td><span class="badge badge-blue">${escapeHTML(ROLE_LABELS[u.rol]||u.rol)}</span></td>
      <td>${u.status==='activo'?'<span class="badge badge-green">Activo</span>':'<span class="badge badge-gray">'+escapeHTML(u.status||'')+'</span>'}</td>
      <td>${usuarioRolControl(u)}</td>
    </tr>`).join('');
  }catch(e){
    tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><p>No se pudieron cargar los usuarios: '+escapeHTML(e.message)+'</p></div></td></tr>';
  }
}

function openUsuarioModal(){
  document.getElementById('usrRol').innerHTML=Object.entries(USUARIO_ROLES_INTERNOS)
    .map(([k,v])=>`<option value="${k}">${escapeHTML(v)}</option>`).join('');
  ['usrNombre','usrEmail','usrWhatsapp','usrPassword'].forEach(id=>sv(id,''));
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
  if(!payload.nombre||!payload.email||!payload.password||!payload.rol){
    showToast('⚠️ Nombre, email, contraseña y rol son obligatorios','warn');
    return;
  }
  if(payload.password.length<8){
    showToast('⚠️ La contraseña debe tener al menos 8 caracteres','warn');
    return;
  }
  try{
    await api('/api/auth/register',{method:'POST',body:JSON.stringify(payload)});
    closeModal('modalUsuario');
    showToast('✅ Usuario creado: '+payload.nombre);
    renderUsuarios();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}

const USUARIO_ROLES_EDITABLES={
  administrador:'Administrador',
  operaciones:'Administración / Ops',
  coordinadora:'Coordinadora',
  comercial:'Comercial / CRM'
};

function usuarioRolControl(u){
  if(typeof currentUser!=='undefined'&&currentUser&&Number(currentUser.id)===Number(u.id)){
    return '<span style="color:var(--text3);font-size:12px">(vos)</span>';
  }
  const actual=u.rol==='superadmin'?'administrador':u.rol;
  const opts=Object.entries(USUARIO_ROLES_EDITABLES)
    .map(([k,v])=>`<option value="${k}"${k===actual?' selected':''}>${escapeHTML(v)}</option>`).join('');
  return `<select id="usrRolSel_${u.id}" style="padding:4px 6px;font-size:12px">${opts}</select>
    <button class="btn-secondary" style="padding:4px 10px;font-size:12px;margin-left:4px" onclick="cambiarRolUsuario(${u.id},'${escapeHTML(u.nombre||'').replace(/'/g,'')}','${actual}')">Guardar</button>`;
}

async function cambiarRolUsuario(id,nombre,rolActual){
  const sel=document.getElementById('usrRolSel_'+id);if(!sel)return;
  const rol=sel.value;
  if(rol===rolActual){showToast('Ya tiene ese rol','warn');return;}
  if(!confirm(`¿Cambiar el rol de ${nombre} a "${USUARIO_ROLES_EDITABLES[rol]}"?`))return;
  try{
    await api('/api/permisos/usuarios/'+id+'/rol',{method:'PUT',body:JSON.stringify({rol})});
    showToast('✅ Rol actualizado: '+nombre);
    renderUsuarios();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}
