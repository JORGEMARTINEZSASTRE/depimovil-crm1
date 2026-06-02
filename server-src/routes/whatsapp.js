/**
 * DepiMóvil — WhatsApp Webhook & Bot de Agendamiento
 * 
 * Recibe mensajes de WhatsApp Business API y guía a la operadora
 * por un flujo conversacional para agendar equipos.
 * 
 * Flujo:
 *   "hola" / "agendar" → Saludo + opciones
 *   "1" o "agendar"    → Pide fecha
 *   Fecha (ej: 15/04)  → Muestra equipos disponibles
 *   Número de equipo   → Confirma reserva
 *   "si" / "confirmar" → Crea la reserva via API
 * 
 * También funciona:
 *   "mis reservas"     → Lista reservas activas
 *   "ayuda"            → Menú de opciones
 *   "cancelar"         → Limpia la sesión
 */

const express = require('express');
const pool = require('../utils/db');
const { getSession, setSession, clearSession } = require('../utils/wa_sessions');
const { enviarMensaje, enviarBotones, enviarLista, obtenerQR, crearInstancia } = require('../utils/wa_sender');
const { getPendientes, marcarEnviado } = require('../utils/wa_queue');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Por seguridad, el webhook entrante queda en modo escucha salvo activación explícita.
function inboundMode() {
  return String(process.env.WA_INBOUND_MODE || 'listen').toLowerCase();
}

function autoReplyEnabled() {
  return ['true', '1', 'si', 'sí', 'yes'].includes(String(process.env.WA_AUTO_REPLY || 'false').toLowerCase());
}

function isBotMode() {
  return inboundMode() === 'bot' && autoReplyEnabled();
}

async function ensureWhatsappCrmTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(50) DEFAULT 'meta',
      provider_message_id VARCHAR(200),
      direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
      phone VARCHAR(50) NOT NULL,
      phone_norm VARCHAR(30) NOT NULL,
      operadora_id INTEGER REFERENCES operadoras(id) ON DELETE SET NULL,
      lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      message_type VARCHAR(50),
      body TEXT,
      intent VARCHAR(100),
      score_delta INTEGER DEFAULT 0,
      raw_payload JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_messages_provider_id ON whatsapp_messages(provider_message_id) WHERE provider_message_id IS NOT NULL');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_norm ON whatsapp_messages(phone_norm, created_at DESC)');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_phone_norm VARCHAR(30)');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_score INTEGER NOT NULL DEFAULT 0');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultimo_contacto TIMESTAMP');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS intencion_whatsapp VARCHAR(100)');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS apellido VARCHAR(200)');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS gabinete VARCHAR(200)');
  await pool.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS pais VARCHAR(100) DEFAULT 'Uruguay'");
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS interes TEXT');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS tecnologia VARCHAR(200)');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS prox_accion TEXT');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS prox_fecha DATE');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS operadora_id INTEGER REFERENCES operadoras(id) ON DELETE SET NULL');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS convertido_en TIMESTAMP');
  await pool.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS convertido_por VARCHAR(200)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_phone_norm ON leads(whatsapp_phone_norm)');
}

const whatsappTablesReady = ensureWhatsappCrmTables().catch(err => {
  console.error('Error preparando tablas WhatsApp CRM:', err.message);
});

// ═══════════════════════════════════
// CRM OUTBOUND SEND
// ═══════════════════════════════════
router.post('/send', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  try {
    const telefono = String(req.body.telefono || req.body.numero || '').trim();
    const mensaje = String(req.body.mensaje || '').trim();
    const contexto = String(req.body.contexto || '').trim();
    if (!telefono || !mensaje) {
      return res.status(400).json({ error: 'Teléfono y mensaje requeridos' });
    }
    if (mensaje.length > 3500) {
      return res.status(400).json({ error: 'Mensaje demasiado largo' });
    }

    const result = await enviarMensaje(telefono, mensaje);
    await pool.query(
      'INSERT INTO audit_log (accion, entidad, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5)',
      ['WA_SEND', 'whatsapp', `${telefono} — ${contexto || mensaje.slice(0, 80)}`, req.user.id, req.ip]
    );

    if (!result.ok) {
      return res.status(502).json({ error: result.error || 'No se pudo enviar WhatsApp', result });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('WA send error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ═══════════════════════════════════
// COLA DE MENSAJES PENDIENTES (wa_queue)
// ═══════════════════════════════════
router.get('/queue', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const pendientes = await getPendientes(100);
    res.json(pendientes);
  } catch (err) {
    console.error('WA queue list error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/queue/:id/send', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await pool.query('SELECT * FROM wa_queue WHERE id = $1 AND enviado = false', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Mensaje no encontrado o ya enviado' });

    const msg = rows[0];
    const result = await enviarMensaje(msg.telefono, msg.mensaje);
    if (!result.ok) {
      return res.status(502).json({ error: result.error || 'No se pudo enviar', result });
    }

    await marcarEnviado(id);
    await pool.query(
      'INSERT INTO audit_log (accion, entidad, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5)',
      ['WA_QUEUE_SEND', 'whatsapp', `queue#${id} -> ${msg.telefono} (${msg.tipo})`, req.user.id, req.ip]
    );

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('WA queue send error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/status', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  const modo        = process.env.WA_MODO || 'simulacion';
  const evoUrl      = process.env.EVOLUTION_URL;
  const evoKey      = process.env.EVOLUTION_KEY;
  const evoInst     = process.env.EVOLUTION_INST || 'depimovil';
  const metaPhoneId = process.env.WA_PHONE_ID;
  const metaToken   = process.env.WA_TOKEN;
  const configurado = !!((evoUrl && evoKey) || (metaPhoneId && metaToken));
  const proveedor   = evoUrl && evoKey ? 'evolution' : (metaPhoneId && metaToken ? 'meta' : 'ninguno');
  const modoReal    = modo !== 'simulacion';

  let conectado = false;
  if (modoReal && configurado) {
    try {
      if (proveedor === 'evolution') {
        const r = await fetch(`${evoUrl}/instance/connectionState/${evoInst}`, {
          headers: { 'apikey': evoKey },
        });
        const d = await r.json().catch(() => ({}));
        const state = d?.instance?.state || d?.state;
        conectado = state === 'open';
      } else if (proveedor === 'meta') {
        const r = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}?fields=display_phone_number`, {
          headers: { Authorization: `Bearer ${metaToken}` },
        });
        conectado = r.ok;
      }
    } catch (_) {}
  }

  res.json({
    modo,
    proveedor,
    evolution_url_configurado: !!evoUrl,
    evolution_key_configurado: !!evoKey,
    instancia: evoInst,
    conectado,
    envio_real_activo: modoReal && configurado && conectado,
    // compatibilidad con frontend anterior
    phone_id_configurado: !!metaPhoneId || !!evoUrl,
    token_configurado: !!metaToken || !!evoKey,
    verify_token_configurado: true,
    inbound_mode: inboundMode(),
    auto_reply_enabled: autoReplyEnabled(),
    modo_seguro_escucha: !isBotMode(),
  });
});

// ─── QR — escanear para conectar WhatsApp ────────────────────────────────────
router.get('/qr', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const modo = process.env.WA_MODO || 'simulacion';
  if (modo !== 'produccion') {
    return res.json({ ok: true, simulado: true, status: 'simulacion', mensaje: 'El servidor está en modo simulación. Cambiá WA_MODO=produccion para conectar WhatsApp real.' });
  }
  if (!process.env.EVOLUTION_URL || !process.env.EVOLUTION_KEY) {
    return res.status(400).json({ error: 'Faltan EVOLUTION_URL o EVOLUTION_KEY en las variables de entorno del servidor' });
  }
  const resultado = await obtenerQR();
  res.json(resultado);
});

// ─── Crear instancia Evolution (primera vez) ─────────────────────────────────
router.post('/setup', auth, requireRole('superadmin'), async (req, res) => {
  if (!process.env.EVOLUTION_URL || !process.env.EVOLUTION_KEY) {
    return res.status(400).json({ error: 'Faltan EVOLUTION_URL o EVOLUTION_KEY' });
  }
  const resultado = await crearInstancia();
  res.json(resultado);
});

// ─── Desconectar / logout instancia ─────────────────────────────────────────
router.delete('/setup', auth, requireRole('superadmin'), async (req, res) => {
  const { url, inst } = require('../utils/wa_sender').normalizePhone
    ? { url: process.env.EVOLUTION_URL, inst: process.env.EVOLUTION_INST || 'depimovil' }
    : { url: process.env.EVOLUTION_URL, inst: process.env.EVOLUTION_INST || 'depimovil' };
  if (!url || !process.env.EVOLUTION_KEY) {
    return res.status(400).json({ error: 'Faltan EVOLUTION_URL o EVOLUTION_KEY' });
  }
  try {
    const r = await fetch(`${url}/instance/logout/${inst}`, {
      method: 'DELETE',
      headers: { 'apikey': process.env.EVOLUTION_KEY },
    });
    const data = await r.json().catch(() => ({}));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/test', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const modo = process.env.WA_MODO || 'simulacion';
  if (modo === 'simulacion') {
    return res.json({ ok: true, simulado: true, modo });
  }
  if (process.env.WA_PHONE_ID && process.env.WA_TOKEN && !process.env.EVOLUTION_URL) {
    try {
      const graphRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}?fields=display_phone_number,verified_name,quality_rating`, {
        headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` },
      });
      const data = await graphRes.json().catch(() => ({}));
      if (!graphRes.ok || data.error) {
        return res.status(502).json({ ok: false, proveedor: 'meta', error: data.error?.message || 'Meta no validó la conexión' });
      }
      return res.json({
        ok: true,
        modo,
        proveedor: 'meta',
        display_phone_number: data.display_phone_number || '',
        verified_name: data.verified_name || '',
        quality_rating: data.quality_rating || '',
      });
    } catch (err) {
      return res.status(500).json({ ok: false, proveedor: 'meta', error: err.message });
    }
  }
  const resultado = await obtenerQR();
  res.json({ ok: resultado.ok, modo, ...resultado });
});

// ═══════════════════════════════════
// WEBHOOK VERIFICATION (Meta requirement)
// ═══════════════════════════════════
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WA_VERIFY_TOKEN;
  if (!verifyToken) {
    return res.status(403).send('Webhook no configurado');
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verificado por Meta');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Token inválido');
});

// ═══════════════════════════════════
// INCOMING MESSAGES
// ═══════════════════════════════════
router.post('/', async (req, res) => {
  // Responder 200 inmediatamente (Meta requiere <5s)
  res.sendStatus(200);

  try {
    const mensajes = extractIncomingMessages(req.body);
    if (!mensajes.length) return; // No es un mensaje entrante (puede ser status update)

    for (const incoming of mensajes) {
      if (!incoming.phone) continue;
      await registrarMensajeEntrante(incoming);

      if (!incoming.texto) {
        if (isBotMode()) {
          await enviarMensaje(incoming.phone, '📝 Por ahora solo puedo procesar mensajes de texto. Escribime lo que necesitás.');
        }
        continue;
      }

      if (!isBotMode()) continue;
      await procesarMensaje(incoming.phone, incoming.texto);
    }

  } catch (err) {
    console.error('❌ Error procesando webhook WA:', err);
  }
});

// ═══════════════════════════════════
// CONVERSATION ENGINE
// ═══════════════════════════════════
async function procesarMensaje(phone, texto) {
  const input = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const session = getSession(phone);

  const accionAdmin = await procesarRevisionOperadoraAdmin(phone, texto);
  if (accionAdmin.procesado) return;

  // ─── Buscar operadora por teléfono ───
  const operadora = await buscarOperadora(phone);

  if (!operadora) {
    await enviarMensaje(phone,
      `👋 Hola, soy el asistente de *DepiMóvil*.\n\n` +
      `No encontré tu número en nuestro sistema. Si sos operadora de DepiMóvil, ` +
      `contactá al equipo para que te registren.\n\n` +
      `📞 Soporte: wa.me/59899000000\n_Equipo DepiMóvil_ ✦`
    );
    return;
  }

  // ─── Comandos globales (funcionan en cualquier momento) ───
  if (['cancelar', 'salir', 'volver', 'menu', 'menú'].includes(input)) {
    clearSession(phone);
    return await enviarMenu(phone, operadora);
  }

  if (['ayuda', 'help', '?'].includes(input)) {
    return await enviarAyuda(phone, operadora);
  }

  if (['mis reservas', 'reservas', 'mis turnos'].includes(input)) {
    clearSession(phone);
    return await enviarReservas(phone, operadora);
  }

  // ─── Si hay sesión activa, seguir el flujo ───
  if (session) {
    return await continuarFlujo(phone, input, texto, session, operadora);
  }

  // ─── Sin sesión: interpretar intención ───
  if (['hola', 'buenas', 'buen dia', 'buen día', 'buenas tardes', 'buenas noches', 'hi', 'ola'].some(s => input.includes(s))) {
    return await enviarMenu(phone, operadora);
  }

  if (['agendar', 'reservar', 'turno', 'quiero', 'necesito', '1'].includes(input) || input.includes('agendar') || input.includes('reservar')) {
    return await iniciarAgendamiento(phone, operadora);
  }

  if (['2', 'reservas'].includes(input)) {
    return await enviarReservas(phone, operadora);
  }

  // No entendí
  await enviarMenu(phone, operadora);
}

// ═══════════════════════════════════
// FLOW STEPS
// ═══════════════════════════════════

async function enviarMenu(phone, op) {
  const nombre = op.nombre.split(' ')[0];
  await enviarMensaje(phone,
    `Hola ${nombre} 👋\n` +
    `Soy el asistente de *DepiMóvil* ✦\n\n` +
    `¿Qué necesitás?\n\n` +
    `*1.* 📅 Agendar un equipo\n` +
    `*2.* 📋 Ver mis reservas\n` +
    `*3.* ❓ Ayuda\n\n` +
    `_Escribí el número o lo que necesites_`
  );
}

async function enviarAyuda(phone, op) {
  await enviarMensaje(phone,
    `❓ *Ayuda — Portal DepiMóvil*\n\n` +
    `Podés escribirme:\n\n` +
    `📅 *"agendar"* — Reservar un equipo\n` +
    `📋 *"mis reservas"* — Ver tus reservas\n` +
    `❌ *"cancelar"* — Volver al menú\n\n` +
    `También podés agendar desde el portal web:\n` +
    `🔗 https://portal.depimovil.live\n\n` +
    `¿Necesitás soporte técnico? Escribí *"soporte"* y te conectamos con el equipo.\n\n` +
    `_Equipo DepiMóvil_ ✦`
  );
}

async function iniciarAgendamiento(phone, op) {
  // Verificar que la operadora esté activa
  if (['suspendida', 'inactiva'].includes(op.estado)) {
    await enviarMensaje(phone,
      `⚠️ ${op.nombre}, tu cuenta está *${op.estado}*.\n` +
      `Contactá al equipo DepiMóvil para regularizar tu situación.`
    );
    return;
  }

  // Verificar deuda
  const { rows: deuda } = await pool.query(
    `SELECT id FROM pagos WHERE operadora_id = $1 AND estado = 'deuda_vencida' LIMIT 1`,
    [op.id]
  );
  if (deuda.length) {
    await enviarMensaje(phone,
      `⚠️ ${op.nombre}, tenés una *deuda vencida* pendiente.\n` +
      `Regularizá tu situación antes de hacer nuevas reservas.\n` +
      `Contactanos para coordinar el pago 💬`
    );
    return;
  }

  setSession(phone, { step: 'fecha', operadoraId: op.id });

  await enviarMensaje(phone,
    `📅 *Agendar equipo*\n\n` +
    `¿Para qué fecha necesitás el equipo?\n\n` +
    `Escribí la fecha en formato:\n` +
    `• *15/04* (día/mes del año actual)\n` +
    `• *15/04/2026* (día/mes/año)\n` +
    `• *mañana* o *pasado mañana*\n\n` +
    `_Escribí "cancelar" para volver al menú_`
  );
}

async function continuarFlujo(phone, input, textoOriginal, session, op) {
  switch (session.step) {

    // ─── PASO 1: Recibir fecha ───
    case 'fecha': {
      const fecha = parsearFecha(textoOriginal);
      if (!fecha) {
        await enviarMensaje(phone,
          `❌ No entendí la fecha. Probá con:\n` +
          `• *15/04* (día/mes)\n` +
          `• *mañana*\n` +
          `• *15/04/2026*`
        );
        return;
      }

      if (fecha < new Date().toISOString().split('T')[0]) {
        await enviarMensaje(phone, `⚠️ Esa fecha ya pasó. Ingresá una fecha futura.`);
        return;
      }

      // Buscar equipos disponibles
      const { rows: equipos } = await pool.query(`
        SELECT m.id, m.nombre, m.categoria, m.ubicacion
        FROM maquinas m
        WHERE m.estado = 'disponible'
          AND m.id NOT IN (
            SELECT r.maquina_id FROM reservas r
            WHERE r.estado NOT IN ('rechazada','cancelada')
              AND r.fecha_inicio <= $1 AND r.fecha_fin >= $1
          )
        ORDER BY m.categoria, m.nombre
      `, [fecha]);

      if (!equipos.length) {
        await enviarMensaje(phone,
          `😔 No hay equipos disponibles para el *${formatearFecha(fecha)}*.\n\n` +
          `Probá con otra fecha o escribí *"cancelar"* para volver al menú.`
        );
        return;
      }

      // Verificar habilitaciones de la operadora
      const { rows: habs } = await pool.query(
        `SELECT equipo_categoria FROM habilitaciones WHERE operadora_id = $1 AND estado = 'activo'`,
        [op.id]
      );
      const habCats = habs.map(h => h.equipo_categoria);
      const catMap = {
        'Soprano Ice': 'soprano_ice', 'Láser Depilación': 'laser_diodo',
        'Láser Diodo': 'laser_diodo', 'HIFU': 'hifu'
      };

      // Filtrar equipos por habilitación (si aplica)
      const equiposFiltrados = equipos.filter(eq => {
        const catHab = catMap[eq.categoria];
        if (!catHab) return true; // Sin requisito de habilitación
        return habCats.includes(catHab);
      });

      const noHabilitados = equipos.length - equiposFiltrados.length;

      if (!equiposFiltrados.length) {
        await enviarMensaje(phone,
          `⚠️ Hay ${equipos.length} equipo${equipos.length > 1 ? 's' : ''} disponible${equipos.length > 1 ? 's' : ''} ` +
          `para el *${formatearFecha(fecha)}*, pero no tenés habilitación técnica para ninguno.\n\n` +
          `Contactá al equipo DepiMóvil para capacitarte. 📚`
        );
        return;
      }

      setSession(phone, {
        step: 'equipo',
        operadoraId: op.id,
        fecha,
        equipos: equiposFiltrados,
      });

      let lista = equiposFiltrados.map((eq, i) =>
        `*${i + 1}.* ${eq.nombre} — ${eq.categoria}${eq.ubicacion ? ' (' + eq.ubicacion + ')' : ''}`
      ).join('\n');

      let msg = `📅 Equipos disponibles para *${formatearFecha(fecha)}*:\n\n${lista}\n\n`;
      if (noHabilitados > 0) {
        msg += `_(${noHabilitados} equipo${noHabilitados > 1 ? 's' : ''} no mostrado${noHabilitados > 1 ? 's' : ''} por falta de habilitación)_\n\n`;
      }
      msg += `Escribí el *número* del equipo que querés reservar.`;

      await enviarMensaje(phone, msg);
      return;
    }

    // ─── PASO 2: Seleccionar equipo ───
    case 'equipo': {
      const num = parseInt(input);
      if (isNaN(num) || num < 1 || num > session.equipos.length) {
        await enviarMensaje(phone,
          `❌ Escribí un número del 1 al ${session.equipos.length} para elegir el equipo.`
        );
        return;
      }

      const equipo = session.equipos[num - 1];
      setSession(phone, {
        ...session,
        step: 'confirmar',
        equipoSeleccionado: equipo,
      });

      await enviarMensaje(phone,
        `✅ *Resumen de tu reserva:*\n\n` +
        `📌 *Equipo:* ${equipo.nombre}\n` +
        `📂 *Categoría:* ${equipo.categoria}\n` +
        `📅 *Fecha:* ${formatearFecha(session.fecha)}\n` +
        `📍 *Tipo:* Jornada (1 día)\n\n` +
        `¿Confirmás la solicitud?\n\n` +
        `Escribí *"sí"* para confirmar o *"cancelar"* para volver al menú.`
      );
      return;
    }

    // ─── PASO 3: Confirmar ───
    case 'confirmar': {
      if (['si', 'sí', 'confirmar', 'confirmo', 'dale', 'ok', 'va', 'listo'].includes(input)) {
        const equipo = session.equipoSeleccionado;
        const fecha = session.fecha;

        try {
          // Crear reserva directamente en la DB
          const { rows: maxRows } = await pool.query('SELECT MAX(id) as max_id FROM reservas');
          const nextId = (maxRows[0].max_id || 0) + 1;
          const codigo = 'RSV-' + String(nextId).padStart(3, '0');

          const { rows: newRes } = await pool.query(`
            INSERT INTO reservas (codigo, operadora_id, maquina_id, tipo, estado,
              fecha_jornada, fecha_inicio, fecha_fin, notas)
            VALUES ($1, $2, $3, 'jornada', 'solicitud_recibida', $4, $4, $4, $5)
            RETURNING *
          `, [codigo, session.operadoraId, equipo.id, fecha, 'Reserva creada via WhatsApp']);

          // Historial
          await pool.query(
            `INSERT INTO reserva_historial (reserva_id, estado_nuevo, motivo) VALUES ($1, 'solicitud_recibida', 'Reserva creada via WhatsApp bot')`,
            [newRes[0].id]
          );

          // Auditoría
          await pool.query(
            `INSERT INTO audit_log (accion, entidad, entidad_id, detalle) VALUES ('CREATE', 'reserva', $1, $2)`,
            [newRes[0].id, `WhatsApp bot — ${codigo} — ${equipo.nombre}`]
          );

          clearSession(phone);

          await enviarMensaje(phone,
            `🎉 *¡Solicitud enviada!*\n\n` +
            `📋 *Código:* ${codigo}\n` +
            `📌 *Equipo:* ${equipo.nombre}\n` +
            `📅 *Fecha:* ${formatearFecha(fecha)}\n\n` +
            `El equipo DepiMóvil va a revisar tu solicitud y te avisamos cuando esté confirmada.\n\n` +
            `_Equipo DepiMóvil_ ✦`
          );

          // Notificar a admin (opcional — via WA o log)
          console.log(`🔔 NUEVA RESERVA VIA WHATSAPP: ${codigo} — ${op.nombre} — ${equipo.nombre} — ${fecha}`);

        } catch (err) {
          console.error('Error creando reserva via WA:', err);
          clearSession(phone);
          await enviarMensaje(phone,
            `❌ Hubo un error al crear tu reserva. Por favor intentá de nuevo o usá el portal web:\n` +
            `🔗 https://portal.depimovil.live`
          );
        }
        return;
      }

      if (['no', 'cancelar', 'volver'].includes(input)) {
        clearSession(phone);
        return await enviarMenu(phone, op);
      }

      await enviarMensaje(phone, `Escribí *"sí"* para confirmar o *"cancelar"* para volver.`);
      return;
    }
  }
}

// ═══════════════════════════════════
// MIS RESERVAS
// ═══════════════════════════════════
async function enviarReservas(phone, op) {
  const { rows: reservas } = await pool.query(`
    SELECT r.codigo, r.estado, r.fecha_inicio, r.fecha_fin, m.nombre AS maquina
    FROM reservas r JOIN maquinas m ON m.id = r.maquina_id
    WHERE r.operadora_id = $1 AND r.estado NOT IN ('rechazada','cancelada','completada')
    ORDER BY r.fecha_inicio
    LIMIT 5
  `, [op.id]);

  if (!reservas.length) {
    await enviarMensaje(phone,
      `📋 No tenés reservas activas.\n\n` +
      `¿Querés agendar un equipo? Escribí *"agendar"*.`
    );
    return;
  }

  const estadoEmoji = {
    solicitud_recibida: '📩', pendiente_aprobacion: '⏳',
    aprobada: '👍', confirmada: '✅', reprogramada: '🔄',
  };

  const lista = reservas.map(r => {
    const emoji = estadoEmoji[r.estado] || '📌';
    const fechas = r.fecha_inicio === r.fecha_fin
      ? formatearFecha(r.fecha_inicio)
      : `${formatearFecha(r.fecha_inicio)} → ${formatearFecha(r.fecha_fin)}`;
    return `${emoji} *${r.codigo}* — ${r.maquina}\n   ${fechas} — _${r.estado.replace(/_/g, ' ')}_`;
  }).join('\n\n');

  await enviarMensaje(phone,
    `📋 *Tus reservas activas:*\n\n${lista}\n\n` +
    `Para más detalles usá el portal:\n🔗 https://portal.depimovil.live`
  );
}

// ═══════════════════════════════════
// HELPERS
// ═══════════════════════════════════
function extractIncomingMessages(payload) {
  return [
    ...extractMetaMessages(payload),
    ...extractEvolutionMessages(payload),
  ];
}

function extractMetaMessages(payload) {
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages?.length) return [];
  return value.messages.map(msg => {
    const messageType = msg.type || 'unknown';
    let texto = '';
    if (messageType === 'text') {
      texto = msg.text?.body?.trim() || '';
    } else if (messageType === 'interactive') {
      texto = msg.interactive?.button_reply?.title
           || msg.interactive?.list_reply?.title
           || msg.interactive?.list_reply?.id
           || '';
    } else {
      texto = msg.image?.caption || msg.video?.caption || msg.document?.caption || '';
    }
    return {
      provider: 'meta',
      phone: msg.from,
      texto,
      messageType,
      messageId: msg.id || null,
      rawPayload: msg,
    };
  });
}

function extractEvolutionMessages(payload) {
  const event = String(payload?.event || '').toLowerCase();
  if (event && event !== 'messages.upsert') return [];
  const items = Array.isArray(payload?.data) ? payload.data : (payload?.data ? [payload.data] : []);
  return items.map(item => {
    const key = item?.key || {};
    const remoteJid = String(key.remoteJid || item?.remoteJid || '');
    if (!remoteJid || remoteJid.endsWith('@g.us') || key.fromMe) return null;
    const phone = remoteJid.split('@')[0];
    const msg = item?.message || {};
    const messageType = item?.messageType || Object.keys(msg)[0] || 'unknown';
    const texto = extractEvolutionText(msg, item).trim();
    return {
      provider: 'evolution',
      phone,
      texto,
      messageType,
      messageId: key.id || item?.id || null,
      rawPayload: item,
    };
  }).filter(Boolean);
}

function extractEvolutionText(msg, item) {
  return msg.conversation
      || msg.extendedTextMessage?.text
      || msg.imageMessage?.caption
      || msg.videoMessage?.caption
      || msg.documentMessage?.caption
      || msg.buttonsResponseMessage?.selectedDisplayText
      || msg.buttonsResponseMessage?.selectedButtonId
      || msg.listResponseMessage?.title
      || msg.listResponseMessage?.singleSelectReply?.selectedRowId
      || msg.templateButtonReplyMessage?.selectedDisplayText
      || item?.message?.conversation
      || '';
}

function normalizeWhatsapp(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '598' + digits.slice(1);
  if (!digits.startsWith('598') && digits.length <= 9) digits = '598' + digits;
  return '+' + digits;
}

function phoneVariants(whatsapp) {
  const digits = normalizeWhatsapp(whatsapp).replace(/\D/g, '');
  const variants = new Set([digits]);
  if (digits.startsWith('598')) {
    variants.add(digits.slice(3));
    variants.add('0' + digits.slice(3));
  }
  return [...variants];
}

function normalizeWhatsappDigits(input) {
  return normalizeWhatsapp(input).replace(/\D/g, '');
}

function inferirIntencionWhatsApp(texto) {
  const input = String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const reglas = [
    { intent: 'cierre_pago', score: 40, tecnologia: null, words: ['sena', 'seña', 'pago', 'transferencia', 'comprobante', 'deposito'] },
    { intent: 'reserva_caliente', score: 25, tecnologia: null, words: ['fecha', 'disponible', 'reservar', 'reserva', 'agenda', 'turno'] },
    { intent: 'presupuesto', score: 20, tecnologia: null, words: ['precio', 'costo', 'cuanto sale', 'cuánto sale', 'presupuesto', 'tarifa'] },
    { intent: 'logistica', score: 10, tecnologia: null, words: ['envio', 'envío', 'agencia', 'dac', 'retiro', 'llega', 'tracking'] },
    { intent: 'depilacion_laser', score: 12, tecnologia: 'Depilación Láser', words: ['depilacion', 'depilación', 'laser', 'láser', 'soprano', 'ice', 'diodo'] },
    { intent: 'nd_yag', score: 12, tecnologia: 'ND-YAG', words: ['tatuaje', 'hollywood peel', 'cejas', 'nd yag', 'nd-yag'] },
    { intent: 'hifu', score: 12, tecnologia: 'HIFU', words: ['hifu', 'liposonix', 'flaccidez'] },
    { intent: 'exilis', score: 12, tecnologia: 'EXILIS 360', words: ['exilis', 'radiofrecuencia'] },
  ];
  const match = reglas.find(r => r.words.some(w => input.includes(w.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))));
  return match || { intent: 'mensaje_whatsapp', score: 5, tecnologia: null };
}

function temperaturaPorScore(score) {
  if (score >= 45) return 'caliente';
  if (score >= 20) return 'tibio';
  return 'frio';
}

function estadoLeadPorIntencion(intencion, estadoActual) {
  const estadosFinales = ['ganado', 'perdido', 'cliente_activa', 'reserva_confirmada'];
  if (estadosFinales.includes(estadoActual)) return estadoActual;
  const map = {
    cierre_pago: 'pendiente_sena',
    reserva_caliente: 'calificado',
    presupuesto: 'presupuesto_enviado',
    logistica: 'reserva_confirmada',
    depilacion_laser: 'interesado',
    nd_yag: 'interesado',
    hifu: 'interesado',
    exilis: 'interesado',
  };
  return map[intencion.intent] || estadoActual || 'nuevo';
}

async function buscarOperadoraPorTelefono(phone) {
  const variants = phoneVariants(phone);
  const { rows } = await pool.query(
    `SELECT id, nombre, apellido, whatsapp, telefono
     FROM operadoras
     WHERE regexp_replace(coalesce(whatsapp, telefono, ''), '[^0-9]', '', 'g') = ANY($1)
     ORDER BY id DESC
     LIMIT 1`,
    [variants]
  );
  return rows[0] || null;
}

async function buscarLeadPorTelefono(phone) {
  const variants = phoneVariants(phone);
  const { rows } = await pool.query(
    `SELECT *
     FROM leads
     WHERE whatsapp_phone_norm = ANY($1)
        OR regexp_replace(coalesce(telefono, ''), '[^0-9]', '', 'g') = ANY($1)
     ORDER BY updated_at DESC NULLS LAST, id DESC
     LIMIT 1`,
    [variants]
  );
  return rows[0] || null;
}

function nombreContactoDesdePayload(rawPayload, phoneNorm) {
  return rawPayload?.profile?.name || rawPayload?.contacts?.[0]?.profile?.name || `WhatsApp ${phoneNorm}`;
}

async function upsertLeadDesdeWhatsApp({ phone, texto, rawPayload, intencion }) {
  const phoneNorm = normalizeWhatsappDigits(phone);
  const operadora = await buscarOperadoraPorTelefono(phone);
  let lead = await buscarLeadPorTelefono(phone);
  const proxAccion = intencion.intent === 'reserva_caliente'
    ? 'Responder consulta y validar fecha/equipo para reserva'
    : intencion.intent === 'presupuesto'
      ? 'Enviar o confirmar presupuesto'
      : intencion.intent === 'cierre_pago'
        ? 'Verificar seña/pago y avanzar cierre'
        : 'Revisar conversación de WhatsApp y responder';
  const nota = texto
    ? `WhatsApp recibido (${intencion.intent}): ${texto}`.slice(0, 1200)
    : `WhatsApp recibido (${intencion.intent}): mensaje ${rawPayload?.type || 'sin texto'}`;

  if (!lead && !operadora) {
    const nombre = nombreContactoDesdePayload(rawPayload, phoneNorm);
    const { rows } = await pool.query(`
      INSERT INTO leads (
        nombre, telefono, canal, estado, temperatura, interes, tecnologia, obs,
        prox_accion, whatsapp_phone_norm, whatsapp_score, ultimo_contacto, intencion_whatsapp
      ) VALUES ($1,$2,'whatsapp',$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11)
      RETURNING *
    `, [
      nombre,
      normalizeWhatsapp(phone),
      estadoLeadPorIntencion(intencion, 'nuevo'),
      temperaturaPorScore(intencion.score),
      texto || 'Contacto iniciado por WhatsApp',
      intencion.tecnologia,
      'Creado automáticamente desde webhook de WhatsApp en modo escucha',
      proxAccion,
      phoneNorm,
      intencion.score,
      intencion.intent,
    ]);
    lead = rows[0];
    await pool.query(
      `INSERT INTO audit_log (accion, entidad, entidad_id, detalle)
       VALUES ('WA_LEAD_CREATED','lead',$1,$2)`,
      [lead.id, `Nuevo lead WhatsApp ${normalizeWhatsapp(phone)} (${intencion.intent})`]
    );
  } else if (lead) {
    const nuevoScore = Math.max(0, Number(lead.whatsapp_score || 0) + intencion.score);
    const { rows } = await pool.query(`
      UPDATE leads
      SET whatsapp_phone_norm=$1,
          whatsapp_score=$2,
          ultimo_contacto=NOW(),
          intencion_whatsapp=$3,
          temperatura=$4,
          tecnologia=COALESCE(tecnologia, $5),
          estado=$6,
          prox_accion=COALESCE($7, prox_accion),
          updated_at=NOW()
      WHERE id=$8
      RETURNING *
    `, [
      phoneNorm,
      nuevoScore,
      intencion.intent,
      temperaturaPorScore(nuevoScore),
      intencion.tecnologia,
      estadoLeadPorIntencion(intencion, lead.estado),
      proxAccion,
      lead.id,
    ]);
    lead = rows[0];
  }

  if (lead) {
    await pool.query(`
      INSERT INTO leads_notas (lead_id, tipo, texto, resultado, prox_accion, usuario_email)
      VALUES ($1,'whatsapp',$2,$3,$4,'sistema-whatsapp')
    `, [lead.id, nota, intencion.intent, proxAccion]);
  }

  if (operadora) {
    await pool.query(
      `INSERT INTO audit_log (accion, entidad, entidad_id, detalle)
       VALUES ('WA_OPERATOR_CONTACT','operadora',$1,$2)`,
      [operadora.id, `Mensaje WhatsApp asociado (${intencion.intent})`]
    );
  }

  return { operadora, lead };
}

async function registrarMensajeEntrante({ provider = 'meta', phone, texto, messageType, messageId, rawPayload }) {
  await whatsappTablesReady;
  const phoneNorm = normalizeWhatsappDigits(phone);
  if (!phoneNorm) return null;
  if (messageId) {
    const { rows: prev } = await pool.query(
      'SELECT id FROM whatsapp_messages WHERE provider_message_id=$1 LIMIT 1',
      [messageId]
    );
    if (prev.length) return prev[0];
  }
  const intencion = inferirIntencionWhatsApp(texto);
  const asociaciones = await upsertLeadDesdeWhatsApp({ phone, texto, rawPayload, intencion });

  try {
    const { rows } = await pool.query(`
      INSERT INTO whatsapp_messages (
        provider, provider_message_id, direction, phone, phone_norm,
        operadora_id, lead_id, message_type, body, intent, score_delta, raw_payload
      ) VALUES ($1,$2,'inbound',$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (provider_message_id) WHERE provider_message_id IS NOT NULL DO NOTHING
      RETURNING *
    `, [
      provider,
      messageId,
      normalizeWhatsapp(phone),
      phoneNorm,
      asociaciones.operadora?.id || null,
      asociaciones.lead?.id || null,
      messageType || 'unknown',
      texto || null,
      intencion.intent,
      intencion.score,
      rawPayload ? JSON.stringify(rawPayload) : null,
    ]);
    return rows[0] || null;
  } catch (err) {
    console.error('registrarMensajeEntrante error:', err.message);
    return null;
  }
}

function cleanAdminObs(value) {
  return String(value || '').trim().slice(0, 1000);
}

function parseRevisionOperadoraCommand(texto) {
  const raw = String(texto || '').trim();
  const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const match = normalized.match(/^(aprobar|apruebo|autorizar|autorizo|rechazar|observar|observada|docs|documentos|pedir\s+docs|pedir\s+documentos)\s+(?:op|operadora)?[-#\s]*(\d+)(?:\s+([\s\S]+))?$/i);
  if (!match) return null;
  const cmd = match[1].toLowerCase().replace(/\s+/g, ' ');
  const operadoraId = parseInt(match[2], 10);
  const obs = cleanAdminObs(match[3]);
  const accion = {
    aprobar: 'aprobar',
    apruebo: 'aprobar',
    autorizar: 'aprobar',
    autorizo: 'aprobar',
    rechazar: 'rechazar',
    observar: 'observar',
    observada: 'observar',
    docs: 'pedir_documentos',
    documentos: 'pedir_documentos',
    'pedir docs': 'pedir_documentos',
    'pedir documentos': 'pedir_documentos',
  }[cmd];
  if (!accion || !operadoraId) return null;
  return { accion, operadoraId, obs };
}

async function buscarAdminPorWhatsapp(phone) {
  const variants = phoneVariants(phone);
  const { rows } = await pool.query(
    `SELECT id, nombre, email, whatsapp, rol
     FROM usuarios
     WHERE rol IN ('superadmin','administrador','operaciones')
       AND status = 'activo'
       AND regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g') = ANY($1)
     ORDER BY rol = 'superadmin' DESC, id ASC
     LIMIT 1`,
    [variants]
  );
  return rows[0] || null;
}

async function procesarRevisionOperadoraAdmin(phone, texto) {
  const command = parseRevisionOperadoraCommand(texto);
  if (!command) return { procesado: false };

  const admin = await buscarAdminPorWhatsapp(phone);
  if (!admin) {
    await enviarMensaje(phone, 'No puedo ejecutar esa autorización: tu WhatsApp no está cargado como administrador u operaciones en DepiMóvil.');
    return { procesado: true };
  }

  const estadoMap = {
    aprobar: 'aprobada',
    observar: 'observada',
    rechazar: 'rechazada',
    pedir_documentos: 'documentos_solicitados',
  };
  const accionLabel = {
    aprobar: 'aprobada',
    observar: 'observada',
    rechazar: 'rechazada',
    pedir_documentos: 'con documentos solicitados',
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT
         u.id AS usuario_id, u.status AS usuario_status, u.whatsapp AS usuario_whatsapp,
         u.revision_admin_estado, u.operadora_id,
         o.id AS operadora_id_real, o.nombre, o.apellido, o.whatsapp AS op_whatsapp,
         o.portal_token
       FROM usuarios u
       JOIN operadoras o ON o.id = u.operadora_id
       WHERE o.id = $1 AND u.rol = 'operadora'
       ORDER BY u.id DESC
       LIMIT 1`,
      [command.operadoraId]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      await enviarMensaje(phone, `No encontré una operadora vinculada a OP-${command.operadoraId}.`);
      return { procesado: true };
    }

    const row = rows[0];
    const requiereRevision = ['observar', 'pedir_documentos'].includes(command.accion);
    await client.query(
      `UPDATE usuarios
       SET requiere_revision_admin = $1,
           revision_admin_estado = $2,
           revision_admin_obs = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [requiereRevision, estadoMap[command.accion], command.obs || null, row.usuario_id]
    );
    if (command.accion === 'aprobar') {
      await client.query('UPDATE operadoras SET estado = $1, updated_at = NOW() WHERE id = $2', ['activa', row.operadora_id_real]);
      await client.query('UPDATE usuarios SET status = $1, updated_at = NOW() WHERE id = $2', ['activo', row.usuario_id]);
    } else if (command.accion === 'rechazar') {
      await client.query('UPDATE operadoras SET estado = $1, updated_at = NOW() WHERE id = $2', ['suspendida', row.operadora_id_real]);
      await client.query('UPDATE usuarios SET status = $1, updated_at = NOW() WHERE id = $2', ['inactivo', row.usuario_id]);
    }
    await client.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id) VALUES ($1,$2,$3,$4,$5)',
      [`WA_REVISION_${command.accion.toUpperCase()}`, 'operadora', row.operadora_id_real, command.obs || estadoMap[command.accion], admin.id]
    );
    await client.query('COMMIT');

    const nombre = `${row.nombre || ''} ${row.apellido || ''}`.trim() || `OP-${row.operadora_id_real}`;
    await enviarMensaje(phone, `Listo. ${nombre} quedó ${accionLabel[command.accion]}.`);

    const waOperadora = row.usuario_whatsapp || row.op_whatsapp;
    if (waOperadora) {
      const portalUrl = row.portal_token ? `https://crm.depimovil.live/portal.html?token=${row.portal_token}` : '';
      const mensajes = {
        aprobar: `Tu alta de DepiMóvil fue autorizada. Ya podés ingresar con tu WhatsApp y el código de acceso.`,
        observar: `DepiMóvil revisó tu registro y necesita aclarar algunos datos.${command.obs ? `\n\nObservación: ${command.obs}` : ''}`,
        rechazar: `DepiMóvil revisó tu registro y por ahora no quedó aprobado.${command.obs ? `\n\nMotivo: ${command.obs}` : ''}`,
        pedir_documentos: `DepiMóvil necesita que subas fotos de tu cédula/DNI frente y dorso para completar tu registro.${command.obs ? `\n\nNota: ${command.obs}` : ''}${portalUrl ? `\n\nSubilos acá: ${portalUrl}` : ''}`,
      };
      await enviarMensaje(waOperadora, mensajes[command.accion]);
    }

    return { procesado: true };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('WA admin revision error:', err);
    await enviarMensaje(phone, 'No pude procesar la autorización. Revisá el ID y probá de nuevo.');
    return { procesado: true };
  } finally {
    client.release();
  }
}

async function buscarOperadora(phone) {
  // Limpiar número: sacar +, espacios, guiones
  const clean = phone.replace(/[^0-9]/g, '');
  
  // Buscar por coincidencia parcial (últimos 8-9 dígitos)
  const ultimos = clean.slice(-9);

  const { rows } = await pool.query(`
    SELECT * FROM operadoras 
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(whatsapp, '+', ''), ' ', ''), '-', ''), '.', '') 
          LIKE '%' || $1
       OR REPLACE(REPLACE(REPLACE(REPLACE(telefono, '+', ''), ' ', ''), '-', ''), '.', '') 
          LIKE '%' || $1
    LIMIT 1
  `, [ultimos]);

  return rows[0] || null;
}

function parsearFecha(texto) {
  const t = texto.trim().toLowerCase();
  const hoy = new Date();

  // "mañana"
  if (t === 'mañana' || t === 'manana') {
    const d = new Date(hoy); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  // "pasado mañana" / "pasado"
  if (t.includes('pasado')) {
    const d = new Date(hoy); d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }

  // DD/MM o DD-MM o DD.MM
  const match2 = t.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (match2) {
    const dia = parseInt(match2[1]);
    const mes = parseInt(match2[2]) - 1;
    let year = hoy.getFullYear();
    // Si la fecha ya pasó este año, asumir el próximo
    const candidata = new Date(year, mes, dia);
    if (candidata < hoy) year++;
    return `${year}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const match3 = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (match3) {
    const dia = parseInt(match3[1]);
    const mes = parseInt(match3[2]) - 1;
    let year = parseInt(match3[3]);
    if (year < 100) year += 2000;
    return `${year}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  return null;
}

function formatearFecha(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' });
}

module.exports = router;
