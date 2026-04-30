const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Intención: Registra un nuevo pasajero genérico en el sistema.
 * Parámetros:
 *  - {Object} req - Petición HTTP. Body requiere (username, email, password).
 *  - {Object} res - Respuesta HTTP.
 * Retorno:
 *  - {Object} Datos del usuario creado y el token (JWT) generado.
 * Reglas de negocio:
 *  - Siempre asigna el rol PASAJERO por defecto según el servicio subyacente.
 *  - Se valida obligatoriamente la presencia de las credenciales base.
 * Casos límite (edge cases):
 *  - Retorna HTTP 400 si falta algún parámetro de autenticación.
 */
const registrar = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ErrorApp('Datos incompletos: El nombre de usuario, correo y contraseña son obligatorios.', 400);
  }

  const result = await authService.register({ username, email, password });
  res.status(201).json(result);
});

/**
 * Intención: Autenticar a un usuario existente y devolverle una sesión.
 * Parámetros:
 *  - {Object} req - Petición HTTP. Body requiere (usernameOrEmail, password).
 *  - {Object} res - Respuesta HTTP.
 * Retorno:
 *  - {Object} Datos públicos del usuario y el token (JWT).
 * Reglas de negocio:
 *  - Admite inicio de sesión bidireccional (vía nombre de usuario O por correo).
 * Casos límite (edge cases):
 *  - Retorna HTTP 400 si las credenciales están vacías.
 */
const iniciarSesion = catchAsync(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    throw new ErrorApp('Datos incompletos: Se requiere el usuario/correo y la contraseña.', 400);
  }

  const result = await authService.login({ usernameOrEmail, password });
  res.status(200).json(result);
});

const verificarCorreo = catchAsync(async (req, res) => {
  const { token } = req.params;
  const result = await authService.verifyEmail(token);
  res.status(200).json(result);
});

const solicitarRecuperacion = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ErrorApp('Datos incompletos: El correo es obligatorio.', 400);

  const result = await authService.forgotPassword(email);
  res.status(200).json(result);
});

const restablecerContrasena = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) throw new ErrorApp('Datos incompletos: La nueva contraseña es obligatoria.', 400);

  const result = await authService.resetPassword({ token, newPassword });
  res.status(200).json(result);
});

module.exports = {
  registrar,
  iniciarSesion,
  verificarCorreo,
  solicitarRecuperacion,
  restablecerContrasena
};
