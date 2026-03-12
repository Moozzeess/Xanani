const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

const register = catchAsync(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ErrorApp('Datos incompletos: El nombre de usuario, correo y contraseña son obligatorios.', 400);
  }

  const result = await authService.register({ username, email, password });
  res.status(201).json(result);
});

const login = catchAsync(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    throw new ErrorApp('Datos incompletos: Se requiere el usuario/correo y la contraseña.', 400);
  }

  const result = await authService.login({ usernameOrEmail, password });
  res.status(200).json(result);
});

module.exports = {
  register,
  login
};
