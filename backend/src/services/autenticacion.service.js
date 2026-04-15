const bcrypt = require('bcryptjs');
const { Usuario, ROLES_USUARIO } = require('../models/User');
const { firmarTokenAcceso } = require('../utils/jwt');

/**
 * Registro público. El primer usuario del sistema se convierte en SUPERUSUARIO.
 */
async function registrar({ username, email, password }) {
  const total = await Usuario.countDocuments();

  const existente = await Usuario.findOne({
    $or: [
      { nombreUsuario: username },
      { correoElectronico: email.toLowerCase() }
    ]
  });

  if (existente) {
    const error = new Error(
      existente.nombreUsuario === username
        ? 'El nombre de usuario ya existe.'
        : 'El correo electrónico ya existe.'
    );
    error.statusCode = 409;
    throw error;
  }

  const hashContrasena = await bcrypt.hash(password, 10);
  const rol = total === 0 ? ROLES_USUARIO.SUPERUSUARIO : ROLES_USUARIO.PASAJERO;

  const user = await Usuario.create({
    nombreUsuario: username,
    correoElectronico: email.toLowerCase(),
    hashContrasena,
    rol
  });

  const token = firmarTokenAcceso({
    id: user._id.toString(),
    rol: user.rol,
    nombreUsuario: user.nombreUsuario,
    correoElectronico: user.correoElectronico
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.nombreUsuario,
      email: user.correoElectronico,
      role: user.rol        // <-- inglés para el frontend React
    }
  };
}

/**
 * Inicio de sesión con nombre de usuario o correo.
 */
async function iniciarSesion({ usernameOCorreo, password }) {
  const user = await Usuario.findOne({
    $or: [
      { nombreUsuario: usernameOCorreo },
      { correoElectronico: usernameOCorreo.toLowerCase() }
    ]
  });

  if (!user || !user.estaActivo) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const esValida = await bcrypt.compare(password, user.hashContrasena);
  if (!esValida) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const token = firmarTokenAcceso({
    id: user._id.toString(),
    rol: user.rol,
    nombreUsuario: user.nombreUsuario,
    correoElectronico: user.correoElectronico
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.nombreUsuario,
      email: user.correoElectronico,
      role: user.rol        // <-- inglés para el frontend React
    }
  };
}

/**
 * Crear cuenta interna (sin token de sesión).
 */
async function registrarCuentaInterna({ username, email, password, roleAsignado }) {
  const existente = await Usuario.findOne({
    $or: [
      { nombreUsuario: username },
      { correoElectronico: email.toLowerCase() }
    ]
  });

  if (existente) {
    const error = new Error('El usuario o correo ya existe.');
    error.statusCode = 409;
    throw error;
  }

  const hashContrasena = await bcrypt.hash(password, 10);

  const user = await Usuario.create({
    nombreUsuario: username,
    correoElectronico: email.toLowerCase(),
    hashContrasena,
    rol: roleAsignado
  });

  return {
    id: user._id.toString(),
    username: user.nombreUsuario,
    email: user.correoElectronico,
    role: user.rol
  };
}

module.exports = { registrar, iniciarSesion, registrarCuentaInterna };
