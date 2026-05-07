/**
 * DepiMóvil — WhatsApp Sender
 *
 * Wrapper sobre Meta Graph API v19.0.
 * En modo simulacion solo loguea; en produccion envia de verdad.
 *
 * Uso:
 *   const { enviarMensaje, enviarBotones, enviarLista } = require('./wa_sender');
 *   await enviarMensaje('+59899123456', 'Hola!');
 */

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Normaliza un numero a formato E.164 uruguayo.
 * Acepta: 099123456 / 59899123456 / +59899123456
 */
function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length <= 9) digits = '598' + digits.slice(1);
  if (!digits.startsWith('598') && digits.length <= 9) digits = '598' + digits;
  return digits; // sin "+" para Meta API
}

/**
 * Envía un mensaje de texto simple.
 * @param {string} to  - Número destino (cualquier formato)
 * @param {string} text - Texto del mensaje
 * @returns {Promise<{ok: boolean, messageId?: string, simulado?: boolean, error?: string}>}
 */
async function enviarMensaje(to, text) {
  const modo = process.env.WA_MODO || 'simulacion';
  const phone = normalizePhone(to);

  if (!phone) {
    console.warn('⚠️ wa_sender: número inválido:', to);
    return { ok: false, error: 'Número inválido' };
  }

  if (modo === 'simulacion') {
    console.log(`📱 [WA SIMULACION] → ${phone}\n${text}\n`);
    return { ok: true, simulado: true, phone };
  }

  const phoneId = process.env.WA_PHONE_ID;
  const token   = process.env.WA_TOKEN;

  if (!phoneId || !token) {
    console.error('❌ wa_sender: faltan WA_PHONE_ID o WA_TOKEN');
    return { ok: false, error: 'Configuración incompleta' };
  }

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: text },
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error('❌ wa_sender error Meta:', data.error?.message || JSON.stringify(data));
      return { ok: false, error: data.error?.message || 'Meta API error', raw: data };
    }

    return { ok: true, messageId: data.messages?.[0]?.id, phone };
  } catch (err) {
    console.error('❌ wa_sender fetch error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Envía un mensaje con botones interactivos (hasta 3 botones).
 * @param {string} to
 * @param {string} body - Texto principal
 * @param {Array<{id: string, title: string}>} buttons
 */
async function enviarBotones(to, body, buttons) {
  const modo = process.env.WA_MODO || 'simulacion';
  const phone = normalizePhone(to);

  if (!phone) return { ok: false, error: 'Número inválido' };

  if (modo === 'simulacion') {
    const btnText = buttons.map((b, i) => `  [${i + 1}] ${b.title}`).join('\n');
    console.log(`📱 [WA SIMULACION BOTONES] → ${phone}\n${body}\n${btnText}\n`);
    return { ok: true, simulado: true, phone };
  }

  const phoneId = process.env.WA_PHONE_ID;
  const token   = process.env.WA_TOKEN;
  if (!phoneId || !token) return { ok: false, error: 'Configuración incompleta' };

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: body },
          action: {
            buttons: buttons.slice(0, 3).map(b => ({
              type: 'reply',
              reply: { id: b.id, title: b.title.slice(0, 20) },
            })),
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) return { ok: false, error: data.error?.message || 'Meta API error' };
    return { ok: true, messageId: data.messages?.[0]?.id, phone };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Envía un mensaje con lista de opciones.
 * @param {string} to
 * @param {string} body
 * @param {string} buttonText - Texto del botón que abre la lista
 * @param {Array<{id: string, title: string, description?: string}>} rows
 */
async function enviarLista(to, body, buttonText, rows) {
  const modo = process.env.WA_MODO || 'simulacion';
  const phone = normalizePhone(to);

  if (!phone) return { ok: false, error: 'Número inválido' };

  if (modo === 'simulacion') {
    const rowText = rows.map((r, i) => `  ${i + 1}. ${r.title}${r.description ? ' — ' + r.description : ''}`).join('\n');
    console.log(`📱 [WA SIMULACION LISTA] → ${phone}\n${body}\n${rowText}\n`);
    return { ok: true, simulado: true, phone };
  }

  const phoneId = process.env.WA_PHONE_ID;
  const token   = process.env.WA_TOKEN;
  if (!phoneId || !token) return { ok: false, error: 'Configuración incompleta' };

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: body },
          action: {
            button: buttonText.slice(0, 20),
            sections: [{
              title: 'Opciones',
              rows: rows.slice(0, 10).map(r => ({
                id: String(r.id),
                title: String(r.title).slice(0, 24),
                description: r.description ? String(r.description).slice(0, 72) : undefined,
              })),
            }],
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) return { ok: false, error: data.error?.message || 'Meta API error' };
    return { ok: true, messageId: data.messages?.[0]?.id, phone };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { enviarMensaje, enviarBotones, enviarLista, normalizePhone };
