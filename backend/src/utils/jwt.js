const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Firma un JWT para el usuario autenticado.
 * @param {{ id: string, rol: string, nombreUsuario?: string, correoElectronico?: string }} payload
 * @returns {string}
 */
function firmarTokenAcceso(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en variables de entorno.');
  }

  return jwt.sign(
    {
      sub: payload.id,
      rol: payload.rol,
      nombreUsuario: payload.nombreUsuario,
      correoElectronico: payload.correoElectronico
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verifica y decodifica un JWT.
 * @param {string} token
 * @returns {import('jsonwebtoken').JwtPayload}
 */
function verificarTokenAcceso(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en variables de entorno.');
  }

  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  firmarTokenAcceso,
  verificarTokenAcceso
};