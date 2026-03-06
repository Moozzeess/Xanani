const bcrypt = require('bcryptjs');
const { Usuario, ROLES_USUARIO } = require('../models/Usuario');

/**
 * Alta de usuarios (solo roles privilegiados).
 * Reglas:
 * - SUPERUSUARIO puede crear: SUPERUSUARIO, ADMINISTRADOR, CONDUCTOR, PASAJERO
 * - ADMINISTRADOR puede crear: CONDUCTOR
 */
async function crearUsuario(req, res) {
  try {
    const { nombreUsuario, correoElectronico, contrasena, rol } = req.body;

    if (!nombreUsuario || !correoElectronico || !contrasena || !rol) {
      return res.status(400).json({
        mensaje: 'nombreUsuario, correoElectronico, contrasena y rol son requeridos.'
      });
    }

    const rolActor = req.auth?.rol;

    if (rolActor === ROLES_USUARIO.ADMINISTRADOR && rol !== ROLES_USUARIO.CONDUCTOR) {
      return res.status(403).json({
        mensaje: 'ADMINISTRADOR solo puede dar de alta CONDUCTOR.'
      });
    }

    if (rolActor !== ROLES_USUARIO.SUPERUSUARIO && rolActor !== ROLES_USUARIO.ADMINISTRADOR) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción.' });
    }

    const existente = await Usuario.findOne({
      $or: [
        { nombreUsuario },
        { correoElectronico: correoElectronico.toLowerCase() }
      ]
    });

    if (existente) {
      return res.status(409).json({ mensaje: 'El usuario o correo ya existe.' });
    }

    const hashContrasena = await bcrypt.hash(contrasena, 10);

    const usuario = await Usuario.create({
      nombreUsuario,
      correoElectronico: correoElectronico.toLowerCase(),
      hashContrasena,
      rol
    });

    return res.status(201).json({
      usuario: {
        id: usuario._id.toString(),
        nombreUsuario: usuario.nombreUsuario,
        correoElectronico: usuario.correoElectronico,
        rol: usuario.rol
      }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message || 'Error interno.' });
  }
}

module.exports = {
  crearUsuario
};
