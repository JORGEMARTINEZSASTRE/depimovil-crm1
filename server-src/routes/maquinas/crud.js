// routes/maquinas/crud.js — GET /, GET /:id, POST /, PUT /:id, DELETE /:id, POST /:id/foto
const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const { auth, requireRole, isOpsRole, isOperadoraRole } = require('../../middleware/auth');
const { upload } = require('./setup');
const {
  localidadesOperadora, maquinaVisibleParaLocalidades,
  registrarMovimientoMaquina,
} = require('./helpers');

// GET /api/maquinas
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && !req.user.transportista_id) return res.json([]);
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol)) return res.json([]);
    let localidades = null;
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.json([]);
      const { rows: opRows } = await pool.query(
        `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
        [req.user.operadora_id]
      );
      localidades = localidadesOperadora(opRows[0]);
      if (!localidades.length) return res.json([]);
    }
    const { rows } = await pool.query(`
      SELECT id, codigo, nombre, categoria, ubicacion, estado,
             serial_num, marca, modelo, dept_base,
             ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs,
             gestor_puesta_punto_id, puesta_punto_estado, puesta_punto_asignada_en, puesta_punto_completada_en,
             puesta_punto_wa_estado, puesta_punto_wa_notificado_en, puesta_punto_wa_error,
             puesta_punto_checklist, puesta_punto_checklist_en, puesta_punto_checklist_responsable,
             tecnico_estado, tecnico_nombre, tecnico_salida_en, tecnico_regreso_en, disponibilidad_visible_gestor,
             created_at, updated_at
      FROM maquinas
      ORDER BY codigo
    `);
    if (req.user.rol === 'transportista') {
      return res.json(rows.filter(row =>
        parseInt(row.gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
        && row.disponibilidad_visible_gestor
      ));
    }
    res.json(localidades ? rows.filter(row => maquinaVisibleParaLocalidades(row, localidades)) : rows);
  } catch (err) {
    console.error('GET /api/maquinas error:', err);
    res.status(500).json({ error: 'Error al obtener máquinas' });
  }
});

// GET /api/maquinas/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && !req.user.transportista_id) return res.status(403).json({ error: 'Sin permisos para máquinas' });
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') return res.status(403).json({ error: 'Sin permisos para máquinas' });
    const { rows } = await pool.query('SELECT * FROM maquinas WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (req.user.rol === 'transportista') {
      const visible = parseInt(rows[0].gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
        && rows[0].disponibilidad_visible_gestor;
      if (!visible) return res.status(403).json({ error: 'Máquina no asignada a este gestor' });
      return res.json(rows[0]);
    }
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.status(403).json({ error: 'Sin permisos para máquinas' });
      const { rows: opRows } = await pool.query(
        `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
        [req.user.operadora_id]
      );
      const localidades = localidadesOperadora(opRows[0]);
      if (!maquinaVisibleParaLocalidades(rows[0], localidades)) {
        return res.status(403).json({ error: 'Máquina no disponible para tus localidades declaradas' });
      }
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/maquinas/:id error:', err);
    res.status(500).json({ error: 'Error al obtener máquina' });
  }
});

// POST /api/maquinas
router.post('/', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    codigo, nombre, categoria, ubicacion, estado,
    serial_num, marca, modelo, dept_base, ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs
  } = req.body;
  if (!codigo || !nombre) return res.status(400).json({ error: 'Código y nombre son obligatorios' });
  const tipoOperativo = tipo_operativo || (es_viajera ? 'viajera' : 'base_ciudad');
  try {
    const { rows } = await pool.query(`
      INSERT INTO maquinas (codigo, nombre, categoria, ubicacion, estado, serial_num, marca, modelo, dept_base, ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [
      codigo.trim(), nombre.trim(), categoria || 'Láser Depilación',
      ubicacion || null, tipoOperativo === 'solo_venta' ? 'fuera_servicio' : (estado || 'disponible'),
      serial_num || null, marca || null, modelo || null, dept_base || 'Uruguay',
      ult_mant || null, prox_mant || null, foto_url || null,
      icono_url || null, tipoOperativo === 'viajera' || !!es_viajera, tipoOperativo, ciudad_base || null, obs || null
    ]);
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'CREATE', 'maquina', rows[0].id, `${codigo} — ${nombre}`]
    );
    await registrarMovimientoMaquina(pool, {
      maquinaId: rows[0].id, tipo: 'creada', estadoAnterior: null, estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion, detalle: 'Máquina creada en CRM',
      metadata: { codigo: rows[0].codigo, nombre: rows[0].nombre }, user: req.user,
    }).catch(() => {});
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/maquinas error:', err);
    if (err.code === '23505') return res.status(409).json({ error: `Ya existe una máquina con el código ${codigo}` });
    res.status(500).json({ error: 'Error al crear máquina' });
  }
});

// PUT /api/maquinas/:id
router.put('/:id', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const {
    codigo, nombre, categoria, ubicacion, estado,
    serial_num, marca, modelo, dept_base, ult_mant, prox_mant, foto_url, icono_url, es_viajera, tipo_operativo, ciudad_base, obs
  } = req.body;
  if (!codigo || !nombre) return res.status(400).json({ error: 'Código y nombre son obligatorios' });
  const tipoOperativo = tipo_operativo || (es_viajera ? 'viajera' : 'base_ciudad');
  try {
    const { rows: prevRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    const { rows } = await pool.query(`
      UPDATE maquinas SET
        codigo=$1, nombre=$2, categoria=$3, ubicacion=$4, estado=$5,
        serial_num=$6, marca=$7, modelo=$8, dept_base=$9,
        ult_mant=$10, prox_mant=$11, foto_url=COALESCE($12, foto_url),
        icono_url=$13, es_viajera=$14, tipo_operativo=$15, ciudad_base=$16, obs=$17, updated_at=NOW()
      WHERE id=$18 RETURNING *
    `, [
      codigo.trim(), nombre.trim(), categoria || 'Láser Depilación',
      ubicacion || null, tipoOperativo === 'solo_venta' ? 'fuera_servicio' : (estado || 'disponible'),
      serial_num || null, marca || null, modelo || null, dept_base || 'Uruguay',
      ult_mant || null, prox_mant || null, foto_url || null,
      icono_url || null, tipoOperativo === 'viajera' || !!es_viajera, tipoOperativo, ciudad_base || null, obs || null,
      req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'UPDATE', 'maquina', req.params.id, `${codigo} — ${nombre}`]
    );
    const prev = prevRows[0] || {};
    if (prev.estado !== rows[0].estado || prev.ubicacion !== rows[0].ubicacion) {
      await registrarMovimientoMaquina(pool, {
        maquinaId: req.params.id, tipo: 'actualizada',
        estadoAnterior: prev.estado, estadoNuevo: rows[0].estado,
        ubicacion: rows[0].ubicacion, detalle: 'Máquina actualizada manualmente',
        metadata: { ubicacion_anterior: prev.ubicacion }, user: req.user,
      }).catch(() => {});
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/maquinas/:id error:', err);
    if (err.code === '23505') return res.status(409).json({ error: `Ya existe una máquina con ese código` });
    res.status(500).json({ error: 'Error al actualizar máquina' });
  }
});

// DELETE /api/maquinas/:id
router.delete('/:id', auth, requireRole('superadmin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM maquinas WHERE id=$1 RETURNING id, codigo, nombre', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'DELETE', 'maquina', req.params.id, `${rows[0].codigo} — ${rows[0].nombre}`]
    );
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/maquinas/:id error:', err);
    if (err.code === '23503') return res.status(409).json({ error: 'No se puede eliminar: la máquina tiene reservas asociadas' });
    res.status(500).json({ error: 'Error al eliminar máquina' });
  }
});

// POST /api/maquinas/:id/foto
router.post('/:id/foto', auth, requireRole('superadmin', 'operaciones'), upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Foto requerida. Usá JPG, PNG o WebP hasta 8 MB.' });
    const fotoUrl = `/uploads/maquinas/${req.file.filename}`;
    const { rows } = await pool.query(
      `UPDATE maquinas SET foto_url=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [fotoUrl, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    await pool.query(
      `INSERT INTO audit_log (usuario_id, usuario_email, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, req.user.email, 'UPLOAD_PHOTO', 'maquina', req.params.id, rows[0].codigo]
    ).catch(() => {});
    await registrarMovimientoMaquina(pool, {
      maquinaId: req.params.id, tipo: 'foto_actualizada', estadoNuevo: rows[0].estado,
      ubicacion: rows[0].ubicacion, detalle: 'Foto de máquina actualizada',
      metadata: { foto_url: fotoUrl }, user: req.user,
    }).catch(() => {});
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/maquinas/:id/foto error:', err);
    res.status(500).json({ error: 'Error al subir foto de máquina' });
  }
});

module.exports = router;
