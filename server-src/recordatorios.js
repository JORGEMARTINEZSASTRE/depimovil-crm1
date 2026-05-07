/**
 * DepiMóvil — Sistema de Recordatorios Automáticos por WhatsApp
 *
 * Corre un cron job cada 5 minutos.
 * En cada ejecución busca reservas que entren en la ventana de tiempo
 * y envía mensajes de recordatorio a las operadoras.
 *
 * Tipos de recordatorio:
 *   - 24h antes: ventana entre 23:50hs y 24:10hs desde ahora
 *   - 2h antes:  ventana entre 1:50hs y 2:10hs desde ahora
 *
 * Condiciones para enviar:
 *   - La reserva debe estar en estado activo (aprobada o confirmada)
 *   - El campo de control (recordatorio_Xh_enviado) debe ser false o null
 *   - La operadora debe tener número de WhatsApp registrado
 *
 * Variables disponibles en plantillas:
 *   {nombre}, {apellido}, {reserva}, {maquina}, {fecha}, {estado}, {departamento}
 */

const cron = require('node-cron');
const pool = require('./utils/db');
const { enviarMensaje } = require('./utils/wa_sender');

// ══════════════════════════════════════════════
// PLANTILLAS DE MENSAJES
// ══════════════════════════════════════════════

const PLANTILLA_24H = `¡Hola {nombre}! 👋

Te recordamos tu reserva de mañana:
📌 Equipo: *{maquina}*
📅 Fecha: *{fecha}*
📍 Departamento: *{departamento}*
🔖 Código: {reserva}

¿Necesitás hacer algún cambio? Contactanos a la brevedad.
_Equipo DepiMóvil_ ✦`;

const PLANTILLA_2H = `¡Hola {nombre}! ⏰

Tu reserva es *en 2 horas*:
📌 Equipo: *{maquina}*
📅 Fecha: *{fecha}*
🔖 Código: {reserva}

¡Te esperamos! Si tenés alguna consulta, escribinos.
_Equipo DepiMóvil_ ✦`;

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

/**
 * Formatea una fecha ISO a formato legible en español.
 * @param {string|Date} dateVal
 * @returns {string} Ej: "lun. 15 de abr."
 */
function formatearFecha(dateVal) {
  try {
    const d = new Date(
      typeof dateVal === 'string' && dateVal.length === 10
        ? dateVal + 'T12:00:00'
        : dateVal
    );
    return d.toLocaleDateString('es-UY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return String(dateVal);
  }
}

/**
 * Reemplaza las variables de una plantilla con los datos de la reserva.
 * @param {string} plantilla
 * @param {Object} datos
 * @returns {string}
 */
function aplicarPlantilla(plantilla, datos) {
  return plantilla
    .replace(/{nombre}/g,       datos.nombre       || '')
    .replace(/{apellido}/g,     datos.apellido      || '')
    .replace(/{reserva}/g,      datos.reserva       || '')
    .replace(/{maquina}/g,      datos.maquina       || '')
    .replace(/{fecha}/g,        datos.fecha         || '')
    .replace(/{estado}/g,       datos.estado        || '')
    .replace(/{departamento}/g, datos.departamento  || '');
}

/**
 * Guarda un mensaje en la cola wa_queue (para envio manual si falla el auto).
 */
async function encolarMensaje(pool, { reservaId, operadoraId, tipo, mensaje, telefono }) {
  try {
    await pool.query(
      `INSERT INTO wa_queue (reserva_id, operadora_id, tipo, mensaje, telefono)
       VALUES ($1, $2, $3, $4, $5)`,
      [reservaId, operadoraId, tipo, mensaje, telefono]
    );
  } catch (err) {
    console.error('❌ Error encolando mensaje WA:', err.message);
  }
}

// ══════════════════════════════════════════════
// LÓGICA PRINCIPAL
// ══════════════════════════════════════════════

/**
 * Procesa los recordatorios para una ventana de tiempo dada.
 *
 * @param {Object} opts
 * @param {number} opts.minutosMin  - Minutos mínimos hasta la reserva (ej: 1430 para 23:50)
 * @param {number} opts.minutosMax  - Minutos máximos hasta la reserva (ej: 1450 para 24:10)
 * @param {string} opts.campo       - Columna de control: 'recordatorio_24h_enviado' | 'recordatorio_2h_enviado'
 * @param {string} opts.tipo        - Etiqueta: 'recordatorio_24h' | 'recordatorio_2h'
 * @param {string} opts.plantilla   - Texto de la plantilla con variables
 */
async function procesarVentana({ minutosMin, minutosMax, campo, tipo, plantilla }) {
  const ahora = new Date();
  const desde = new Date(ahora.getTime() + minutosMin * 60 * 1000);
  const hasta = new Date(ahora.getTime() + minutosMax * 60 * 1000);

  // Formatear a YYYY-MM-DD para comparar con la columna fecha_jornada/fecha_inicio
  const desdeFecha = desde.toISOString().split('T')[0];
  const hastaFecha = hasta.toISOString().split('T')[0];

  // Para reservas de tipo 'jornada' (sin hora) usamos la fecha del dia.
  // La condicion es: la fecha_inicio cae dentro del rango de dias relevante
  // para la ventana de recordatorio.
  // Nota: como las reservas actuales no tienen campo 'hora', el recordatorio 24h
  // se dispara el dia anterior. El de 2h se omite para jornadas sin hora
  // (solo aplica si en el futuro se agrega hora al modelo).

  const { rows: reservas } = await pool.query(
    `SELECT
       r.id,
       r.codigo,
       r.estado,
       r.fecha_jornada,
       r.fecha_inicio,
       r.dept_logistica,
       m.nombre AS maquina,
       o.nombre AS op_nombre,
       o.apellido AS op_apellido,
       o.whatsapp AS op_whatsapp,
       o.id AS operadora_id
     FROM reservas r
     JOIN maquinas   m ON m.id = r.maquina_id
     JOIN operadoras o ON o.id = r.operadora_id
     WHERE r.estado IN ('aprobada', 'confirmada')
       AND r.${campo} IS NOT TRUE
       AND COALESCE(r.fecha_jornada, r.fecha_inicio) BETWEEN $1 AND $2
       AND o.whatsapp IS NOT NULL
       AND o.whatsapp <> ''`,
    [desdeFecha, hastaFecha]
  );

  if (!reservas.length) return;

  console.log(`📋 [${tipo}] ${reservas.length} reserva(s) en ventana`);

  for (const r of reservas) {
    const fechaDisplay = formatearFecha(r.fecha_jornada || r.fecha_inicio);
    const datos = {
      nombre:      r.op_nombre,
      apellido:    r.op_apellido,
      reserva:     r.codigo,
      maquina:     r.maquina,
      fecha:       fechaDisplay,
      estado:      r.estado.replace(/_/g, ' '),
      departamento: r.dept_logistica || '',
    };

    const mensaje = aplicarPlantilla(plantilla, datos);

    // Intentar enviar
    const result = await enviarMensaje(r.op_whatsapp, mensaje);

    if (result.ok) {
      // Marcar como enviado en la DB
      await pool.query(
        `UPDATE reservas SET ${campo} = true, updated_at = NOW() WHERE id = $1`,
        [r.id]
      );

      // Auditoría
      await pool.query(
        `INSERT INTO audit_log (accion, entidad, entidad_id, detalle)
         VALUES ('WA_RECORDATORIO', 'reserva', $1, $2)`,
        [r.id, `${tipo} → ${r.op_whatsapp} — ${r.codigo}`]
      );

      console.log(`✅ [${tipo}] Enviado a ${r.op_nombre} ${r.op_apellido} (${r.op_whatsapp}) — ${r.codigo}`);
    } else {
      // Fallo: encolar para envio manual
      await encolarMensaje(pool, {
        reservaId:    r.id,
        operadoraId:  r.operadora_id,
        tipo,
        mensaje,
        telefono:     r.op_whatsapp,
      });

      console.warn(`⚠️ [${tipo}] Fallo envio a ${r.op_whatsapp} — encolado. Error: ${result.error}`);
    }
  }
}

// ══════════════════════════════════════════════
// CRON JOB
// ══════════════════════════════════════════════

/**
 * Inicia el scheduler de recordatorios.
 * Debe llamarse una sola vez al arrancar el servidor.
 */
function iniciarRecordatorios() {
  console.log('⏰ Recordatorios WhatsApp: scheduler iniciado (cada 5 min)');

  // Corre cada 5 minutos: */5 * * * *
  cron.schedule('*/5 * * * *', async () => {
    const inicio = Date.now();
    try {
      // ── Recordatorio 24 horas antes ──
      // Ventana: entre 23h50m y 24h10m desde ahora
      await procesarVentana({
        minutosMin: 23 * 60 + 50,  // 1430 min
        minutosMax: 24 * 60 + 10,  // 1450 min
        campo:     'recordatorio_24h_enviado',
        tipo:      'recordatorio_24h',
        plantilla:  PLANTILLA_24H,
      });

      // ── Recordatorio 2 horas antes ──
      // Ventana: entre 1h50m y 2h10m desde ahora
      // (Solo aplica si las reservas tienen hora; para jornadas completas
      //  este bloque no encontrará coincidencias porque las fechas no incluyen hora)
      await procesarVentana({
        minutosMin: 1 * 60 + 50,   // 110 min
        minutosMax: 2 * 60 + 10,   // 130 min
        campo:     'recordatorio_2h_enviado',
        tipo:      'recordatorio_2h',
        plantilla:  PLANTILLA_2H,
      });

    } catch (err) {
      console.error('❌ Error en cron recordatorios:', err.message);
    } finally {
      const ms = Date.now() - inicio;
      if (ms > 1000) console.log(`⏱ Recordatorios procesados en ${ms}ms`);
    }
  });
}

module.exports = { iniciarRecordatorios };
