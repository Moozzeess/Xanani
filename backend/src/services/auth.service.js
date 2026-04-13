const bcrypt = require('bcryptjs');
const { Usuario, USER_ROLES } = require('../models/Usuario');
const { signAccessToken } = require('../utils/jwt');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Intención: Inscribe un cliente orgánico en el sistema y le provee un JWT firmado.
 * Parámetros:
 *  - {Object} params - Diccionario que contiene (username, email, password).
 * Retorno:
 *  - {Object} Mapa estructurado con un token JWT válido y public_data del usuario creado.
 * Reglas de negocio:
 *  - Por defecto inserta el role "PASAJERO".
 *  - Valida unicidad inyectando minúsculas al email preventivamente.
 *  - Oculta (hash) la contraseña con factor de costo de 10 iteraciones de Bcrypt.
 * Casos límite (edge cases):
 *  - Despacha ErrorApp 409 si el correo o usuario se encuentran duplicados en la jerarquía general.
 */
async function register({ username, email, password }) {
  const usersCount = await Usuario.countDocuments();

  const existing = await Usuario.findOne({
    $or: [{ username }, { email: email.toLowerCase() }]
  });

  if (existing) {
    const field = existing.username === username ? 'Nombre de usuario' : 'Correo electrónico';
    throw new ErrorApp(`Error al registrar: El ${field} ya se encuentra en uso.`, 409, `Conflicto de unicidad en campo: ${field}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await Usuario.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: usersCount === 0 ? USER_ROLES.SUPERUSUARIO : USER_ROLES.PASAJERO
  });

  const token = signAccessToken({
    id: user._id.toString(),
    role: user.role,
    username: user.username,
    email: user.email
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      genero: user.genero,
      nacionalidad: user.nacionalidad,
      fechaNacimiento: user.fechaNacimiento,
      foto: user.foto,
      rutasFavoritas: user.rutasFavoritas
    }
  };
}

/**
 * Intención: Autenticar e identificar un perfil devolciendo su sesión cifrada JWT.
 * Parámetros:
 *  - {Object} params - Credenciales empaquetadas (usernameOrEmail, password).
 * Retorno:
 *  - {Object} Estructura con `token` y objeto plano `user` para cache de navegador.
 * Reglas de negocio:
 *  - Fomenta la autenticación dual (Acepta email o username).
 *  - Invalida internamente a los usuarios donde `isActive` no sea true.
 * Casos límite (edge cases):
 *  - Retorna estado 401 unificado si no existe O la contraseña desentona con el Hash guardado. (Oculta el vector de fallo por seguridad).
 */
async function login({ usernameOrEmail, password }) {
  const query = {
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail.toLowerCase() }
    ]
  };

  const user = await Usuario.findOne(query);
  if (!user || !user.isActive) {
    throw new ErrorApp('Inicio de sesión fallido: Contraseña o datos incorrectos.', 401, 'Usuario no encontrado o inactivo.');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ErrorApp('Inicio de sesión fallido: Contraseña o datos incorrectos.', 401, 'Fallo en la comparación de hash de contraseña (bcrypt).');
  }

  const token = signAccessToken({
    id: user._id.toString(),
    role: user.role,
    username: user.username,
    email: user.email
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      genero: user.genero,
      nacionalidad: user.nacionalidad,
      fechaNacimiento: user.fechaNacimiento,
      foto: user.foto,
      rutasFavoritas: user.rutasFavoritas
    }
  };
}

module.exports = {
  register,
  login
};
