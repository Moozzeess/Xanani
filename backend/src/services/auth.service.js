const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Usuario, USER_ROLES } = require('../models/Usuario');
const { signAccessToken } = require('../utils/jwt');
const ErrorApp = require('../utils/ErrorApp');
const emailService = require('./email.service');

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
  
  // Crear token de verificación
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  const user = await Usuario.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: usersCount === 0 ? USER_ROLES.SUPERUSUARIO : USER_ROLES.PASAJERO,
    verificationToken
  });

  // Lanzar el envío de correo de manera asíncrona (no bloqueante)
  emailService.enviarCorreoVerificacion(user.email, user.username, verificationToken);

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

  // Verificar que el usuario haya confirmado su correo
  if (!user.isVerified) {
    throw new ErrorApp('Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.', 403, 'Cuenta no verificada.');
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

/**
 * VERIFICAR CORREO (Token URL clickeado)
 */
async function verifyEmail(token) {
  // Normalizar el token (trim y lowercase) por si el cliente de correo lo alteró
  const tokenLimpio = (token || '').trim();
  
  const user = await Usuario.findOne({ verificationToken: tokenLimpio });
  if (!user) {
    throw new ErrorApp('Token inválido o expirado.', 400, 'Verification token no encontrado.');
  }

  user.isVerified = true;
  user.verificationToken = null; // Limpiar para que no se re-use
  await user.save();
  return { mensaje: 'Correo verificado exitosamente.' };
}

/**
 * OLVIDÉ MI CONTRASEÑA
 */
async function forgotPassword(email) {
  const user = await Usuario.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Para no revelar qué correos existen, devolvemos éxito silencioso siempre o un error genérico.
    // Usaremos un éxito silencioso.
    return { mensaje: 'Si el correo existe, hemos enviado un enlace de recuperación.' };
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hora

  await user.save();
  
  // Disparar correo
  emailService.enviarCorreoRecuperacion(user.email, user.username, resetToken);

  return { mensaje: 'Si el correo existe, hemos enviado un enlace de recuperación.' };
}

/**
 * RESTABLECER CONTRASEÑA
 */
async function resetPassword({ token, newPassword }) {
  const user = await Usuario.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ErrorApp('El enlace de recuperación es inválido o ha expirado.', 400);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { mensaje: 'Contraseña actualizada exitosamente.' };
}

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword
};
