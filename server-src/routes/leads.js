const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole, isOpsRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const LEAD_ESTADOS_VALIDOS = [
  'nuevo',
  'contactado',
  'interesado',
  'calificado',
  'presupuesto_enviado',
  'pendiente_respuesta',
  'pendiente_sena',
  'reserva_confirmada',
  'cliente_activa',
  'cliente_inactiva',
  'recuperacion',
  'seguimiento',
  'ganado',
  'perdido',
  'reactivar_luego',
];

const LEAD_ESTADO_ORDEN_SQL = `
  CASE estado
    WHEN 'nuevo' THEN 1
    WHEN 'contactado' THEN 2
    WHEN 'interesado' THEN 3
    WHEN 'calificado' THEN 4
    WHEN 'presupuesto_enviado' THEN 5
    WHEN 'pendiente_respuesta' THEN 6
    WHEN 'pendiente_sena' THEN 7
    WHEN 'reserva_confirmada' THEN 8
    WHEN 'cliente_activa' THEN 9
    WHEN 'cliente_inactiva' THEN 10
    WHEN 'recuperacion' THEN 11
    WHEN 'seguimiento' THEN 12
    WHEN 'ganado' THEN 13
    WHEN 'perdido' THEN 14
    WHEN 'reactivar_luego' THEN 15
    ELSE 99
  END
`;

function validarEstadoLead(estado) {
  return LEAD_ESTADOS_VALIDOS.includes(estado);
}

function proxAccionPorEstado(estado) {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const enDos = new Date();
  enDos.setDate(enDos.getDate() + 2);
  const enTreinta = new Date();
  enTreinta.setDate(enTreinta.getDate() + 30);
  const iso = d => d.toISOString().split('T')[0];
  const map = {
    nuevo: ['Primer contacto por WhatsApp', iso(manana)],
    contactado: ['Confirmar ciudad, equipo de interés y necesidad concreta', iso(enDos)],
    interesado: ['Calificar oportunidad y preparar presupuesto', iso(enDos)],
    calificado: ['Enviar propuesta comercial o disponibilidad', iso(enDos)],
    presupuesto_enviado: ['Seguimiento de presupuesto en 24/48 horas', iso(enDos)],
    pendiente_respuesta: ['Recontactar si no respondió', iso(enDos)],
    pendiente_sena: ['Controlar seña y enviar datos de pago', iso(manana)],
    reserva_confirmada: ['Coordinar logística y confirmar datos de jornada', iso(manana)],
    cliente_activa: ['Sugerir próxima reserva según historial', iso(enTreinta)],
    cliente_inactiva: ['Preparar acción de recuperación comercial', iso(enDos)],
    recuperacion: ['Enviar mensaje de recuperación segmentado', iso(enDos)],
    seguimiento: ['Registrar próximo contacto comercial', iso(enDos)],
    reactivar_luego: ['Reactivar lead', iso(enTreinta)],
  };
  return map[estado] || [null, null];
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id           SERIAL PRIMARY KEY,
      nombre       VARCHAR(200) NOT NULL,
      apellido     VARCHAR(200),
      gabinete     VARCHAR(200),
      ciudad       VARCHAR(100),
      departamento VARCHAR(100),
      pais         VARCHAR(100) DEFAULT 'Uruguay',
      telefono     VARCHAR(50),
      email        VARCHAR(200),
      canal        VARCHAR(50)  DEFAULT 'otro',
      estado       VARCHAR(50)  NOT NULL DEFAULT 'nuevo'
                   CHECK (estado IN ('nuevo','contactado','interesado','presupuesto_enviado','seguimiento','ganado','perdido','reactivar_luego')),
      temperatura  VARCHAR(20)  DEFAULT 'frio',
      interes      TEXT,
      tecnologia   VARCHAR(200),
      obs          TEXT,
      prox_accion  TEXT,
      prox_fecha   DATE,
      operadora_id INTEGER REFERENCES operadoras(id) ON DELETE SET NULL,
      convertido_en TIMESTAMP,
      convertido_por VARCHAR(200),
      created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query('ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_estado_check');
  await pool.query(`
    ALTER TABLE leads
    ADD CONSTRAINT leads_estado_check
    CHECK (estado IN (${LEAD_ESTADOS_VALIDOS.map(e => `'${e.replace(/'/g, "''")}'`).join(',')}))
  `);
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
  await pool.query('CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado, updated_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_score ON leads(whatsapp_score DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_leads_prox_fecha ON leads(prox_fecha) WHERE prox_fecha IS NOT NULL');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_phone_norm ON leads(whatsapp_phone_norm)');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads_notas (
      id           SERIAL PRIMARY KEY,
      lead_id      INTEGER      REFERENCES leads(id) ON DELETE CASCADE,
      tipo         VARCHAR(50)  DEFAULT 'otro',
      texto        TEXT         NOT NULL,
      resultado    TEXT,
      prox_accion  TEXT,
      prox_fecha   DATE,
      usuario_email VARCHAR(200),
      created_at   TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads_estado_historial (
      id            SERIAL PRIMARY KEY,
      lead_id       INTEGER      REFERENCES leads(id) ON DELETE CASCADE,
      estado_previo VARCHAR(50),
      estado_nuevo  VARCHAR(50),
      motivo        TEXT,
      usuario_email VARCHAR(200),
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

ensureTable().catch(err => console.error('Error creando tablas leads:', err.message));

function canEditLead(user) {
  return ['superadmin', 'administrador', 'operaciones', 'comercial'].includes(user?.rol);
}

// ─────────────────────────────────────────────
// GET /api/leads — listar todos
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  if (!canEditLead(req.user)) return res.json([]);
  try {
    const { rows } = await pool.query(`
      SELECT * FROM leads
      ORDER BY
        ${LEAD_ESTADO_ORDEN_SQL},
        COALESCE(whatsapp_score, 0) DESC,
        created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/leads error:', err);
    res.status(500).json({ error: 'Error al obtener leads' });
  }
});

// ─────────────────────────────────────────────
// GET /api/leads/:id — obtener uno
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  if (!canEditLead(req.user)) return res.status(403).json({ error: 'Sin permisos para leads' });
  try {
    const { rows } = await pool.query('SELECT * FROM leads WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/leads/:id error:', err);
    res.status(500).json({ error: 'Error al obtener lead' });
  }
});

// ─────────────────────────────────────────────
// POST /api/leads — crear nuevo
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos para crear leads' });
  }
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    telefono, email, canal, estado, temperatura, interes, tecnologia, obs,
    prox_accion, prox_fecha
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
  if (estado && !validarEstadoLead(estado)) return res.status(400).json({ error: `Estado comercial inválido: ${estado}` });

  try {
    const { rows } = await pool.query(`
      INSERT INTO leads (
        nombre, apellido, gabinete, ciudad, departamento, pais,
        telefono, email, canal, estado, temperatura, interes, tecnologia, obs,
        prox_accion, prox_fecha
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      nombre.trim(), apellido || null, gabinete || null, ciudad || null,
      departamento || null, pais || 'Uruguay',
      telefono || null, email || null, canal || 'otro',
      estado || 'nuevo', temperatura || 'frio',
      interes || null, tecnologia || null, obs || null,
      prox_accion || null, prox_fecha || null
    ]);

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'lead', rows[0].id, nombre]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/leads error:', err);
    res.status(500).json({ error: 'Error al crear lead' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/leads/:id — actualizar
// ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos para editar leads' });
  }
  const {
    nombre, apellido, gabinete, ciudad, departamento, pais,
    telefono, email, canal, estado, temperatura, interes, tecnologia, obs,
    prox_accion, prox_fecha, operadora_id, convertido_en, convertido_por
  } = req.body;

  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
  if (estado && !validarEstadoLead(estado)) return res.status(400).json({ error: `Estado comercial inválido: ${estado}` });

  try {
    const { rows: prev } = await pool.query('SELECT estado, operadora_id, convertido_en, convertido_por FROM leads WHERE id=$1', [req.params.id]);
    if (!prev.length) return res.status(404).json({ error: 'Lead no encontrado' });
    if (!isOpsRole(req.user.rol) && (
      operadora_id ||
      convertido_en ||
      convertido_por ||
      prev[0].operadora_id ||
      prev[0].convertido_en ||
      prev[0].convertido_por
    )) {
      return res.status(403).json({ error: 'Solo administración puede convertir leads en operadoras' });
    }

    const { rows } = await pool.query(`
      UPDATE leads SET
        nombre=$1, apellido=$2, gabinete=$3, ciudad=$4, departamento=$5, pais=$6,
        telefono=$7, email=$8, canal=$9, estado=$10, temperatura=$11,
        interes=$12, tecnologia=$13, obs=$14,
        prox_accion=$15, prox_fecha=$16,
        operadora_id=$17, convertido_en=$18, convertido_por=$19,
        updated_at=NOW()
      WHERE id=$20
      RETURNING *
    `, [
      nombre.trim(), apellido || null, gabinete || null, ciudad || null,
      departamento || null, pais || 'Uruguay',
      telefono || null, email || null, canal || 'otro',
      estado || prev[0].estado, temperatura || 'frio',
      interes || null, tecnologia || null, obs || null,
      prox_accion || null, prox_fecha || null,
      operadora_id ? parseInt(operadora_id) : null,
      convertido_en || null, convertido_por || null,
      req.params.id
    ]);

    // Historial si cambió estado
    if (estado && estado !== prev[0].estado) {
      await pool.query(`
        INSERT INTO leads_estado_historial (lead_id, estado_previo, estado_nuevo, motivo, usuario_email)
        VALUES ($1,$2,$3,$4,$5)
      `, [req.params.id, prev[0].estado, estado, 'Actualización desde CRM', req.user.email]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/leads/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar lead' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/leads/:id — eliminar
// ─────────────────────────────────────────────
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM leads WHERE id=$1 RETURNING id, nombre', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead no encontrado' });

    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'lead', req.params.id, rows[0].nombre]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/leads/:id error:', err);
    res.status(500).json({ error: 'Error al eliminar lead' });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/leads/:id/estado — mover en embudo
// ─────────────────────────────────────────────
router.patch('/:id/estado', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos para cambiar estado de leads' });
  }
  const estado = String(req.body?.estado || '').trim();
  const motivo = String(req.body?.motivo || 'Cambio desde embudo comercial').trim();
  if (!validarEstadoLead(estado)) {
    return res.status(400).json({ error: `Estado comercial inválido: ${estado}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: prev } = await client.query('SELECT * FROM leads WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!prev.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead no encontrado' });
    }
    if (prev[0].estado === estado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El lead ya está en ese estado' });
    }

    const [accionSugerida, fechaSugerida] = proxAccionPorEstado(estado);
    const { rows } = await client.query(`
      UPDATE leads
      SET estado=$1,
          prox_accion=COALESCE($2, prox_accion),
          prox_fecha=COALESCE($3, prox_fecha),
          updated_at=NOW()
      WHERE id=$4
      RETURNING *
    `, [estado, accionSugerida, fechaSugerida, req.params.id]);

    await client.query(`
      INSERT INTO leads_estado_historial (lead_id, estado_previo, estado_nuevo, motivo, usuario_email)
      VALUES ($1,$2,$3,$4,$5)
    `, [req.params.id, prev[0].estado, estado, motivo, req.user.email]);

    await client.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle)
       VALUES ($1,$2,'ESTADO','lead',$3,$4)`,
      [req.user.id, req.user.email, req.params.id, `${prev[0].estado} → ${estado}: ${motivo}`]
    );

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /api/leads/:id/estado error:', err);
    res.status(500).json({ error: 'Error al cambiar estado del lead' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// GET /api/leads/:id/notas — notas de seguimiento
// ─────────────────────────────────────────────
router.get('/:id/notas', auth, async (req, res) => {
  if (!canEditLead(req.user)) return res.status(403).json({ error: 'Sin permisos para leads' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM leads_notas WHERE lead_id=$1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/leads/:id/notas error:', err);
    res.json([]);
  }
});

// ─────────────────────────────────────────────
// POST /api/leads/:id/notas — agregar nota
// ─────────────────────────────────────────────
router.post('/:id/notas', auth, async (req, res) => {
  if (!canEditLead(req.user)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  const { tipo, texto, resultado, prox_accion, prox_fecha } = req.body;
  if (!texto) return res.status(400).json({ error: 'texto es requerido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO leads_notas (lead_id, tipo, texto, resultado, prox_accion, prox_fecha, usuario_email)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [req.params.id, tipo || 'otro', texto, resultado || null, prox_accion || null, prox_fecha || null, req.user.email]);

    // Actualizar prox_accion/prox_fecha del lead si se proporcionó
    if (prox_accion || prox_fecha) {
      await client.query(`
        UPDATE leads SET prox_accion=$1, prox_fecha=$2, updated_at=NOW() WHERE id=$3
      `, [prox_accion || null, prox_fecha || null, req.params.id]);
    }
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/leads/:id/notas error:', err);
    res.status(500).json({ error: 'Error al crear nota' });
  } finally {
    client.release();
  }
});

module.exports = router;
