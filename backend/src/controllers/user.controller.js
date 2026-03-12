const bcrypt = require('bcryptjs');
const { User, USER_ROLES } = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Alta de usuarios (solo roles privilegiados).
 */
const createUser = catchAsync(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    throw new ErrorApp('Datos incompletos: username, email, password y role son requeridos.', 400);
  }

  const actorRole = req.auth?.role;

  // Verificación de permisos
  if (actorRole === USER_ROLES.ADMINISTRADOR && role !== USER_ROLES.CONDUCTOR) {
    throw new ErrorApp('Permisos insuficientes: Un ADMINISTRADOR solo puede dar de alta CONDUCTORES.', 403);
  }

  if (actorRole !== USER_ROLES.SUPERUSUARIO && actorRole !== USER_ROLES.ADMINISTRADOR) {
    throw new ErrorApp('Acceso denegado: No tienes permisos para crear usuarios.', 403);
  }

  const existing = await User.findOne({
    $or: [{ username }, { email: email.toLowerCase() }]
  });

  if (existing) {
    throw new ErrorApp('Conflicto: El nombre de usuario o el correo ya están registrados.', 409, 'Error de unicidad en base de datos Mongoose.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role
  });

  res.status(201).json({
    status: 'exito',
    mensaje: 'Usuario creado correctamente.',
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = {
  createUser
};
