const express = require('express');
const pool = require('../utils/db');
const { auth, requireRole } = require('../middleware/auth');
const { ensureAutomationTables, detectInactiveOperators } = require('../utils/automation_engine');

const router = express.Router();

router.use(auth, requireRole('superadmin', 'administrador', 'operaciones', 'comercial'));

router.get('/summary', async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const [rules, events, runs, tasks, errors] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE active)::int AS active FROM automation_rules'),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::int AS last_24h FROM automation_events"),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='error')::int AS errors FROM automation_runs"),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pendiente')::int AS pending FROM automation_tasks"),
      pool.query(`
        SELECT id, rule_key, status, error, updated_at
        FROM automation_runs
        WHERE status='error'
        ORDER BY updated_at DESC
        LIMIT 10
      `),
    ]);
    res.json({
      rules: rules.rows[0],
      events: events.rows[0],
      runs: runs.rows[0],
      tasks: tasks.rows[0],
      recent_errors: errors.rows,
    });
  } catch (err) {
    console.error('GET /api/automatizaciones/summary error:', err);
    res.status(500).json({ error: 'Error al obtener resumen de automatizaciones' });
  }
});

router.get('/rules', async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const { rows } = await pool.query('SELECT * FROM automation_rules ORDER BY event, key');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/automatizaciones/rules error:', err);
    res.status(500).json({ error: 'Error al obtener reglas' });
  }
});

router.put('/rules/:key', requireRole('superadmin', 'administrador'), async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const { active, config } = req.body;
    const { rows } = await pool.query(`
      UPDATE automation_rules SET
        active=COALESCE($1, active),
        config=COALESCE($2, config),
        updated_at=NOW()
      WHERE key=$3
      RETURNING *
    `, [
      typeof active === 'boolean' ? active : null,
      config ? JSON.stringify(config) : null,
      req.params.key,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Regla no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/automatizaciones/rules/:key error:', err);
    res.status(500).json({ error: 'Error al actualizar regla' });
  }
});

router.get('/events', async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const limit = Math.min(parseInt(req.query.limit, 10) || 80, 200);
    const { rows } = await pool.query(`
      SELECT *
      FROM automation_events
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/automatizaciones/events error:', err);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

router.get('/runs', async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 300);
    const { rows } = await pool.query(`
      SELECT r.*, e.event, e.entity, e.entity_id
      FROM automation_runs r
      LEFT JOIN automation_events e ON e.id = r.event_id
      ORDER BY r.created_at DESC
      LIMIT $1
    `, [limit]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/automatizaciones/runs error:', err);
    res.status(500).json({ error: 'Error al obtener ejecuciones' });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const status = req.query.status || 'pendiente';
    const params = [];
    let where = '';
    if (status !== 'todas') {
      params.push(status);
      where = `WHERE status=$${params.length}`;
    }
    const { rows } = await pool.query(`
      SELECT *
      FROM automation_tasks
      ${where}
      ORDER BY COALESCE(due_at, created_at) ASC
      LIMIT 200
    `, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/automatizaciones/tasks error:', err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.patch('/tasks/:id', async (req, res) => {
  try {
    await ensureAutomationTables(pool);
    const status = req.body.status || 'resuelta';
    const { rows } = await pool.query(`
      UPDATE automation_tasks SET status=$1, updated_at=NOW()
      WHERE id=$2
      RETURNING *
    `, [status, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/automatizaciones/tasks/:id error:', err);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

router.post('/detect-inactive', requireRole('superadmin', 'administrador', 'comercial'), async (req, res) => {
  try {
    const days = parseInt(req.body.days || req.query.days, 10) || 45;
    const events = await detectInactiveOperators(pool, days, req.user);
    res.json({ ok: true, days, created_events: events.length });
  } catch (err) {
    console.error('POST /api/automatizaciones/detect-inactive error:', err);
    res.status(500).json({ error: 'Error al detectar operadoras inactivas' });
  }
});

module.exports = router;
