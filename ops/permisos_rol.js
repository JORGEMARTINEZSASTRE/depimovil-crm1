// ─────────────────────────────────────────────
// PUT /api/permisos/usuarios/:id/rol — cambiar rol de un usuario interno (admin)
// ─────────────────────────────────────────────
const ROLES_INTERNOS = ['superadmin', 'administrador', 'operaciones', 'comercial', 'coordinadora'];

router.put('/usuarios/:id/rol', auth, requireRole('superadmin'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rol } = req.body || {};
  if (!id || !ROLES_INTERNOS.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No podés cambiar tu propio rol' });
  }
  try {
    const { rows } = await pool.query('SELECT id, email, rol FROM usuarios WHERE id = $1', [id]);
    const u = rows[0];
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!ROLES_INTERNOS.includes(u.rol)) {
      return res.status(400).json({ error: 'Solo se puede cambiar el rol de usuarios internos' });
    }
    await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);
    await pool.query(
      'INSERT INTO audit_log (accion, entidad, entidad_id, detalle, usuario_id, ip) VALUES ($1,$2,$3,$4,$5,$6)',
      ['CAMBIO_ROL', 'usuario', id, `${u.email}: ${u.rol} → ${rol}`, req.user.id, req.ip]
    ).catch(() => {});
    res.json({ ok: true, id, rol });
  } catch (err) {
    console.error('PUT /api/permisos/usuarios/:id/rol error:', err);
    res.status(500).json({ error: 'Error al cambiar el rol' });
  }
});

module.exports = router;
