const express = require('express');
const crypto = require('crypto');
const pool = require('../utils/db');
const { auth, requireRole, isOperadoraRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contratos (
      id                  SERIAL PRIMARY KEY,
      operadora_id        INTEGER REFERENCES operadoras(id) ON DELETE SET NULL,
      maquina_id          INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
      reserva_id          INTEGER REFERENCES reservas(id) ON DELETE SET NULL,
      nombre              VARCHAR(200),
      ci                  VARCHAR(50),
      domicilio           TEXT,
      ciudad              VARCHAR(100),
      maquina             VARCHAR(200),
      serial              VARCHAR(100),
      fecha_inicio        DATE,
      fecha_fin           DATE,
      monto               NUMERIC(12,2) DEFAULT 0,
      moneda              VARCHAR(10)   DEFAULT 'UYU',
      forma_pago          VARCHAR(100)  DEFAULT 'Transferencia bancaria',
      garantia            NUMERIC(12,2) DEFAULT 0,
      estado              VARCHAR(50)   NOT NULL DEFAULT 'activo'
                          CHECK (estado IN ('activo','pendiente','firmado','finalizado','anulado')),
      firmado_en          TIMESTAMP,
      cedula_frente_meta  JSONB,
      cedula_dorso_meta   JSONB,
      obs                 TEXT,
      contenido           TEXT,
      token               VARCHAR(100),
      created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch(err => console.error('Error creando tabla contratos:', err.message));

function makeContratoToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ─────────────────────────────────────────────
// GET /api/contratos — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const params = [];
    let where = '';
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      params.push(req.user.operadora_id);
      where = `WHERE c.operadora_id = $${params.length}`;
    } else if (req.user.rol === 'transportista') {
      return res.json([]);
    }
    const { rows } = await pool.query(`
      SELECT c.*,
             o.nombre AS operadora_nombre, o.apellido AS operadora_apellido,
             m.nombre AS maquina_nombre_cat, m.codigo AS maquina_codigo
      FROM contratos c
      LEFT JOIN operadoras o ON o.id = c.operadora_id
      LEFT JOIN maquinas m ON m.id = c.maquina_id
      ${where}
      ORDER BY c.id DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/contratos error:', err);
    res.status(500).json({ error: 'Error al obtener contratos' });
  }
});

// ─────────────────────────────────────────────
// GET /api/contratos/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const params = [req.params.id];
    let query = 'SELECT * FROM contratos WHERE id=$1';
    if (isOperadoraRole(req.user.rol)) {
      params.push(req.user.operadora_id || 0);
      query += ` AND operadora_id = $${params.length}`;
    } else if (req.user.rol === 'transportista') {
      return res.status(403).json({ error: 'Sin permisos para contratos' });
    }
    const { rows } = await pool.query(query, params);
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/contratos/:id error:', err);
    res.status(500).json({ error: 'Error al obtener contrato' });
  }
});

// ─────────────────────────────────────────────
// POST /api/contratos — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, requireRole('superadmin', 'operaciones', 'comercial'), async (req, res) => {
  const {
    operadora_id, maquina_id, reserva_id,
    nombre, ci, domicilio, ciudad, maquina, serial,
    fecha_inicio, fecha_fin, monto, moneda, forma_pago, garantia,
    firmado, fecha_firma, cedula_frente_meta, cedula_dorso_meta,
    obs, contenido
  } = req.body;

  // Si se marcó como firmado en el formulario, usar estado='firmado'
  const estadoFinal = firmado ? 'firmado' : 'activo';
  const firmadoEn = firmado && fecha_firma ? fecha_firma : firmado ? new Date().toISOString() : null;

  try {
    const { rows } = await pool.query(`
      INSERT INTO contratos (
        operadora_id, maquina_id, reserva_id,
        nombre, ci, domicilio, ciudad, maquina, serial,
        fecha_inicio, fecha_fin, monto, moneda, forma_pago, garantia,
        estado, firmado_en, cedula_frente_meta, cedula_dorso_meta, obs, contenido, token
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [
      operadora_id ? parseInt(operadora_id) : null,
      maquina_id ? parseInt(maquina_id) : null,
      reserva_id ? parseInt(reserva_id) : null,
      nombre || null, ci || null, domicilio || null, ciudad || null,
      maquina || null, serial || null,
      fecha_inicio || null, fecha_fin || null,
      parseFloat(monto) || 0, moneda || 'UYU',
      forma_pago || 'Transferencia bancaria',
      parseFloat(garantia) || 0,
      estadoFinal, firmadoEn || null,
      cedula_frente_meta ? JSON.stringify(cedula_frente_meta) : null,
      cedula_dorso_meta ? JSON.stringify(cedula_dorso_meta) : null,
      obs || null, contenido || null,
      makeContratoToken()
    ]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'contrato', rows[0].id, nombre || `Contrato #${rows[0].id}`]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/contratos error:', err);
    res.status(500).json({ error: 'Error al crear contrato' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/contratos/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    operadora_id, maquina_id, reserva_id,
    nombre, ci, domicilio, ciudad, maquina, serial,
    fecha_inicio, fecha_fin, monto, moneda, forma_pago, garantia,
    estado, firmado_en, cedula_frente_meta, cedula_dorso_meta, obs, contenido
  } = req.body;

  try {
    const { rows: prev } = await pool.query('SELECT id FROM contratos WHERE id=$1', [req.params.id]);
    if (!prev.length) return res.status(404).json({ error: 'Contrato no encontrado' });

    const { rows } = await pool.query(`
      UPDATE contratos SET
        operadora_id=$1, maquina_id=$2, reserva_id=$3,
        nombre=$4, ci=$5, domicilio=$6, ciudad=$7, maquina=$8, serial=$9,
        fecha_inicio=$10, fecha_fin=$11, monto=$12, moneda=$13, forma_pago=$14, garantia=$15,
        estado=$16, firmado_en=$17,
        cedula_frente_meta=$18, cedula_dorso_meta=$19,
        obs=$20, contenido=$21, updated_at=NOW()
      WHERE id=$22
      RETURNING *
    `, [
      operadora_id ? parseInt(operadora_id) : null,
      maquina_id ? parseInt(maquina_id) : null,
      reserva_id ? parseInt(reserva_id) : null,
      nombre || null, ci || null, domicilio || null, ciudad || null,
      maquina || null, serial || null,
      fecha_inicio || null, fecha_fin || null,
      parseFloat(monto) || 0, moneda || 'UYU',
      forma_pago || 'Transferencia bancaria',
      parseFloat(garantia) || 0,
      estado || 'activo', firmado_en || null,
      cedula_frente_meta ? JSON.stringify(cedula_frente_meta) : null,
      cedula_dorso_meta ? JSON.stringify(cedula_dorso_meta) : null,
      obs || null, contenido || null,
      req.params.id
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/contratos/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar contrato' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/contratos/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM contratos WHERE id=$1 RETURNING id, nombre',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'contrato', req.params.id, rows[0].nombre || `Contrato #${req.params.id}`]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/contratos/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar contrato' });
  }
});

module.exports = router;
