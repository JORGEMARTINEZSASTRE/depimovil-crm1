/**
 * DepiMóvil — Cola manual de mensajes WhatsApp (wa_queue)
 *
 * Cuando el envio automatico falla (WhatsApp desconectado, API no disponible, etc.)
 * el mensaje queda guardado en esta tabla para que el admin lo envie manualmente
 * desde el panel de la CRM.
 *
 * Tabla: wa_queue
 *   id           SERIAL PRIMARY KEY
 *   reserva_id   INTEGER REFERENCES reservas(id)
 *   operadora_id INTEGER REFERENCES operadoras(id)
 *   tipo         VARCHAR(50)   -- 'recordatorio_24h', 'recordatorio_2h', 'estado_cambio', etc.
 *   mensaje      TEXT
 *   telefono     VARCHAR(30)
 *   enviado      BOOLEAN DEFAULT false
 *   creado_en    TIMESTAMP DEFAULT NOW()
 *   enviado_en   TIMESTAMP
 */

const pool = require('./db');

/**
 * Agrega un mensaje a la cola.
 * @param {Object} opts
 * @param {number} opts.reservaId
 * @param {number} opts.operadoraId
 * @param {string} opts.tipo
 * @param {string} opts.mensaje
 * @param {string} opts.telefono
 * @returns {Promise<Object>} El registro creado
 */
async function encolar({ reservaId, operadoraId, tipo, mensaje, telefono }) {
  const { rows } = await pool.query(
    `INSERT INTO wa_queue (reserva_id, operadora_id, tipo, mensaje, telefono)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [reservaId || null, operadoraId || null, tipo, mensaje, telefono]
  );
  return rows[0];
}

/**
 * Obtiene los mensajes pendientes de envio.
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
async function getPendientes(limit = 50) {
  const { rows } = await pool.query(
    `SELECT q.*, o.nombre AS op_nombre, o.apellido AS op_apellido,
            r.codigo AS reserva_codigo
     FROM wa_queue q
     LEFT JOIN operadoras o ON o.id = q.operadora_id
     LEFT JOIN reservas   r ON r.id = q.reserva_id
     WHERE q.enviado = false
     ORDER BY q.creado_en ASC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

/**
 * Marca un mensaje como enviado.
 * @param {number} id
 */
async function marcarEnviado(id) {
  await pool.query(
    `UPDATE wa_queue SET enviado = true, enviado_en = NOW() WHERE id = $1`,
    [id]
  );
}

/**
 * Crea la tabla wa_queue si no existe. Llamar al arrancar el servidor.
 */
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_queue (
      id           SERIAL PRIMARY KEY,
      reserva_id   INTEGER,
      operadora_id INTEGER,
      tipo         VARCHAR(50)  NOT NULL,
      mensaje      TEXT         NOT NULL,
      telefono     VARCHAR(30)  NOT NULL,
      enviado      BOOLEAN      NOT NULL DEFAULT false,
      creado_en    TIMESTAMP    NOT NULL DEFAULT NOW(),
      enviado_en   TIMESTAMP
    )
  `);
}

module.exports = { encolar, getPendientes, marcarEnviado, ensureTable };
