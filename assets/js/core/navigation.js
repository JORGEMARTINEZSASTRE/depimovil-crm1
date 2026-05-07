/* ══════════════════════════════════
   NAVIGATION
══════════════════════════════════ */
const viewTitles={'transportistas':'Transportistas',
  dashboard:'Dashboard',operadoras:'Operadoras','operadora-ficha':'Ficha de Operadora',
  'revision-operadoras':'Revisión de Operadoras',
  documentos:'Documentos de Operadoras',
  maquinas:'Máquinas','maquina-ficha':'Ficha de Máquina',
  reservas:'Reservas','reserva-ficha':'Ficha de Reserva',
  calendario:'Calendario de Reservas',
  logistica:'Reglas Logísticas',
  pagos:'Pagos y Señas','pago-ficha':'Detalle de Pago',
  caja:'Caja',
  proveedores:'Proveedores',
  compras:'Compras',
  contratos:'Contratos de Alquiler',
  whatsapp:'Centro de Notificaciones WhatsApp',
  envios:'Envíos de Máquinas','envio-ficha':'Ficha de Envío',
  configuracion:'Configuración del Sistema',
  reportes:'Reportes Operativos',
  auditoria:'Log de Auditoría',
  leads:'Leads / Prospectos CRM','lead-ficha':'Ficha de Lead',
  embudo:'Embudo Comercial',
  materiales:'Materiales de Formación',
};
function navigate(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el=document.getElementById('view-'+view);
  if(el)el.classList.add('active');
  const nav=document.querySelector('[data-view="'+view+'"]');
  if(nav)nav.classList.add('active');
  document.getElementById('pageTitle').textContent=viewTitles[view]||view;
  closeSidebar();
  if(view==='dashboard')renderDashboard();
  if(view==='operadoras')renderOperadoras();
  if(view==='revision-operadoras')renderRevisionOperadoras();
  if(view==='documentos')renderDocumentos();
  if(view==='maquinas')renderMaquinas();
  if(view==='reservas')renderReservas();
  if(view==='calendario')renderCalendario();
  if(view==='logistica')renderLogistica();
  if(view==='pagos')renderPagos();
  if(view==='caja')renderCaja();
  if(view==='proveedores')renderProveedores();
  if(view==='compras')renderCompras();
  if(view==='contratos')renderContratos();
  if(view==='transportistas')initTransportistas();
  if(view==='whatsapp'){renderWA('pendientes');updateWABadge();}
  if(view==='envios')renderEnvios();
  if(view==='configuracion')renderConfiguracion();
  if(view==='reportes')renderReportes();
  if(view==='auditoria')renderAuditoria();
  if(view==='leads')renderLeads();
  if(view==='embudo')renderEmbudo();
  if(view==='materiales')renderMateriales();
}
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}
