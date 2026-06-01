// === FORMATO NUMERICO ===
function formatMonto(n,moneda){if(n===null||n===undefined||n==='')return'\u2014';var num=parseFloat(n);if(isNaN(num))return n;var parts=num.toFixed(2).split('.');parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');var f=parts[1]==='00'?parts[0]:parts[0]+','+parts[1];if(moneda)return'$'+f+' '+moneda;return f}
// === FIN FORMATO ===

// === FILTRO MAQUINAS ===
function filterMaquinasByOperadora(){if(typeof filterMaquinasReservaByOperadora==='function')return filterMaquinasReservaByOperadora();var opSel=document.getElementById('resOperadoraId');var maqSel=document.getElementById('resMaquinaId');var opId=parseInt(opSel.value);var ops=JSON.parse(localStorage.getItem('dm_operadoras')||'[]');var hab=JSON.parse(localStorage.getItem('dm_habilitaciones')||'[]');var maqs=JSON.parse(localStorage.getItem('dm_maquinas')||'[]');while(maqSel.options.length>1)maqSel.remove(1);if(!opId){maqs.forEach(function(m){if(m.estado==='disponible'&&m.tipoOperativo!=='solo_venta'){var o=document.createElement('option');o.value=m.id;o.text=m.codigo+'\u2014'+m.nombre+' ['+m.categoria+']';maqSel.add(o)}});return}var op=ops.find(function(o){return o.id===opId});if(!op)return;var ciudad=(op.ciudad||'').toUpperCase();var depto=(op.departamento||'').toUpperCase();var habCats=hab.filter(function(h){return h.operadoraId===opId&&h.estado==='activa'}).map(function(h){return h.categoria});maqs.filter(function(m){if(m.estado!=='disponible'||m.tipoOperativo==='solo_venta')return false;if(habCats.length>0&&habCats.indexOf(m.categoria)===-1)return false;var ubi=(m.tipoOperativo==='base_ciudad'?(m.ciudadBase||m.ubicacion):m.ubicacion||'').toUpperCase();if(m.tipoOperativo==='base_ciudad')return ciudad&&ubi.indexOf(ciudad)!==-1;if(ubi==='SIN ASIGNAR'||ubi==='')return true;if(ciudad&&ubi.indexOf(ciudad)!==-1)return true;if(depto&&ubi.indexOf(depto)!==-1)return true;return false}).forEach(function(m){var o=document.createElement('option');o.value=m.id;o.text=m.codigo+' \u2014 '+m.nombre+' ['+m.categoria+']';maqSel.add(o)})}
// === FIN FILTRO MAQUINAS ===

// === FILTRO DEPTO ===
var _allResOps=[];
function initDeptoFilter(){var s=document.getElementById('resOperadoraId'),f=document.getElementById('resDeptoFilter');if(!s||!f)return;_allResOps=[];for(var i=1;i<s.options.length;i++)_allResOps.push({v:s.options[i].value,t:s.options[i].text});var d={};_allResOps.forEach(function(o){var m=o.t.match(/\(([^)]+)\)\s*$/);if(m)d[m[1]]=1});while(f.options.length>1)f.remove(1);Object.keys(d).sort().forEach(function(k){var o=document.createElement('option');o.value=k;o.text=k;f.add(o)})}
function filterOperadorasByDepto(){if(typeof filterOperadorasReservaByDepto==='function')return filterOperadorasReservaByDepto();var s=document.getElementById('resOperadoraId'),dept=document.getElementById('resDeptoFilter').value;while(s.options.length>1)s.remove(1);_allResOps.forEach(function(o){if(!dept||o.t.indexOf('('+dept+')')!==-1){var opt=document.createElement('option');opt.value=o.v;opt.text=o.t;s.add(opt)}})}
// === FIN FILTRO DEPTO ===

// === CONTRATO DE ALQUILER ===
var _contratos = JSON.parse(localStorage.getItem('dm_contratos') || '[]');
var _ctrNextId = _contratos.length ? Math.max(..._contratos.map(c=>c.id)) + 1 : 1;
var _ctrDocumentos = { frente: null, dorso: null };

function resetContratoForm() {
  ['ctrNombre','ctrCI','ctrDomicilio','ctrCiudad','ctrSerial','ctrFechaFin','ctrDuracion','ctrMonto','ctrGarantia','ctrObs'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var moneda = document.getElementById('ctrMoneda');
  if (moneda) moneda.value = 'UYU';
  var formaPago = document.getElementById('ctrFormaPago');
  if (formaPago) formaPago.value = 'Transferencia bancaria';
  var firmado = document.getElementById('ctrFirmado');
  if (firmado) firmado.value = 'pendiente';
  var fechaFirma = document.getElementById('ctrFechaFirma');
  if (fechaFirma) fechaFirma.value = '';
  ['ctrCedulaFrente','ctrCedulaDorso'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  _ctrDocumentos = { frente: null, dorso: null };
  updateContratoDocumentoInfo('frente');
  updateContratoDocumentoInfo('dorso');
}

function openContratoModal(opId) {
  var modal = document.getElementById('modalContrato');
  if (!modal) return;
  resetContratoForm();

  // Populate operadoras select
  var ops = JSON.parse(localStorage.getItem('dm_operadoras') || '[]');
  var sel = document.getElementById('ctrOperadora');
  sel.innerHTML = '<option value="">\u2014 Seleccionar \u2014</option>';
  ops.filter(function(o){ return o.estado === 'activa'; }).forEach(function(o){
    var opt = document.createElement('option');
    opt.value = o.id;
    opt.text = o.nombre + ' ' + (o.apellido || '') + ' \u2014 ' + (o.ciudad || '');
    sel.add(opt);
  });
  
  // Populate maquinas select
  var maqs = JSON.parse(localStorage.getItem('dm_maquinas') || '[]');
  var mSel = document.getElementById('ctrMaquina');
  mSel.innerHTML = '<option value="">\u2014 Seleccionar \u2014</option>';
  maqs.filter(function(m){ return m.estado === 'disponible' && m.tipoOperativo !== 'solo_venta'; }).forEach(function(m){
    var opt = document.createElement('option');
    opt.value = m.id;
    opt.text = m.codigo + ' \u2014 ' + m.nombre + ' [' + m.categoria + ']';
    opt.dataset.serial = m.serial || '';
    mSel.add(opt);
  });
  
  // Set dates
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('ctrFechaInicio').value = today;
  
  // Pre-select operadora if provided
  if (opId) {
    sel.value = opId;
    onCtrOperadoraChange();
  }
  
  // Maquina change handler
  mSel.onchange = function() {
    var opt = mSel.options[mSel.selectedIndex];
    document.getElementById('ctrSerial').value = opt.dataset.serial || '';
  };
  
  // Date change handlers
  document.getElementById('ctrFechaInicio').onchange = calcDuracion;
  document.getElementById('ctrFechaFin').onchange = calcDuracion;
  
  switchContratoTab('form');
  openModal('modalContrato');
}

function onCtrOperadoraChange() {
  var opId = parseInt(document.getElementById('ctrOperadora').value);
  if (!opId) return;
  var ops = JSON.parse(localStorage.getItem('dm_operadoras') || '[]');
  var op = ops.find(function(o){ return o.id === opId; });
  if (op) {
    document.getElementById('ctrNombre').value = (op.nombre || '') + ' ' + (op.apellido || '');
    document.getElementById('ctrCiudad').value = op.ciudad || '';
    document.getElementById('ctrDomicilio').value = op.direccionEntrega || op.direccion_entrega || '';
  }
}

function calcDuracion() {
  var inicio = document.getElementById('ctrFechaInicio').value;
  var fin = document.getElementById('ctrFechaFin').value;
  if (inicio && fin) {
    var d1 = new Date(inicio), d2 = new Date(fin);
    var diffDays = Math.round((d2 - d1) / (1000*60*60*24));
    var months = Math.round(diffDays / 30);
    document.getElementById('ctrDuracion').value = months > 0 ? months + ' mes' + (months > 1 ? 'es' : '') + ' (' + diffDays + ' dias)' : diffDays + ' dias';
  }
}

function updateContratoDocumentoInfo(lado) {
  var info = document.getElementById(lado === 'frente' ? 'ctrCedulaFrenteInfo' : 'ctrCedulaDorsoInfo');
  if (!info) return;
  var doc = _ctrDocumentos[lado];
  info.textContent = doc ? doc.name + ' listo para guardar' : 'Sin archivo cargado';
}

function setContratoDocumento(lado, file) {
  if (!file) return;
  _ctrDocumentos[lado] = {
    name: file.name,
    type: file.type || 'archivo',
    size: file.size || 0,
    cargadoEn: new Date().toISOString()
  };
  updateContratoDocumentoInfo(lado);
}

function switchContratoTab(tab) {
  var tabs = document.querySelectorAll('.contrato-tab');
  tabs[0].classList.toggle('active', tab === 'form');
  tabs[1].classList.toggle('active', tab === 'preview');
  document.getElementById('contratoTabForm').style.display = tab === 'form' ? 'block' : 'none';
  document.getElementById('contratoTabPreview').style.display = tab === 'preview' ? 'block' : 'none';
  if (tab === 'preview') renderContratoPreview();
}

function renderContratoPreview() {
  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  var nombre = document.getElementById('ctrNombre').value || '________________';
  var ci = document.getElementById('ctrCI').value || '________________';
  var domicilio = document.getElementById('ctrDomicilio').value || '________________';
  var ciudad = document.getElementById('ctrCiudad').value || '________________';
  var opId = parseInt(document.getElementById('ctrOperadora').value) || null;
  var op = opId ? (DB.get('operadoras')||[]).find(function(o){return o.id===opId}) : null;
  var telefono = (op && (op.whatsapp || op.telefono)) || '________________';
  var correo = (op && op.email) || '________________';
  var maqSel = document.getElementById('ctrMaquina');
  var maqText = maqSel.selectedIndex > 0 ? maqSel.options[maqSel.selectedIndex].text : '________________';
  var maqId = parseInt(maqSel.value) || null;
  var maq = maqId ? (DB.get('maquinas')||[]).find(function(m){return m.id===maqId}) : null;
  var equipo = maq ? (maq.nombre || maqText) : maqText;
  var referencia = maq ? [maq.codigo, maq.categoria].filter(Boolean).join(' / ') : '________________';
  var nombreFantasia = maq ? (maq.nombre || '________________') : '________________';
  var serial = document.getElementById('ctrSerial').value || 'S/N';
  var fechaInicio = document.getElementById('ctrFechaInicio').value || '____/____/____';
  var fechaFin = document.getElementById('ctrFechaFin').value || '____/____/____';
  var monto = document.getElementById('ctrMonto').value || '0';
  var moneda = document.getElementById('ctrMoneda').value || 'UYU';
  var formaPago = document.getElementById('ctrFormaPago').value || 'Transferencia bancaria';
  var garantia = document.getElementById('ctrGarantia').value || '0';
  var firmado = document.getElementById('ctrFirmado').value === 'firmado';
  var fechaFirma = document.getElementById('ctrFechaFirma').value || '';
  var obs = document.getElementById('ctrObs').value || '';
  
  // Format dates
  function fmtD(d) { if (!d) return d; var p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  var montoTotal = formatMonto(monto, moneda);
  var sena = parseFloat(garantia) > 0 ? formatMonto(garantia, moneda) : '____________________';
  var saldo = parseFloat(monto||0) && parseFloat(garantia||0) ? formatMonto(Math.max(0, parseFloat(monto)-parseFloat(garantia)), moneda) : '____________________';
  
  var h = '<div class="contrato-header-mini">DEPI M\u00d3VIL URUGUAY<br><span>ALQUILER DE EQUIPOS DE EST\u00c9TICA PROFESIONAL</span></div>';
  h += '<h1>CONTRATO DE ALQUILER DE EQUIPOS EST\u00c9TICOS PROFESIONALES</h1>';
  h += '<h2>Domicilio de la Empresa: Uruguay 1533, Salto, Uruguay</h2>';
  h += '<div class="clausula">En la ciudad de <strong>'+esc(ciudad)+'</strong>, Rep\u00fablica Oriental del Uruguay, comparecen por una parte <strong>DEPI M\u00d3VIL URUGUAY</strong>, empresa dedicada al alquiler, soporte, capacitaci\u00f3n y provisi\u00f3n de aparatolog\u00eda est\u00e9tica profesional, con domicilio comercial en calle <strong>Uruguay 1533, ciudad de Salto, Rep\u00fablica Oriental del Uruguay</strong>, en adelante <strong>LA ARRENDADORA</strong>, y por otra parte <strong>'+esc(nombre)+'</strong>, C.I./RUT <strong>'+esc(ci)+'</strong>, con domicilio en <strong>'+esc(domicilio)+'</strong>, ciudad <strong>'+esc(ciudad)+'</strong>, tel\u00e9fono <strong>'+esc(telefono)+'</strong>, correo <strong>'+esc(correo)+'</strong>, en adelante <strong>LA ARRENDATARIA</strong>, quienes acuerdan lo siguiente:</div>';
  
  h += '<div class="clausula"><div class="clausula-title">PRIMERA. OBJETO.</div>';
  h += 'LA ARRENDADORA da en alquiler a LA ARRENDATARIA el equipo: <strong>'+esc(equipo)+'</strong>, modelo/referencia <strong>'+esc(referencia)+'</strong>, N.\u00ba de serie <strong>'+esc(serial)+'</strong>, nombre fantas\u00eda <strong>'+esc(nombreFantasia)+'</strong>, con los accesorios que se detallan en el anexo de entrega. El equipo se destina exclusivamente a uso profesional est\u00e9tico.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">SEGUNDA. PLAZO.</div>';
  h += 'El alquiler regir\u00e1 desde el <strong>'+fmtD(fechaInicio)+'</strong> hasta el <strong>'+fmtD(fechaFin)+'</strong>. Toda pr\u00f3rroga deber\u00e1 acordarse expresamente entre las partes.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">TERCERA. PRECIO Y PAGO.</div>';
  h += 'El precio total del alquiler se fija en <strong>'+montoTotal+'</strong>. Forma de pago: <strong>'+esc(formaPago)+'</strong>. Se\u00f1a/anticipo <strong>'+sena+'</strong>, saldo <strong>'+saldo+'</strong>. La se\u00f1a confirma la reserva del equipo y de la fecha pactada.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">QUINTA. ENTREGA Y DEVOLUCI\u00d3N.</div>';
  h += 'El equipo ser\u00e1 entregado el <strong>'+fmtD(fechaInicio)+'</strong> y devuelto el <strong>'+fmtD(fechaFin)+'</strong>. LA ARRENDATARIA declara recibirlo en correcto estado de funcionamiento, limpio, completo y apto para su uso, oblig\u00e1ndose a devolverlo en iguales condiciones, salvo desgaste normal por uso adecuado.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">SEXTA. USO Y RESPONSABILIDAD.</div>';
  h += 'LA ARRENDATARIA se obliga a utilizar el equipo de forma correcta, profesional y responsable; no cederlo, prestarlo ni subalquilarlo a terceros; conservarlo en buen estado y operarlo bajo su exclusiva responsabilidad profesional y comercial frente a sus clientas/pacientes.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">S\u00c9PTIMA. FALLAS Y SERVICIO T\u00c9CNICO.</div>';
  h += 'Ante cualquier falla o inconveniente t\u00e9cnico, LA ARRENDATARIA deber\u00e1 comunicarlo de inmediato a LA ARRENDADORA. Queda prohibido abrir, reparar o intervenir el equipo por s\u00ed o por terceros no autorizados. Si el da\u00f1o derivara de golpes, humedad, conexi\u00f3n el\u00e9ctrica inadecuada, mal uso o negligencia, el costo de reparaci\u00f3n o reposici\u00f3n ser\u00e1 de cargo exclusivo de LA ARRENDATARIA.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">OCTAVA. TRASLADO Y LOG\u00cdSTICA.</div>';
  h += 'La entrega y devoluci\u00f3n se realizar\u00e1 seg\u00fan lo acordado por las partes. Los costos de env\u00edo, retiro, agencia o traslado ser\u00e1n a cargo de DEPIMOVIL.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">NOVENA. DA\u00d1OS, P\u00c9RDIDA O FALTANTES.</div>';
  h += 'LA ARRENDATARIA responder\u00e1 por cualquier rotura, p\u00e9rdida, hurto, extrav\u00edo o faltante del equipo y/o sus accesorios mientras permanezcan bajo su tenencia. En caso de da\u00f1o total o p\u00e9rdida, deber\u00e1 abonar el valor de reposici\u00f3n vigente al momento del hecho.</div>';

  h += '<div class="clausula"><div class="clausula-title">D\u00c9CIMA. RESCISI\u00d3N Y MORA.</div>';
  h += 'LA ARRENDADORA podr\u00e1 rescindir el presente contrato y exigir la devoluci\u00f3n inmediata del equipo en caso de falta de pago, uso indebido, cesi\u00f3n a terceros o incumplimiento de cualquiera de las obligaciones asumidas. La mora se producir\u00e1 autom\u00e1ticamente por el solo vencimiento de los plazos pactados, sin necesidad de intimaci\u00f3n previa.</div>';

  h += '<div class="clausula"><div class="clausula-title">D\u00c9CIMA PRIMERA. REITERACI\u00d3N DE ALQUILERES.</div>';
  h += 'Cada nueva solicitud, reserva, renovaci\u00f3n o reiteraci\u00f3n de alquiler realizada por LA ARRENDATARIA implica la aceptaci\u00f3n nuevamente del presente contrato y de sus condiciones vigentes, sin necesidad de una nueva firma escrita por cada operaci\u00f3n.</div>';

  h += '<div class="clausula"><div class="clausula-title">D\u00c9CIMA SEGUNDA. DOMICILIO Y JURISDICCI\u00d3N.</div>';
  h += 'Las partes constituyen como domicilios especiales los denunciados en este contrato y acuerdan someter cualquier diferencia a la jurisdicci\u00f3n de los tribunales competentes de la Rep\u00fablica Oriental del Uruguay.</div>';
  
  if (obs) {
    h += '<div class="clausula"><div class="clausula-title">OBSERVACIONES</div>'+esc(obs).replace(/\n/g,'<br>')+'</div>';
  }
  
  h += '<div class="clausula">En prueba de conformidad, se firman dos ejemplares del mismo tenor.</div>';
  if (firmado) {
    h += '<div class="clausula"><div class="clausula-title">CONSTANCIA DE FIRMA</div>';
    h += 'Contrato marcado como firmado por la operadora'+(fechaFirma ? ' el <strong>'+fmtD(fechaFirma)+'</strong>' : '')+'.</div>';
  }
  
  h += '<div class="firmas firmas-tabla">';
  h += '<div class="firma-box"><strong>LA ARRENDADORA</strong><div class="firma-line">Firma y aclaraci\u00f3n</div></div>';
  h += '<div class="firma-box"><strong>LA ARRENDATARIA</strong><div class="firma-line">Firma y aclaraci\u00f3n<br>C.I./RUT: '+esc(ci)+'</div></div>';
  h += '</div>';
  
  h += '<h2 class="anexo-title">ANEXO DE ENTREGA</h2>';
  h += '<div class="clausula anexo-line"><strong>Equipo:</strong> '+esc(equipo)+'</div>';
  h += '<div class="clausula anexo-line"><strong>Accesorios entregados:</strong> ____________________________________________</div>';
  h += '<div class="clausula anexo-line"><strong>Estado general al momento de la entrega:</strong> ____________________________________________</div>';
  h += '<div class="clausula anexo-line"><strong>Observaciones:</strong> ____________________________________________</div>';
  h += '<div class="firmas">';
  h += '<div class="firma-box"><div class="firma-line">Firma ARRENDADORA<br>DEPI M\u00d3VIL URUGUAY<br>Uruguay 1533, Salto, Uruguay</div></div>';
  h += '<div class="firma-box"><div class="firma-line">Firma ARRENDATARIA<br>'+esc(nombre)+'</div></div>';
  h += '</div>';
  h += '<div class="contrato-footer-mini">DepiM\u00f3vil Uruguay | Contrato base de alquiler de equipo est\u00e9tico</div>';
  
  document.getElementById('contratoPreviewPrint').innerHTML = h;
}

function printContrato() {
  switchContratoTab('preview');
  setTimeout(function(){ window.print(); }, 300);
}

async function saveContrato() {
  renderContratoPreview();
  var contrato = {
    id: _ctrNextId++,
    operadoraId: parseInt(document.getElementById('ctrOperadora').value) || null,
    nombre: document.getElementById('ctrNombre').value,
    ci: document.getElementById('ctrCI').value,
    domicilio: document.getElementById('ctrDomicilio').value,
    ciudad: document.getElementById('ctrCiudad').value,
    maquinaId: parseInt(document.getElementById('ctrMaquina').value) || null,
    maquina: document.getElementById('ctrMaquina').selectedIndex > 0 ? document.getElementById('ctrMaquina').options[document.getElementById('ctrMaquina').selectedIndex].text : '',
    serial: document.getElementById('ctrSerial').value,
    fechaInicio: document.getElementById('ctrFechaInicio').value,
    fechaFin: document.getElementById('ctrFechaFin').value,
    monto: parseFloat(document.getElementById('ctrMonto').value) || 0,
    moneda: document.getElementById('ctrMoneda').value,
    formaPago: document.getElementById('ctrFormaPago').value,
    garantia: parseFloat(document.getElementById('ctrGarantia').value) || 0,
    firmado: document.getElementById('ctrFirmado').value === 'firmado',
    fechaFirma: document.getElementById('ctrFechaFirma').value,
    cedulaFrente: _ctrDocumentos.frente,
    cedulaDorso: _ctrDocumentos.dorso,
    obs: document.getElementById('ctrObs').value,
    creadoEn: new Date().toISOString(),
    estado: 'activo'
  };
  try {
    var payload = {
      operadora_id: contrato.operadoraId,
      maquina_id: contrato.maquinaId,
      nombre: contrato.nombre,
      ci: contrato.ci,
      domicilio: contrato.domicilio,
      ciudad: contrato.ciudad,
      maquina: contrato.maquina,
      serial: contrato.serial,
      fecha_inicio: contrato.fechaInicio,
      fecha_fin: contrato.fechaFin,
      monto: contrato.monto,
      moneda: contrato.moneda,
      forma_pago: contrato.formaPago,
      garantia: contrato.garantia,
      firmado: contrato.firmado,
      fecha_firma: contrato.fechaFirma,
      cedula_frente_meta: contrato.cedulaFrente,
      cedula_dorso_meta: contrato.cedulaDorso,
      obs: contrato.obs,
      contenido: document.getElementById('contratoPreviewPrint').innerText || ''
    };
    var creado = await api('/api/contratos', {method:'POST', body:JSON.stringify(payload)});
    contrato = typeof mapContrato === 'function' ? mapContrato(creado) : contrato;
  } catch(e) {
    if (typeof showToast === 'function') showToast('⚠️ No se pudo guardar en servidor. Guardado local temporal.');
  }
  _contratos.push(contrato);
  localStorage.setItem('dm_contratos', JSON.stringify(_contratos));
  closeModal('modalContrato');
  if (typeof renderContratos === 'function') renderContratos();
  if (typeof updateContratosBadge === 'function') updateContratosBadge();
  if (typeof showToast === 'function') showToast('Contrato guardado correctamente');
}
// === FIN CONTRATO ===
