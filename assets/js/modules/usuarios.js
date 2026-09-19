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
  tbody.innerHTML='<tr><td colspan="4"><div class="empty-state"><p>Cargando…</p></div></td></tr>';
  try{
    const rows=(await api('/api/permisos/usuarios')).filter(u=>USUARIO_ROLES_LISTA.includes(u.rol));
    if(!rows.length){
      tbody.innerHTML='<tr><td colspan="4"><div class="empty-state"><div class="icon">👥</div><h3>Sin usuarios internos</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML=rows.map(u=>`<tr>
      <td>${escapeHTML(u.nombre||'')}</td>
      <td>${escapeHTML(u.email||'')}</td>
      <td><span class="badge badge-blue">${escapeHTML(ROLE_LABELS[u.rol]||u.rol)}</span></td>
      <td>${u.status==='activo'?'<span class="badge badge-green">Activo</span>':'<span class="badge badge-gray">'+escapeHTML(u.status||'')+'</span>'}</td>
    </tr>`).join('');
  }catch(e){
    tbody.innerHTML='<tr><td colspan="4"><div class="empty-state"><p>No se pudieron cargar los usuarios: '+escapeHTML(e.message)+'</p></div></td></tr>';
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
