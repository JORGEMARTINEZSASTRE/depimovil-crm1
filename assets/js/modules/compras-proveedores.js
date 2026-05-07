/* ══════════════════════════════════
   PROVEEDORES Y COMPRAS
══════════════════════════════════ */
let proveedoresFilter='';
let comprasFilter={search:'',estado:'',categoria:''};

function ensureComprasData(){
  if(!DB.get('proveedores')) DB.set('proveedores',[]);
  if(!DB.get('compras')) DB.set('compras',[]);
}
function getProveedor(id){return (DB.get('proveedores')||[]).find(p=>parseInt(p.id)===parseInt(id));}
function compraCategoriaLabel(c){
  return {repuestos:'Repuestos',insumos:'Insumos',servicio_tecnico:'Servicio técnico',limpieza:'Limpieza',transporte:'Transporte',otros:'Otros'}[c]||c;
}
function compraEstadoBadge(e){
  const map={pendiente:['badge-yellow','Pendiente'],parcial:['badge-blue','Parcial'],pagada:['badge-green','Pagada'],anulada:['badge-red','Anulada']};
  const m=map[e]||map.pendiente;return `<span class="badge ${m[0]}">${m[1]}</span>`;
}

function renderProveedores(){
  ensureComprasData();
  const q=proveedoresFilter.toLowerCase();
  const compras=DB.get('compras')||[];
  const rows=(DB.get('proveedores')||[]).filter(p=>!q||[p.nombre,p.documento,p.telefono,p.direccion,p.obs].join(' ').toLowerCase().includes(q));
  const tbody=document.getElementById('proveedoresTableBody');
  if(!rows.length){tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="icon">🏢</div><h3>Sin proveedores</h3><p>Cargá proveedores de repuestos, insumos o servicios.</p></div></td></tr>`;return;}
  tbody.innerHTML=rows.map(p=>`<tr>
    <td><span class="bold">${p.nombre}</span></td><td>${p.documento||'—'}</td><td>${p.telefono||'—'}</td><td>${p.direccion||'—'}</td>
    <td>${compras.filter(c=>parseInt(c.proveedorId)===parseInt(p.id)).length}</td>
    <td><button class="action-btn" onclick="openProveedorModal(${p.id})">Editar</button></td>
  </tr>`).join('');
}
function filterProveedores(v){proveedoresFilter=v;renderProveedores();}
function openProveedorModal(id){
  ensureComprasData();
  const p=getProveedor(id);
  document.getElementById('modalProveedorTitle').textContent=p?'Editar Proveedor':'Nuevo Proveedor';
  sv('proveedorId',p?.id||'');sv('proveedorNombre',p?.nombre||'');sv('proveedorDocumento',p?.documento||'');
  sv('proveedorTelefono',p?.telefono||'');sv('proveedorDireccion',p?.direccion||'');sv('proveedorObs',p?.obs||'');
  openModal('modalProveedor');
}
async function saveProveedor(){
  ensureComprasData();
  const proveedores=DB.get('proveedores')||[];const id=gv('proveedorId');const nombre=gv('proveedorNombre').trim();
  if(!nombre){showToast('⚠️ Ingresá nombre del proveedor','warn');return;}
  const prev=id?proveedores.find(p=>p.id===parseInt(id)):null;
  const data={id:prev?.id||proveedores.reduce((m,p)=>Math.max(m,p.id||0),0)+1,nombre,documento:gv('proveedorDocumento').trim(),telefono:gv('proveedorTelefono').trim(),direccion:gv('proveedorDireccion').trim(),obs:gv('proveedorObs').trim(),updatedAt:new Date().toISOString()};
  try{
    const saved=await api(prev?`/api/finanzas/proveedores/${prev.id}`:'/api/finanzas/proveedores',{method:prev?'PUT':'POST',body:JSON.stringify(data)});
    if(saved) data.id=saved.id;
    await recargarFinanzas();
  }catch(e){
    DB.set('proveedores',prev?proveedores.map(p=>p.id===prev.id?data:p):[...proveedores,data]);
  }
  auditLog(prev?'UPDATE':'CREATE','proveedores',data.id,data.nombre);
  closeModal('modalProveedor');showToast('✅ Proveedor guardado');renderProveedores();
}

function renderCompras(){
  ensureComprasData();
  const compras=DB.get('compras')||[];
  const pendientes=compras.filter(c=>['pendiente','parcial'].includes(c.estado));
  const totalPend=pendientes.reduce((s,c)=>s+(c.saldo||0),0);
  const totalPag=compras.reduce((s,c)=>s+(c.pagado||0),0);
  document.getElementById('comprasAlerts').innerHTML=pendientes.length?`<div class="alert-banner warn"><span class="ab-icon">⏳</span><div><strong>${pendientes.length} compra${pendientes.length>1?'s':''} pendiente${pendientes.length>1?'s':''}</strong> — Saldo abierto ${totalPend.toLocaleString()}.</div></div>`:'';
  document.getElementById('comprasResumen').innerHTML=`
    <div class="fin-cell"><div class="fc-label">Compras</div><div class="fc-value">${compras.length}</div></div>
    <div class="fin-cell"><div class="fc-label">Pagado</div><div class="fc-value" style="color:var(--red)">${totalPag.toLocaleString()}</div></div>
    <div class="fin-cell"><div class="fc-label">Saldo pendiente</div><div class="fc-value" style="color:var(--yellow)">${totalPend.toLocaleString()}</div></div>`;
  renderComprasTabla(compras);updateComprasBadge();
}
function renderComprasTabla(compras){
  const q=comprasFilter.search.toLowerCase();
  const rows=compras.filter(c=>{
    const p=getProveedor(c.proveedorId);const m=getMaq(c.maquinaId);
    const txt=[c.codigo,c.concepto,c.comprobante,c.obs,p&&p.nombre,m&&m.nombre].filter(Boolean).join(' ').toLowerCase();
    return (!q||txt.includes(q))&&(!comprasFilter.estado||c.estado===comprasFilter.estado)&&(!comprasFilter.categoria||c.categoria===comprasFilter.categoria);
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')||b.id-a.id);
  const tbody=document.getElementById('comprasTableBody');
  if(!rows.length){tbody.innerHTML=`<tr><td colspan="9"><div class="empty-state"><div class="icon">🧾</div><h3>Sin compras</h3><p>Cargá repuestos, insumos o servicios técnicos.</p></div></td></tr>`;return;}
  tbody.innerHTML=rows.map(c=>{const p=getProveedor(c.proveedorId);const m=getMaq(c.maquinaId);return `<tr>
    <td>${fmtDate(c.fecha)}</td><td><span style="font-family:monospace;color:var(--accent);font-size:11px">${c.codigo}</span></td>
    <td>${p?p.nombre:'—'}</td><td>${compraCategoriaLabel(c.categoria)}</td><td>${m?m.nombre:'—'}</td>
    <td><strong>${(c.total||0).toLocaleString()}</strong> ${c.moneda}</td><td>${(c.pagado||0).toLocaleString()}</td><td>${compraEstadoBadge(c.estado)}</td>
    <td><button class="action-btn" onclick="openCompraModal(${c.id})">Editar</button></td></tr>`;}).join('');
}
function filterCompras(k,v){comprasFilter[k]=v;renderCompras();}

function openCompraModal(id){
  ensureComprasData();ensureCajaData();
  const c=(DB.get('compras')||[]).find(x=>x.id===id);
  document.getElementById('modalCompraTitle').textContent=c?'Editar Compra':'Nueva Compra';
  document.getElementById('compraProveedor').innerHTML='<option value="">— Seleccionar —</option>'+(DB.get('proveedores')||[]).map(p=>`<option value="${p.id}">${p.nombre}</option>`).join('');
  document.getElementById('compraMaquina').innerHTML='<option value="">— Sin máquina —</option>'+(DB.get('maquinas')||[]).map(m=>`<option value="${m.id}">${m.codigo||''} ${m.nombre||''}</option>`).join('');
  document.getElementById('compraCuenta').innerHTML=(DB.get('caja_cuentas')||[]).map(cu=>`<option value="${cu.id}">${cu.nombre}</option>`).join('');
  sv('compraId',c?.id||'');sv('compraFecha',c?.fecha||today());sv('compraProveedor',c?.proveedorId||'');sv('compraCategoria',c?.categoria||'repuestos');
  sv('compraMaquina',c?.maquinaId||'');sv('compraTotal',c?.total||'');sv('compraMoneda',c?.moneda||'UYU');sv('compraPagado','');
  sv('compraCuenta',c?.cuentaId||1);sv('compraComprobante',c?.comprobante||'');sv('compraServicio',c?.servicio||'');sv('compraConcepto',c?.concepto||'');sv('compraObs',c?.obs||'');
  calcCompraSaldo();openModal('modalCompra');
}
function calcCompraSaldo(){
  const total=parseFloat(gv('compraTotal'))||0;const pago=parseFloat(gv('compraPagado'))||0;const wrap=document.getElementById('compraSaldoWrap');
  if(total>0){wrap.style.display='flex';wrap.innerHTML=`Pagado ahora: <strong>${pago.toLocaleString()}</strong> · Saldo estimado: <strong>${Math.max(0,total-pago).toLocaleString()}</strong>`;}else wrap.style.display='none';
}
async function saveCompra(){
  ensureComprasData();
  const compras=DB.get('compras')||[];const id=gv('compraId');const total=parseFloat(gv('compraTotal'))||0;const pago=parseFloat(gv('compraPagado'))||0;
  if(!gv('compraProveedor')){showToast('⚠️ Seleccioná proveedor','warn');return;}
  if(total<=0){showToast('⚠️ Ingresá total de compra','warn');return;}
  if(gv('compraCategoria')==='otros'&&!gv('compraObs').trim()){showToast('⚠️ Otros requiere observación','warn');return;}
  const prev=id?compras.find(c=>c.id===parseInt(id)):null;const pagadoPrev=prev?.pagado||0;const pagado=Math.min(total,pagadoPrev+pago);const saldo=Math.max(0,total-pagado);
  const data={id:prev?.id||compras.reduce((m,c)=>Math.max(m,c.id||0),0)+1,codigo:prev?.codigo||`CP-${String(compras.reduce((m,c)=>Math.max(m,c.id||0),0)+1).padStart(5,'0')}`,fecha:gv('compraFecha')||today(),proveedorId:parseInt(gv('compraProveedor')),categoria:gv('compraCategoria'),maquinaId:parseInt(gv('compraMaquina'))||null,total,moneda:gv('compraMoneda'),pagado,saldo,estado:saldo<=0?'pagada':pagado>0?'parcial':'pendiente',cuentaId:parseInt(gv('compraCuenta')),comprobante:gv('compraComprobante').trim(),servicio:gv('compraServicio').trim(),concepto:gv('compraConcepto').trim()||compraCategoriaLabel(gv('compraCategoria')),obs:gv('compraObs').trim(),updatedAt:new Date().toISOString()};
  try{
    const saved=await api(prev?`/api/finanzas/compras/${prev.id}`:'/api/finanzas/compras',{method:prev?'PUT':'POST',body:JSON.stringify(data)});
    Object.assign(data,saved||{});
    if(pago>0)crearEgresoCajaCompra(data,pago);
    await recargarFinanzas();
  }catch(e){
    DB.set('compras',prev?compras.map(c=>c.id===prev.id?data:c):[...compras,data]);
    if(pago>0)crearEgresoCajaCompra(data,pago);
  }
  auditLog(prev?'UPDATE':'CREATE','compras',data.id,`${data.codigo} ${data.total} ${data.moneda}`);
  closeModal('modalCompra');showToast('✅ Compra guardada');renderCompras();
}
function crearEgresoCajaCompra(compra,monto){
  ensureCajaData();
  const movs=DB.get('caja_movimientos')||[];const nextId=movs.reduce((m,x)=>Math.max(m,x.id||0),0)+1;const prov=getProveedor(compra.proveedorId);
  const mov={id:nextId,codigo:`CJ-${String(nextId).padStart(5,'0')}`,tipo:'egreso',estado:'confirmado',fecha:compra.fecha,cuentaId:compra.cuentaId,categoria:compra.categoria==='otros'?'otros_egreso':compra.categoria,moneda:compra.moneda,monto,comprobante:compra.comprobante||'',operadoraId:null,reservaId:null,maquinaId:compra.maquinaId||null,relacionado:prov?prov.nombre:'',concepto:`Pago compra ${compra.codigo} · ${compra.concepto}`,obs:`Egreso automático desde compra ${compra.codigo}`,origen:'compra',compraId:compra.id,usuario:'sistema',ts:new Date().toISOString(),updatedAt:new Date().toISOString()};
  DB.set('caja_movimientos',[...movs,mov]);
  if(typeof api==='function'){
    api('/api/finanzas/caja/movimientos',{method:'POST',body:JSON.stringify(mov)}).then(()=>typeof recargarFinanzas==='function'?recargarFinanzas():null).catch(()=>{});
  }
  auditLog('CREATE','caja_movimientos',mov.id,`${mov.codigo} egreso compra ${compra.codigo}`);
}
function updateComprasBadge(){
  const count=(DB.get('compras')||[]).filter(c=>['pendiente','parcial'].includes(c.estado)).length;const badge=document.getElementById('navBadgeCompras');
  if(badge){badge.textContent=count;badge.style.display=count>0?'inline':'none';}
}
