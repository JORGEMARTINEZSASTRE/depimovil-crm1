// === FORMATO NUMERICO ===
function formatMonto(n,moneda){if(n===null||n===undefined||n==='')return'\u2014';var num=parseFloat(n);if(isNaN(num))return n;var parts=num.toFixed(2).split('.');parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.');var f=parts[1]==='00'?parts[0]:parts[0]+','+parts[1];if(moneda)return'$'+f+' '+moneda;return f}
// === FIN FORMATO ===

// === FILTRO MAQUINAS ===
function filterMaquinasByOperadora(){var opSel=document.getElementById('resOperadoraId');var maqSel=document.getElementById('resMaquinaId');var opId=parseInt(opSel.value);var ops=JSON.parse(localStorage.getItem('dm_operadoras')||'[]');var hab=JSON.parse(localStorage.getItem('dm_habilitaciones')||'[]');var maqs=JSON.parse(localStorage.getItem('dm_maquinas')||'[]');while(maqSel.options.length>1)maqSel.remove(1);if(!opId){maqs.forEach(function(m){if(m.estado==='disponible'){var o=document.createElement('option');o.value=m.id;o.text=m.codigo+'\u2014'+m.nombre+' ['+m.categoria+']';maqSel.add(o)}});return}var op=ops.find(function(o){return o.id===opId});if(!op)return;var ciudad=(op.ciudad||'').toUpperCase();var depto=(op.departamento||'').toUpperCase();var habCats=hab.filter(function(h){return h.operadoraId===opId&&h.estado==='activa'}).map(function(h){return h.categoria});maqs.filter(function(m){if(m.estado!=='disponible')return false;if(habCats.length>0&&habCats.indexOf(m.categoria)===-1)return false;var ubi=(m.ubicacion||'').toUpperCase();if(ubi==='SIN ASIGNAR'||ubi==='')return true;if(ciudad&&ubi.indexOf(ciudad)!==-1)return true;if(depto&&ubi.indexOf(depto)!==-1)return true;return false}).forEach(function(m){var o=document.createElement('option');o.value=m.id;o.text=m.codigo+' \u2014 '+m.nombre+' ['+m.categoria+']';maqSel.add(o)})}
// === FIN FILTRO MAQUINAS ===

// === FILTRO DEPTO ===
var _allResOps=[];
function initDeptoFilter(){var s=document.getElementById('resOperadoraId'),f=document.getElementById('resDeptoFilter');if(!s||!f)return;_allResOps=[];for(var i=1;i<s.options.length;i++)_allResOps.push({v:s.options[i].value,t:s.options[i].text});var d={};_allResOps.forEach(function(o){var m=o.t.match(/\(([^)]+)\)\s*$/);if(m)d[m[1]]=1});while(f.options.length>1)f.remove(1);Object.keys(d).sort().forEach(function(k){var o=document.createElement('option');o.value=k;o.text=k;f.add(o)})}
function filterOperadorasByDepto(){var s=document.getElementById('resOperadoraId'),dept=document.getElementById('resDeptoFilter').value;while(s.options.length>1)s.remove(1);_allResOps.forEach(function(o){if(!dept||o.t.indexOf('('+dept+')')!==-1){var opt=document.createElement('option');opt.value=o.v;opt.text=o.t;s.add(opt)}})}
// === FIN FILTRO DEPTO ===

// === CONTRATO DE ALQUILER ===
var _contratos = JSON.parse(localStorage.getItem('dm_contratos') || '[]');
var _ctrNextId = _contratos.length ? Math.max(..._contratos.map(c=>c.id)) + 1 : 1;

function openContratoModal(opId) {
  var modal = document.getElementById('modalContrato');
  if (!modal) return;
  
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
  maqs.filter(function(m){ return m.estado === 'disponible'; }).forEach(function(m){
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
  modal.style.cssText='display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center';
}

function onCtrOperadoraChange() {
  var opId = parseInt(document.getElementById('ctrOperadora').value);
  if (!opId) return;
  var ops = JSON.parse(localStorage.getItem('dm_operadoras') || '[]');
  var op = ops.find(function(o){ return o.id === opId; });
  if (op) {
    document.getElementById('ctrNombre').value = (op.nombre || '') + ' ' + (op.apellido || '');
    document.getElementById('ctrCiudad').value = op.ciudad || '';
    document.getElementById('ctrDomicilio').value = op.direccion_entrega || '';
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

function switchContratoTab(tab) {
  var tabs = document.querySelectorAll('.contrato-tab');
  tabs[0].classList.toggle('active', tab === 'form');
  tabs[1].classList.toggle('active', tab === 'preview');
  document.getElementById('contratoTabForm').style.display = tab === 'form' ? 'block' : 'none';
  document.getElementById('contratoTabPreview').style.display = tab === 'preview' ? 'block' : 'none';
  if (tab === 'preview') renderContratoPreview();
}

function renderContratoPreview() {
  var nombre = document.getElementById('ctrNombre').value || '________________';
  var ci = document.getElementById('ctrCI').value || '________________';
  var domicilio = document.getElementById('ctrDomicilio').value || '________________';
  var ciudad = document.getElementById('ctrCiudad').value || '________________';
  var maqSel = document.getElementById('ctrMaquina');
  var maqText = maqSel.selectedIndex > 0 ? maqSel.options[maqSel.selectedIndex].text : '________________';
  var serial = document.getElementById('ctrSerial').value || 'S/N';
  var fechaInicio = document.getElementById('ctrFechaInicio').value || '____/____/____';
  var fechaFin = document.getElementById('ctrFechaFin').value || '____/____/____';
  var monto = document.getElementById('ctrMonto').value || '0';
  var moneda = document.getElementById('ctrMoneda').value || 'UYU';
  var formaPago = document.getElementById('ctrFormaPago').value || 'Transferencia bancaria';
  var garantia = document.getElementById('ctrGarantia').value || '0';
  var obs = document.getElementById('ctrObs').value || '';
  
  // Format dates
  function fmtD(d) { if (!d) return d; var p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  
  var h = '<h1>CONTRATO DE ALQUILER DE EQUIPAMIENTO</h1>';
  h += '<h2>DepiM\u00f3vil \u2014 Alquiler de Equipos de Est\u00e9tica</h2>';
  h += '<div class="clausula"><div class="clausula-title">PRIMERA: PARTES</div>';
  h += 'Entre <strong>DepiM\u00f3vil</strong>, en adelante "EL ARRENDADOR", con domicilio en la ciudad de Salto, Rep\u00fablica Oriental del Uruguay; ';
  h += 'y <strong>'+nombre+'</strong>, CI/RUT: <strong>'+ci+'</strong>, con domicilio en <strong>'+domicilio+', '+ciudad+'</strong>, en adelante "EL ARRENDATARIO", se celebra el presente contrato de alquiler.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">SEGUNDA: OBJETO</div>';
  h += 'El ARRENDADOR entrega en alquiler al ARRENDATARIO el siguiente equipamiento: <strong>'+maqText+'</strong>, N\u00b0 de Serie: <strong>'+serial+'</strong>.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">TERCERA: PLAZO</div>';
  h += 'El presente contrato tendr\u00e1 vigencia desde el <strong>'+fmtD(fechaInicio)+'</strong> hasta el <strong>'+fmtD(fechaFin)+'</strong>.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">CUARTA: PRECIO</div>';
  h += 'El ARRENDATARIO abonar\u00e1 la suma de <strong>$'+formatMonto(monto)+' '+moneda+'</strong> mensuales, pagaderos mediante <strong>'+formaPago+'</strong>.</div>';
  
  if (parseInt(garantia) > 0) {
    h += '<div class="clausula"><div class="clausula-title">QUINTA: GARANT\u00cdA</div>';
    h += 'El ARRENDATARIO entrega en concepto de garant\u00eda/se\u00f1a la suma de <strong>$'+formatMonto(garantia)+' '+moneda+'</strong>, reembolsable al finalizar el contrato y devoluci\u00f3n del equipo en buen estado.</div>';
  }
  
  h += '<div class="clausula"><div class="clausula-title">'+(parseInt(garantia)>0?'SEXTA':'QUINTA')+': OBLIGACIONES DEL ARRENDATARIO</div>';
  h += 'a) Utilizar el equipo exclusivamente para los fines previstos.<br>';
  h += 'b) Mantener el equipo en buen estado de conservaci\u00f3n.<br>';
  h += 'c) No ceder ni subarrendar el equipo a terceros.<br>';
  h += 'd) Comunicar inmediatamente cualquier desperfecto.<br>';
  h += 'e) Devolver el equipo en las condiciones recibidas al t\u00e9rmino del contrato.</div>';
  
  h += '<div class="clausula"><div class="clausula-title">'+(parseInt(garantia)>0?'S\u00c9PTIMA':'SEXTA')+': OBLIGACIONES DEL ARRENDADOR</div>';
  h += 'a) Entregar el equipo en perfecto estado de funcionamiento.<br>';
  h += 'b) Brindar capacitaci\u00f3n t\u00e9cnica para el uso del equipo.<br>';
  h += 'c) Proveer soporte t\u00e9cnico remoto durante la vigencia del contrato.<br>';
  h += 'd) Realizar mantenimiento preventivo seg\u00fan cronograma acordado.</div>';
  
  if (obs) {
    h += '<div class="clausula"><div class="clausula-title">CL\u00c1USULAS ADICIONALES</div>'+obs.replace(/\n/g,'<br>')+'</div>';
  }
  
  h += '<div class="clausula">Ambas partes firman de conformidad en la ciudad de '+ciudad+', a los ______ d\u00edas del mes de ______________ de 20____.</div>';
  
  h += '<div class="firmas">';
  h += '<div class="firma-box"><div class="firma-line">EL ARRENDADOR<br>DepiM\u00f3vil</div></div>';
  h += '<div class="firma-box"><div class="firma-line">EL ARRENDATARIO<br>'+nombre+'</div></div>';
  h += '</div>';
  
  document.getElementById('contratoPreviewPrint').innerHTML = h;
}

function printContrato() {
  switchContratoTab('preview');
  setTimeout(function(){ window.print(); }, 300);
}

function saveContrato() {
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
    obs: document.getElementById('ctrObs').value,
    creadoEn: new Date().toISOString(),
    estado: 'activo'
  };
  _contratos.push(contrato);
  localStorage.setItem('dm_contratos', JSON.stringify(_contratos));
  closeModal('modalContrato');
  if (typeof showToast === 'function') showToast('Contrato guardado correctamente');
}
// === FIN CONTRATO ===
