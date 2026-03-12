const bcrypt = require('bcryptjs');
const { User, USER_ROLES } = require('../models/User');
const { signAccessToken } = require('../utils/jwt');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Crea un usuario con rol PASAJERO por defecto (registro público).
 */
async function register({ username, email, password }) {
  const usersCount = await User.countDocuments();

  const existing = await User.findOne({
    $or: [{ username }, { email: email.toLowerCase() }]
  });

  if (existing) {
    const field = existing.username === username ? 'Nombre de usuario' : 'Correo electrónico';
    throw new ErrorApp(`Error al registrar: El ${field} ya se encuentra en uso.`, 409, `Conflicto de unicidad en campo: ${field}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
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
      role: user.role
    }
  };
}

/**
 * Login por username o email.
 */
async function login({ usernameOrEmail, password }) {
  const query = {
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail.toLowerCase() }
    ]
  };

  const user = await User.findOne(query);
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
      role: user.role
    }
  };
}

module.exports = {
  register,
  login
};
