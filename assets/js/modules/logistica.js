/* ══════════════════════════════════
   LOGÍSTICA
══════════════════════════════════ */
function renderLogistica(){
  const reglas = DB.get('reglas_logisticas')||[];
  const sorted = [...reglas].sort((a,b)=>{
    // Maldonado y Salto primero, luego resto
    const prio = d => ['Maldonado','Salto'].includes(d) ? 0 : 1;
    return prio(a.departamento) - prio(b.departamento) || a.departamento.localeCompare(b.departamento);
  });

  document.getElementById('reglaGrid').innerHTML = sorted.map(r => `
    <div class="regla-card">
      <div>
        <div class="regla-dept">${r.departamento}</div>
        <div style="font-size:11px;margin-top:3px">${r.activa
          ? `<span style="color:var(--green);font-weight:600">● Activa</span>`
          : `<span style="color:var(--text3)">○ Usa default</span>`}</div>
      </div>
      <div class="regla-chips">
        ${r.mismoDia
          ? `<div class="regla-chip agil">⚡ Mismo día / Ágil</div>`
          : `<div class="regla-chip">Antes <span class="chip-val">${r.diasAntes}d</span></div>
             <div class="regla-chip">Jornada</div>
             <div class="regla-chip">Después <span class="chip-val">${r.diasDespues}d</span></div>`
        }
      </div>
      ${canEdit() ? `<button class="action-btn" onclick="openReglaModal('${r.departamento}')">Editar</button>` : ''}
    </div>`).join('');
}

function openReglaModal(dept){
  const reglas = DB.get('reglas_logisticas')||[];
  const r = reglas.find(x=>x.departamento===dept);
  if(!r) return;
  sv('reglaDept', dept);
  sv('reglaDeptLabel', dept);
  sv('reglaMismoDia', r.mismoDia?'true':'false');
  sv('reglaDiasAntes', r.diasAntes);
  sv('reglaDiasDespues', r.diasDespues);
  sv('reglaActiva', r.activa?'true':'false');
  document.getElementById('modalReglaTitle').textContent = `Regla: ${dept}`;
  onReglaMismoDiaChange();
  openModal('modalRegla');
}

function onReglaMismoDiaChange(){
  const mismoDia = gv('reglaMismoDia') === 'true';
  document.getElementById('reglaExtendidoFields').style.display = mismoDia ? 'none' : 'block';
}

function saveReglaLogistica(){
  const dept = gv('reglaDept');
  const reglas = DB.get('reglas_logisticas')||[];
  const idx = reglas.findIndex(r=>r.departamento===dept);
  if(idx < 0) return;
  const mismoDia = gv('reglaMismoDia') === 'true';
  reglas[idx] = {
    departamento: dept,
    mismoDia,
    diasAntes: mismoDia ? 0 : parseInt(gv('reglaDiasAntes'))||0,
    diasDespues: mismoDia ? 0 : parseInt(gv('reglaDiasDespues'))||0,
    activa: gv('reglaActiva') === 'true',
  };
  DB.set('reglas_logisticas', reglas);
  closeModal('modalRegla');
  showToast(`✅ Regla actualizada: ${dept}`);
  renderLogistica();
}

function resetReglasLogisticas(){
  if(!confirm('¿Restaurar todas las reglas a los valores por defecto?')) return;
  DB.del('reglas_logisticas');
  // Re-init just the reglas
  const deptUY = ['Montevideo','Canelones','Maldonado','Salto','Paysandú','Rivera','Artigas',
    'Colonia','Soriano','Río Negro','Tacuarembó','Treinta y Tres','Cerro Largo',
    'San José','Flores','Florida','Lavalleja','Rocha','Durazno'];
  const reglas = deptUY.map(d=>({
    departamento:d, diasAntes:(d==='Maldonado'||d==='Salto')?0:2,
    diasDespues:(d==='Maldonado'||d==='Salto')?0:2,
    mismoDia:(d==='Maldonado'||d==='Salto'), activa:true,
  }));
  reglas.push({departamento:'Argentina',diasAntes:3,diasDespues:3,mismoDia:false,activa:true});
  DB.set('reglas_logisticas', reglas);
  showToast('↺ Reglas restauradas al default');
  renderLogistica();
}
