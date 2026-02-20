const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware: requiere autenticación por JWT (Authorization: Bearer <token>).
 */
function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Falta encabezado Authorization.' });
    }

    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return res
        .status(401)
        .json({ message: 'Authorization debe ser: Bearer <token>.' });
    }

    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      username: payload.username,
      email: payload.email
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware factory: requiere que el usuario tenga alguno de los roles permitidos.
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.role) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
