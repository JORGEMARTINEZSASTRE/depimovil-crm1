// routes/maquinas/puesta-punto.js — asignar y dar alta de puesta a punto
const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const { auth, requireRole, isOpsRole } = require('../../middleware/auth');
const {
  isViajera, normalizarChecklistPuestaPunto,
  getTransportistaPersonaFisica, registrarMovimientoMaquina,
} = require('./helpers');

async function notifyPuestaPunto(transportista, maquina) {
  const telefono = transportista?.whatsapp || transportista?.telefono;
  if (!telefono) return { status: 'sin_telefono' };
  if (maquina.puesta_punto_wa_key && maquina.puesta_punto_wa_notificado_en) {
    return { status: 'duplicado', key: maquina.puesta_punto_wa_key };
  }
  try {
    const { enviarMensaje } = require('../../utils/wa_sender');
    // wa_queue deshabilitado — Meta Cloud API es el canal principal
    const encolar = async (opts) => { console.log('[puesta-punto] wa_queue deshabilitado, se envió por Meta'); return { ok: false }; };
    const mensaje = `Hola ${transportista.nombre || ''} 👋\n\nDepiMóvil te asignó una *puesta a punto de máquina viajera*.\n\nMáquina: *${maquina.codigo} — ${maquina.nombre}*\nUbicación/base estética: *${maquina.ubicacion || 'a confirmar'}*\n\nPor favor realizar:\n1. Limpieza exterior y accesorios.\n2. Revisión visual de cabezales/cables.\n3. Control de piezas y elementos entregados.\n4. Avisar cualquier daño o faltante.\n\nCuando esté lista, entrá al CRM y tocá *Dar alta disponible* en la ficha de la máquina.\n\nTambién podés responder *LISTA* por WhatsApp para dejar constancia en la conversación.`;
    const envio = await enviarMensaje(telefono, mensaje);
    if (envio?.ok) return { status: 'enviado', messageId: envio.messageId || null };
    await encolar({ telefono, mensaje, tipo: 'puesta_punto_maquina', maquinaId: maquina.id });
    return { status: 'encolado', error: envio?.error || null };
  } catch (err) {
    console.error('notifyPuestaPunto error:', err.message);
    return { status: 'error', error: err.message };
  }
}

// POST /api/maquinas/:id/puesta-punto/asignar
router.post('/:id/puesta-punto/asignar', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const gestorId = parseInt(req.body.gestor_puesta_punto_id || req.body.transportista_id, 10);
  const ubicacion = String(req.body.ubicacion || '').trim();
  const obs = String(req.body.obs || '').trim();
  if (!gestorId) return res.status(400).json({ error: 'Gestor persona física requerido' });
  try {
    const gestor = await getTransportistaPersonaFisica(gestorId);
    if (!gestor) return res.status(400).json({ error: 'Solo una empresa/persona física activa puede gestionar puesta a punto' });
    const { rows: currentRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [maquinaId]);
    if (!currentRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (!isViajera(currentRows[0])) return res.status(400).json({ error: 'La puesta a punto gestionada aplica a máquinas viajeras' });
    const existingPendingSameGestor = currentRows[0].puesta_punto_estado === 'pendiente'
      && parseInt(currentRows[0].gestor_puesta_punto_id, 10) === gestorId
      && currentRows[0].puesta_punto_wa_key;
    const waKey = existingPendingSameGestor || `puesta-punto:${maquinaId}:${gestorId}:${Date.now()}`;
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='mantenimiento',
        ubicacion=COALESCE(NULLIF($1,''), ubicacion),
        gestor_puesta_punto_id=$2,
        puesta_punto_estado='pendiente',
        puesta_punto_asignada_en=CASE WHEN $5::boolean THEN puesta_punto_asignada_en ELSE NOW() END,
        puesta_punto_completada_en=NULL,
        disponibilidad_visible_gestor=TRUE,
        puesta_punto_wa_key=$6,
        puesta_punto_wa_estado=CASE WHEN $5::boolean THEN puesta_punto_wa_estado ELSE NULL END,
        puesta_punto_wa_error=NULL,
        puesta_punto_wa_notificado_en=CASE WHEN $5::boolean THEN puesta_punto_wa_notificado_en ELSE NULL END,
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $3='' THEN '' ELSE E'\n' || $3 END)),
        updated_at=NOW()
      WHERE id=$4 RETURNING *
    `, [ubicacion, gestorId, obs, maquinaId, !!existingPendingSameGestor, waKey]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,'PUESTA_PUNTO_ASIGNADA','maquina',$3,$4)`,
      [req.user.id, req.user.email, maquinaId, `${rows[0].codigo} — ${rows[0].nombre} asignada a ${gestor.nombre}`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId, tipo: 'puesta_punto_asignada',
      estadoAnterior: currentRows[0].estado, estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion, gestorId,
      detalle: `Asignada a puesta a punto por ${gestor.nombre}`,
      metadata: { whatsapp_key: waKey, obs }, user: req.user,
    }).catch(() => {});
    const wa = await notifyPuestaPunto(gestor, rows[0]);
    const notified = ['enviado', 'encolado', 'duplicado'].includes(wa?.status);
    const { rows: finalRows } = await pool.query(`
      UPDATE maquinas SET
        puesta_punto_wa_estado=$1, puesta_punto_wa_error=$2,
        puesta_punto_wa_notificado_en=CASE WHEN $3 THEN COALESCE(puesta_punto_wa_notificado_en,NOW()) ELSE puesta_punto_wa_notificado_en END,
        updated_at=NOW()
      WHERE id=$4 RETURNING *
    `, [wa?.status || null, wa?.error || null, notified, maquinaId]);
    res.json({ ...finalRows[0], whatsapp: wa });
  } catch (err) {
    console.error('POST puesta punto asignar error:', err);
    res.status(500).json({ error: 'Error al asignar puesta a punto' });
  }
});

// POST /api/maquinas/:id/puesta-punto/alta
router.post('/:id/puesta-punto/alta', auth, async (req, res) => {
  const maquinaId = parseInt(req.params.id, 10);
  const isAssignedManager = req.user.rol === 'transportista' && req.user.transportista_id;
  if (!isOpsRole(req.user.rol) && !isAssignedManager) {
    return res.status(403).json({ error: 'Sin permisos para dar alta de puesta a punto' });
  }
  const obs = String(req.body.obs || '').trim();
  const responsable = String(req.body.responsable || req.user?.email || '').trim();
  const { checklist, faltantes } = normalizarChecklistPuestaPunto(req.body.checklist);
  if (faltantes.length) {
    return res.status(400).json({
      error: `Checklist incompleto. Falta confirmar: ${faltantes.join(', ')}`,
      faltantes,
    });
  }
  try {
    const params = [maquinaId];
    let managerWhere = '';
    if (isAssignedManager && !isOpsRole(req.user.rol)) {
      params.push(req.user.transportista_id);
      managerWhere = ` AND gestor_puesta_punto_id=$${params.length} AND disponibilidad_visible_gestor=TRUE`;
    }
    const { rows: currentRows } = await pool.query(`SELECT * FROM maquinas WHERE id=$1${managerWhere}`, params);
    if (!currentRows.length) return res.status(404).json({ error: 'Máquina no encontrada o no asignada a este gestor' });
    if (!isViajera(currentRows[0])) return res.status(400).json({ error: 'La puesta a punto aplica a máquinas viajeras' });
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        estado='disponible',
        puesta_punto_estado='completada',
        puesta_punto_completada_en=NOW(),
        disponibilidad_visible_gestor=FALSE,
        puesta_punto_wa_key=NULL,
        puesta_punto_checklist=$1::jsonb,
        puesta_punto_checklist_en=NOW(),
        puesta_punto_checklist_responsable=NULLIF($2,''),
        ult_mant=COALESCE(ult_mant, CURRENT_DATE),
        obs=TRIM(BOTH E'\n' FROM CONCAT(COALESCE(obs,''), CASE WHEN $3='' THEN '' ELSE E'\n' || $3 END)),
        updated_at=NOW()
      WHERE id=$4 RETURNING *
    `, [JSON.stringify(checklist), responsable, obs, maquinaId]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,'PUESTA_PUNTO_ALTA','maquina',$3,$4)`,
      [req.user.id, req.user.email, maquinaId, `${rows[0].codigo} — ${rows[0].nombre} disponible`]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId, tipo: 'puesta_punto_alta',
      estadoAnterior: currentRows[0].estado, estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion, gestorId: rows[0].gestor_puesta_punto_id,
      detalle: 'Puesta a punto completada con checklist. Máquina disponible.',
      metadata: { obs, checklist, responsable }, user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST puesta punto alta error:', err);
    res.status(500).json({ error: 'Error al dar alta de puesta a punto' });
  }
});

module.exports = router;
