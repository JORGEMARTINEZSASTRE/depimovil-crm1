const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole, isOpsRole } = require('../middleware/auth');
const { enviarMensaje } = require('../utils/wa_sender');
const { emitAutomationEvent } = require('../utils/automation_engine');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS envios (
      id                 SERIAL PRIMARY KEY,
      codigo             VARCHAR(50)   NOT NULL,
      reserva_id         INTEGER       REFERENCES reservas(id) ON DELETE SET NULL,
      operadora_id       INTEGER       REFERENCES operadoras(id) ON DELETE SET NULL,
      maquina_id         INTEGER       REFERENCES maquinas(id) ON DELETE SET NULL,
      transportista_id   INTEGER,
      departamento       VARCHAR(100),
      direccion          TEXT,
      transportista      VARCHAR(200),
      tracking           VARCHAR(200),
      numero_rastreo     VARCHAR(200),
      rastreo_notificado BOOLEAN DEFAULT false,
      fecha_notificacion TIMESTAMP,
      estado             VARCHAR(50)   NOT NULL DEFAULT 'pendiente_envio'
                         CHECK (estado IN ('pendiente_envio','preparando','en_transito','entregado','retiro_pendiente','retirado','cancelado')),
      tipo_envio         VARCHAR(50)   DEFAULT 'ida',
      tipo_maquina       VARCHAR(50)   DEFAULT 'chica',
      departamento_destino VARCHAR(100),
      fecha_salida       DATE,
      fecha_envio_est    DATE,
      fecha_envio_real   DATE,
      fecha_retiro_est   DATE,
      fecha_retiro_real  DATE,
      incluye_limpieza   BOOLEAN DEFAULT false,
      costo_envio        NUMERIC(10,2) DEFAULT 0,
      costo_retiro       NUMERIC(10,2) DEFAULT 0,
      costo_limpieza     NUMERIC(10,2) DEFAULT 0,
      costo_total        NUMERIC(10,2) DEFAULT 0,
      moneda             VARCHAR(10)   DEFAULT 'UYU',
      observacion        TEXT,
      obs                TEXT,
      tiene_rastreo      BOOLEAN DEFAULT true,
      tiempo_entrega_dias INTEGER,
      created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMP     NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch(err => console.error('Error creando tabla envios:', err.message));

async function generarCodigo(client) {
  const { rows } = await client.query('SELECT COUNT(*) AS cnt FROM envios');
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `ENV-${String(n).padStart(3, '0')}`;
}

// ─────────────────────────────────────────────
// GET /api/envios — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const params = [];
    const where = [];
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      params.push(req.user.operadora_id);
      where.push(`e.operadora_id = $${params.length}`);
    } else if (req.user.rol === 'transportista') {
      if (!req.user.transportista_id) return res.json([]);
      params.push(req.user.transportista_id);
      where.push(`e.transportista_id = $${params.length}`);
    } else if (!isOpsRole(req.user.rol)) {
      return res.json([]);
    }
    const { rows } = await pool.query(`
      SELECT e.*
      FROM envios e
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY e.id DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/envios error:', err);
    res.status(500).json({ error: 'Error al obtener envíos' });
  }
});

// ─────────────────────────────────────────────
// GET /api/envios/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const params = [req.params.id];
    let query = 'SELECT * FROM envios WHERE id=$1';
    if (isOperadoraRole(req.user.rol)) {
      params.push(req.user.operadora_id || 0);
      query += ` AND operadora_id = $${params.length}`;
    } else if (req.user.rol === 'transportista') {
      params.push(req.user.transportista_id || 0);
      query += ` AND transportista_id = $${params.length}`;
    } else if (!isOpsRole(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para envíos' });
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/envios/:id error:', err);
    res.status(500).json({ error: 'Error al obtener envío' });
  }
});

// ─────────────────────────────────────────────
// POST /api/envios — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones', 'transportista'), async (req, res) => {
  if (req.user.rol === 'transportista') {
    return res.status(403).json({ error: 'Transportistas solo pueden actualizar envíos asignados' });
  }
  const {
    reserva_id, operadora_id, maquina_id, transportista_id,
    departamento, direccion, transportista, tracking,
    estado, tipo_envio, tipo_maquina, departamento_destino, fecha_salida,
    fecha_envio_est, fecha_envio_real, fecha_retiro_est, fecha_retiro_real,
    incluye_limpieza, costo_envio, costo_retiro, costo_limpieza, moneda,
    observacion, obs, tiene_rastreo
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codigo = await generarCodigo(client);
    const costoTotal = (parseFloat(costo_envio) || 0) + (parseFloat(costo_limpieza) || 0);

    const { rows } = await client.query(`
      INSERT INTO envios (
        codigo, reserva_id, operadora_id, maquina_id, transportista_id,
        departamento, direccion, transportista, tracking,
        estado, tipo_envio, tipo_maquina, departamento_destino, fecha_salida,
        fecha_envio_est, fecha_envio_real, fecha_retiro_est, fecha_retiro_real,
        incluye_limpieza, costo_envio, costo_retiro, costo_limpieza, costo_total, moneda,
        observacion, obs, tiene_rastreo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
      RETURNING *
    `, [
      codigo,
      reserva_id ? parseInt(reserva_id) : null,
      operadora_id ? parseInt(operadora_id) : null,
      maquina_id ? parseInt(maquina_id) : null,
      transportista_id ? parseInt(transportista_id) : null,
      departamento || null, direccion || null, transportista || null, tracking || null,
      estado || 'pendiente_envio',
      tipo_envio || 'ida', tipo_maquina || 'chica',
      departamento_destino || departamento || null,
      fecha_salida || null,
      fecha_envio_est || null, fecha_envio_real || null,
      fecha_retiro_est || null, fecha_retiro_real || null,
      incluye_limpieza || false,
      parseFloat(costo_envio) || 0,
      parseFloat(costo_retiro) || 0,
      parseFloat(costo_limpieza) || 0,
      costoTotal,
      moneda || 'UYU',
      observacion || null, obs || null,
      tiene_rastreo !== false
    ]);
    await client.query('COMMIT');
    if (rows[0].estado === 'en_transito') {
      emitAutomationEvent(null, {
        event: 'machine.shipped',
        entity: 'envio',
        entityId: rows[0].id,
        dedupeKey: `machine.shipped:envio:${rows[0].id}`,
        payload: { envio: rows[0] },
        user: req.user,
      }).catch(() => {});
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/envios error:', err);
    res.status(500).json({ error: 'Error al crear envío' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/envios/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones', 'transportista'), async (req, res) => {
  const {
    reserva_id, operadora_id, maquina_id, transportista_id,
    departamento, direccion, transportista, tracking,
    estado, tipo_envio, tipo_maquina, departamento_destino, fecha_salida,
    fecha_envio_est, fecha_envio_real, fecha_retiro_est, fecha_retiro_real,
    incluye_limpieza, costo_envio, costo_retiro, costo_limpieza, moneda,
    observacion, obs, tiene_rastreo
  } = req.body;

  try {
    const { rows: prev } = await pool.query('SELECT id, transportista_id, estado FROM envios WHERE id=$1', [req.params.id]);
    if (!prev.length) return res.status(404).json({ error: 'Envío no encontrado' });
    if (req.user.rol === 'transportista') {
      return res.status(403).json({ error: 'Transportistas solo pueden actualizar rastreo de envíos asignados' });
    }

    const costoTotal = (parseFloat(costo_envio) || 0) + (parseFloat(costo_limpieza) || 0);

    const { rows } = await pool.query(`
      UPDATE envios SET
        reserva_id=$1, operadora_id=$2, maquina_id=$3, transportista_id=$4,
        departamento=$5, direccion=$6, transportista=$7, tracking=$8,
        estado=$9, tipo_envio=$10, tipo_maquina=$11,
        departamento_destino=$12, fecha_salida=$13,
        fecha_envio_est=$14, fecha_envio_real=$15,
        fecha_retiro_est=$16, fecha_retiro_real=$17,
        incluye_limpieza=$18, costo_envio=$19, costo_retiro=$20,
        costo_limpieza=$21, costo_total=$22, moneda=$23,
        observacion=$24, obs=$25, tiene_rastreo=$26, updated_at=NOW()
      WHERE id=$27
      RETURNING *
    `, [
      reserva_id ? parseInt(reserva_id) : null,
      operadora_id ? parseInt(operadora_id) : null,
      maquina_id ? parseInt(maquina_id) : null,
      transportista_id ? parseInt(transportista_id) : null,
      departamento || null, direccion || null, transportista || null, tracking || null,
      estado || 'pendiente_envio',
      tipo_envio || 'ida', tipo_maquina || 'chica',
      departamento_destino || departamento || null, fecha_salida || null,
      fecha_envio_est || null, fecha_envio_real || null,
      fecha_retiro_est || null, fecha_retiro_real || null,
      incluye_limpieza || false,
      parseFloat(costo_envio) || 0,
      parseFloat(costo_retiro) || 0,
      parseFloat(costo_limpieza) || 0,
      costoTotal, moneda || 'UYU',
      observacion || null, obs || null,
      tiene_rastreo !== false,
      req.params.id
    ]);
    if (estado && estado !== prev[0].estado) {
      const eventByState = {
        en_transito: 'machine.shipped',
        entregado: 'machine.received',
        retirado: 'machine.returned',
      };
      if (eventByState[estado]) {
        await emitAutomationEvent(null, {
          event: eventByState[estado],
          entity: 'envio',
          entityId: parseInt(req.params.id, 10),
          dedupeKey: `${eventByState[estado]}:envio:${req.params.id}`,
          payload: { envio: rows[0], estadoPrevio: prev[0].estado },
          user: req.user,
        });
      }
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/envios/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar envío' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/envios/:id/rastreo — guardar número de rastreo (módulo transportistas)
// ─────────────────────────────────────────────
router.put('/:id/rastreo', auth, async (req, res) => {
  const { numero_rastreo, rastreo_notificado, fecha_notificacion, mensaje_operadora } = req.body;
  try {
    if (req.user.rol === 'transportista') {
      const own = await pool.query('SELECT id FROM envios WHERE id=$1 AND transportista_id=$2', [req.params.id, req.user.transportista_id || 0]);
      if (!own.rows.length) return res.status(403).json({ error: 'Sin permisos para este envío' });
    } else if (!isOpsRole(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para rastreo' });
    }
    const { rows } = await pool.query(`
      UPDATE envios SET
        numero_rastreo=$1, rastreo_notificado=$2, fecha_notificacion=$3, updated_at=NOW()
      WHERE id=$4
      RETURNING *
    `, [
      numero_rastreo || null,
      rastreo_notificado || false,
      fecha_notificacion || null,
      req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });

    // Si debe notificar, enviar WA
    if (rastreo_notificado && numero_rastreo) {
      try {
        const { rows: envioRow } = await pool.query(`
          SELECT e.*, o.whatsapp AS op_wa, o.nombre AS op_nombre
          FROM envios e
          LEFT JOIN operadoras o ON o.id = e.operadora_id
          WHERE e.id = $1
        `, [req.params.id]);
        if (envioRow[0]?.op_wa) {
          let texto = `¡Hola ${envioRow[0].op_nombre || ''}! 👋\nTu máquina ya está en camino.\n\n📦 Rastreo: *${numero_rastreo}*\n`;
          if (mensaje_operadora) texto += `\n${mensaje_operadora}\n`;
          texto += `\n_DepiMóvil_`;
          await enviarMensaje(envioRow[0].op_wa, texto);
        }
      } catch (waErr) {
        console.error('Error enviando WA rastreo:', waErr.message);
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/envios/:id/rastreo error:', err);
    res.status(500).json({ error: 'Error al guardar rastreo' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/envios/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM envios WHERE id=$1 RETURNING id, codigo', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/envios/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar envío' });
  }
});

module.exports = router;
