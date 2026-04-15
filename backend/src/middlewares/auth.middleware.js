const { verifyAccessToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        mensaje: 'Falta el encabezado Authorization o no es Bearer'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyAccessToken(token);

    // 🔥 AQUÍ SE GUARDA EL USUARIO (Payload en inglés: id, role, username, email)
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido o expirado',
      error: error.message
    });
  }
};
