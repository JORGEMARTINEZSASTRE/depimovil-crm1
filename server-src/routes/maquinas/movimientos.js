// routes/maquinas/movimientos.js — GET /:id/movimientos
const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const { auth, isOpsRole, isOperadoraRole } = require('../../middleware/auth');
const { localidadesOperadora, maquinaVisibleParaLocalidades } = require('./helpers');

router.get('/:id/movimientos', auth, async (req, res) => {
  try {
    if (req.user.rol === 'transportista' && !req.user.transportista_id) return res.status(403).json({ error: 'Sin permisos para historial' });
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') {
      return res.status(403).json({ error: 'Sin permisos para historial' });
    }
    const { rows: maqRows } = await pool.query('SELECT * FROM maquinas WHERE id=$1', [req.params.id]);
    if (!maqRows.length) return res.status(404).json({ error: 'Máquina no encontrada' });
    if (req.user.rol === 'transportista') {
      const visible = parseInt(maqRows[0].gestor_puesta_punto_id, 10) === parseInt(req.user.transportista_id, 10)
        && maqRows[0].disponibilidad_visible_gestor;
      if (!visible) return res.status(403).json({ error: 'Máquina no asignada a este gestor' });
    }
    if (isOperadoraRole(req.user.rol)) {
      if (!req.user.operadora_id) return res.status(403).json({ error: 'Sin permisos para historial' });
      const { rows: opRows } = await pool.query(
        `SELECT ciudad, direcciones_entrega FROM operadoras WHERE id=$1`,
        [req.user.operadora_id]
      );
      if (!maquinaVisibleParaLocalidades(maqRows[0], localidadesOperadora(opRows[0]))) {
        return res.status(403).json({ error: 'Máquina no disponible para tus localidades declaradas' });
      }
    }
    const { rows } = await pool.query(
      `SELECT mv.*, t.nombre AS gestor_nombre
       FROM maquina_movimientos mv
       LEFT JOIN transportistas t ON t.id = mv.gestor_id
       WHERE mv.maquina_id=$1
       ORDER BY mv.created_at DESC
       LIMIT 80`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET maquina movimientos error:', err);
    res.status(500).json({ error: 'Error al obtener historial de máquina' });
  }
});

module.exports = router;
