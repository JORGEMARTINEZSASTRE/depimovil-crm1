/* ══════════════════════════════════
   EMBUDO COMERCIAL
══════════════════════════════════ */
function renderEmbudo(){
  const leads = DB.get('leads')||[];
  const total  = leads.length;
  const activos= leads.filter(l=>!['ganado','perdido'].includes(l.estado)).length;
  const ganados= leads.filter(l=>l.estado==='ganado').length;
  const tasa   = total ? Math.round((ganados/total)*100) : 0;

  const reactivar= leads.filter(l=>l.estado==='reactivar_luego').length;
  const convertidos= leads.filter(l=>l.operadoraId).length;

  document.getElementById('embudoStats').innerHTML = [
    {val:total,      lbl:'Total Leads',       color:'var(--text)'},
    {val:activos,    lbl:'En Pipeline',        color:'var(--blue)'},
    {val:ganados,    lbl:'Ganados',            color:'var(--green)'},
    {val:convertidos,lbl:'Convertidos',        color:'var(--accent)'},
    {val:leads.filter(l=>l.estado==='perdido').length, lbl:'Perdidos', color:'var(--red)'},
    {val:reactivar,  lbl:'A Reactivar',        color:'var(--text2)'},
    {val:tasa+'%',   lbl:'Tasa Conversión',    color:'var(--purple)'},
  ].map(s=>`<div class="embudo-stat"><div class="es-val" style="color:${s.color}">${s.val}</div><div class="es-lbl">${s.lbl}</div></div>`).join('');

  const COLS_ORDER = ['nuevo','contactado','interesado','presupuesto_enviado','seguimiento','ganado','perdido','reactivar_luego'];
  const colColors  = {nuevo:'var(--text3)',contactado:'var(--blue)',interesado:'var(--accent)',
    presupuesto_enviado:'var(--purple)',seguimiento:'var(--yellow)',ganado:'var(--green)',
    perdido:'var(--red)',reactivar_luego:'var(--rose)'};

  const board = document.getElementById('kanbanBoard');
  board.innerHTML = COLS_ORDER.map(estado=>{
    const st  = LEAD_ESTADOS[estado]||{label:estado,icon:''};
    const col_leads = leads.filter(l=>l.estado===estado).sort((a,b)=>b.id-a.id);
    const cards = col_leads.length
      ? col_leads.map(l=>{
          const optns = COLS_ORDER.filter(s=>s!==estado)
            .map(s=>`<option value="${s}">${LEAD_ESTADOS[s]?.icon||''} ${LEAD_ESTADOS[s]?.label||s}</option>`)
            .join('');
          const qcHtml = canEditLead()
            ? `<div class="kc-actions" onclick="event.stopPropagation()">
                <select class="kc-select" onchange="cambiarEstadoLeadDesdeEmbudo(${l.id},this.value)">
                  <option value="">Mover a…</option>${optns}
                </select>
               </div>` : '';
          return `<div class="kanban-card" onclick="showLeadFicha(${l.id})">
            <div class="kc-name">${l.nombre} ${l.apellido}</div>
            <div class="kc-sub">${l.gabinete||l.ciudad||'—'}</div>
            <div class="kc-tech">${l.tecnologia||l.fuente||'—'}</div>
            ${l.fechaUpdate?`<div class="kc-date">📅 ${fmtDate(l.fechaUpdate)}</div>`:''}
            ${qcHtml}
          </div>`;
        }).join('')
      : `<div class="kanban-empty">Sin leads</div>`;

    return `<div class="kanban-col">
      <div class="kanban-col-head">
        <div class="kanban-col-title">
          <span style="color:${colColors[estado]}">${st.icon}</span> ${st.label}
        </div>
        <span class="kanban-col-count">${col_leads.length}</span>
      </div>
      <div class="kanban-col-body">${cards}</div>
    </div>`;
  }).join('');
}
