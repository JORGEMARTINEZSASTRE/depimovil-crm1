/* ══════════════════════════════════
   REPORTES
══════════════════════════════════ */
function renderReportes(){
  const ops     = DB.get('operadoras')||[];
  const maqs    = DB.get('maquinas')||[];
  const reservas= DB.get('reservas')||[];
  const pagos   = DB.get('pagos')||[];
  const envios  = DB.get('envios')||[];

  // KPIs globales
  const totalFacturado  = pagos.filter(p=>p.estado==='validado').reduce((s,p)=>s+(p.montoTotal||0),0);
  const totalPendiente  = pagos.filter(p=>['pendiente','sena_pendiente','sena_abonada'].includes(p.estado)).reduce((s,p)=>s+(p.saldoPendiente||0),0);
  const tasaActivacion  = ops.length ? Math.round((ops.filter(o=>o.estado==='activa').length/ops.length)*100) : 0;
  const maqsActivas     = maqs.filter(m=>m.estado==='disponible'||m.estado==='reservada').length;

  const leads = DB.get('leads')||[];
  const leadsNuevos   = leads.filter(l=>l.estado==='nuevo').length;
  const leadsGanados  = leads.filter(l=>l.estado==='ganado').length;
  const leadsPerdidos = leads.filter(l=>l.estado==='perdido').length;
  const tasaConversion= leads.length ? Math.round((leadsGanados/leads.length)*100) : 0;

  const kpiHtml = `
    <div class="kpi-row">
      <div class="kpi-box"><div class="kv" style="color:var(--green)">${totalFacturado.toLocaleString()}</div><div class="kl">UYU Cobrado</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--yellow)">${totalPendiente.toLocaleString()}</div><div class="kl">UYU Pendiente</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--accent)">${reservas.length}</div><div class="kl">Reservas Totales</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--blue)">${tasaActivacion}%</div><div class="kl">Operadoras Activas</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--purple)">${maqsActivas}</div><div class="kl">Equipos Operativos</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--rose)">${leads.length}</div><div class="kl">Leads Totales</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--green)">${leadsGanados}</div><div class="kl">Leads Ganados</div></div>
      <div class="kpi-box"><div class="kv" style="color:var(--blue)">${tasaConversion}%</div><div class="kl">Tasa Conversión</div></div>
    </div>`;

  // Reservas por estado
  const resEstados = Object.entries(RES_ESTADOS);
  const maxRes = Math.max(1,...resEstados.map(([k])=>reservas.filter(r=>r.estado===k).length));
  const resChart = resEstados.map(([k,v])=>{
    const n=reservas.filter(r=>r.estado===k).length;
    const pct=Math.round((n/maxRes)*100);
    return `<div class="bar-row">
      <div class="bar-label">${v.icon} ${v.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:var(--accent)"></div></div>
      <div class="bar-val">${n}</div>
    </div>`;
  }).join('');

  // Operadoras por departamento (top 8)
  const deptCount={};
  ops.filter(o=>o.estado==='activa').forEach(o=>{const d=o.departamento||'Sin dept.';deptCount[d]=(deptCount[d]||0)+1;});
  const deptEntries=Object.entries(deptCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxDept=Math.max(1,...deptEntries.map(e=>e[1]));
  const deptChart=deptEntries.map(([d,n])=>`<div class="bar-row">
    <div class="bar-label">${d}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/maxDept)*100)}%;background:var(--rose)"></div></div>
    <div class="bar-val">${n}</div>
  </div>`).join('');

  // Pagos por estado
  const pagosEstados = Object.entries(PAGO_ESTADOS);
  const maxPag=Math.max(1,...pagosEstados.map(([k])=>pagos.filter(p=>p.estado===k).length));
  const pagChart=pagosEstados.map(([k,v])=>{
    const n=pagos.filter(p=>p.estado===k).length;
    return `<div class="bar-row">
      <div class="bar-label">${v.icon} ${v.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/maxPag)*100)}%;background:var(--blue)"></div></div>
      <div class="bar-val">${n}</div>
    </div>`;
  }).join('');

  // Envíos por estado
  const envEstados=Object.entries(ENVIO_ESTADOS);
  const maxEnv=Math.max(1,...envEstados.map(([k])=>envios.filter(e=>e.estado===k).length));
  const envChart=envEstados.map(([k,v])=>{
    const n=envios.filter(e=>e.estado===k).length;
    return `<div class="bar-row">
      <div class="bar-label">${v.icon} ${v.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/maxEnv)*100)}%;background:var(--teal||'#3cc4b4')"></div></div>
      <div class="bar-val">${n}</div>
    </div>`;
  }).join('');

  // Máquinas más utilizadas
  const maqUso={};
  reservas.forEach(r=>{if(r.maquinaId)maqUso[r.maquinaId]=(maqUso[r.maquinaId]||0)+1;});
  const maqEntries=Object.entries(maqUso).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxMaqUso=Math.max(1,...maqEntries.map(e=>e[1]));
  const maqChart=maqEntries.length?maqEntries.map(([id,n])=>{
    const m=getMaq(parseInt(id));
    return `<div class="bar-row">
      <div class="bar-label">${m?m.nombre:id}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/maxMaqUso)*100)}%;background:var(--green)"></div></div>
      <div class="bar-val">${n}</div>
    </div>`;
  }).join(''):'<div style="color:var(--text3);font-size:13px">Sin datos aún.</div>';

  document.getElementById('reportesContent').innerHTML = `
    ${kpiHtml}
    <div class="report-grid">
      <div class="report-card"><h4>📅 Reservas por Estado</h4>${resChart}</div>
      <div class="report-card"><h4>💳 Pagos por Estado</h4>${pagChart}</div>
      <div class="report-card"><h4>👩‍💼 Operadoras por Departamento</h4>${deptChart}</div>
      <div class="report-card"><h4>🚚 Envíos por Estado</h4>${envChart}</div>
      <div class="report-card"><h4>⚙️ Máquinas más Utilizadas</h4>${maqChart}
      <div class="report-card">
        <h4>🎯 Leads por Estado</h4>
        ${Object.entries(LEAD_ESTADOS).map(([k,v])=>{const n=leads.filter(l=>l.estado===k).length;const mx=Math.max(1,...Object.keys(LEAD_ESTADOS).map(kk=>leads.filter(l=>l.estado===kk).length));return `<div class="bar-row"><div class="bar-label">${v.icon} ${v.label}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/mx)*100)}%;background:var(--rose)"></div></div><div class="bar-val">${n}</div></div>`;}).join('')}
      </div>
      <div class="report-card">
        <h4>🎯 Leads por Fuente</h4>
        ${(()=>{const fMap={instagram:'Instagram',facebook:'Facebook',whatsapp:'WhatsApp',referido:'Referido',web:'Web/Google',feria:'Feria',llamada:'Llamada',otro:'Otro'};const entries=Object.entries(fMap).map(([k,l])=>[k,l,leads.filter(x=>x.fuente===k).length]).filter(e=>e[2]>0).sort((a,b)=>b[2]-a[2]);if(!entries.length)return '<div style=\"color:var(--text3);font-size:13px\">Sin leads.</div>';const mx=entries[0][2];return entries.map(([k,l,n])=>`<div class="bar-row"><div class="bar-label">${l}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/mx)*100)}%;background:var(--purple)"></div></div><div class="bar-val">${n}</div></div>`).join('');})()} 
      </div></div>
      <div class="report-card">
        <h4>📊 Resumen General</h4>
        ${[
          ['Total Operadoras', ops.length],
          ['Operadoras Activas', ops.filter(o=>o.estado==='activa').length],
          ['Total Máquinas', maqs.length],
          ['Máquinas Disponibles', maqs.filter(m=>m.estado==='disponible').length],
          ['Total Reservas', reservas.length],
          ['Reservas Confirmadas', reservas.filter(r=>r.estado==='confirmada').length],
          ['Total Envíos', envios.length],
          ['Notif. WhatsApp Enviadas', (DB.get('wa_notificaciones')||[]).filter(n=>n.estado==='enviada').length],
          ['Total Leads', leads.length],
          ['Leads Ganados', leads.filter(l=>l.estado==='ganado').length],
          ['Tasa Conversión', tasaConversion+'%'],
        ].map(([l,v])=>`<div class="bar-row">
          <div class="bar-label">${l}</div>
          <div class="bar-val" style="font-size:15px;color:var(--text)">${v}</div>
        </div>`).join('')}
      </div>
    </div>`;
}
