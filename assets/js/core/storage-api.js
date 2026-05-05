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
async function loadAllData(){
  try{
    const[ops,maqs,reservas,pagos,leads]=await Promise.all([
      api('/api/operadoras'),api('/api/maquinas'),api('/api/reservas'),
      api('/api/pagos'),api('/api/leads')
    ]);
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
  }catch(e){
    console.error('Error cargando datos:',e);
    showToast('⚠️ Error conectando con el servidor','warn');
  }
}
