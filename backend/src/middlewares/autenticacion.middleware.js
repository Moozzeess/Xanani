const { verificarTokenAcceso } = require('../utils/jwt');

/**
 * Middleware: requiere autenticación por JWT (Authorization: Bearer <token>).
 */
function requerirAutenticacion(req, res, next) {
  try {
    const encabezado = req.headers.authorization;
    if (!encabezado) {
      return res.status(401).json({ mensaje: 'Falta el encabezado Authorization.' });
    }

    const [tipo, token] = encabezado.split(' ');
    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({
        mensaje: 'Authorization debe ser: Bearer <token>.'
      });
    }

    const payload = verificarTokenAcceso(token);
    req.auth = {
      usuarioId: payload.sub,
      rol: payload.rol,
      nombreUsuario: payload.nombreUsuario,
      correoElectronico: payload.correoElectronico
    };

    return next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware factory: requiere que el usuario tenga alguno de los roles permitidos.
 * @param {string[]} rolesPermitidos
 */
function requerirRol(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.auth?.rol) {
      return res.status(401).json({ mensaje: 'No autenticado.' });
    }

    if (!rolesPermitidos.includes(req.auth.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción.' });
    }

    return next();
  };
}

module.exports = {
  requerirAutenticacion,
  requerirRol
};
