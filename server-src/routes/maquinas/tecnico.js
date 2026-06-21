// routes/maquinas/tecnico.js — baja y alta de técnico
const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const { auth, requireRole } = require('../../middleware/auth');
const { registrarMovimientoMaquina } = require('./helpers');

// POST /api/maquinas/:id/tecnico/baja
router.post('/:id/tecnico/baja', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const tecnico = String(req.body.tecnico_nombre || req.body.tecnico || '').trim();
  const obs = String(req.body.obs || '').trim();
  try {
    const { rows: prevRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    if (!prevRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='fuera_servicio',
        tecnico_estado='en_tecnico',
        tecnico_nombre=NULLIF($1,''),
        tecnico_salida_en=NOW(),
        tecnico_regreso_en=NULL,
        disponibilidad_visible_gestor=FALSE,
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $2='' THEN '' ELSE E'\n' || $2 END)),
        updated_at=NOW()
      WHERE id=$3 RETURNING *
    `, [tecnico, obs, req.params.id]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,'TECNICO_BAJA','maquina',$3,$4)`,
      [req.user.id, req.user.email, req.params.id, `${rows[0].codigo} — ${rows[0].nombre} enviada a técnico`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId: req.params.id, tipo: 'tecnico_baja',
      estadoAnterior: prevRows[0].estado, estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion, tecnicoNombre: tecnico,
      detalle: 'Máquina enviada a técnico y dada de baja comercial.',
      metadata: { obs }, user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST tecnico baja error:', err);
    res.status(500).json({ error: 'Error al enviar máquina al técnico' });
  }
});

// POST /api/maquinas/:id/tecnico/alta
router.post('/:id/tecnico/alta', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const obs = String(req.body.obs || '').trim();
  try {
    const { rows: prevRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    if (!prevRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='disponible',
        tecnico_estado='regresada',
        tecnico_regreso_en=NOW(),
        ult_mant=CURRENT_DATE,
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $1='' THEN '' ELSE E'\n' || $1 END)),
        updated_at=NOW()
      WHERE id=$2 RETURNING *
    `, [obs, req.params.id]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,'TECNICO_ALTA','maquina',$3,$4)`,
      [req.user.id, req.user.email, req.params.id, `${rows[0].codigo} — ${rows[0].nombre} regresó del técnico`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId: req.params.id, tipo: 'tecnico_alta',
      estadoAnterior: prevRows[0].estado, estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion, tecnicoNombre: rows[0].tecnico_nombre,
      detalle: 'Máquina regresó del técnico y quedó disponible.',
      metadata: { obs }, user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST tecnico alta error:', err);
    res.status(500).json({ error: 'Error al dar alta de técnico' });
  }
});

module.exports = router;
