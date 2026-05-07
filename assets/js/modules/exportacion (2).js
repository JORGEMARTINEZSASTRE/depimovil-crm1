/* ══════════════════════════════════
   EXPORTACIÓN CSV
══════════════════════════════════ */
function exportarCSV(tipo){
  let rows=[], filename='', headers=[];

  if(tipo==='operadoras'){
    headers=['ID','Nombre','Apellido','Gabinete','Ciudad','Departamento','País','WhatsApp','Email','Fecha Alta','Estado','Nivel'];
    rows=(DB.get('operadoras')||[]).map(o=>[o.id,o.nombre,o.apellido,o.gabinete||'',o.ciudad,o.departamento,o.pais,o.whatsapp||'',o.email||'',o.fechaAlta,o.estado,o.nivel]);
    filename='operadoras_depimovil';
  } else if(tipo==='reservas'){
    headers=['Código','Operadora','Máquina','Tipo','Fecha Jornada','Fecha Inicio','Fecha Fin','Departamento','Estado','Monto','Moneda'];
    rows=(DB.get('reservas')||[]).map(r=>{const op=getOp(r.operadoraId);const maq=getMaq(r.maquinaId);
      return[r.codigo,op?`${op.nombre} ${op.apellido}`:'',maq?maq.nombre:'',r.tipo,r.fechaJornada||'',r.fechaInicio||'',r.fechaFin||'',r.deptLogistica||'',r.estado,r.monto||0,r.moneda||'UYU'];});
    filename='reservas_depimovil';
  } else if(tipo==='pagos'){
    headers=['Código','Operadora','Reserva','Tipo','Total','Moneda','Seña Req.','Seña Abonada','Saldo','Estado','Fecha Pago'];
    rows=(DB.get('pagos')||[]).map(p=>{const op=getOp(p.operadoraId);
      return[p.codigo,op?`${op.nombre} ${op.apellido}`:'',p.reservaId,p.tipo,p.montoTotal||0,p.moneda||'UYU',p.senaRequerida||0,p.senaAbonada||0,p.saldoPendiente||0,p.estado,p.fechaPago||''];});
    filename='pagos_depimovil';
  } else if(tipo==='caja'){
    headers=['Fecha','Código','Tipo','Categoría','Cuenta','Monto','Moneda','Estado','Concepto','Comprobante','Operadora','Reserva','Máquina','Relacionado','Origen','Usuario'];
    rows=(DB.get('caja_movimientos')||[]).map(m=>{
      const op=getOp(m.operadoraId);const res=(DB.get('reservas')||[]).find(r=>r.id===m.reservaId);const maq=getMaq(m.maquinaId);
      return[m.fecha,m.codigo,m.tipo,typeof cajaCategoriaLabel==='function'?cajaCategoriaLabel(m.categoria):m.categoria,typeof cajaCuentaNombre==='function'?cajaCuentaNombre(m.cuentaId):m.cuentaId,
        m.monto||0,m.moneda||'UYU',m.estado,m.concepto||'',m.comprobante||'',op?`${op.nombre} ${op.apellido}`:'',
        res?res.codigo:'',maq?maq.nombre:'',m.relacionado||'',m.origen||'',m.usuario||''];
    });
    filename='caja_depimovil';
  } else if(tipo==='compras'){
    headers=['Fecha','Código','Proveedor','Categoría','Máquina','Total','Pagado','Saldo','Moneda','Estado','Comprobante','Concepto'];
    rows=(DB.get('compras')||[]).map(c=>{const p=getProveedor(c.proveedorId);const m=getMaq(c.maquinaId);
      return[c.fecha,c.codigo,p?p.nombre:'',c.categoria,m?m.nombre:'',c.total||0,c.pagado||0,c.saldo||0,c.moneda,c.estado,c.comprobante||'',c.concepto||''];});
    filename='compras_depimovil';
  } else if(tipo==='ventas_maquinas'){
    headers=['Fecha','Código','Máquina','Comprador','Teléfono','Documento','Total','Pagado','Saldo','Moneda','Estado','Comprobante'];
    rows=(DB.get('ventas_maquinas')||[]).map(v=>{const m=getMaq(v.maquinaId);
      return[v.fecha,v.codigo,m?m.nombre:'',v.comprador||'',v.telefono||'',v.documento||'',v.total||0,v.pagado||0,v.saldo||0,v.moneda,v.estado,v.comprobante||''];});
    filename='ventas_maquinas_depimovil';
  } else if(tipo==='envios'){
    headers=['Código','Operadora','Máquina','Reserva','Departamento','Dirección','Transportista',
             'Tracking','F.Envío Est.','F.Envío Real','F.Retiro Est.','F.Retiro Real','Estado'];
    rows=(DB.get('envios')||[]).map(e=>{
      const op=getOp(e.operadoraId); const maq=getMaq(e.maquinaId);
      return[e.codigo,op?`${op.nombre} ${op.apellido}`:'',maq?maq.nombre:'',
        e.reservaId||'',e.departamento||'',e.direccion||'',e.transportista||'',
        e.tracking||'',e.fechaEnvioEst||'',e.fechaEnvioReal||'',
        e.fechaRetiroEst||'',e.fechaRetiroReal||'',e.estado];
    });
    filename='envios_depimovil';
  } else if(tipo==='leads'){
    headers=['ID','Nombre','Apellido','Gabinete','Ciudad','Departamento','País',
             'WhatsApp','Email','Fuente','Tecnología','Estado','Fecha Alta','Observaciones'];
    rows=(DB.get('leads')||[]).map(l=>[
      l.id,l.nombre,l.apellido,l.gabinete||'',l.ciudad||'',l.departamento||'',l.pais||'',
      l.whatsapp||'',l.email||'',l.fuente||'',l.tecnologia||'',l.estado,l.fechaAlta||'',
      (l.obs||'').replace(/\n/g,' ')
    ]);
    filename='leads_depimovil';
  } else if(tipo==='audit'){
    headers=['Timestamp','Usuario','Acción','Entidad','ID','Resumen'];
    rows=(DB.get('audit_log')||[]).sort((a,b)=>b.ts.localeCompare(a.ts))
      .map(e=>[e.ts,e.user||'',e.action,e.entidad||'',e.entidadId||'',e.resumen||'']);
    filename='auditoria_depimovil';
  } else {
    showToast('⚠️ Tipo de exportación no reconocido','warn'); return;
  }

  const csv=[headers,...rows].map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`${filename}_${today()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast(`⬇ ${filename}.csv descargado`);
  auditLog('EXPORT',tipo,null,`${rows.length} registros exportados`);
}
