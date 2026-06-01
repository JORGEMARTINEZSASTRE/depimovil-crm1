/* ══════════════════════════════════
   REPORTES OPERATIVOS
══════════════════════════════════ */
function reportMoney(n,moneda='UYU'){
  const num=Number(n||0);
  return '$'+num.toLocaleString('es-UY',{maximumFractionDigits:0})+' '+moneda;
}
function reportDateValue(v){
  const normalized=normalizeDateInput(v);
  if(!normalized)return null;
  const d=new Date(normalized+'T00:00:00');
  return Number.isNaN(d.getTime())?null:d;
}
function reportDaysFromToday(v){
  const d=reportDateValue(v);
  if(!d)return null;
  const t=reportDateValue(today());
  return Math.floor((d-t)/(1000*60*60*24));
}
function reportBetween(v,min,max){
  const d=reportDaysFromToday(v);
  return d!==null&&d>=min&&d<=max;
}
function reportPct(a,b){
  return b?Math.round((a/b)*100):0;
}
function reportPagoCobrado(p){
  if(p.estado==='validado')return Number(p.montoTotal||0);
  if(p.estado==='sena_abonada')return Number(p.senaAbonada||0);
  return 0;
}
function reportPagoPendiente(p){
  const saldo=Number(p.saldoPendiente||0);
  if(saldo>0)return saldo;
  if(['pendiente','sena_pendiente'].includes(p.estado)){
    return Math.max(0,Number(p.senaRequerida||0)-Number(p.senaAbonada||0));
  }
  return 0;
}
function reportLeadScore(l){
  const base=Number(l.whatsappScore||0);
  const estadoBonus={pendiente_sena:40,reserva_confirmada:60,calificado:30,presupuesto_enviado:25,interesado:15,contactado:5};
  const tempBonus={caliente:20,tibio:8,frio:0};
  return base+(estadoBonus[l.estado]||0)+(tempBonus[l.temperatura]||0);
}
function reportOpName(id){
  const op=getOp(id);
  return op?`${op.nombre||''} ${op.apellido||''}`.trim():'Sin operadora';
}
function reportMaqName(id){
  const m=getMaq(id);
  return m?`${m.codigo||''} ${m.nombre||''}`.trim():'Sin máquina';
}
function reportReservaFecha(r){
  return r.tipo==='jornada'?(r.fechaJornada||r.fechaInicio):r.fechaInicio;
}
function reportReservaDias(r){
  if(r.tipo==='jornada')return 1;
  const inicio=reportDateValue(r.fechaInicio||r.fechaJornada);
  const fin=reportDateValue(r.fechaFin||r.fechaInicio||r.fechaJornada);
  if(!inicio||!fin)return 1;
  const diff=Math.floor((fin-inicio)/(1000*60*60*24))+1;
  return Math.max(1,diff);
}
function reportMoneyPair(values){
  const parts=[];
  if(Math.abs(values.UYU||0)>0)parts.push(reportMoney(values.UYU,'UYU'));
  if(Math.abs(values.USD||0)>0)parts.push(reportMoney(values.USD,'USD'));
  return parts.length?parts.join('<br>'):'$0 UYU';
}
function reportAddMoney(bucket,amount,moneda){
  const key=moneda==='USD'?'USD':'UYU';
  bucket[key]=(bucket[key]||0)+Number(amount||0);
}
function reportProfitValue(row){
  return (row.utilidad.UYU||0)+((row.utilidad.USD||0)*40);
}
function reportMachineStopDays(m){
  const stopped=['mantenimiento','fuera_servicio','en_viaje'].includes(m.estado)||['pendiente','en_tecnico'].includes(m.tecnicoEstado)||m.puestaPuntoEstado==='pendiente';
  if(!stopped)return 0;
  if(typeof maquinaGestionDias==='function'){
    return maquinaGestionDias(m.puestaPuntoAsignadaEn||m.tecnicoSalidaEn||m.ultMant||m.updatedAt||m.creadaEn||today())||0;
  }
  const d=reportDaysFromToday(m.updatedAt||m.creadaEn||today());
  return d===null?0:Math.abs(Math.min(d,0));
}
function reportMachineProfitRows(maqs,reservas,pagos,compras,cajaMovs){
  const reservasValidas=reservas.filter(r=>r.maquinaId&&!['cancelada','rechazada'].includes(r.estado));
  return maqs.map(m=>{
    const ingresos={UYU:0,USD:0};
    const gastos={UYU:0,USD:0};
    const rs=reservasValidas.filter(r=>parseInt(r.maquinaId)===parseInt(m.id));
    const reservaIds=new Set(rs.map(r=>parseInt(r.id)));
    pagos.filter(p=>reservaIds.has(parseInt(p.reservaId))).forEach(p=>reportAddMoney(ingresos,reportPagoCobrado(p),p.moneda||'UYU'));
    cajaMovs.filter(c=>c.estado==='confirmado'&&parseInt(c.maquinaId)===parseInt(m.id)&&c.tipo==='ingreso'&&c.origen!=='pago')
      .forEach(c=>reportAddMoney(ingresos,Math.abs(Number(c.monto||0)),c.moneda||'UYU'));
    compras.filter(c=>parseInt(c.maquinaId)===parseInt(m.id))
      .forEach(c=>reportAddMoney(gastos,Number(c.pagado||0),c.moneda||'UYU'));
    cajaMovs.filter(c=>c.estado==='confirmado'&&parseInt(c.maquinaId)===parseInt(m.id)&&c.tipo!=='ingreso'&&!['compra','pago'].includes(c.origen))
      .forEach(c=>reportAddMoney(gastos,Math.abs(Number(c.monto||0)),c.moneda||'UYU'));
    const utilidad={UYU:(ingresos.UYU||0)-(gastos.UYU||0),USD:(ingresos.USD||0)-(gastos.USD||0)};
    const ingresoBase=(ingresos.UYU||0)+((ingresos.USD||0)*40);
    const utilidadBase=reportProfitValue({utilidad});
    return {
      maquina:m,
      ingresos,
      gastos,
      utilidad,
      margen:ingresoBase?Math.round((utilidadBase/ingresoBase)*100):0,
      reservas:rs.length,
      diasOcupada:rs.reduce((s,r)=>s+reportReservaDias(r),0),
      diasParada:reportMachineStopDays(m)
    };
  }).sort((a,b)=>reportProfitValue(b)-reportProfitValue(a));
}
function reportMachineProfitTable(rows){
  const visible=rows.filter(r=>r.reservas||r.ingresos.UYU||r.ingresos.USD||r.gastos.UYU||r.gastos.USD).slice(0,10);
  if(!visible.length)return `<div class="report-empty">Todavía no hay ingresos o gastos vinculados a máquinas.</div>`;
  return `<div class="profit-table-wrap"><table class="profit-table">
    <thead><tr><th>Máquina</th><th>Ingresos</th><th>Gastos</th><th>Utilidad</th><th>Margen</th><th>Reservas</th><th>Días ocupada</th><th>Días parada</th><th></th></tr></thead>
    <tbody>${visible.map(r=>{
      const name=`${r.maquina.codigo||''} ${r.maquina.nombre||''}`.trim()||'Máquina';
      const profitClass=reportProfitValue(r)>=0?'profit-positive':'profit-negative';
      return `<tr>
        <td><strong>${escapeHTML(name)}</strong><span>${escapeHTML(r.maquina.estado||'sin estado')}</span></td>
        <td>${reportMoneyPair(r.ingresos)}</td>
        <td>${reportMoneyPair(r.gastos)}</td>
        <td class="${profitClass}">${reportMoneyPair(r.utilidad)}</td>
        <td class="${profitClass}">${r.margen}%</td>
        <td>${r.reservas}</td>
        <td>${r.diasOcupada}</td>
        <td>${r.diasParada}</td>
        <td>${reportAction('Ficha',`showMaqFicha(${r.maquina.id})`)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}
function reportBarRows(entries,color='var(--accent)',empty='Sin datos.'){
  const rows=entries.filter(e=>e[1]>0);
  if(!rows.length)return `<div class="report-empty">${empty}</div>`;
  const max=Math.max(1,...rows.map(e=>e[1]));
  return rows.map(([label,n])=>`<div class="bar-row">
    <div class="bar-label">${escapeHTML(label)}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/max)*100)}%;background:${color}"></div></div>
    <div class="bar-val">${n}</div>
  </div>`).join('');
}
function reportList(items,empty='Sin pendientes.'){
  if(!items.length)return `<div class="report-empty">${empty}</div>`;
  return `<div class="report-list">${items.map(i=>`<div class="report-list-row">
    <div>
      <div class="report-list-title">${escapeHTML(i.title)}</div>
      <div class="report-list-sub">${escapeHTML(i.sub||'')}</div>
    </div>
    ${i.action||''}
  </div>`).join('')}</div>`;
}
function reportAction(label,onclick){
  return `<button type="button" class="action-btn" onclick="${onclick}">${escapeHTML(label)}</button>`;
}
function renderReportes(){
  const ops=DB.get('operadoras')||[];
  const maqs=DB.get('maquinas')||[];
  const reservas=DB.get('reservas')||[];
  const pagos=DB.get('pagos')||[];
  const envios=DB.get('envios')||[];
  const leads=DB.get('leads')||[];
  const contratos=DB.get('contratos')||[];
  const compras=DB.get('compras')||[];
  const cajaMovs=DB.get('caja_movimientos')||[];

  const reservasActivas=reservas.filter(r=>!['cancelada','rechazada','finalizada'].includes(r.estado));
  const reservasProximas=reservasActivas.filter(r=>reportBetween(reportReservaFecha(r),0,14))
    .sort((a,b)=>String(reportReservaFecha(a)).localeCompare(String(reportReservaFecha(b))));
  const reservasVencidas=reservasActivas.filter(r=>reportDaysFromToday(reportReservaFecha(r))!==null&&reportDaysFromToday(reportReservaFecha(r))<0);
  const pagosPendientes=pagos.filter(p=>reportPagoPendiente(p)>0);
  const cobrado=pagos.reduce((s,p)=>s+reportPagoCobrado(p),0);
  const pendiente=pagosPendientes.reduce((s,p)=>s+reportPagoPendiente(p),0);
  const leadsCalientes=leads.map(l=>({...l,score:reportLeadScore(l)}))
    .filter(l=>l.score>=30||['pendiente_sena','reserva_confirmada','calificado','presupuesto_enviado'].includes(l.estado))
    .sort((a,b)=>b.score-a.score);
  const leadsSinSeguimiento=leads.filter(l=>!['ganado','perdido','cliente_activa'].includes(l.estado)&&(!l.proxFecha||reportDaysFromToday(l.proxFecha)<0));
  const contratosPendientes=contratos.filter(c=>!c.firmado);
  const enviosCriticos=envios.filter(e=>['pendiente_envio','preparando','en_transito','entregado','pendiente_retiro'].includes(e.estado))
    .filter(e=>reportBetween(e.fechaEnvioEst,-7,7)||reportBetween(e.fechaRetiroEst,-7,7));

  const ultReservaPorOp={};
  reservas.forEach(r=>{
    if(!r.operadoraId)return;
    const f=reportReservaFecha(r)||r.creadaEn||'';
    if(!ultReservaPorOp[r.operadoraId]||String(f)>String(ultReservaPorOp[r.operadoraId].fecha)){
      ultReservaPorOp[r.operadoraId]={fecha:f,reserva:r};
    }
  });
  const opsInactivas=ops.map(o=>{
    const last=ultReservaPorOp[o.id];
    const dias=last?reportDaysFromToday(last.fecha):null;
    return {...o,ultimaReserva:last,diasDesde:dias===null?9999:Math.abs(Math.min(dias,0))};
  }).filter(o=>o.estado==='inactiva'||!o.ultimaReserva||o.diasDesde>=60)
    .sort((a,b)=>b.diasDesde-a.diasDesde);

  const conversion=reportPct(leads.filter(l=>['ganado','cliente_activa','reserva_confirmada'].includes(l.estado)).length,leads.length);
  const ocupacion=reportPct(reservasActivas.length,Math.max(1,maqs.filter(m=>m.tipoOperativo!=='solo_venta').length));
  const maquinasFuera=maqs.filter(m=>['mantenimiento','fuera_servicio','en_viaje'].includes(m.estado)).length;
  const rentabilidadMaquinas=reportMachineProfitRows(maqs,reservas,pagos,compras,cajaMovs);
  const utilidadUYU=rentabilidadMaquinas.reduce((s,r)=>s+(r.utilidad.UYU||0),0);
  const topRentable=rentabilidadMaquinas.find(r=>reportProfitValue(r)>0);

  const kpis=[
    ['Cobrado',reportMoney(cobrado),'green'],
    ['Pendiente',reportMoney(pendiente),'yellow'],
    ['Reservas activas',reservasActivas.length,'accent'],
    ['Próximas 14 días',reservasProximas.length,'blue'],
    ['Leads calientes',leadsCalientes.length,'rose'],
    ['Conversión leads',conversion+'%','green'],
    ['Operadoras a recuperar',opsInactivas.length,'yellow'],
    ['Equipos no operativos',maquinasFuera,'rose'],
    ['Utilidad máquinas',reportMoney(utilidadUYU),'green'],
  ];

  const resEstados=Object.entries(RES_ESTADOS||{}).map(([k,v])=>[v.label||k,reservas.filter(r=>r.estado===k).length]);
  const pagEstados=Object.entries(PAGO_ESTADOS||{}).map(([k,v])=>[v.label||k,pagos.filter(p=>p.estado===k).length]);
  const envEstados=Object.entries(ENVIO_ESTADOS||{}).map(([k,v])=>[v.label||k,envios.filter(e=>e.estado===k).length]);
  const leadEstados=Object.entries(LEAD_ESTADOS||{}).map(([k,v])=>[v.label||k,leads.filter(l=>l.estado===k).length]);
  const deptCount={};
  ops.forEach(o=>{const d=o.departamento||o.ciudad||'Sin zona';deptCount[d]=(deptCount[d]||0)+1;});
  const deptEntries=Object.entries(deptCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maqUso={};
  reservas.forEach(r=>{if(r.maquinaId)maqUso[r.maquinaId]=(maqUso[r.maquinaId]||0)+1;});
  const maqEntries=Object.entries(maqUso).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id,n])=>[reportMaqName(id),n]);

  document.getElementById('reportesContent').innerHTML=`
    <div class="kpi-row">
      ${kpis.map(([label,value,color])=>`<div class="kpi-box">
        <div class="kv" style="color:var(--${color})">${escapeHTML(value)}</div>
        <div class="kl">${escapeHTML(label)}</div>
      </div>`).join('')}
    </div>
    <div class="report-grid report-grid-wide">
      <div class="report-card report-card-main">
        <h4>Rentabilidad por máquina</h4>
        <div class="report-card-note">Ingresos cobrados menos gastos pagados y movimientos extra vinculados a cada equipo. USD se muestra separado.</div>
        ${topRentable?`<div class="profit-summary"><strong>Top:</strong> ${escapeHTML(`${topRentable.maquina.codigo||''} ${topRentable.maquina.nombre||''}`.trim())} · ${reportMoneyPair(topRentable.utilidad)}</div>`:''}
        ${reportMachineProfitTable(rentabilidadMaquinas)}
      </div>
      <div class="report-card report-card-main">
        <h4>Agenda operativa</h4>
        ${reportList(reservasProximas.slice(0,8).map(r=>({
          title:`${r.codigo||'Reserva'} · ${reportOpName(r.operadoraId)}`,
          sub:`${fmtDate(reportReservaFecha(r))} · ${reportMaqName(r.maquinaId)} · ${r.estado}`,
          action:reportAction('Ver',`showResFicha(${r.id})`)
        })), 'No hay reservas próximas en 14 días.')}
      </div>
      <div class="report-card">
        <h4>Alertas de cobro</h4>
        ${reportList(pagosPendientes.slice(0,8).map(p=>({
          title:`${p.codigo||'Pago'} · ${reportMoney(reportPagoPendiente(p),p.moneda||'UYU')}`,
          sub:`${reportOpName(p.operadoraId)} · ${p.estado}`,
          action:reportAction('Pago',`showPagoFicha(${p.id})`)
        })), 'No hay saldos pendientes.')}
      </div>
      <div class="report-card">
        <h4>Leads calientes</h4>
        ${reportList(leadsCalientes.slice(0,8).map(l=>({
          title:`${l.nombre||'Lead'} ${l.apellido||''}`.trim()+` · ${l.score} pts`,
          sub:`${l.estado||'nuevo'} · ${l.ciudad||l.departamento||'Sin ciudad'} · ${l.interes||l.intencionWhatsapp||''}`,
          action:reportAction('Abrir',`showLeadFicha(${l.id})`)
        })), 'No hay leads calientes pendientes.')}
      </div>
      <div class="report-card">
        <h4>Seguimientos vencidos</h4>
        ${reportList(leadsSinSeguimiento.slice(0,8).map(l=>({
          title:`${l.nombre||'Lead'} ${l.apellido||''}`.trim(),
          sub:`${l.proxFecha?fmtDate(l.proxFecha):'Sin próxima fecha'} · ${l.estado||'nuevo'}`,
          action:reportAction('Abrir',`showLeadFicha(${l.id})`)
        })), 'No hay seguimientos atrasados.')}
      </div>
      <div class="report-card">
        <h4>Logística próxima</h4>
        ${reportList(enviosCriticos.slice(0,8).map(e=>({
          title:`${e.codigo||'Envío'} · ${reportOpName(e.operadoraId)}`,
          sub:`Envio ${fmtDate(e.fechaEnvioEst)} · Retiro ${fmtDate(e.fechaRetiroEst)} · ${e.estado}`,
          action:reportAction('Ver',`showEnvioFicha(${e.id})`)
        })), 'No hay logística crítica en los próximos días.')}
      </div>
      <div class="report-card">
        <h4>Operadoras a recuperar</h4>
        ${reportList(opsInactivas.slice(0,8).map(o=>({
          title:`${o.nombre||''} ${o.apellido||''}`.trim(),
          sub:o.ultimaReserva?`Última reserva ${fmtDate(o.ultimaReserva.fecha)} · ${o.ciudad||o.departamento||''}`:`Sin reservas registradas · ${o.ciudad||o.departamento||''}`,
          action:reportAction('Ficha',`showOpFicha(${o.id})`)
        })), 'No hay operadoras para recuperar.')}
      </div>
      <div class="report-card">
        <h4>Reservas por estado</h4>${reportBarRows(resEstados,'var(--accent)')}
      </div>
      <div class="report-card">
        <h4>Pagos por estado</h4>${reportBarRows(pagEstados,'var(--blue)')}
      </div>
      <div class="report-card">
        <h4>Leads por estado</h4>${reportBarRows(leadEstados,'var(--rose)')}
      </div>
      <div class="report-card">
        <h4>Envíos por estado</h4>${reportBarRows(envEstados,'var(--green)')}
      </div>
      <div class="report-card">
        <h4>Operadoras por zona</h4>${reportBarRows(deptEntries,'var(--rose)','Sin operadoras.')}
      </div>
      <div class="report-card">
        <h4>Máquinas más utilizadas</h4>${reportBarRows(maqEntries,'var(--green)','Sin reservas registradas.')}
      </div>
      <div class="report-card">
        <h4>Control documental</h4>
        ${reportList([
          {title:`${contratosPendientes.length} contratos pendientes`,sub:'Contratos de alquiler sin firma registrada',action:reportAction('Contratos',`navigate('contratos')`)},
          {title:`${reservasVencidas.length} reservas vencidas activas`,sub:'Reservas no finalizadas con fecha pasada',action:reportAction('Reservas',`navigate('reservas')`)},
          {title:`${ocupacion}% presión de agenda`,sub:'Reservas activas sobre equipos operativos',action:reportAction('Calendario',`navigate('calendario')`)}
        ], 'Sin controles pendientes.')}
      </div>
    </div>`;
}
