// routes/maquinas/categorias.js
const express = require('express');
const router = express.Router();
const pool = require('../../utils/db');
const { auth, requireRole, isOpsRole, isOperadoraRole } = require('../../middleware/auth');

// GET /api/maquinas/categorias
router.get('/categorias', auth, async (req, res) => {
  try {
    if (!isOpsRole(req.user.rol) && !isOperadoraRole(req.user.rol) && req.user.rol !== 'transportista') return res.json([]);
    const { rows } = await pool.query(`
      SELECT nombre FROM maquina_categorias WHERE activo = TRUE
      UNION
      SELECT DISTINCT categoria AS nombre FROM maquinas WHERE categoria IS NOT NULL AND trim(categoria) <> ''
      ORDER BY nombre
    `);
    res.json(rows.map(r => r.nombre));
  } catch (err) {
    console.error('GET /api/maquinas/categorias error:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST /api/maquinas/categorias
router.post('/categorias', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'Nombre de categoría requerido' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO maquina_categorias (nombre) VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET activo=TRUE
       RETURNING nombre`,
      [nombre]
    );
    res.status(201).json({ nombre: rows[0].nombre });
  } catch (err) {
    console.error('POST /api/maquinas/categorias error:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// GET /api/maquinas/siguiente-codigo
router.get('/siguiente-codigo', auth, requireRole('superadmin', 'operaciones'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(MAX((substring(codigo FROM '^OP-([0-9]+)$'))::int), 0) + 1 AS siguiente
      FROM maquinas
      WHERE codigo ~ '^OP-[0-9]+$'
    `);
    const n = Number(rows[0]?.siguiente || 1);
    res.json({ codigo: `OP-${String(n).padStart(3, '0')}` });
  } catch (err) {
    console.error('GET /api/maquinas/siguiente-codigo error:', err);
    res.status(500).json({ error: 'Error al calcular próximo código' });
  }
});

module.exports = router;
