/**
 * DepiMóvil — WhatsApp Sender
 *
 * Wrapper sobre Evolution API (QR-based).
 * En modo simulacion solo loguea; en produccion envia via Evolution API.
 *
 * Variables de entorno necesarias (modo produccion):
 *   WA_MODO          = 'produccion'
 *   EVOLUTION_URL    = 'https://evolution.tudominio.com'  (URL de Evolution API en Railway)
 *   EVOLUTION_KEY    = 'tu-api-key-de-evolution'
 *   EVOLUTION_INST   = 'depimovil'  (nombre de la instancia creada en Evolution)
 *
 * Para escanear el QR: GET /api/webhook/whatsapp/qr (desde el CRM)
 */

/**
 * Normaliza un número a formato E.164 uruguayo (solo dígitos, sin +).
 * Acepta: 099123456 / 59899123456 / +59899123456
 */
function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length <= 9) digits = '598' + digits.slice(1);
  if (!digits.startsWith('598') && digits.length <= 9) digits = '598' + digits;
  return digits;
}

/**
 * Headers de autenticación para Evolution API.
 */
function evoHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': process.env.EVOLUTION_KEY || '',
  };
}

/**
 * URL base de la instancia Evolution.
 */
function evoBase() {
  const url  = (process.env.EVOLUTION_URL || '').replace(/\/$/, '');
  const inst = process.env.EVOLUTION_INST || 'depimovil';
  return { url, inst };
}

/**
 * Envía un mensaje de texto simple.
 * @param {string} to   - Número destino (cualquier formato uruguayo)
 * @param {string} text - Texto del mensaje
 * @returns {Promise<{ok: boolean, messageId?: string, simulado?: boolean, error?: string}>}
 */
async function enviarMensaje(to, text) {
  const modo  = process.env.WA_MODO || 'simulacion';
  const phone = normalizePhone(to);

  if (!phone) {
    console.warn('⚠️ wa_sender: número inválido:', to);
    return { ok: false, error: 'Número inválido' };
  }

  if (modo !== 'produccion') {
    console.log(`📱 [WA SIMULACION] → ${phone}\n${text}\n`);
    return { ok: true, simulado: true, phone };
  }

  const { url, inst } = evoBase();
  if (!url || !process.env.EVOLUTION_KEY) {
    console.error('❌ wa_sender: faltan EVOLUTION_URL o EVOLUTION_KEY');
    return { ok: false, error: 'Configuración incompleta' };
  }

  try {
    const res = await fetch(`${url}/message/sendText/${inst}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({
        number: phone + '@s.whatsapp.net',
        textMessage: { text },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message || data?.error || `HTTP ${res.status}`;
      console.error('❌ wa_sender error Evolution:', msg);
      return { ok: false, error: msg };
    }

    return { ok: true, messageId: data?.key?.id || data?.id, phone };
  } catch (err) {
    console.error('❌ wa_sender fetch error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Envía un mensaje con botones (Evolution API soporta hasta 3).
 * Si la instancia no admite botones, cae a texto plano numerado.
 */
async function enviarBotones(to, body, buttons) {
  const modo  = process.env.WA_MODO || 'simulacion';
  const phone = normalizePhone(to);

  if (!phone) return { ok: false, error: 'Número inválido' };

  if (modo !== 'produccion') {
    const btnText = buttons.map((b, i) => `  [${i + 1}] ${b.title}`).join('\n');
    console.log(`📱 [WA SIMULACION BOTONES] → ${phone}\n${body}\n${btnText}\n`);
    return { ok: true, simulado: true, phone };
  }

  const { url, inst } = evoBase();
  if (!url || !process.env.EVOLUTION_KEY) return { ok: false, error: 'Configuración incompleta' };

  // Intentar con botones nativos
  try {
    const res = await fetch(`${url}/message/sendButtons/${inst}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({
        number: phone + '@s.whatsapp.net',
        title: '',
        description: body,
        footer: 'DepiMóvil',
        buttons: buttons.slice(0, 3).map((b, i) => ({
          buttonId: b.id || String(i + 1),
          buttonText: { displayText: b.title.slice(0, 20) },
          type: 1,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, messageId: data?.key?.id, phone };
    }
  } catch (_) {}

  // Fallback: texto plano numerado
  const textoFallback = body + '\n\n' + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
  return enviarMensaje(to, textoFallback);
}

/**
 * Envía un mensaje con lista de opciones.
 * Si la instancia no admite listas, cae a texto plano numerado.
 */
async function enviarLista(to, body, buttonText, rows) {
  const modo  = process.env.WA_MODO || 'simulacion';
  const phone = normalizePhone(to);

  if (!phone) return { ok: false, error: 'Número inválido' };

  if (modo !== 'produccion') {
    const rowText = rows.map((r, i) => `  ${i + 1}. ${r.title}${r.description ? ' — ' + r.description : ''}`).join('\n');
    console.log(`📱 [WA SIMULACION LISTA] → ${phone}\n${body}\n${rowText}\n`);
    return { ok: true, simulado: true, phone };
  }

  const { url, inst } = evoBase();
  if (!url || !process.env.EVOLUTION_KEY) return { ok: false, error: 'Configuración incompleta' };

  // Intentar con lista nativa
  try {
    const res = await fetch(`${url}/message/sendList/${inst}`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({
        number: phone + '@s.whatsapp.net',
        title: '',
        description: body,
        footer: 'DepiMóvil',
        buttonText: buttonText.slice(0, 20),
        sections: [{
          title: 'Opciones',
          rows: rows.slice(0, 10).map(r => ({
            title: String(r.title).slice(0, 24),
            description: r.description ? String(r.description).slice(0, 72) : '',
            rowId: String(r.id),
          })),
        }],
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: true, messageId: data?.key?.id, phone };
    }
  } catch (_) {}

  // Fallback: texto plano numerado
  const textoFallback = body + '\n\n' + rows.map((r, i) => `${i + 1}. ${r.title}`).join('\n');
  return enviarMensaje(to, textoFallback);
}

/**
 * Obtiene el QR de la instancia para escanear.
 * Devuelve { ok, qrcode, status } — qrcode es una imagen base64.
 */
async function obtenerQR() {
  const { url, inst } = evoBase();
  if (!url || !process.env.EVOLUTION_KEY) {
    return { ok: false, error: 'EVOLUTION_URL o EVOLUTION_KEY no configurados' };
  }

  try {
    // Primero verificar si ya está conectado
    const statusRes = await fetch(`${url}/instance/connectionState/${inst}`, {
      headers: evoHeaders(),
    });
    if (statusRes.ok) {
      const statusData = await statusRes.json().catch(() => ({}));
      const state = statusData?.instance?.state || statusData?.state;
      if (state === 'open') {
        return { ok: true, status: 'conectado', qrcode: null };
      }
    }

    // Obtener QR
    const res = await fetch(`${url}/instance/connect/${inst}`, {
      headers: evoHeaders(),
    });
    const data = await res.json().catch(() => ({}));

    if (data?.base64) {
      return { ok: true, status: 'pendiente_escaneo', qrcode: data.base64 };
    }
    if (data?.qrcode?.base64) {
      return { ok: true, status: 'pendiente_escaneo', qrcode: data.qrcode.base64 };
    }

    return { ok: false, error: 'No se pudo obtener el QR', raw: data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Crea la instancia en Evolution API si no existe.
 * Llamar una sola vez al configurar.
 */
async function crearInstancia() {
  const { url, inst } = evoBase();
  if (!url || !process.env.EVOLUTION_KEY) return { ok: false, error: 'Config incompleta' };

  try {
    const res = await fetch(`${url}/instance/create`, {
      method: 'POST',
      headers: evoHeaders(),
      body: JSON.stringify({
        instanceName: inst,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { enviarMensaje, enviarBotones, enviarLista, normalizePhone, obtenerQR, crearInstancia };
