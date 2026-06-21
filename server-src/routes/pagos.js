const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole } = require('../middleware/auth');
const { enviarMensaje } = require('../utils/wa_sender');
// wa_queue stub — Evolution API deshabilitado, Meta Cloud API es el canal principal
const encolar = async (opts) => { console.log('[wa_queue stub]', opts?.tipo); return { ok: false }; };
const { emitAutomationEvent } = require('../utils/automation_engine');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function generarCodigo(client) {
  const { rows } = await client.query('SELECT COUNT(*) AS cnt FROM pagos');
  const n = parseInt(rows[0].cnt, 10) + 1;
  return `PAG-${String(n).padStart(5, '0')}`;
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagos (
      id               SERIAL PRIMARY KEY,
      codigo           VARCHAR(50)  NOT NULL,
      reserva_id       INTEGER      REFERENCES reservas(id) ON DELETE SET NULL,
      operadora_id     INTEGER      REFERENCES operadoras(id) ON DELETE SET NULL,
      tipo             VARCHAR(50)  DEFAULT 'jornada',
      estado           VARCHAR(50)  NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','sena_pendiente','sena_abonada','validado','rechazado','deuda_vencida')),
      monto_total      NUMERIC(12,2) DEFAULT 0,
      moneda           VARCHAR(10)  DEFAULT 'UYU',
      sena_requerida   NUMERIC(12,2) DEFAULT 0,
      sena_abonada     NUMERIC(12,2) DEFAULT 0,
      saldo_pendiente  NUMERIC(12,2) DEFAULT 0,
      fecha_pago       DATE,
      comprobante      TEXT,
      obs              TEXT,
      created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);
}

// Inicializar tabla al cargar la ruta
ensureTable().catch(err => console.error('Error creando tabla pagos:', err.message));

async function notificarWAPago(pagoId, estado) {
  try {
    const MENSAJES = {
      validado: (op, p) =>
        `¡Hola ${op.nombre}! 🔒 Tu pago fue validado.\n💰 Monto: ${p.monto_total} ${p.moneda}\n🔖 Código: ${p.codigo}`,
      sena_pendiente: (op, p) =>
        `¡Hola ${op.nombre}! 💰 Te recordamos que tenés una seña pendiente.\n💰 Monto: ${p.sena_requerida} ${p.moneda}\n🔖 Código de reserva: ${p.reserva_codigo||'—'}`,
    };
    if (!MENSAJES[estado]) return;

    const { rows } = await pool.query(`
      SELECT p.*, o.nombre AS op_nombre, o.whatsapp AS op_wa, r.codigo AS reserva_codigo
      FROM pagos p
      LEFT JOIN operadoras o ON o.id = p.operadora_id
      LEFT JOIN reservas r ON r.id = p.reserva_id
      WHERE p.id = $1
    `, [pagoId]);
    if (!rows.length || !rows[0].op_wa) return;
    const row = rows[0];
    const texto = MENSAJES[estado]({ nombre: row.op_nombre || '' }, row);
    const resultado = await enviarMensaje(row.op_wa, texto);
    if (!resultado.ok) {
      await encolar({
        reservaId: row.reserva_id,
        operadoraId: row.operadora_id,
        tipo: `pago_${estado}`,
        mensaje: texto,
        telefono: row.op_wa,
      });
    }
  } catch (e) {
    console.error('notificarWAPago error:', e.message);
  }
}

function pagoCompleto(estado, senaAbonada, montoTotal, saldoPendiente) {
  if (['validado', 'sena_abonada'].includes(estado)) return true;
  const abonado = parseFloat(senaAbonada) || 0;
  const total = parseFloat(montoTotal) || 0;
  const saldo = parseFloat(saldoPendiente) || 0;
  return abonado > 0 && (saldo <= 0 || (total > 0 && abonado >= total));
}

async function confirmarReservaPorPago(client, pago, user) {
  if (!pago?.reserva_id || !pagoCompleto(pago.estado, pago.sena_abonada, pago.monto_total, pago.saldo_pendiente)) return null;
  const { rows: reservas } = await client.query('SELECT id, estado FROM reservas WHERE id=$1 FOR UPDATE', [pago.reserva_id]);
  if (!reservas.length || reservas[0].estado === 'confirmada') return null;
  const estadoPrevio = reservas[0].estado;
  const { rows } = await client.query(
    "UPDATE reservas SET estado='confirmada', updated_at=NOW() WHERE id=$1 RETURNING *",
    [pago.reserva_id]
  );
  await client.query(`
    INSERT INTO reserva_historial (reserva_id, estado_previo, estado_nuevo, motivo, usuario_id, usuario_email)
    VALUES ($1,$2,'confirmada',$3,$4,$5)
  `, [pago.reserva_id, estadoPrevio, `Confirmación automática por pago ${pago.codigo}`, user?.id || null, user?.email || null]);
  await client.query(`
    INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
    VALUES ($1,$2,'AUTO_CONFIRM','reserva',$3,$4)
  `, [user?.id || null, user?.email || null, pago.reserva_id, `Reserva confirmada automáticamente por pago ${pago.codigo}`]);
  await emitAutomationEvent(client, {
    event: 'booking.confirmed',
    entity: 'reserva',
    entityId: pago.reserva_id,
    dedupeKey: `booking.confirmed:reserva:${pago.reserva_id}`,
    payload: { reserva: rows[0], source: 'payment', pago },
    user,
  });
  return rows[0];
}

// ─────────────────────────────────────────────
// GET /api/pagos — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const params = [];
    let where = '';
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      params.push(req.user.operadora_id);
      where = `WHERE p.operadora_id = $${params.length}`;
    } else if (!['superadmin', 'administrador'].includes(req.user.rol)) {
      return res.json([]);
    }
    const { rows } = await pool.query(`
      SELECT p.*
      FROM pagos p
      ${where}
      ORDER BY p.id DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/pagos error:', err);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

// ─────────────────────────────────────────────
// GET /api/pagos/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const params = [req.params.id];
    let query = 'SELECT * FROM pagos WHERE id=$1';
    if (isOperadoraRole(req.user.rol)) {
      params.push(req.user.operadora_id || 0);
      query += ` AND operadora_id = $${params.length}`;
    } else if (!['superadmin', 'administrador'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para pagos' });
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/pagos/:id error:', err);
    res.status(500).json({ error: 'Error al obtener pago' });
  }
});

// ─────────────────────────────────────────────
// POST /api/pagos — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin'), async (req, res) => {
  const {
    reserva_id, operadora_id, tipo, estado,
    monto_total, moneda, sena_requerida, sena_abonada, saldo_pendiente,
    fecha_pago, comprobante, obs
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codigo = await generarCodigo(client);
    const { rows } = await client.query(`
      INSERT INTO pagos (
        codigo, reserva_id, operadora_id, tipo, estado,
        monto_total, moneda, sena_requerida, sena_abonada, saldo_pendiente,
        fecha_pago, comprobante, obs
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      codigo,
      reserva_id ? parseInt(reserva_id) : null,
      operadora_id ? parseInt(operadora_id) : null,
      tipo || 'jornada', estado || 'pendiente',
      parseFloat(monto_total) || 0, moneda || 'UYU',
      parseFloat(sena_requerida) || 0, parseFloat(sena_abonada) || 0,
      parseFloat(saldo_pendiente) || 0,
      fecha_pago || null, comprobante || null, obs || null
    ]);

    await client.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'pago', rows[0].id, codigo]
    );
    const reservaConfirmada = await confirmarReservaPorPago(client, rows[0], req.user);
    if (pagoCompleto(rows[0].estado, rows[0].sena_abonada, rows[0].monto_total, rows[0].saldo_pendiente)) {
      await emitAutomationEvent(client, {
        event: 'payment.completed',
        entity: 'pago',
        entityId: rows[0].id,
        dedupeKey: `payment.completed:pago:${rows[0].id}`,
        payload: { pago: rows[0], reservaConfirmada },
        user: req.user,
      });
    }
    await client.query('COMMIT');

    // Notificar WhatsApp fuera de transacción
    if (['validado', 'sena_pendiente'].includes(estado)) {
      notificarWAPago(rows[0].id, estado).catch(() => {});
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/pagos error:', err);
    res.status(500).json({ error: 'Error al crear pago' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// PUT /api/pagos/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin'), async (req, res) => {
  const {
    reserva_id, operadora_id, tipo, estado,
    monto_total, moneda, sena_requerida, sena_abonada, saldo_pendiente,
    fecha_pago, comprobante, obs
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: prev } = await client.query('SELECT estado FROM pagos WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!prev.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const { rows } = await client.query(`
      UPDATE pagos SET
        reserva_id=$1, operadora_id=$2, tipo=$3, estado=$4,
        monto_total=$5, moneda=$6, sena_requerida=$7, sena_abonada=$8, saldo_pendiente=$9,
        fecha_pago=$10, comprobante=$11, obs=$12, updated_at=NOW()
      WHERE id=$13
      RETURNING *
    `, [
      reserva_id ? parseInt(reserva_id) : null,
      operadora_id ? parseInt(operadora_id) : null,
      tipo || 'jornada', estado || prev[0].estado,
      parseFloat(monto_total) || 0, moneda || 'UYU',
      parseFloat(sena_requerida) || 0, parseFloat(sena_abonada) || 0,
      parseFloat(saldo_pendiente) || 0,
      fecha_pago || null, comprobante || null, obs || null,
      req.params.id
    ]);
    const reservaConfirmada = await confirmarReservaPorPago(client, rows[0], req.user);
    if (pagoCompleto(rows[0].estado, rows[0].sena_abonada, rows[0].monto_total, rows[0].saldo_pendiente)) {
      await emitAutomationEvent(client, {
        event: 'payment.completed',
        entity: 'pago',
        entityId: rows[0].id,
        dedupeKey: `payment.completed:pago:${rows[0].id}`,
        payload: { pago: rows[0], reservaConfirmada },
        user: req.user,
      });
    }
    await client.query('COMMIT');

    // Notificar si cambió el estado
    if (estado && estado !== prev[0].estado && ['validado', 'sena_pendiente'].includes(estado)) {
      notificarWAPago(parseInt(req.params.id), estado).catch(() => {});
    }

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/pagos/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar pago' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// DELETE /api/pagos/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM pagos WHERE id=$1 RETURNING id, codigo', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Pago no encontrado' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'pago', req.params.id, rows[0].codigo]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/pagos/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar pago' });
  }
});

module.exports = router;
