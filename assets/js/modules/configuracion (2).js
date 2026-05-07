/* ══════════════════════════════════
   CONFIGURACIÓN
══════════════════════════════════ */
function renderConfiguracion(){
  const cfg=DB.get('wa_config')||{};
  const waStatus=DB.get('wa_status')||{};
  const isConnected=!!waStatus.envio_real_activo;
  const tema=getTemaCRM();
  const paletteCards=Object.entries(CRM_THEMES).map(([id,p])=>`
    <button type="button" class="palette-card ${tema.id===id||(!tema.id&&id==='depimovil')?'active':''}" onclick="seleccionarPaletaCRM('${id}')">
      <strong>${p.nombre}</strong>
      <div class="palette-swatches">
        <span class="palette-swatch" style="background:${p.bg}"></span>
        <span class="palette-swatch" style="background:${p.surface}"></span>
        <span class="palette-swatch" style="background:${p.accent}"></span>
        <span class="palette-swatch" style="background:${p.rose}"></span>
      </div>
    </button>`).join('');

  document.getElementById('configContent').innerHTML=`
    <div class="config-section" id="crmColorsSection">
      <h3>🎨 Colores del CRM</h3>
      <div class="palette-grid">${paletteCards}</div>
      <div class="color-config-grid">
        <div class="color-field">
          <label>Fondo</label>
          <input type="color" id="temaBg" value="${tema.bg}">
        </div>
        <div class="color-field">
          <label>Paneles</label>
          <input type="color" id="temaSurface" value="${tema.surface}">
        </div>
        <div class="color-field">
          <label>Panel secundario</label>
          <input type="color" id="temaSurface2" value="${tema.surface2}">
        </div>
        <div class="color-field">
          <label>Bordes</label>
          <input type="color" id="temaBorder" value="${tema.border}">
        </div>
        <div class="color-field">
          <label>Acento</label>
          <input type="color" id="temaAccent" value="${tema.accent}">
        </div>
        <div class="color-field">
          <label>Acento claro</label>
          <input type="color" id="temaAccent2" value="${tema.accent2}">
        </div>
        <div class="color-field">
          <label>Secundario</label>
          <input type="color" id="temaRose" value="${tema.rose}">
        </div>
        <div class="color-field">
          <label>Texto</label>
          <input type="color" id="temaText" value="${tema.text}">
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
        <button class="btn-add" onclick="guardarTemaCRM()">Aplicar colores</button>
        <button class="btn-secondary" onclick="resetTemaCRM()">Restaurar clásico</button>
      </div>
    </div>

    <div class="config-section">
      <h3>🏢 Datos de la Empresa</h3>
      <div class="config-row">
        <div class="form-field">
          <label>Nombre de la empresa</label>
          <input type="text" id="cfgEmpresaNombre" value="${cfg.empresa_nombre||''}" placeholder="DepiMóvil"/>
        </div>
        <div class="form-field">
          <label>Email de contacto</label>
          <input type="email" id="cfgEmpresaEmail" value="${cfg.empresa_email||''}" placeholder="admin\x40depimovil.com"/>
        </div>
        <div class="form-field">
          <label>WhatsApp de la empresa</label>
          <input type="tel" id="cfgEmpresaWA" value="${cfg.empresa_whatsapp||''}" placeholder="+598 99 000 000"/>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h3>💬 WhatsApp Business API
        <span class="api-status ${isConnected?'connected':'disconnected'}" style="margin-left:8px">
          ${isConnected?'● Conectado':'○ Revisar'}
        </span>
      </h3>
      <div id="waServerStatus" class="alert-banner info" style="margin-bottom:16px">
        <span class="ab-icon">🔌</span>
        <div>Consultando estado real del servidor...</div>
      </div>
      <div class="config-row">
        <div class="form-field">
          <label>Auto-envío al encolar</label>
          <select id="cfgWAAutoEnvio">
            <option value="false" ${!cfg.wa_auto_envio?'selected':''}>No — enviar manualmente</option>
            <option value="true" ${cfg.wa_auto_envio?'selected':''}>Sí — enviar automáticamente</option>
          </select>
        </div>
        <div class="form-field">
          <label>Modo del servidor</label>
          <input type="text" id="cfgWAModoServidor" value="${waStatus.modo||'Consultando...'}" readonly/>
        </div>
        <div class="form-field">
          <label>Credenciales</label>
          <input type="text" value="${waStatus.phone_id_configurado&&waStatus.token_configurado?'Configuradas en servidor':'Pendientes en servidor'}" readonly/>
        </div>
      </div>
      <div style="margin-top:16px;background:var(--surface2);border:1px solid var(--border);border-radius:9px;padding:14px">
        <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.6px">Webhook Meta</div>
        <code style="font-size:12px;color:var(--accent)">${window.location.origin}/api/webhook/whatsapp</code>
        <div style="font-size:11px;color:var(--text3);margin-top:6px">El token de verificación y el Bearer Token quedan solo en el servidor.</div>
      </div>
    </div>

    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn-add" onclick="saveConfiguracion()">💾 Guardar Configuración</button>
      <button class="btn-secondary" onclick="testWAConnection()">🔌 Probar conexión</button>
    </div>`;
  refreshWAStatus();
}

function seleccionarPaletaCRM(id){
  const p=CRM_THEMES[id]||CRM_THEMES.depimovil;
  const tema={id,...p};
  DB.set('crm_theme',tema);
  aplicarTemaCRM(tema);
  renderConfiguracion();
  showToast('🎨 Paleta aplicada');
}

function guardarTemaCRM(){
  const tema={
    id:'personalizada',
    nombre:'Personalizada',
    bg:gv('temaBg'),
    surface:gv('temaSurface'),
    surface2:gv('temaSurface2'),
    border:gv('temaBorder'),
    accent:gv('temaAccent'),
    accent2:gv('temaAccent2'),
    rose:gv('temaRose'),
    text:gv('temaText'),
    text2:getTemaCRM().text2,
    text3:getTemaCRM().text3
  };
  DB.set('crm_theme',tema);
  aplicarTemaCRM(tema);
  renderConfiguracion();
  showToast('✅ Colores guardados');
}

function resetTemaCRM(){
  DB.del('crm_theme');
  aplicarTemaCRM(CRM_THEMES.depimovil);
  renderConfiguracion();
  showToast('↩️ Paleta clásica restaurada');
}

function saveConfiguracion(){
  const cfg={
    empresa_nombre:gv('cfgEmpresaNombre').trim(),
    empresa_email:gv('cfgEmpresaEmail').trim(),
    empresa_whatsapp:gv('cfgEmpresaWA').trim(),
    wa_auto_envio:gv('cfgWAAutoEnvio')==='true',
  };
  DB.set('wa_config',cfg);
  showToast('✅ Configuración guardada');
  renderConfiguracion();
}

async function refreshWAStatus(){
  const el=document.getElementById('waServerStatus');
  try{
    const st=await api('/api/webhook/whatsapp/status');
    DB.set('wa_status',st);
    if(document.getElementById('cfgWAModoServidor'))document.getElementById('cfgWAModoServidor').value=st.modo||'simulacion';
    if(el){
      const ok=st.envio_real_activo;
      el.className='alert-banner '+(ok?'':'warn');
      el.innerHTML=`<span class="ab-icon">${ok?'✅':'⚠️'}</span><div><strong>${ok?'WhatsApp real activo':'WhatsApp no está en modo real completo'}</strong> — Phone ID: ${st.phone_id_configurado?'configurado':'falta'} · Token: ${st.token_configurado?'configurado':'falta'} · Verify token: ${st.verify_token_configurado?'configurado':'falta'}.</div>`;
    }
  }catch(e){
    if(el){
      el.className='alert-banner warn';
      el.innerHTML=`<span class="ab-icon">⚠️</span><div>No pude consultar el estado del servidor: ${e.message}</div>`;
    }
  }
}

async function testWAConnection(){
  showToast('🔌 Verificando conexión…');
  try{
    const d=await api('/api/webhook/whatsapp/test');
    if(d.simulado) showToast('ℹ️ Servidor en modo simulación');
    else showToast('✅ Conexión WhatsApp OK: '+(d.display_phone_number||d.verified_name||'Meta validó la API'));
    await refreshWAStatus();
  }catch(e){
    showToast('❌ '+e.message,'error');
  }
}
