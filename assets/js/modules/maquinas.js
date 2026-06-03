/* ══════════════════════════════════
   MÁQUINAS
══════════════════════════════════ */
let maqFilter={search:'',status:''};
const MAQ_CATEGORIAS_DEFAULT=['Láser Depilación','Radiofrecuencia / HIFU','IPL','Pressoterapia','Hidrofacial','Electroestimulación','Ultrasonido','Cavitación','Diodo + NDYAG','Otro'];
function maqTipoOperativoLabel(tipo){
  return {viajera:'Viajera',alquiler:'Viajera',base_ciudad:'Base ciudad',solo_venta:'Solo venta'}[tipo||'viajera'] || tipo;
}
function maqTipoOperativoBadge(m){
  const tipo=m?.tipoOperativo||m?.tipo_operativo||(m?.esViajera?'viajera':'base_ciudad');
  if(tipo==='viajera'||tipo==='alquiler')return '<span class="badge badge-blue">Viajera</span>';
  if(tipo==='base_ciudad')return `<span class="badge badge-blue">Base ${escapeHTML(m.ciudadBase||m.ciudad_base||m.ubicacion||'ciudad')}</span>`;
  if(tipo==='solo_venta')return '<span class="badge badge-yellow">Solo venta</span>';
  return '';
}
function badgeMaq(e){
  const m={disponible:'badge-green',reservada:'badge-rose',mantenimiento:'badge-yellow',fuera_servicio:'badge-red',en_viaje:'badge-blue'};
  const l={disponible:'Disponible',reservada:'Reservada',mantenimiento:'Mantenimiento',fuera_servicio:'Fuera Servicio',en_viaje:'En Viaje de China'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function badgeSubEstadoMaq(m){
  if(m?.puestaPuntoEstado==='pendiente')return '<span class="badge badge-yellow">Pendiente puesta a punto</span>';
  if(m?.puestaPuntoEstado==='completada')return '<span class="badge badge-green">Puesta a punto OK</span>';
  if(m?.tecnicoEstado==='en_tecnico')return '<span class="badge badge-red">En técnico</span>';
  if(m?.tecnicoEstado==='regresada')return '<span class="badge badge-green">Regresó del técnico</span>';
  return '';
}
function mapMaquinaLocal(m){
  return {id:m.id,codigo:m.codigo,nombre:m.nombre,
    categoria:m.categoria||'',ubicacion:m.ubicacion||'',estado:m.estado||'disponible',
    marca:m.marca||'',modelo:m.modelo||'',serie:m.serial_num||'',serial:m.serial_num||'',
    deptBase:m.dept_base||'Uruguay',ultMant:normalizeDateInput(m.ult_mant),proxMant:normalizeDateInput(m.prox_mant),
    fotoUrl:m.foto_url||'',iconoUrl:m.icono_url||'',esViajera:!!m.es_viajera,
    tipoOperativo:m.tipo_operativo==='alquiler'?'viajera':(m.tipo_operativo||(m.es_viajera?'viajera':'base_ciudad')),ciudadBase:m.ciudad_base||'',
    gestorPuestaPuntoId:m.gestor_puesta_punto_id||null,puestaPuntoEstado:m.puesta_punto_estado||'',
    puestaPuntoAsignadaEn:m.puesta_punto_asignada_en||'',puestaPuntoCompletadaEn:m.puesta_punto_completada_en||'',
    puestaPuntoWaEstado:m.puesta_punto_wa_estado||'',puestaPuntoWaNotificadoEn:m.puesta_punto_wa_notificado_en||'',puestaPuntoWaError:m.puesta_punto_wa_error||'',
    puestaPuntoChecklist:m.puesta_punto_checklist||{},puestaPuntoChecklistEn:m.puesta_punto_checklist_en||'',puestaPuntoChecklistResponsable:m.puesta_punto_checklist_responsable||'',
    tecnicoEstado:m.tecnico_estado||'',tecnicoNombre:m.tecnico_nombre||'',
    tecnicoSalidaEn:m.tecnico_salida_en||'',tecnicoRegresoEn:m.tecnico_regreso_en||'',
    disponibilidadVisibleGestor:!!m.disponibilidad_visible_gestor,
    obs:m.obs||''};
}
function maqPrecioNorm(v){
  return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function maqPrecioEquipo(m){
  const raw=maqPrecioNorm([m.nombre,m.marca,m.modelo,m.categoria,m.obs].filter(Boolean).join(' '));
  if(/22d/.test(raw)||/liposonix/.test(raw))return 'HIFU 22D MAX con Liposonix';
  if(/hifu/.test(raw)&&/(12d max|12 d max|max)/.test(raw))return 'HIFU 12D MAX';
  if(/hifu/.test(raw)||/12d/.test(raw))return 'HIFU 12D';
  if(/pressoterapia|presoterapia|botas/.test(raw))return 'Pressoterapia';
  if(/exilis/.test(raw))return 'Exilis';
  if(/hidrofacial|hydrafacial|facial/.test(raw))return 'Hidrofacial';
  if(/\bems\b|electroestimulacion|electro estimulacion/.test(raw))return 'EMS / Electroestimulación';
  if(/soprano|titanium|ice|laser|depil|depi/.test(raw))return 'Soprano Titanium Ice';
  return m.categoria||m.nombre||'';
}
function maqPrecioFormato(m){
  const raw=maqPrecioNorm([m.nombre,m.marca,m.modelo,m.categoria,m.obs].filter(Boolean).join(' '));
  if(/de pie|vertical|torre|grande|standing|floor|ndyag|ndyac/.test(raw))return 'de pie';
  if(/escritorio|desktop|mesa|portatil|portátil|chica/.test(raw))return 'de escritorio';
  return '';
}
function maqPrecioFmt(v){
  return (typeof precioMaqFmt==='function'?precioMaqFmt(v):(Number(v)||0).toLocaleString('es-UY',{maximumFractionDigits:0}));
}
function maqPrecioModalidad(m){
  return typeof precioMaqModalidadLabel==='function'?precioMaqModalidadLabel(m):m;
}
function renderMaqPreciosFicha(m){
  if(!canEdit())return '';
  const equipo=maqPrecioEquipo(m);
  const formato=maqPrecioFormato(m);
  const tarifas=(DB.get('maquina_tarifas')||[]).filter(t=>{
    if(t.equipo!==equipo)return false;
    if(formato&&t.formato&&t.formato!==formato)return false;
    return true;
  }).sort((a,b)=>
    (a.formato||'').localeCompare(b.formato||'','es')||
    (a.localidad||'').localeCompare(b.localidad||'','es')||
    ((typeof precioMaqOrdenModalidad==='function'?precioMaqOrdenModalidad(a.modalidad):0)-(typeof precioMaqOrdenModalidad==='function'?precioMaqOrdenModalidad(b.modalidad):0))
  );
  return `<div class="info-card full">
    <h4>💲 Precios por zona</h4>
    ${tarifas.length?`<div style="overflow-x:auto"><table>
      <thead><tr><th>Formato</th><th>Zona</th><th>Variable</th><th style="text-align:right">Precio</th><th>Condición</th></tr></thead>
      <tbody>${tarifas.map(t=>`<tr>
        <td>${escapeHTML(t.formato||'General')}</td>
        <td>${escapeHTML(t.localidad||'—')}</td>
        <td>${t.inicioSuave?'<span class="badge badge-green">Inicio suave</span>':escapeHTML(maqPrecioModalidad(t.modalidad))}</td>
        <td style="text-align:right"><strong>${maqPrecioFmt(t.precio)}</strong> ${escapeHTML(t.moneda||'UYU')}</td>
        <td>${escapeHTML(t.condicion||'—')}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <div style="margin-top:10px"><button class="action-btn" onclick="preciosMaqFilter.equipo='${escapeAttr(equipo)}';preciosMaqFilter.formato='${escapeAttr(formato)}';navigate('precios-maquinas');renderPreciosMaquinas()">Editar matriz de precios</button></div>`:
    `<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin precios cargados para ${escapeHTML(equipo)}${formato?' '+escapeHTML(formato):''}.</div>
    <div><button class="action-btn" onclick="preciosMaqFilter.equipo='${escapeAttr(equipo)}';preciosMaqFilter.formato='${escapeAttr(formato)}';preciosMaqNuevo=true;navigate('precios-maquinas');renderPreciosMaquinas()">Agregar precio</button></div>`}
  </div>`;
}
function maquinaPhotoUrl(m){
  const url=m?.fotoUrl||m?.foto_url||'';
  if(!url)return '';
  if(/^https?:\/\//.test(url))return url;
  return window.location.origin+url;
}
function isMaquinaViajera(m){
  return !!(m&&(m.tipoOperativo==='viajera'||m.tipoOperativo==='alquiler'||m.esViajera));
}
function maquinaGestionOrden(m){
  if(m.puestaPuntoEstado==='pendiente')return 1;
  if(m.tecnicoEstado==='en_tecnico')return 2;
  if(m.estado==='fuera_servicio')return 3;
  if(m.estado==='mantenimiento')return 4;
  if(m.estado==='disponible')return 5;
  return 6;
}
function maquinaGestionDias(value){
  const f=value?(typeof normalizeDateInput==='function'?normalizeDateInput(value):String(value).slice(0,10)):'';
  return f?Math.max(0,daysDiff(f,today())):0;
}
function renderMaqMiniList(items,empty){
  if(!items.length)return `<div class="machine-ops-empty">${escapeHTML(empty)}</div>`;
  return items.slice(0,5).map(m=>`<button type="button" class="machine-ops-row" onclick="showMaqFicha(${m.id})">
    <span><strong>${escapeHTML(m.codigo||'')}</strong> ${escapeHTML(m.nombre||'')}</span>
    <small>${escapeHTML(m.ubicacion||'Sin ubicación')}${m.gestionDias!==undefined?` · ${m.gestionDias}d`:''}</small>
  </button>`).join('');
}
function renderMaquinasViajerasPanel(baseMaqs){
  const el=document.getElementById('maquinasViajerasPanel');if(!el)return;
  const viajeras=baseMaqs.filter(isMaquinaViajera).sort((a,b)=>maquinaGestionOrden(a)-maquinaGestionOrden(b)||String(a.codigo||'').localeCompare(String(b.codigo||'')));
  const pendiente=viajeras.filter(m=>m.puestaPuntoEstado==='pendiente').map(m=>({...m,gestionDias:maquinaGestionDias(m.puestaPuntoAsignadaEn)})).sort((a,b)=>b.gestionDias-a.gestionDias);
  const tecnico=viajeras.filter(m=>m.tecnicoEstado==='en_tecnico').map(m=>({...m,gestionDias:maquinaGestionDias(m.tecnicoSalidaEn)})).sort((a,b)=>b.gestionDias-a.gestionDias);
  const disponibles=viajeras.filter(m=>m.estado==='disponible'&&!m.puestaPuntoEstado&&!m.tecnicoEstado);
  const fuera=viajeras.filter(m=>m.estado==='fuera_servicio'||m.estado==='mantenimiento').filter(m=>m.puestaPuntoEstado!=='pendiente'&&m.tecnicoEstado!=='en_tecnico');
  const demoradas=pendiente.filter(m=>m.gestionDias>=1).length+tecnico.filter(m=>m.gestionDias>=7).length;
  if(!viajeras.length){el.innerHTML='';return;}
  el.innerHTML=`
    ${demoradas?`<div class="alert-banner ${tecnico.some(m=>m.gestionDias>=7)?'danger':'warn'}" style="margin-bottom:12px"><span class="ab-icon">⚠️</span><div><strong>${demoradas} alerta${demoradas!==1?'s':''} operativa${demoradas!==1?'s':''}</strong> — Hay máquinas viajeras demoradas en preparación o técnico.</div></div>`:''}
    <div class="machine-ops-summary">
      ${[
        ['Viajeras',viajeras.length,'', ''],
        ['Pendientes puesta a punto',pendiente.length,'mantenimiento','warn'],
        ['En técnico',tecnico.length,'fuera_servicio','danger'],
        ['Disponibles',disponibles.length,'disponible','ok'],
        ['No operativas',fuera.length,'mantenimiento','muted'],
      ].map(([label,value,status,tone])=>`<button type="button" class="machine-ops-stat ${tone}" onclick="${status?`filterMaqStatus('${status}')`:`filterMaqStatus('')`}">
        <span>${escapeHTML(label)}</span><strong>${value}</strong>
      </button>`).join('')}
    </div>
    <div class="machine-ops-grid">
      <div class="machine-ops-card">
        <h4>Pendientes de puesta a punto</h4>
        ${renderMaqMiniList(pendiente,'Sin máquinas pendientes.')}
      </div>
      <div class="machine-ops-card">
        <h4>En técnico</h4>
        ${renderMaqMiniList(tecnico,'Sin máquinas en técnico.')}
      </div>
      <div class="machine-ops-card">
        <h4>Disponibles para alquilar</h4>
        ${renderMaqMiniList(disponibles,'Sin viajeras disponibles.')}
      </div>
    </div>`;
}
function getNextMaquinaCodigoLocal(){
  const nums=(DB.get('maquinas')||[])
    .map(m=>String(m.codigo||'').match(/^OP-(\d+)$/))
    .filter(Boolean)
    .map(m=>parseInt(m[1],10))
    .filter(n=>Number.isFinite(n));
  const next=(nums.length?Math.max(...nums):0)+1;
  return 'OP-'+String(next).padStart(3,'0');
}
async function setNextMaquinaCodigo(){
  sv('maqCodigo',getNextMaquinaCodigoLocal());
  if(typeof api!=='function')return;
  try{
    const data=await api('/api/maquinas/siguiente-codigo');
    if(data?.codigo&&!gv('maqId'))sv('maqCodigo',data.codigo);
  }catch(e){}
}
function renderMaquinas(){
  const opActual=isOperadoraUser()?getOp(currentUser?.operadora_id):null;
  const visibles=(DB.get('maquinas')||[]).filter(m=>maquinaVisibleParaOperadora(m,opActual));
  renderMaquinasViajerasPanel(visibles);
  const maqs=visibles.filter(m=>{
    const q=maqFilter.search.toLowerCase();
    const ms=!q||(m.codigo+' '+m.nombre+' '+m.categoria+' '+m.ubicacion).toLowerCase().includes(q);
    return ms&&(!maqFilter.status||m.estado===maqFilter.status);
  });
  const tbody=document.getElementById('maqTableBody');
  if(!maqs.length){tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="icon">⚙️</div><h3>Sin resultados</h3></div></td></tr>`;return;}
  tbody.innerHTML=maqs.map(m=>`<tr>
    <td><span style="font-family:monospace;color:var(--accent);font-size:12px">${escapeHTML(m.codigo)}</span></td>
    <td><div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">${maquinaPhotoUrl(m)?`<img class="machine-mini-thumb" src="${escapeAttr(maquinaPhotoUrl(m))}" alt="${escapeAttr(m.nombre)}"/>`:'<span class="machine-mini-thumb" style="display:inline-flex;align-items:center;justify-content:center;color:var(--text3);font-size:15px">⚙️</span>'}<span class="bold">${escapeHTML(m.nombre)}</span>${maqTipoOperativoBadge(m)}</div></td><td>${escapeHTML(m.categoria)}</td>
    <td>${escapeHTML(m.ubicacion)}</td><td>${badgeMaq(m.estado)} ${badgeSubEstadoMaq(m)}</td><td>${fmtDate(m.ultMant)}</td>
    <td style="white-space:nowrap">
      <button class="action-btn" onclick="showMaqFicha(${m.id})">Ver</button>
      ${canEdit()?`<button class="action-btn" onclick="openMaqModal(${m.id})" style="margin-left:4px">Editar</button>`:''}
    </td></tr>`).join('');
}
function filterMaquinas(v){maqFilter.search=v;renderMaquinas();}
function filterMaqStatus(v){maqFilter.status=v;renderMaquinas();}

function maqReservaFechaInicio(r){
  return r?.tipo==='jornada' ? (r.fechaJornada||r.fechaInicio||'') : (r?.fechaInicio||r?.fechaJornada||'');
}
function maqReservaFechaFin(r){
  return r?.tipo==='jornada' ? (r.fechaJornada||r.fechaFin||'') : (r?.fechaFin||r?.fechaInicio||r?.fechaJornada||'');
}
function maqReservaActivaHoy(r,hoy){
  const inicio=maqReservaFechaInicio(r);
  const fin=maqReservaFechaFin(r)||inicio;
  return ESTADOS_ACTIVOS.includes(r.estado)&&inicio&&inicio<=hoy&&fin>=hoy;
}
function maqResumenReservas(reservas){
  const hoy=today();
  const ordenadas=reservas.slice().sort((a,b)=>(maqReservaFechaInicio(a)||'').localeCompare(maqReservaFechaInicio(b)||''));
  const activa=ordenadas.find(r=>maqReservaActivaHoy(r,hoy));
  const proxima=ordenadas.find(r=>ESTADOS_ACTIVOS.includes(r.estado)&&(maqReservaFechaInicio(r)||'')>=hoy);
  const ultima=ordenadas.slice().reverse().find(r=>(maqReservaFechaInicio(r)||'')<hoy);
  return {activa,proxima,ultima,total:reservas.length,activas:reservas.filter(r=>ESTADOS_ACTIVOS.includes(r.estado)).length};
}
function maqMantResumen(m){
  const prox=m.proxMant&&m.proxMant!=='—'?m.proxMant:'';
  if(!prox)return {label:'Sin próximo',tone:'muted',detail:'No hay fecha de mantenimiento cargada'};
  const dias=daysDiff(today(),prox);
  if(prox<today())return {label:'Vencido',tone:'danger',detail:`Venció ${fmtDate(prox)}`};
  if(dias<=7)return {label:'Próximo',tone:'warn',detail:`En ${dias} día${dias!==1?'s':''}`};
  return {label:'Vigente',tone:'ok',detail:fmtDate(prox)};
}
function maqDisponibilidadResumen(m,reservas){
  const hoy=today();
  const activa=reservas.find(r=>maqReservaActivaHoy(r,hoy));
  if(m.tecnicoEstado==='en_tecnico')return {label:'En técnico',tone:'danger',detail:m.tecnicoNombre||'Fuera de disponibilidad'};
  if(m.puestaPuntoEstado==='pendiente')return {label:'Puesta a punto',tone:'warn',detail:`${maquinaGestionDias(m.puestaPuntoAsignadaEn)} día${maquinaGestionDias(m.puestaPuntoAsignadaEn)!==1?'s':''} en gestión`};
  if(['mantenimiento','fuera_servicio','en_viaje'].includes(m.estado))return {label:badgeTxt(m.estado),tone:'danger',detail:'No disponible para reservar'};
  if(m.tipoOperativo==='solo_venta')return {label:'Solo venta',tone:'warn',detail:'No disponible para alquiler'};
  if(activa)return {label:'Ocupada hoy',tone:'warn',detail:activa.codigo||'Reserva activa'};
  if(m.estado==='disponible')return {label:'Disponible',tone:'ok',detail:'Lista para reservar'};
  return {label:badgeTxt(m.estado),tone:'muted',detail:'Revisar estado operativo'};
}
function maqHeroMetric(label,value,detail,tone){
  return `<div class="machine-hero-metric ${tone||''}">
    <span>${escapeHTML(label)}</span>
    <strong>${value}</strong>
    <small>${escapeHTML(detail||'')}</small>
  </div>`;
}
function renderMaqFichaHero(m,reservas,foto){
  const resumen=maqResumenReservas(reservas);
  const disp=maqDisponibilidadResumen(m,reservas);
  const mant=maqMantResumen(m);
  const reservaRef=resumen.activa||resumen.proxima||resumen.ultima;
  const reservaLabel=resumen.activa?'Activa hoy':resumen.proxima?'Próxima reserva':resumen.ultima?'Última reserva':'Sin reservas';
  const reservaDetail=reservaRef?`${reservaRef.codigo||''} · ${fmtDate(maqReservaFechaInicio(reservaRef))}`:'Todavía no registra movimientos';
  return `<section class="machine-profile-hero">
    <div class="machine-profile-media ${foto?'':'empty'}">
      ${foto?`<button type="button" onclick="openImageLightbox('${escapeAttr(foto)}','${escapeAttr(m.nombre)}')" title="Ampliar foto">
        <img src="${escapeAttr(foto)}" alt="${escapeAttr(m.nombre)}"/>
      </button>`:`<div class="machine-profile-empty">Sin foto</div>`}
      <div class="machine-profile-badges">
        ${badgeMaq(m.estado)}
        ${badgeSubEstadoMaq(m)}
        ${maqTipoOperativoBadge(m)}
      </div>
    </div>
    <div class="machine-profile-main">
      <div class="machine-profile-kicker">${escapeHTML(m.codigo||'')} · ${escapeHTML(m.categoria||'Sin categoría')}</div>
      <h2>${escapeHTML(m.nombre||'Máquina')}</h2>
      <div class="machine-profile-sub">${escapeHTML(m.ubicacion||'Sin ubicación')} · ${escapeHTML(maqTipoOperativoLabel(m.tipoOperativo))}${m.ciudadBase?' · Base '+escapeHTML(m.ciudadBase):''}</div>
      <div class="machine-hero-grid">
        ${maqHeroMetric('Disponibilidad',disp.label,disp.detail,disp.tone)}
        ${maqHeroMetric('Mantenimiento',mant.label,mant.detail,mant.tone)}
        ${maqHeroMetric(reservaLabel,reservaRef?(reservaRef.codigo||'Reserva'):'0',reservaDetail,resumen.activa?'warn':'')}
        ${maqHeroMetric('Reservas activas',String(resumen.activas),`${resumen.total} total`,resumen.activas?'':'muted')}
      </div>
      <div class="machine-profile-actions">
        ${canEdit()?`<button class="btn-secondary" onclick="openMaqModal(${m.id})">Editar máquina</button>`:''}
        ${canEdit()?`<button class="btn-secondary" onclick="openMantModal(${m.id})">Registrar mantenimiento</button>`:''}
        ${canEdit()?`<button class="btn-secondary" onclick="openIncidenciaMaquinaModal(${m.id})">Registrar incidencia</button>`:''}
        ${canEdit()&&m.puestaPuntoEstado==='pendiente'?`<button class="btn-add" onclick="openAltaPuestaPuntoModal(${m.id})">Dar alta disponible</button>`:''}
      </div>
    </div>
  </section>`;
}
function showMaqFicha(id){
  const maqs=DB.get('maquinas')||[];const m=maqs.find(x=>x.id===id);if(!m)return;
  const opActual=isOperadoraUser()?getOp(currentUser?.operadora_id):null;
  if(!maquinaVisibleParaOperadora(m,opActual)){showToast('⛔ Máquina no disponible para tus localidades declaradas','warn');return;}
  const reservas=(DB.get('reservas')||[]).filter(r=>r.maquinaId===id);
  const foto=maquinaPhotoUrl(m);
  navigate('maquina-ficha');
  document.getElementById('fichaMaqContent').innerHTML=`
    ${renderMaqFichaHero(m,reservas,foto)}
    <div class="ficha-header">
      <div class="ficha-header-left">
        <div class="ficha-avatar maq">⚙️</div>
        <div class="ficha-title"><h2>${escapeHTML(m.nombre)}</h2><p style="font-family:monospace;color:var(--accent)">${escapeHTML(m.codigo)}</p></div>
      </div>
      <div class="ficha-actions">
        ${badgeMaq(m.estado)}
        ${badgeSubEstadoMaq(m)}
        ${canEdit()?`<button class="btn-secondary" onclick="openMaqModal(${m.id})">✏️ Editar</button>`:''}
        ${isSuperAdmin()?`<button class="btn-danger" onclick="deleteMaquina(${m.id})">🗑</button>`:''}
      </div>
    </div>
    <div class="ficha-grid">
      <div class="info-card full">
        <h4>📷 Vista previa para operadoras</h4>
        ${foto?`<div class="machine-photo-card" onclick="openImageLightbox('${escapeAttr(foto)}','${escapeAttr(m.nombre)}')">
          <img src="${escapeAttr(foto)}" alt="${escapeAttr(m.nombre)}"/>
          <div class="caption">Tocar la foto para ampliar</div>
        </div>`:`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin foto cargada para esta máquina.</div>`}
      </div>
      <div class="info-card">
        <h4>🔧 Datos Técnicos</h4>
        ${ir('Código',`<span style="font-family:monospace;color:var(--accent)">${escapeHTML(m.codigo)}</span>`)}
        ${ir('Nombre',escapeHTML(m.nombre))}${ir('Categoría',escapeHTML(m.categoria))}${ir('Marca',escapeHTML(m.marca||'—'))}
        ${ir('Modelo/Tipo',escapeHTML(m.modelo||'—'))}${ir('Uso operativo',`${escapeHTML(maqTipoOperativoLabel(m.tipoOperativo))}${m.tipoOperativo==='base_ciudad'&&m.ciudadBase?' · Base '+escapeHTML(m.ciudadBase):''}`)}${ir('Ícono URL',m.iconoUrl?escapeHTML(m.iconoUrl):'—')}${ir('Estado',badgeMaq(m.estado))}
      </div>
      <div class="info-card">
        <h4>📍 Ubicación y Mantenimiento</h4>
        ${ir('País Base',escapeHTML(m.deptBase||'Uruguay'))}${ir('Ubicación actual',escapeHTML(m.ubicacion||'—'))}
        ${ir('Último mantenimiento',fmtDate(m.ultMant))}${ir('Próximo mantenimiento',fmtDate(m.proxMant))}
        ${ir('Puesta a punto',badgeSubEstadoMaq(m)||'—')}
        ${m.gestorPuestaPuntoId?ir('Gestor asignado',escapeHTML(getTransportistaNombreMaq(m.gestorPuestaPuntoId))):''}
        ${m.puestaPuntoWaEstado?ir('WhatsApp gestor',`${escapeHTML(m.puestaPuntoWaEstado)}${m.puestaPuntoWaNotificadoEn?' · '+fmtDate(m.puestaPuntoWaNotificadoEn):''}${m.puestaPuntoWaError?' · '+escapeHTML(m.puestaPuntoWaError):''}`):''}
        ${m.tecnicoEstado?ir('Técnico',`${badgeSubEstadoMaq(m)} ${escapeHTML(m.tecnicoNombre||'')}`):''}
      </div>
      ${renderMaqPreciosFicha(m)}
      ${renderGestionViajeraPanel(m)}
      <div class="info-card">
        <h4>📅 Reservas (${reservas.length})</h4>
        ${reservas.length?reservas.slice(0,5).map(r=>{
          const op=getOp(r.operadoraId);
          return `<div class="dash-list-item"><div><div class="name">${escapeHTML(op?op.nombre+' '+op.apellido:'—')}</div><div class="sub">${fmtDate(r.fechaInicio)} → ${fmtDate(r.fechaFin)}</div></div><div style="display:flex;gap:6px;align-items:center">${badgeRes(r.estado)}<button class="action-btn" onclick="showResFicha(${r.id})">Ver</button></div></div>`;
        }).join(''):`<div style="color:var(--text3);font-size:13px;padding:12px 0">Sin reservas registradas.</div>`}
      </div>
      <div class="info-card full">
        <h4>🗒 Observaciones Técnicas</h4>
        <div class="obs-text">${escapeHTML(m.obs||'Sin observaciones técnicas.')}</div>
      </div>
      ${renderMaqIncidenciasPlaceholder(m.id)}
      ${renderMaqMovimientosPlaceholder(m.id)}
    </div>`;
  cargarMaqIncidencias(m.id);
  cargarMaqMovimientos(m.id);
}

function getTransportistaNombreMaq(id){
  const t=(DB.get('transportistas')||[]).find(x=>parseInt(x.id)===parseInt(id));
  return t?`${t.nombre||''}`:'Gestor #'+id;
}

function maqMovTipoLabel(tipo){
  return {
    creada:'Creada',
    actualizada:'Actualizada',
    puesta_punto_asignada:'Asignada a puesta a punto',
    puesta_punto_alta:'Alta puesta a punto',
    tecnico_baja:'Salida a técnico',
    tecnico_alta:'Regreso de técnico',
    foto_actualizada:'Foto actualizada',
    incidencia_creada:'Incidencia técnica creada',
    incidencia_actualizada:'Incidencia técnica actualizada',
    incidencia_cerrada:'Incidencia técnica cerrada',
  }[tipo]||tipo;
}

function renderMaqMovimientosPlaceholder(maquinaId){
  return `<div class="info-card full">
    <h4>🧾 Historial de movimientos</h4>
    <div id="maqMovimientosBox-${maquinaId}" class="machine-history-box">
      <div class="machine-ops-empty">Cargando historial...</div>
    </div>
  </div>`;
}

async function cargarMaqMovimientos(maquinaId){
  const box=document.getElementById('maqMovimientosBox-'+maquinaId);
  if(!box)return;
  try{
    const rows=await api('/api/maquinas/'+maquinaId+'/movimientos');
    if(!rows.length){
      box.innerHTML='<div class="machine-ops-empty">Sin movimientos registrados todavía.</div>';
      return;
    }
    box.innerHTML=rows.map(m=>`<div class="machine-history-row">
      <div class="machine-history-dot"></div>
      <div class="machine-history-body">
        <div class="machine-history-title">${escapeHTML(maqMovTipoLabel(m.tipo))}</div>
        <div class="machine-history-sub">
          ${escapeHTML(m.detalle||'')}
          ${m.ubicacion?` · ${escapeHTML(m.ubicacion)}`:''}
          ${m.gestor_nombre?` · Gestor: ${escapeHTML(m.gestor_nombre)}`:''}
          ${m.tecnico_nombre?` · Técnico: ${escapeHTML(m.tecnico_nombre)}`:''}
        </div>
        <div class="machine-history-meta">${fmtDate(m.created_at)}${m.usuario_email?' · '+escapeHTML(m.usuario_email):''}${m.estado_anterior||m.estado_nuevo?` · ${escapeHTML(m.estado_anterior||'—')} → ${escapeHTML(m.estado_nuevo||'—')}`:''}</div>
      </div>
    </div>`).join('');
  }catch(e){
    box.innerHTML='<div class="machine-ops-empty">No se pudo cargar el historial.</div>';
  }
}

function incidenciaEstadoBadge(estado){
  const cls={abierta:'badge-red',en_revision:'badge-yellow',resuelta:'badge-green',descartada:'badge-gray'}[estado]||'badge-gray';
  const lbl={abierta:'Abierta',en_revision:'En revisión',resuelta:'Resuelta',descartada:'Descartada'}[estado]||estado;
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function incidenciaGravedadBadge(gravedad){
  const cls={baja:'badge-gray',media:'badge-yellow',alta:'badge-red',critica:'badge-red'}[gravedad]||'badge-gray';
  const lbl={baja:'Baja',media:'Media',alta:'Alta',critica:'Crítica'}[gravedad]||gravedad;
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function incidenciaTipoLabel(tipo){
  return {falla_tecnica:'Falla técnica',limpieza:'Limpieza',accesorio_faltante:'Accesorio faltante',daño:'Daño',uso_indebido:'Uso indebido',otro:'Otro'}[tipo]||tipo;
}
function renderMaqIncidenciasPlaceholder(maquinaId){
  const puedeCrear=canEdit()||currentUser?.rol==='transportista'||isOperadoraUser();
  return `<div class="info-card full">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <h4>🚨 Incidencias técnicas</h4>
      ${puedeCrear?`<button class="btn-secondary" onclick="openIncidenciaMaquinaModal(${maquinaId})">Registrar incidencia</button>`:''}
    </div>
    <div id="maqIncidenciasBox-${maquinaId}" class="machine-incident-box">
      <div class="machine-ops-empty">Cargando incidencias...</div>
    </div>
  </div>`;
}
async function cargarMaqIncidencias(maquinaId){
  const box=document.getElementById('maqIncidenciasBox-'+maquinaId);
  if(!box)return;
  try{
    const rows=await api('/api/maquinas/'+maquinaId+'/incidencias');
    if(!rows.length){
      box.innerHTML='<div class="machine-ops-empty">Sin incidencias registradas.</div>';
      return;
    }
    box.innerHTML=rows.map(i=>`<div class="machine-incident-row ${i.bloquea_reservas&&['abierta','en_revision'].includes(i.estado)?'blocking':''}">
      <div class="machine-incident-head">
        <div><strong>${escapeHTML(incidenciaTipoLabel(i.tipo))}</strong> ${incidenciaGravedadBadge(i.gravedad)} ${incidenciaEstadoBadge(i.estado)} ${i.bloquea_reservas?'<span class="badge badge-red">Bloquea reservas</span>':''}</div>
        <small>${fmtDate(i.created_at)}${i.reportado_por_email?' · '+escapeHTML(i.reportado_por_email):''}</small>
      </div>
      <div class="machine-incident-desc">${escapeHTML(i.descripcion||'')}</div>
      <div class="machine-incident-meta">
        ${i.reserva_codigo?`Reserva: ${escapeHTML(i.reserva_codigo)} · `:''}
        ${i.operadora_nombre?`Operadora: ${escapeHTML((i.operadora_nombre||'')+' '+(i.operadora_apellido||''))} · `:''}
        ${i.evidencia_url?`<a href="${escapeAttr(i.evidencia_url)}" target="_blank" rel="noopener">Ver evidencia</a>`:''}
      </div>
      ${i.resolucion?`<div class="machine-incident-resolution">Resolución: ${escapeHTML(i.resolucion)}</div>`:''}
      ${canEdit()&&['abierta','en_revision'].includes(i.estado)?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="action-btn" onclick="actualizarIncidenciaMaquina(${maquinaId},${i.id},'en_revision')">Marcar en revisión</button>
        <button class="action-btn" onclick="actualizarIncidenciaMaquina(${maquinaId},${i.id},'resuelta')">Cerrar resuelta</button>
        <button class="action-btn" onclick="actualizarIncidenciaMaquina(${maquinaId},${i.id},'descartada')">Descartar</button>
      </div>`:''}
    </div>`).join('');
  }catch(e){
    box.innerHTML='<div class="machine-ops-empty">No se pudieron cargar las incidencias.</div>';
  }
}

function renderGestionViajeraPanel(m){
  const esViajera=(m.tipoOperativo==='viajera'||m.tipoOperativo==='alquiler'||m.esViajera);
  if(!esViajera)return '';
  const isGestor=currentUser?.rol==='transportista'&&parseInt(currentUser.transportista_id)===parseInt(m.gestorPuestaPuntoId)&&m.disponibilidadVisibleGestor;
  const canOps=canEdit();
  if(!canOps&&!isGestor)return '';
  return `<div class="info-card full">
    <h4>🧼 Gestión viajera / puesta a punto</h4>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${canOps?`<button class="btn-secondary" onclick="openPuestaPuntoModal(${m.id})">Asignar puesta a punto</button>`:''}
      ${(canOps||isGestor)&&m.puestaPuntoEstado==='pendiente'?`<button class="btn-add" onclick="openAltaPuestaPuntoModal(${m.id})">Dar alta disponible</button>`:''}
      ${canOps?`<button class="btn-secondary" onclick="enviarMaquinaTecnico(${m.id})">Llevar al técnico / baja</button>`:''}
      ${canOps&&m.tecnicoEstado==='en_tecnico'?`<button class="btn-add" onclick="recibirMaquinaTecnico(${m.id})">Regresó del técnico / alta</button>`:''}
    </div>
    <div class="docs-line" style="margin-top:8px">Mientras está en puesta a punto o técnico queda fuera de disponibilidad para reservas.</div>
    ${renderPuestaPuntoChecklist(m)}
  </div>`;
}

function puestaPuntoChecklistItems(){
  return [
    ['limpieza_exterior','Limpieza exterior realizada'],
    ['limpieza_cabezales','Cabezales y accesorios limpios'],
    ['cables_conectores','Cableado y conectores revisados'],
    ['prueba_encendido','Prueba de encendido correcta'],
    ['prueba_funcional','Prueba funcional básica correcta'],
    ['accesorios_controlados','Piezas y accesorios controlados'],
    ['foto_post_limpieza','Foto post limpieza cargada o verificada'],
  ];
}

function renderPuestaPuntoChecklist(m){
  const checklist=m.puestaPuntoChecklist||{};
  if(!m.puestaPuntoChecklistEn&&!Object.keys(checklist).length)return '';
  return `<div class="machine-checklist-summary">
    <div class="machine-checklist-title">Último checklist de puesta a punto</div>
    <div class="machine-checklist-grid">
      ${puestaPuntoChecklistItems().map(([key,label])=>`<span class="${checklist[key]?'ok':'pending'}">${checklist[key]?'✓':'•'} ${escapeHTML(label)}</span>`).join('')}
    </div>
    <div class="docs-line">Registrado ${fmtDate(m.puestaPuntoChecklistEn)}${m.puestaPuntoChecklistResponsable?' · '+escapeHTML(m.puestaPuntoChecklistResponsable):''}</div>
  </div>`;
}

function openPuestaPuntoModal(maquinaId){
  const m=(DB.get('maquinas')||[]).find(x=>parseInt(x.id)===parseInt(maquinaId));if(!m)return;
  const gestores=(DB.get('transportistas')||[]).filter(t=>t.tipo==='persona_fisica'&&t.estado!=='eliminado'&&t.estado!=='inactivo');
  if(!gestores.length){showToast('⚠️ Cargá primero una empresa/persona física activa en Transportistas','warn');return;}
  const old=document.getElementById('modalPuestaPunto');if(old)old.remove();
  const div=document.createElement('div');
  div.id='modalPuestaPunto';
  div.className='modal-overlay open';
  div.innerHTML=`<div class="modal-box">
    <div class="modal-header"><span class="modal-title">Asignar puesta a punto</span><button class="btn-close" onclick="document.getElementById('modalPuestaPunto').remove()">✕</button></div>
    <div class="form-grid">
      <div class="form-field"><label>Máquina</label><input value="${escapeAttr(m.codigo+' — '+m.nombre)}" disabled></div>
      <div class="form-field"><label>Gestor persona física</label><select id="ppGestor">${gestores.map(t=>`<option value="${t.id}">${escapeHTML(t.nombre)}${t.ciudad?' · '+escapeHTML(t.ciudad):''}</option>`).join('')}</select></div>
      <div class="form-field full"><label>Base estética / ubicación donde llegó</label><input id="ppUbicacion" value="${escapeAttr(m.ubicacion||'')}" placeholder="Ej: Estética X - Maldonado"></div>
      <div class="form-field full"><label>Observación</label><textarea id="ppObs" placeholder="Ej: llegó de jornada, limpiar cabezales, revisar accesorios"></textarea></div>
    </div>
    <button class="btn-add full-width" onclick="asignarPuestaPunto(${m.id})">Asignar y avisar</button>
  </div>`;
  document.body.appendChild(div);
}

async function refrescarMaquinasDespuesGestion(id){
  const maqs=await api('/api/maquinas');
  DB.set('maquinas',maqs.map(mapMaquinaLocal));
  renderMaquinas();
  showMaqFicha(id);
}

async function asignarPuestaPunto(id){
  try{
    await api('/api/maquinas/'+id+'/puesta-punto/asignar',{method:'POST',body:JSON.stringify({
      gestor_puesta_punto_id:gv('ppGestor'),
      ubicacion:gv('ppUbicacion'),
      obs:gv('ppObs')
    })});
    document.getElementById('modalPuestaPunto')?.remove();
    await refrescarMaquinasDespuesGestion(id);
    showToast('✅ Puesta a punto asignada. WhatsApp enviado o en cola sin duplicar.');
  }catch(e){showToast('❌ '+e.message,'error');}
}

function openAltaPuestaPuntoModal(id){
  const m=(DB.get('maquinas')||[]).find(x=>parseInt(x.id)===parseInt(id));if(!m)return;
  const old=document.getElementById('modalAltaPuestaPunto');if(old)old.remove();
  const div=document.createElement('div');
  div.id='modalAltaPuestaPunto';
  div.className='modal-overlay open';
  div.innerHTML=`<div class="modal-box">
    <div class="modal-header"><span class="modal-title">Checklist de puesta a punto</span><button class="btn-close" onclick="document.getElementById('modalAltaPuestaPunto').remove()">✕</button></div>
    <div class="docs-line" style="margin-bottom:10px">Para dejar disponible ${escapeHTML(m.codigo||'')} — ${escapeHTML(m.nombre||'')} confirmá todos los controles.</div>
    <div class="machine-checklist-form">
      ${puestaPuntoChecklistItems().map(([key,label])=>`<label class="check-row"><input type="checkbox" id="ppChk_${key}"><span>${escapeHTML(label)}</span></label>`).join('')}
    </div>
    <div class="form-field full" style="margin-top:12px"><label>Observación</label><textarea id="ppAltaObs">Limpieza y revisión completadas. Máquina disponible.</textarea></div>
    <button class="btn-add full-width" onclick="completarAltaPuestaPunto(${m.id})">Confirmar alta disponible</button>
  </div>`;
  document.body.appendChild(div);
}

async function completarAltaPuestaPunto(id){
  const checklist={};
  const faltantes=[];
  puestaPuntoChecklistItems().forEach(([key,label])=>{
    checklist[key]=!!document.getElementById('ppChk_'+key)?.checked;
    if(!checklist[key])faltantes.push(label);
  });
  if(faltantes.length){showToast('⚠️ Checklist incompleto: '+faltantes[0],'warn');return;}
  const obs=gv('ppAltaObs')||'Limpieza y revisión completadas. Máquina disponible.';
  try{
    await api('/api/maquinas/'+id+'/puesta-punto/alta',{method:'POST',body:JSON.stringify({obs,checklist,responsable:currentUser?.email||currentUser?.nombre||''})});
    document.getElementById('modalAltaPuestaPunto')?.remove();
    await refrescarMaquinasDespuesGestion(id);
    showToast('✅ Máquina disponible para alquilar');
  }catch(e){showToast('❌ '+e.message,'error');}
}

function openIncidenciaMaquinaModal(id,reservaPreseleccionadaId=null){
  const m=(DB.get('maquinas')||[]).find(x=>parseInt(x.id)===parseInt(id));if(!m)return;
  const reservas=(DB.get('reservas')||[]).filter(r=>parseInt(r.maquinaId)===parseInt(id)).sort((a,b)=>(b.fechaInicio||'').localeCompare(a.fechaInicio||''));
  const old=document.getElementById('modalIncidenciaMaquina');if(old)old.remove();
  const div=document.createElement('div');
  div.id='modalIncidenciaMaquina';
  div.className='modal-overlay open';
  div.innerHTML=`<div class="modal-box">
    <div class="modal-header"><span class="modal-title">Registrar incidencia técnica</span><button class="btn-close" onclick="document.getElementById('modalIncidenciaMaquina').remove()">✕</button></div>
    <div class="docs-line" style="margin-bottom:10px">${escapeHTML(m.codigo||'')} — ${escapeHTML(m.nombre||'')}</div>
    <div class="form-grid">
      <div class="form-field"><label>Tipo</label><select id="incMaqTipo">
        <option value="falla_tecnica">Falla técnica</option><option value="limpieza">Limpieza</option><option value="accesorio_faltante">Accesorio faltante</option><option value="daño">Daño</option><option value="uso_indebido">Uso indebido</option><option value="otro">Otro</option>
      </select></div>
      <div class="form-field"><label>Gravedad</label><select id="incMaqGravedad">
        <option value="media">Media</option><option value="baja">Baja</option><option value="alta">Alta</option><option value="critica">Crítica</option>
      </select></div>
      <div class="form-field full"><label>Reserva relacionada</label><select id="incMaqReserva">
        <option value="">Sin reserva relacionada</option>
        ${reservas.map(r=>`<option value="${r.id}" ${parseInt(reservaPreseleccionadaId)===parseInt(r.id)?'selected':''}>${escapeHTML(r.codigo||('Reserva #'+r.id))} · ${fmtDate(r.fechaInicio)} · ${escapeHTML(getOp(r.operadoraId)?.nombre||'')}</option>`).join('')}
      </select></div>
      <div class="form-field full"><label>Descripción</label><textarea id="incMaqDesc" placeholder="Qué pasó, cuándo se detectó, síntomas, accesorios afectados"></textarea></div>
      <div class="form-field full"><label>Link evidencia / foto</label><input id="incMaqEvidencia" placeholder="https://..."></div>
      <div class="form-field full"><label class="check-row"><input type="checkbox" id="incMaqBloquea"><span>Bloquear reservas hasta resolver</span></label></div>
    </div>
    <button class="btn-add full-width" onclick="guardarIncidenciaMaquina(${m.id})">Guardar incidencia</button>
  </div>`;
  document.body.appendChild(div);
}

async function guardarIncidenciaMaquina(id){
  const payload={
    tipo:gv('incMaqTipo')||'falla_tecnica',
    gravedad:gv('incMaqGravedad')||'media',
    descripcion:gv('incMaqDesc').trim(),
    evidencia_url:gv('incMaqEvidencia').trim(),
    reserva_id:gv('incMaqReserva')?parseInt(gv('incMaqReserva')):null,
    bloquea_reservas:!!document.getElementById('incMaqBloquea')?.checked
  };
  if(!payload.descripcion){showToast('⚠️ Describí la incidencia','warn');return;}
  try{
    await api('/api/maquinas/'+id+'/incidencias',{method:'POST',body:JSON.stringify(payload)});
    document.getElementById('modalIncidenciaMaquina')?.remove();
    await refrescarMaquinasDespuesGestion(id);
    await cargarMaqIncidencias(id);
    showToast('✅ Incidencia registrada');
  }catch(e){showToast('❌ '+e.message,'error');}
}

async function actualizarIncidenciaMaquina(maquinaId,incidenciaId,estado){
  const resolucion=['resuelta','descartada'].includes(estado)?prompt('Resolución / comentario de cierre:','Incidencia revisada y cerrada.'):('');
  if(resolucion===null)return;
  try{
    await api('/api/maquinas/'+maquinaId+'/incidencias/'+incidenciaId,{method:'PATCH',body:JSON.stringify({estado,resolucion})});
    await refrescarMaquinasDespuesGestion(maquinaId);
    await cargarMaqIncidencias(maquinaId);
    showToast('✅ Incidencia actualizada');
  }catch(e){showToast('❌ '+e.message,'error');}
}

async function enviarMaquinaTecnico(id){
  const tecnico=prompt('Nombre del técnico o taller:','');
  if(tecnico===null)return;
  const obs=prompt('Motivo / observación:','Sale a servicio técnico. Dar de baja hasta regreso.');
  if(obs===null)return;
  try{
    await api('/api/maquinas/'+id+'/tecnico/baja',{method:'POST',body:JSON.stringify({tecnico_nombre:tecnico,obs})});
    await refrescarMaquinasDespuesGestion(id);
    showToast('✅ Máquina dada de baja por técnico');
  }catch(e){showToast('❌ '+e.message,'error');}
}

async function recibirMaquinaTecnico(id){
  const obs=prompt('Observación del regreso del técnico:','Regresó del técnico. Máquina revisada y disponible.');
  if(obs===null)return;
  try{
    await api('/api/maquinas/'+id+'/tecnico/alta',{method:'POST',body:JSON.stringify({obs})});
    await refrescarMaquinasDespuesGestion(id);
    showToast('✅ Máquina dada de alta');
  }catch(e){showToast('❌ '+e.message,'error');}
}
function openMaqModal(id){
  document.getElementById('modalMaqTitle').textContent=id?'Editar Máquina':'Nueva Máquina';
  const currentCategory=id?(DB.get('maquinas')||[]).find(x=>x.id===id)?.categoria:'Láser Depilación';
  populateMaqCategorias(currentCategory);
  const fileInput=document.getElementById('maqFotoFile');
  if(fileInput)fileInput.value='';
  if(id){
    const m=(DB.get('maquinas')||[]).find(x=>x.id===id);if(!m)return;
    sv('maqId',m.id);sv('maqCodigo',m.codigo);sv('maqNombre',m.nombre);sv('maqCategoria',m.categoria);
    sv('maqMarca',m.marca);sv('maqModelo',m.modelo);
    sv('maqDeptBase',m.deptBase);sv('maqUbicacion',m.ubicacion);sv('maqEstado',m.estado);
    sv('maqTipoOperativo',m.tipoOperativo||'viajera');sv('maqCiudadBase',m.ciudadBase||'');
    sv('maqUltMant',m.ultMant);sv('maqProxMant',m.proxMant==='—'?'':m.proxMant);sv('maqObs',m.obs);
    sv('maqIconoUrl',m.iconoUrl||'');
    const viajera=document.getElementById('maqEsViajera');if(viajera)viajera.checked=!!m.esViajera;
    sv('maqFotoUrl',m.fotoUrl||'');
    setMaquinaFotoPreview(m.fotoUrl||'');
  } else {
    ['maqId','maqNombre','maqMarca','maqModelo','maqUbicacion','maqObs','maqCiudadBase'].forEach(f=>sv(f,''));
    sv('maqFotoUrl','');setMaquinaFotoPreview('');
    setNextMaquinaCodigo();sv('maqDeptBase','Uruguay');
    sv('maqCategoria','Láser Depilación');sv('maqEstado','disponible');sv('maqUltMant',today());sv('maqProxMant','');
    sv('maqTipoOperativo','viajera');
    sv('maqIconoUrl','');
    const viajera=document.getElementById('maqEsViajera');if(viajera)viajera.checked=false;
  }
  onMaqTipoOperativoChange();
  onMaqCategoriaChange();
  openModal('modalMaq');
}
function getMaqCategoriasLocales(extra){
  const actuales=(DB.get('maquinas')||[]).map(m=>m.categoria).filter(Boolean);
  return Array.from(new Set([...MAQ_CATEGORIAS_DEFAULT,...actuales,extra].filter(Boolean))).sort((a,b)=>a.localeCompare(b,'es'));
}
async function populateMaqCategorias(selected){
  const sel=document.getElementById('maqCategoria');if(!sel)return;
  let categorias=getMaqCategoriasLocales(selected);
  if(typeof api==='function'){
    try{
      const remotas=await api('/api/maquinas/categorias');
      if(Array.isArray(remotas))categorias=Array.from(new Set([...categorias,...remotas].filter(Boolean))).sort((a,b)=>a.localeCompare(b,'es'));
    }catch(e){}
  }
  sel.innerHTML=categorias.map(c=>`<option value="${escapeAttr(c)}">${escapeHTML(c)}</option>`).join('')+'<option value="__add">+ Agregar nueva categoría</option>';
  sv('maqCategoria',selected||'Láser Depilación');
}
function onMaqCategoriaChange(){
  const add=gv('maqCategoria')==='__add';
  const field=document.getElementById('maqCategoriaNuevaField');
  if(field)field.style.display=add?'':'none';
  if(add)setTimeout(()=>document.getElementById('maqCategoriaNueva')?.focus(),20);
}
function onMaqTipoOperativoChange(){
  const tipo=gv('maqTipoOperativo')||'alquiler';
  const ciudadField=document.getElementById('maqCiudadBaseField');
  if(ciudadField)ciudadField.style.display=tipo==='base_ciudad'?'':'none';
  const viajera=document.getElementById('maqEsViajera');if(viajera)viajera.checked=tipo==='viajera';
  if(tipo==='solo_venta')sv('maqEstado','fuera_servicio');
}
function setMaquinaFotoPreview(url){
  const box=document.getElementById('maqFotoPreview');if(!box)return;
  const src=url?maquinaPhotoUrl({fotoUrl:url}):'';
  box.innerHTML=src?`<img src="${escapeAttr(src)}" alt="Foto de máquina"/>`:'<span>Sin foto</span>';
}
function previewMaquinaFoto(file){
  if(!file){setMaquinaFotoPreview(gv('maqFotoUrl'));return;}
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){
    showToast('⚠️ La foto debe ser JPG, PNG o WebP','warn');
    document.getElementById('maqFotoFile').value='';
    return;
  }
  if(file.size>8*1024*1024){
    showToast('⚠️ La foto no puede superar 8 MB','warn');
    document.getElementById('maqFotoFile').value='';
    return;
  }
  const url=URL.createObjectURL(file);
  const box=document.getElementById('maqFotoPreview');
  if(box)box.innerHTML=`<img src="${escapeAttr(url)}" alt="Vista previa"/>`;
}
async function uploadMaquinaFoto(maquinaId){
  const file=document.getElementById('maqFotoFile')?.files?.[0];
  if(!file)return null;
  const fd=new FormData();
  fd.append('foto',file);
  const token=TOKEN.get();
  const res=await fetch('/api/maquinas/'+maquinaId+'/foto',{
    method:'POST',
    headers:token?{Authorization:'Bearer '+token}:{},
    body:fd
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||'No se pudo subir la foto');
  return data;
}
function openImageLightbox(src,alt){
  const old=document.getElementById('imageLightbox');
  if(old)old.remove();
  const div=document.createElement('div');
  div.id='imageLightbox';
  div.className='image-lightbox';
  div.innerHTML=`<img src="${escapeAttr(src)}" alt="${escapeAttr(alt||'Imagen ampliada')}"/>`;
  div.addEventListener('click',()=>div.remove());
  document.body.appendChild(div);
}
async function saveMaquina(){
  const id=gv('maqId');
  let categoria=gv('maqCategoria');
  if(categoria==='__add'){
    categoria=gv('maqCategoriaNueva').trim();
    if(!categoria){showToast('⚠️ Ingresá la nueva categoría','warn');return;}
    if(typeof api==='function'){
      try{await api('/api/maquinas/categorias',{method:'POST',body:JSON.stringify({nombre:categoria})});}catch(e){}
    }
  }
  const tipoOperativo=gv('maqTipoOperativo')||'viajera';
  const payload={
    codigo:gv('maqCodigo').trim(),nombre:gv('maqNombre').trim(),categoria,
    ubicacion:gv('maqUbicacion').trim(),estado:gv('maqEstado'),
    marca:gv('maqMarca').trim(),modelo:gv('maqModelo').trim(),
    dept_base:gv('maqDeptBase').trim()||'Uruguay',
    ult_mant:gv('maqUltMant')||null,prox_mant:gv('maqProxMant')||null,
    icono_url:gv('maqIconoUrl').trim()||null,es_viajera:tipoOperativo==='viajera',
    tipo_operativo:tipoOperativo,ciudad_base:tipoOperativo==='base_ciudad'?(gv('maqCiudadBase').trim()||gv('maqUbicacion').trim()||null):null,
    obs:gv('maqObs').trim()};
  if(!payload.codigo||!payload.nombre){showToast('⚠️ Código y nombre son obligatorios','warn');return;}
  try{
    let saved;
    if(id){
      saved=await api('/api/maquinas/'+id,{method:'PUT',body:JSON.stringify(payload)});
      showToast('✅ Máquina actualizada');
    }else{
      saved=await api('/api/maquinas',{method:'POST',body:JSON.stringify(payload)});
      showToast('✅ Máquina creada');
    }
    if(saved?.id){
      const uploaded=await uploadMaquinaFoto(saved.id);
      if(uploaded?.foto_url)showToast('✅ Foto de máquina cargada');
    }
    const maqs=await api('/api/maquinas');
    DB.set('maquinas',maqs.map(mapMaquinaLocal));
    closeModal('modalMaq');renderMaquinas();if(typeof renderMantenimientos==='function')renderMantenimientos();
  }catch(e){showToast('❌ Error: '+e.message,'error');}
}
async function deleteMaquina(id){
  if(!confirm('\u00bfEliminar esta m\u00e1quina?'))return;
  try{
    await api('/api/maquinas/'+id,{method:'DELETE'});
    const maqs=await api('/api/maquinas');
    DB.set('maquinas',maqs.map(mapMaquinaLocal));
    showToast('\ud83d\uddd1 M\u00e1quina eliminada');navigate('maquinas');
  }catch(e){showToast('\u274c Error: '+e.message,'error');}
}
