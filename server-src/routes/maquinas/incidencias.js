// routes/maquinas/incidencias.js — GET/POST /:id/incidencias, PATCH /:id/incidencias/:incidenciaId
const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const { auth, requireRole, isOpsRole, isOperadoraRole } = require('../../middleware/auth');
const { assertCanViewMachine, incidenciaBloqueaReservas, registrarMovimientoMaquina } = require('./helpers');

// GET /api/maquinas/:id/incidencias
router.get('/:id/incidencias', auth, async (req, res) => {
  try {
    await assertCanViewMachine(req, req.params.id, 'incidencias');
    const { rows } = await pool.query(
      `SELECT i.*,
              r.codigo AS reserva_codigo,
              o.nombre AS operadora_nombre,
              o.apellido AS operadora_apellido
       FROM maquina_incidencias i
       LEFT JOIN reservas r ON r.id = i.reserva_id
       LEFT JOIN operadoras o ON o.id = COALESCE(i.operadora_id, r.operadora_id)
       WHERE i.maquina_id=$1
       ORDER BY CASE i.estado WHEN 'abierta' THEN 0 WHEN 'en_revision' THEN 1 ELSE 2 END,
                i.created_at DESC
       LIMIT 80`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET maquina incidencias error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al obtener incidencias de máquina' });
  }
});

// POST /api/maquinas/:id/incidencias
router.post('/:id/incidencias', auth, async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const tipo = String(req.body.tipo || 'falla_tecnica').trim();
  const gravedad = String(req.body.gravedad || 'media').trim().toLowerCase();
  const descripcion = String(req.body.descripcion || '').trim();
  const evidenciaUrl = String(req.body.evidencia_url || '').trim();
  const reservaId = req.body.reserva_id ? parseInt(req.body.reserva_id, 10) : null;
  const operadoraId = req.body.operadora_id
    ? parseInt(req.body.operadora_id, 10)
    : (isOperadoraRole(req.user.rol) ? req.user.operadora_id : null);
  const bloqueaReservas = incidenciaBloqueaReservas(gravedad, req.body.bloquea_reservas);
  if (!descripcion) return res.status(400).json({ error: 'Descripción de incidencia requerida' });
  try {
    const maquina = await assertCanViewMachine(req, maquinaId, 'incidencias');
    if (reservaId) {
      const { rows: reservaRows } = await pool.query('SELECT id, maquina_id, operadora_id FROM reservas WHERE id=$1', [reservaId]);
      if (!reservaRows.length || parseInt(reservaRows[0].maquina_id, 10) !== maquinaId) {
        return res.status(400).json({ error: 'La reserva indicada no corresponde a esta máquina' });
      }
    }
    const { rows } = await pool.query(
      `INSERT INTO maquina_incidencias (
         maquina_id, reserva_id, operadora_id, tipo, gravedad, estado, descripcion,
         evidencia_url, bloquea_reservas, estado_maquina_anterior,
         reportado_por_id, reportado_por_email, responsable_id, responsable_email
       ) VALUES ($1,$2,$3,$4,$5,'abierta',$6,NULLIF($7,''),$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        maquinaId, reservaId, operadoraId, tipo, gravedad, descripcion,
        evidenciaUrl, bloqueaReservas, maquina.estado,
        req.user.id || null, req.user.email || null,
        isOpsRole(req.user.rol) ? req.user.id : null,
        isOpsRole(req.user.rol) ? req.user.email : null,
      ]
    );
    if (bloqueaReservas && !['fuera_servicio', 'en_viaje'].includes(maquina.estado)) {
      await pool.query('UPDATE maquinas SET estado=$1, updated_at=NOW() WHERE id=$2', ['fuera_servicio', maquinaId]);
    }
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,'INCIDENCIA_TECNICA_CREADA','maquina_incidencia',$3,$4)`,
      [req.user.id, req.user.email, rows[0].id, `${maquina.codigo} — ${maquina.nombre}: ${gravedad}`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId, tipo: 'incidencia_creada',
      estadoAnterior: maquina.estado,
      estadoNuevo: bloqueaReservas ? 'fuera_servicio' : maquina.estado,
      ubicacion: maquina.ubicacion,
      detalle: `Incidencia técnica ${gravedad}: ${descripcion}`,
      metadata: { incidencia_id: rows[0].id, reserva_id: reservaId, operadora_id: operadoraId, tipo, gravedad, bloquea_reservas: bloqueaReservas },
      user: req.user,
    }).catch(() => {});
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST maquina incidencia error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al registrar incidencia técnica' });
  }
});

// PATCH /api/maquinas/:id/incidencias/:incidenciaId
router.patch('/:id/incidencias/:incidenciaId', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const incidenciaId = parseInt(req.params.incidenciaId, 10);
  const estado = String(req.body.estado || '').trim();
  const resolucion = String(req.body.resolucion || '').trim();
  if (!['abierta', 'en_revision', 'resuelta', 'descartada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado de incidencia inválido' });
  }
  try {
    const maquina = await assertCanViewMachine(req, maquinaId, 'incidencias');
    const { rows: prevRows } = await pool.query(
      'SELECT * FROM maquina_incidencias WHERE id=$1 AND maquina_id=$2', [incidenciaId, maquinaId]
    );
    if (!prevRows.length) return res.status(404).json({ error: 'Incidencia no encontrada' });
    const cerrada = ['resuelta', 'descartada'].includes(estado);
    const { rows } = await pool.query(
      `UPDATE maquina_incidencias SET
         estado=$1,
         resolucion=CASE WHEN $2='' THEN resolucion ELSE $2 END,
         responsable_id=$3, responsable_email=$4,
         cerrada_en=CASE WHEN $5 THEN COALESCE(cerrada_en,NOW()) ELSE NULL END,
         updated_at=NOW()
       WHERE id=$6 AND maquina_id=$7 RETURNING *`,
      [estado, resolucion, req.user.id || null, req.user.email || null, cerrada, incidenciaId, maquinaId]
    );
    if (cerrada && prevRows[0].bloquea_reservas) {
      const { rows: abiertas } = await pool.query(
        `SELECT id FROM maquina_incidencias
         WHERE maquina_id=$1 AND bloquea_reservas=TRUE AND estado IN ('abierta','en_revision') AND id<>$2 LIMIT 1`,
        [maquinaId, incidenciaId]
      );
      const estadoPrevio = prevRows[0].estado_maquina_anterior || 'disponible';
      if (!abiertas.length && maquina.estado === 'fuera_servicio' && ['disponible', 'reservada', 'mantenimiento'].includes(estadoPrevio)) {
        await pool.query('UPDATE maquinas SET estado=$1, updated_at=NOW() WHERE id=$2', [estadoPrevio, maquinaId]);
      }
    }
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,'INCIDENCIA_TECNICA_ACTUALIZADA','maquina_incidencia',$3,$4)`,
      [req.user.id, req.user.email, incidenciaId, `Incidencia ${incidenciaId}: ${estado}`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId,
      tipo: cerrada ? 'incidencia_cerrada' : 'incidencia_actualizada',
      estadoAnterior: maquina.estado,
      estadoNuevo: cerrada && prevRows[0].bloquea_reservas ? (prevRows[0].estado_maquina_anterior || maquina.estado) : maquina.estado,
      ubicacion: maquina.ubicacion,
      detalle: `Incidencia técnica ${estado}${resolucion ? ': ' + resolucion : ''}`,
      metadata: { incidencia_id: incidenciaId, estado, resolucion },
      user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH maquina incidencia error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Error al actualizar incidencia técnica' });
  }
});

module.exports = router;
