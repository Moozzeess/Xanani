const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Firma un JWT para el usuario autenticado.
 * @param {{ id: string, role: string, username?: string, email?: string }} payload
 * @returns {string}
 */
function signAccessToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en variables de entorno.');
  }

  return jwt.sign(
    {
      sub: payload.id,
      role: payload.role,
      username: payload.username,
      email: payload.email
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
function verifyAccessToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en variables de entorno.');
  }

  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};
