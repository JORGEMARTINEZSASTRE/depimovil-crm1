/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function ir(label,value){return `<div class="info-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;}
function escapeHTML(value){
  return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(value){return escapeHTML(value);}
function safeUrl(value){
  const str=String(value||'').trim();
  if(!str)return '';
  if(/^https?:\/\//i.test(str)||str.startsWith('/'))return str.replace(/"/g,'%22');
  return '';
}
function normalizeDateInput(d){
  if(!d||d==='—')return '';
  const str=String(d).trim();
  const isoDate=str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(isoDate)return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const isoUyMixed=str.match(/^(\d{1,2})T[\d:.]+Z\/(\d{1,2})\/(\d{4})$/);
  if(isoUyMixed)return `${isoUyMixed[3]}-${isoUyMixed[2].padStart(2,'0')}-${isoUyMixed[1].padStart(2,'0')}`;
  const localDate=str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(localDate)return `${localDate[3]}-${localDate[2].padStart(2,'0')}-${localDate[1].padStart(2,'0')}`;
  const parsed=new Date(str);
  if(!Number.isNaN(parsed.getTime()))return parsed.toISOString().slice(0,10);
  return str;
}
function fmtDate(d){
  const normalized=normalizeDateInput(d);
  if(!normalized)return '—';
  const parts=normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!parts)return String(d);
  return `${parts[3]}/${parts[2]}/${parts[1]}`;
}
function today(){return new Date().toISOString().split('T')[0];}
function daysDiff(from,to){return Math.ceil((new Date(to)-new Date(from))/(1000*60*60*24));}
const ROLE_LABELS={
  superadmin:'Administrador',
  administrador:'Administrador',
  operaciones:'Administración / Ops',
  comercial:'Comercial / CRM',
  operadora:'Operadora',
  operadora_habilitada:'Operadora habilitada',
  operadora_limitada:'Operadora en capacitación',
  transportista:'Transportista',
};
const VIEW_PERMISSIONS={
  superadmin:['*'],
  administrador:['*'],
  operaciones:['dashboard','operadoras','operadora-ficha','revision-operadoras','documentos','maquinas','maquina-ficha','mantenimientos','reservas','reserva-ficha','calendario','logistica','contratos','whatsapp','envios','envio-ficha','transportistas','materiales'],
  comercial:['dashboard','whatsapp','leads','lead-ficha','embudo'],
  operadora_habilitada:['dashboard','operadoras','operadora-ficha','reservas','reserva-ficha','calendario','maquinas','maquina-ficha','pagos','pago-ficha','envios','envio-ficha','materiales'],
  operadora:['dashboard','operadoras','operadora-ficha','reservas','reserva-ficha','calendario','maquinas','maquina-ficha','pagos','pago-ficha','envios','envio-ficha','materiales'],
  operadora_limitada:['dashboard','materiales'],
  transportista:['dashboard','maquinas','maquina-ficha','envios','envio-ficha','transportistas'],
};
function isAdminRole(rol){return ['superadmin','administrador'].includes(rol);}
function isOpsRole(rol){return isAdminRole(rol)||rol==='operaciones';}
function isOperadoraRole(rol){return ['operadora','operadora_habilitada','operadora_limitada'].includes(rol);}
function isOperadoraUser(user=currentUser){return !!(user&&(isOperadoraRole(user.rol)||user.operadora_id));}
function isTransportistaUser(user=currentUser){return !!(user&&(user.rol==='transportista'||user.transportista_id));}
function normalizarLocalidad(v){
  return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function localidadesOperadora(op){
  if(!op)return[];
  const vals=[op.ciudad,op.localidad];
  const direcciones=Array.isArray(op.direccionesEntrega)?op.direccionesEntrega:[];
  direcciones.forEach(d=>{
    vals.push(d.localidad,d.ciudad,d.departamento);
    const partes=String(d.direccion||'').split('|').map(x=>x.trim());
    if(partes.length>1)vals.push(partes[1]);
  });
  return Array.from(new Set(vals.map(normalizarLocalidad).filter(Boolean)));
}
function localidadMaquina(m){
  if(!m)return'';
  return normalizarLocalidad(m.tipoOperativo==='base_ciudad' ? (m.ciudadBase||m.ubicacion) : (m.ciudad||m.ubicacion||m.ciudadBase));
}
function maquinaVisibleParaOperadora(m,op){
  if(!isOperadoraUser())return true;
  if(!m||m.tipoOperativo==='solo_venta')return false;
  const permitidas=localidadesOperadora(op);
  const maqLoc=localidadMaquina(m);
  return !!(permitidas.length&&maqLoc&&permitidas.includes(maqLoc));
}
function currentOperadoraHabs(){
  if(!currentUser||!currentUser.operadora_id)return[];
  return (DB.get('habilitaciones')||[]).filter(h=>
    parseInt(h.operadoraId)===parseInt(currentUser.operadora_id)&&h.estado==='activa'
  );
}
function getAccessRole(user=currentUser){
  if(!user)return'';
  if(isOperadoraUser(user)){
    return currentOperadoraHabs().length?'operadora_habilitada':'operadora_limitada';
  }
  if(isTransportistaUser(user))return'transportista';
  return user.rol;
}
function getRoleLabel(user=currentUser){
  if(isOperadoraUser(user))return 'Operadora';
  if(isTransportistaUser(user))return 'Transportista';
  return ROLE_LABELS[getAccessRole(user)]||ROLE_LABELS[user?.rol]||user?.rol||'';
}
function canView(view){
  const role=getAccessRole();
  const allowed=VIEW_PERMISSIONS[role]||[];
  return allowed.includes('*')||allowed.includes(view);
}
function applyRoleUI(){
  const role=getAccessRole();
  document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
    btn.style.display=canView(btn.dataset.view)?'':'none';
  });
  document.querySelectorAll('.nav-group').forEach(group=>{
    const visible=Array.from(group.querySelectorAll('.nav-item[data-view]')).some(btn=>btn.style.display!=='none');
    group.style.display=visible?'':'none';
  });
  ['btnAddOp','btnAddMaq','btnAddMant','btnAddRes','btnAddPago','btnAddEnvio','btnAddLead'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    if(id==='btnAddRes'&&isOperadoraUser()){
      el.style.display='';
      return;
    }
    el.style.display=canEdit()?'':'none';
  });
  const roleEl=document.getElementById('userRole');
  const topEl=document.getElementById('topbarRole');
  if(roleEl)roleEl.textContent=getRoleLabel();
  if(topEl)topEl.textContent=getRoleLabel();
  document.body.dataset.accessRole=role;
}
function canEdit(){return currentUser&&isOpsRole(currentUser.rol);}
function canEditLead(){return currentUser&&(isOpsRole(currentUser.rol)||currentUser.rol==='comercial');}
function isSuperAdmin(){return currentUser&&isAdminRole(currentUser.rol);}
function gv(id){const el=document.getElementById(id);return el?el.value:'';}
function sv(id,val){const el=document.getElementById(id);if(el)el.value=val;}
function badgeTxt(e){const l={disponible:'Disponible',reservada:'Reservada',mantenimiento:'Mantenimiento',fuera_servicio:'Fuera Servicio',en_viaje:'En Viaje de China'};return l[e]||e;}
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-overlay').forEach(mo=>{
  mo.addEventListener('click',e=>{if(e.target===mo)mo.classList.remove('open');});
});
let toastTimer=null;
function showToast(msg,type){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg.replace(/^\S+\s/,'');
  document.getElementById('toastIcon').textContent=msg.match(/^\S+/)?.[0]||'✓';
  t.classList.add('show');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),3200);
}
