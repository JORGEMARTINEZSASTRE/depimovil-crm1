/**
 * DepiMóvil — Middleware de autenticación JWT
 *
 * Uso:
 *   router.get('/ruta', auth, requireRole('superadmin'), handler)
 *   router.get('/ruta', auth, requireRole('superadmin', 'operaciones'), handler)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'depimovil-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/**
 * Genera un token JWT para un usuario.
 * @param {Object} user - Objeto usuario con id, email, rol
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      operadora_id: user.operadora_id || null,
      transportista_id: user.transportista_id || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * Middleware: verifica el token JWT del header Authorization.
 * Agrega req.user con los datos del payload.
 */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token vencido' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * Middleware factory: verifica que req.user.rol sea uno de los roles permitidos.
 * Debe usarse DESPUÉS de auth.
 * @param {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }
    next();
  };
}

module.exports = { auth, requireRole, generateToken };
