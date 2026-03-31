const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        mensaje: 'Falta el encabezado Authorization'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 AQUÍ SE GUARDA EL USUARIO
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: 'Token inválido',
      error: error.message
    });
  }
};
