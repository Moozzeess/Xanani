const bcrypt = require('bcryptjs');
const { Usuario, ROLES_USUARIO } = require('../models/Usuario');
const { firmarTokenAcceso } = require('../utils/jwt');

/**
 * Crea un usuario con rol PASAJERO por defecto (registro público).
 */
async function registrar({ nombreUsuario, correoElectronico, contrasena }) {
  const cantidadUsuarios = await Usuario.countDocuments();

  const existente = await Usuario.findOne({
    $or: [
      { nombreUsuario },
      { correoElectronico: correoElectronico.toLowerCase() }
    ]
  });

  if (existente) {
    const campo = existente.nombreUsuario === nombreUsuario ? 'nombreUsuario' : 'correoElectronico';
    const mensaje =
      campo === 'nombreUsuario'
        ? 'El nombre de usuario ya existe.'
        : 'El correo electrónico ya existe.';
    const error = new Error(mensaje);
    error.statusCode = 409;
    throw error;
  }

  const hashContrasena = await bcrypt.hash(contrasena, 10);

  const usuario = await Usuario.create({
    nombreUsuario,
    correoElectronico: correoElectronico.toLowerCase(),
    hashContrasena,
    rol: cantidadUsuarios === 0 ? ROLES_USUARIO.SUPERUSUARIO : ROLES_USUARIO.PASAJERO
  });

  const token = firmarTokenAcceso({
    id: usuario._id.toString(),
    rol: usuario.rol,
    nombreUsuario: usuario.nombreUsuario,
    correoElectronico: usuario.correoElectronico
  });

  return {
    token,
    usuario: {
      id: usuario._id.toString(),
      nombreUsuario: usuario.nombreUsuario,
      correoElectronico: usuario.correoElectronico,
      rol: usuario.rol
    }
  };
}

/**
 * Inicio de sesión por nombre de usuario o correo electrónico.
 */
async function iniciarSesion({ nombreUsuarioOCorreo, contrasena }) {
  const consulta = {
    $or: [
      { nombreUsuario: nombreUsuarioOCorreo },
      { correoElectronico: nombreUsuarioOCorreo.toLowerCase() }
    ]
  };

  const usuario = await Usuario.findOne(consulta);

  if (!usuario || !usuario.estaActivo) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const esValida = await bcrypt.compare(contrasena, usuario.hashContrasena);

  if (!esValida) {
    const error = new Error('Credenciales inválidas.');
    error.statusCode = 401;
    throw error;
  }

  const token = firmarTokenAcceso({
    id: usuario._id.toString(),
    rol: usuario.rol,
    nombreUsuario: usuario.nombreUsuario,
    correoElectronico: usuario.correoElectronico
  });

  return {
    token,
    usuario: {
      id: usuario._id.toString(),
      nombreUsuario: usuario.nombreUsuario,
      correoElectronico: usuario.correoElectronico,
      rol: usuario.rol
    }
  };
}

/**
 * Crea una cuenta de forma interna (ideal para que un admin/superusuario asigne cuentas)
 * No genera Token de sesión ya que el creador ya está en sesión segura.
 */
async function registrarCuentaInterna({ nombreUsuario, correoElectronico, contrasena, rolAsignado }) {
  const existente = await Usuario.findOne({
    $or: [
      { nombreUsuario },
      { correoElectronico: correoElectronico.toLowerCase() }
    ]
  });

  if (existente) {
    const campo = existente.nombreUsuario === nombreUsuario ? 'nombreUsuario' : 'correoElectronico';
    const mensaje =
      campo === 'nombreUsuario'
        ? 'El nombre de usuario ya existe.'
        : 'El correo electrónico ya existe.';
    const error = new Error(mensaje);
    error.statusCode = 409;
    throw error;
  }

  const hashContrasena = await bcrypt.hash(contrasena, 10);

  const usuario = await Usuario.create({
    nombreUsuario,
    correoElectronico: correoElectronico.toLowerCase(),
    hashContrasena,
    rol: rolAsignado
  });

  return {
    id: usuario._id.toString(),
    nombreUsuario: usuario.nombreUsuario,
    correoElectronico: usuario.correoElectronico,
    rol: usuario.rol
  };
}

module.exports = {
  registrar,
  iniciarSesion,
  registrarCuentaInterna
};
