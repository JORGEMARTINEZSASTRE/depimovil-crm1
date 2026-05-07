/* ══════════════════════════════════
   DB
══════════════════════════════════ */
const DB={
  get(k){try{return JSON.parse(localStorage.getItem('dm_'+k)||'null')}catch(e){return null}},
  set(k,v){localStorage.setItem('dm_'+k,JSON.stringify(v))},
  del(k){localStorage.removeItem('dm_'+k)}
};

const CRM_THEMES={
  depimovil:{nombre:'DepiMóvil clásico',bg:'#0f1117',surface:'#181c27',surface2:'#1e2335',border:'#262d42',accent:'#d4a96a',accent2:'#e8c48a',rose:'#c76b8a',text:'#e8ecf4',text2:'#8892aa',text3:'#555e75'},
  blanco_rosa:{nombre:'Blanco rosa estética',bg:'#f7f8fb',surface:'#ffffff',surface2:'#fff1f6',border:'#ecd7e1',accent:'#d85c8a',accent2:'#f7a8c6',rose:'#9b6fd3',text:'#2c2530',text2:'#756877',text3:'#9f8f9e'},
  lavanda:{nombre:'Lavanda profesional',bg:'#f7f5ff',surface:'#ffffff',surface2:'#f0ecff',border:'#ddd5f7',accent:'#7c5fd6',accent2:'#b9a7ff',rose:'#e0719b',text:'#29243a',text2:'#6d6580',text3:'#9a90ad'},
  perla_menta:{nombre:'Perla menta spa',bg:'#f5fbf9',surface:'#ffffff',surface2:'#eaf7f2',border:'#d5ebe3',accent:'#25a982',accent2:'#83d8bd',rose:'#e06f92',text:'#1f302c',text2:'#607a72',text3:'#90a8a0'},
  coral_claro:{nombre:'Coral luminoso',bg:'#fff8f7',surface:'#ffffff',surface2:'#fff0ed',border:'#f0d4cf',accent:'#e7685d',accent2:'#ffaaa0',rose:'#c45f9d',text:'#352423',text2:'#806967',text3:'#aa918e'},
  lila_blanco:{nombre:'Lila blanco boutique',bg:'#fbfaff',surface:'#ffffff',surface2:'#f4efff',border:'#e3d9f6',accent:'#a25ad6',accent2:'#d6a8ff',rose:'#ef7aa4',text:'#2f2638',text2:'#74697f',text3:'#a79aad'},
  rosa_grafito:{nombre:'Rosa grafito moderno',bg:'#111216',surface:'#1b1c22',surface2:'#262730',border:'#3b3d48',accent:'#f184ad',accent2:'#ffc1d5',rose:'#b88cff',text:'#f8edf2',text2:'#b4a7af',text3:'#756b74'},
  esmeralda:{nombre:'Esmeralda profesional',bg:'#071512',surface:'#10201d',surface2:'#172b27',border:'#24433c',accent:'#42d19b',accent2:'#8be7c2',rose:'#df7197',text:'#edf7f3',text2:'#8aa69d',text3:'#557169'},
  oceano:{nombre:'Océano limpio',bg:'#08131f',surface:'#101d2d',surface2:'#17283c',border:'#253b55',accent:'#55b7f7',accent2:'#9ed7ff',rose:'#d975a5',text:'#edf5ff',text2:'#91a5bb',text3:'#586b80'},
  grafito:{nombre:'Grafito sobrio',bg:'#101113',surface:'#1a1c20',surface2:'#24272d',border:'#343842',accent:'#c7d0dc',accent2:'#f0f3f6',rose:'#d87989',text:'#f1f3f5',text2:'#9aa2ad',text3:'#626a75'},
  vino:{nombre:'Vino elegante',bg:'#171014',surface:'#23171e',surface2:'#311f29',border:'#49303b',accent:'#f0b36c',accent2:'#ffd29b',rose:'#e06f92',text:'#fff2f5',text2:'#b99aa5',text3:'#765c66'}
};

function hexToRgbParts(hex){
  const clean=String(hex||'').replace('#','').trim();
  if(clean.length!==6)return '212,169,106';
  const n=parseInt(clean,16);
  return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
}

function getTemaCRM(){
  const saved=DB.get('crm_theme')||{};
  const base=CRM_THEMES[saved.id]||CRM_THEMES.depimovil;
  return {...base,...saved};
}

function aplicarTemaCRM(theme){
  const t=theme||getTemaCRM();
  const root=document.documentElement;
  ['bg','surface','surface2','border','accent','accent2','rose','text','text2','text3'].forEach(k=>{
    if(t[k])root.style.setProperty('--'+k,t[k]);
  });
  root.style.setProperty('--bg2',t.surface2||t.bg);
  root.style.setProperty('--text-muted',t.text2||'#8892aa');
  root.style.setProperty('--border-strong',t.border||'#3a4158');
  root.style.setProperty('--accent-rgb',hexToRgbParts(t.accent));
  root.style.setProperty('--accent2-rgb',hexToRgbParts(t.accent2));
  root.style.setProperty('--rose-rgb',hexToRgbParts(t.rose));
  root.style.setProperty('--accent-dim',`rgba(${hexToRgbParts(t.accent)},0.12)`);
}

aplicarTemaCRM();

/* ══════════════════════════════════
   API (JWT + fetch helper)
══════════════════════════════════ */
const TOKEN={
  get(){return localStorage.getItem('dm_jwt')||null},
  set(v){localStorage.setItem('dm_jwt',v)},
  del(){localStorage.removeItem('dm_jwt')}
};
async function api(path,opts={}){
  const token=TOKEN.get();
  const headers={'Content-Type':'application/json',...(opts.headers||{})};
  if(token) headers['Authorization']='Bearer '+token;
  const res=await fetch(path,{...opts,headers});
  if(res.status===401){doLogout();throw new Error('Sesión expirada');}
  if(!res.ok){
    const err=await res.json().catch(()=>({error:'Error '+res.status}));
    throw new Error(err.error||'Error en la solicitud');
  }
  return res.status===204?null:res.json();
}
// Mapeo de campo snake_case (API) → camelCase (CRM local cache)
function mapReserva(r){
  return{id:r.id,codigo:r.codigo,operadoraId:r.operadora_id,maquinaId:r.maquina_id,
    tipo:r.tipo,estado:r.estado,fechaJornada:r.fecha_jornada||'',
    fechaInicio:r.fecha_inicio,fechaFin:r.fecha_fin,
    deptLogistica:r.dept_logistica||'',bloqueLogistico:r.bloque_logistico||false,
    monto:parseFloat(r.monto)||0,moneda:r.moneda||'UYU',
    notas:r.notas||'',creadaEn:r.created_at?r.created_at.split('T')[0]:''};
}
function mapContrato(c){
  return {
    id:c.id,
    reservaId:c.reserva_id||null,
    operadoraId:c.operadora_id||null,
    nombre:c.nombre||c.operadora_nombre||'',
    ci:c.ci||'',
    domicilio:c.domicilio||'',
    ciudad:c.ciudad||'',
    maquinaId:c.maquina_id||null,
    maquina:c.maquina||'',
    serial:c.serial||'',
    fechaInicio:c.fecha_inicio?c.fecha_inicio.split('T')[0]:'',
    fechaFin:c.fecha_fin?c.fecha_fin.split('T')[0]:'',
    monto:parseFloat(c.monto)||0,
    moneda:c.moneda||'UYU',
    formaPago:c.forma_pago||'Transferencia bancaria',
    garantia:parseFloat(c.garantia)||0,
    firmado:c.estado==='firmado'||!!c.firmado_en,
    fechaFirma:c.firmado_en?c.firmado_en.split('T')[0]:'',
    cedulaFrente:c.cedula_frente_meta||null,
    cedulaDorso:c.cedula_dorso_meta||null,
    obs:c.obs||'',
    creadoEn:c.created_at||'',
    estado:c.estado==='pendiente'?'activo':(c.estado||'activo'),
    token:c.token||''
  };
}
async function syncContratosLocales(contratosApi){
  const locales = DB.get('contratos') || [];
  if ((contratosApi || []).length || !locales.length) return contratosApi;
  const subidos = [];
  for (const c of locales) {
    try {
      const creado = await api('/api/contratos', {method:'POST', body:JSON.stringify({
        operadora_id:c.operadoraId, maquina_id:c.maquinaId, nombre:c.nombre, ci:c.ci,
        domicilio:c.domicilio, ciudad:c.ciudad, maquina:c.maquina, serial:c.serial,
        fecha_inicio:c.fechaInicio, fecha_fin:c.fechaFin, monto:c.monto, moneda:c.moneda,
        forma_pago:c.formaPago, garantia:c.garantia, firmado:c.firmado, fecha_firma:c.fechaFirma,
        cedula_frente_meta:c.cedulaFrente, cedula_dorso_meta:c.cedulaDorso, obs:c.obs
      })});
      subidos.push(creado);
    } catch(e) {}
  }
  return subidos.length ? subidos : contratosApi;
}
function aplicarFinanzasCache(data){
  if(!data)return;
  ['caja_cuentas','caja_categorias','caja_movimientos','caja_cierres','proveedores','compras','ventas_maquinas'].forEach(k=>{
    if(Array.isArray(data[k])) DB.set(k,data[k]);
  });
}
async function recargarFinanzas(){
  const data=await api('/api/finanzas/bootstrap');
  aplicarFinanzasCache(data);
  return data;
}
async function loadAllData(){
  try{
    const results=await Promise.allSettled([
      api('/api/operadoras'),api('/api/maquinas'),api('/api/reservas'),
      api('/api/pagos'),api('/api/leads'),api('/api/contratos'),
      api('/api/auth/operadoras/revision'),api('/api/finanzas/bootstrap')
    ]);
    const val=function(i, fallback){return results[i].status==='fulfilled'?results[i].value:fallback};
    const ops=val(0,[]), maqs=val(1,[]), reservas=val(2,[]), pagos=val(3,[]), leads=val(4,[]), contratos=val(5,[]), revisiones=val(6,[]), finanzas=val(7,null);
    DB.set('operadoras',ops.map(o=>({id:o.id,nombre:o.nombre,apellido:o.apellido||'',
      gabinete:o.gabinete||'',ciudad:o.ciudad,departamento:o.departamento||'',
      pais:o.pais||'Uruguay',whatsapp:o.whatsapp||'',telefono:o.telefono||'',
      email:o.email||'',fechaAlta:o.fecha_alta,estado:o.estado,
      nivel:o.nivel||'Intermedio',obs:o.obs||'',
      direccionEntrega:o.direccion_entrega||'',tipoDireccion:o.tipo_direccion||'trabajo',portalToken:o.portal_token||''})));
    DB.set('maquinas',maqs.map(m=>({id:m.id,codigo:m.codigo,nombre:m.nombre,
      categoria:m.categoria||'',ubicacion:m.ubicacion||'',estado:m.estado||'disponible',
      serial:m.serial_num||'',obs:m.obs||''})));
    DB.set('reservas',reservas.map(mapReserva));
    DB.set('pagos',pagos.map(p=>({id:p.id,codigo:p.codigo,reservaId:p.reserva_id,
      operadoraId:p.operadora_id,tipo:p.tipo,estado:p.estado,
      montoTotal:parseFloat(p.monto_total)||0,moneda:p.moneda||'UYU',
      senaRequerida:parseFloat(p.sena_requerida)||0,senaAbonada:parseFloat(p.sena_abonada)||0,
      saldoPendiente:parseFloat(p.saldo_pendiente)||0,
      fechaPago:p.fecha_pago,comprobante:p.comprobante||'',obs:p.obs||'',
      creadaEn:p.created_at?.split('T')[0]||''})));
    DB.set('leads',leads.map(l=>({id:l.id,nombre:l.nombre,apellido:'',gabinete:'',
      ciudad:l.ciudad||'',departamento:l.departamento||'',pais:'Uruguay',
      whatsapp:l.telefono||'',telefono:l.telefono||'',email:l.email||'',
      fuente:l.canal||'',interes:'',tecnologia:'',estado:l.estado||'nuevo',
      obs:l.obs||'',fechaAlta:l.created_at?l.created_at.split('T')[0]:'',
      fechaUpdate:l.updated_at?l.updated_at.split('T')[0]:'',operadoraId:null})));
    const contratosFinales = await syncContratosLocales(contratos);
    DB.set('contratos',contratosFinales.map(mapContrato));
    DB.set('revision_operadoras',revisiones||[]);
    aplicarFinanzasCache(finanzas);
    const docsResults=await Promise.allSettled((ops||[]).map(o=>api('/api/portal/docs/'+o.id)));
    const docs=[];
    docsResults.forEach(function(r){
      if(r.status==='fulfilled'&&Array.isArray(r.value)) docs.push(...r.value);
    });
    DB.set('documentos_operadora',docs);
  }catch(e){
    console.error('Error cargando datos:',e);
    showToast('⚠️ Error conectando con el servidor','warn');
  }
}
