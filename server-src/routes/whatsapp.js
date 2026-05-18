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

  const verifyToken = process.env.WA_VERIFY_TOKEN || 'depimovil-webhook-2026';

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
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) return; // No es un mensaje (puede ser status update)

    const msg = value.messages[0];
    const phone = msg.from; // Número de la operadora
    const messageType = msg.type;

    // Extraer texto del mensaje
    let texto = '';
    if (messageType === 'text') {
      texto = msg.text.body.trim();
    } else if (messageType === 'interactive') {
      // Respuesta a botón o lista
      texto = msg.interactive?.button_reply?.title 
           || msg.interactive?.list_reply?.title 
           || msg.interactive?.list_reply?.id
           || '';
    } else {
      // Audio, imagen, etc — no procesamos
      await enviarMensaje(phone, '📝 Por ahora solo puedo procesar mensajes de texto. Escribime lo que necesitás.');
      return;
    }

    if (!texto) return;

    // Procesar el mensaje
    await procesarMensaje(phone, texto);

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
        'Láser Diodo': 'laser_diodo', 'IPL': 'ipl', 'HIFU': 'hifu'
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
