const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Firma un JWT para el usuario autenticado.
 * 
 * @param {Object} payload - Datos del usuario.
 * @param {string} payload.id - ID único (MongoDB).
 * @param {string} payload.role - Rol del usuario (SUPERUSUARIO, etc).
 * @param {string} [payload.username] - Nombre de usuario.
 * @param {string} [payload.email] - Correo electrónico.
 * @returns {string} Token firmado.
 */
function signAccessToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en variables de entorno.');
  }

  // Normalizamos nombres de campos a inglés para consistencia
  return jwt.sign(
    {
      id: payload.id,
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
 * 
 * @param {string} token - Token JWT.
 * @returns {Object} Payload decodificado.
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