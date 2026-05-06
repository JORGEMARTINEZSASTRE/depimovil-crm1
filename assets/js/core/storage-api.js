/* ══════════════════════════════════
   DB
══════════════════════════════════ */
const DB={
  get(k){try{return JSON.parse(localStorage.getItem('dm_'+k)||'null')}catch(e){return null}},
  set(k,v){localStorage.setItem('dm_'+k,JSON.stringify(v))},
  del(k){localStorage.removeItem('dm_'+k)}
};

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
async function loadAllData(){
  try{
    const results=await Promise.allSettled([
      api('/api/operadoras'),api('/api/maquinas'),api('/api/reservas'),
      api('/api/pagos'),api('/api/leads'),api('/api/contratos')
    ]);
    const val=function(i, fallback){return results[i].status==='fulfilled'?results[i].value:fallback};
    const ops=val(0,[]), maqs=val(1,[]), reservas=val(2,[]), pagos=val(3,[]), leads=val(4,[]), contratos=val(5,[]);
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
  }catch(e){
    console.error('Error cargando datos:',e);
    showToast('⚠️ Error conectando con el servidor','warn');
  }
}
