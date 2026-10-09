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

const USR_ROL_COLOR={superadmin:'#d4a96a',administrador:'#d4a96a',operaciones:'#5c8fe0',coordinadora:'#c76b8a',comercial:'#52c48a'};
let _usrFiltro='todos';

function _iniciales(n){return String(n||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase()||'?';}

function _rolLabel(r){return r==='superadmin'?'Administrador':(USUARIO_ROLES_INTERNOS[r]||ROLE_LABELS?.[r]||r);}

function filtrarUsuarios(f){_usrFiltro=f;_pintarUsuarios();}

function _pintarUsuarios(){
  const grid=document.getElementById('usuariosTableBody');if(!grid)return;
  const fil=document.getElementById('usrFiltros');
  const rows=_usuariosCache;
  const grupo=r=>r==='superadmin'?'administrador':r;
  const cuenta={todos:rows.length};
  rows.forEach(u=>{const g=grupo(u.rol);cuenta[g]=(cuenta[g]||0)+1;});
  if(fil){
    const chips=[['todos','Todos'],...Object.entries(USUARIO_ROLES_INTERNOS)].filter(([k])=>k==='todos'||cuenta[k]);
    fil.innerHTML=chips.map(([k,v])=>`<button class="usr-chip${_usrFiltro===k?' on':''}" onclick="filtrarUsuarios('${k}')">${escapeHTML(v)}<b>${cuenta[k]||0}</b></button>`).join('');
  }
  const lista=_usrFiltro==='todos'?rows:rows.filter(u=>grupo(u.rol)===_usrFiltro);
  if(!lista.length){grid.innerHTML='<div class="usr-vacio">👥<br>No hay usuarios en este rol</div>';return;}
  grid.innerHTML=lista.map(u=>{
    const activo=u.status==='activo', yo=_esYo(u);
    const c=USR_ROL_COLOR[u.rol]||'#8892aa';
    const acciones=activo
      ?`<button class="usr-btn" onclick="openUsuarioModal(${u.id})">✏️ Editar</button>${yo?'':`<button class="usr-btn del" onclick="eliminarUsuario(${u.id})">🗑 Eliminar</button>`}`
      :`<button class="usr-btn" onclick="reactivarUsuario(${u.id})">↩️ Reactivar</button>`;
    return `<div class="usr-card${activo?'':' off'}">
      <div class="usr-top">
        <div class="usr-av" style="background:${c}">${escapeHTML(_iniciales(u.nombre))}</div>
        <div class="usr-info">
          <div class="usr-nombre">${escapeHTML(u.nombre||'')}${yo?'<span class="usr-yo">VOS</span>':''}</div>
          <div class="usr-mail">${escapeHTML(u.email||'')}</div>
        </div>
      </div>
      <div class="usr-meta">
        <span class="usr-rol" style="background:${c}22;color:${c}">${escapeHTML(_rolLabel(u.rol))}</span>
        <span class="usr-est">${activo?'Activo':'Inactivo'}</span>
        ${u.whatsapp?`<span class="usr-wa">📱 ${escapeHTML(u.whatsapp)}</span>`:''}
      </div>
      <div class="usr-acc">${acciones}</div>
    </div>`;
  }).join('');
}

async function renderUsuarios(){
  const grid=document.getElementById('usuariosTableBody');if(!grid)return;
  grid.innerHTML='<div class="usr-vacio">Cargando…</div>';
  try{
    const rows=(await api('/api/permisos/usuarios')).filter(u=>USUARIO_ROLES_LISTA.includes(u.rol));
    rows.sort((a,b)=>((a.status==='activo'?0:1)-(b.status==='activo'?0:1))||String(a.nombre).localeCompare(String(b.nombre)));
    _usuariosCache=rows;
    if(!rows.length){grid.innerHTML='<div class="usr-vacio">👥<br>Sin usuarios internos</div>';return;}
    _pintarUsuarios();
  }catch(e){
    grid.innerHTML='<div class="usr-vacio">No se pudieron cargar los usuarios: '+escapeHTML(e.message)+'</div>';
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
