const express = require('express');
const path = require('path');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function findOperadoraByToken(token) {
  if (!token) return null;
  const { rows } = await pool.query(
    'SELECT * FROM operadoras WHERE portal_token = $1 LIMIT 1',
    [token]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────
// GET /api/portal/:token — bootstrap del portal de operadora
// ─────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  try {
    const op = await findOperadoraByToken(req.params.token);
    if (!op) return res.status(404).json({ error: 'Token inválido o expirado' });

    // Documentos subidos
    const { rows: docs } = await pool.query(
      'SELECT * FROM documentos_operadora WHERE operadora_id = $1 ORDER BY created_at DESC',
      [op.id]
    ).catch(() => ({ rows: [] }));

    // Reservas activas
    const { rows: reservas } = await pool.query(`
      SELECT r.id, r.codigo, r.tipo, r.fecha_inicio, r.fecha_fin, r.fecha_jornada, r.estado,
             m.nombre AS maquina_nombre, m.id AS maquina_id
      FROM reservas r
      LEFT JOIN maquinas m ON m.id = r.maquina_id
      WHERE r.operadora_id = $1
        AND r.estado IN ('aprobada','confirmada','solicitud_recibida','pendiente_aprobacion')
      ORDER BY r.fecha_inicio DESC
    `, [op.id]).catch(() => ({ rows: [] }));

    // Contratos firmados
    const { rows: contratos } = await pool.query(
      'SELECT id, maquina_id, estado, firmado_en FROM contratos WHERE operadora_id = $1',
      [op.id]
    ).catch(() => ({ rows: [] }));

    res.json({
      operadora: {
        id: op.id,
        nombre: op.nombre,
        apellido: op.apellido,
        whatsapp: op.whatsapp,
        ciudad: op.ciudad,
      },
      cedula: docs.filter(d => ['cedula', 'cedula_dorso'].includes(d.tipo)),
      reservas_activas: reservas,
      contratos,
    });
  } catch (err) {
    console.error('GET /api/portal/:token error:', err);
    res.status(500).json({ error: 'Error al cargar el portal' });
  }
});

// ─────────────────────────────────────────────
// POST /api/portal/:token/cedula — subir cédula (base64 inline)
// ─────────────────────────────────────────────
router.post('/:token/cedula', async (req, res) => {
  try {
    const op = await findOperadoraByToken(req.params.token);
    if (!op) return res.status(404).json({ error: 'Token inválido' });

    const { frente, dorso } = req.body; // base64 data URLs o metadatos

    // Upsert frente
    if (frente) {
      await pool.query(`
        INSERT INTO documentos_operadora (operadora_id, tipo, archivo_url, meta)
        VALUES ($1, 'cedula', $2, $3)
        ON CONFLICT (operadora_id, tipo)
        DO UPDATE SET archivo_url=$2, meta=$3, created_at=NOW()
      `, [op.id, frente.url || '', JSON.stringify(frente)]).catch(() => {
        // Si no tiene unique constraint, hacer DELETE + INSERT
        pool.query('DELETE FROM documentos_operadora WHERE operadora_id=$1 AND tipo=$2', [op.id, 'cedula']);
        pool.query('INSERT INTO documentos_operadora (operadora_id, tipo, archivo_url, meta) VALUES ($1,$2,$3,$4)',
          [op.id, 'cedula', frente.url || '', JSON.stringify(frente)]);
      });
    }

    // Upsert dorso
    if (dorso) {
      await pool.query(`
        INSERT INTO documentos_operadora (operadora_id, tipo, archivo_url, meta)
        VALUES ($1, 'cedula_dorso', $2, $3)
        ON CONFLICT (operadora_id, tipo)
        DO UPDATE SET archivo_url=$2, meta=$3, created_at=NOW()
      `, [op.id, 'cedula_dorso', dorso.url || '', JSON.stringify(dorso)]).catch(() => {
        pool.query('DELETE FROM documentos_operadora WHERE operadora_id=$1 AND tipo=$2', [op.id, 'cedula_dorso']);
        pool.query('INSERT INTO documentos_operadora (operadora_id, tipo, archivo_url, meta) VALUES ($1,$2,$3,$4)',
          [op.id, 'cedula_dorso', dorso.url || '', JSON.stringify(dorso)]);
      });
    }

    res.json({ ok: true, mensaje: 'Documentos guardados' });
  } catch (err) {
    console.error('POST /api/portal/:token/cedula error:', err);
    res.status(500).json({ error: 'Error al subir documentos' });
  }
});

// ─────────────────────────────────────────────
// POST /api/portal/:token/contrato/:maquinaId — firmar contrato
// ─────────────────────────────────────────────
router.post('/:token/contrato/:maquinaId', async (req, res) => {
  try {
    const op = await findOperadoraByToken(req.params.token);
    if (!op) return res.status(404).json({ error: 'Token inválido' });

    const maquinaId = parseInt(req.params.maquinaId);

    // Verificar que hay una reserva activa para esta máquina
    const { rows: reservas } = await pool.query(`
      SELECT id FROM reservas
      WHERE operadora_id=$1 AND maquina_id=$2
        AND estado IN ('aprobada','confirmada','solicitud_recibida','pendiente_aprobacion')
      LIMIT 1
    `, [op.id, maquinaId]);
    if (!reservas.length) {
      return res.status(400).json({ error: 'No hay reserva activa para esta máquina' });
    }

    // Buscar contrato existente o crear uno
    const { rows: existing } = await pool.query(
      'SELECT id FROM contratos WHERE operadora_id=$1 AND maquina_id=$2 LIMIT 1',
      [op.id, maquinaId]
    );

    if (existing.length) {
      await pool.query(
        `UPDATE contratos SET estado='firmado', firmado_en=NOW() WHERE id=$1`,
        [existing[0].id]
      );
    } else {
      await pool.query(`
        INSERT INTO contratos (operadora_id, maquina_id, estado, firmado_en, nombre, ciudad)
        VALUES ($1,$2,'firmado',NOW(),$3,$4)
      `, [op.id, maquinaId, `${op.nombre} ${op.apellido}`, op.ciudad || '']);
    }

    res.json({ ok: true, mensaje: 'Contrato firmado correctamente' });
  } catch (err) {
    console.error('POST /api/portal/:token/contrato/:maquinaId error:', err);
    res.status(500).json({ error: 'Error al firmar contrato' });
  }
});

// ─────────────────────────────────────────────
// GET /api/portal/docs/:operadoraId — admin: documentos de una operadora
// Usado por el módulo de documentos del CRM
// ─────────────────────────────────────────────
router.get('/docs/:operadoraId', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM documentos_operadora WHERE operadora_id=$1 ORDER BY created_at DESC',
      [req.params.operadoraId]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/portal/docs/:id error:', err);
    // Si la tabla no existe aún, devolver array vacío
    res.json([]);
  }
});

module.exports = router;
