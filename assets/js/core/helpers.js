/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function ir(label,value){return `<div class="info-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;}
function normalizeDateInput(d){
  if(!d||d==='—')return '';
  const str=String(d).trim();
  const isoDate=str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(isoDate)return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const localDate=str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(localDate)return `${localDate[3]}-${localDate[2].padStart(2,'0')}-${localDate[1].padStart(2,'0')}`;
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
function canEdit(){return currentUser&&(currentUser.rol==='superadmin'||currentUser.rol==='operaciones');}
function canEditLead(){return currentUser&&(currentUser.rol==='superadmin'||currentUser.rol==='operaciones'||currentUser.rol==='comercial');}
function isSuperAdmin(){return currentUser&&currentUser.rol==='superadmin';}
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
