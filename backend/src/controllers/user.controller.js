const bcrypt = require('bcryptjs');
const { Usuario, ROLES_USUARIO } = require('../models/Usuario');

/**
 * Alta de usuarios (solo roles privilegiados).
 * Reglas:
 * - SUPERUSUARIO puede crear: SUPERUSUARIO, ADMINISTRADOR, CONDUCTOR, PASAJERO
 * - ADMINISTRADOR puede crear: CONDUCTOR
 */
async function createUser(req, res) {
  try {
    const { nombreUsuario, correoElectronico, contrasena, rol } = req.body;

    if (!nombreUsuario || !correoElectronico || !contrasena || !rol) {
      return res.status(400).json({
        mensaje: 'nombreUsuario, correoElectronico, contrasena y rol son requeridos.'
      });
    }

    const rolActor = req.user?.rol;

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

/**
 * Actualizar el rol de un usuario existente.
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol) {
      return res.status(400).json({ mensaje: 'El campo "rol" es requerido.' });
    }

    if (!Object.values(ROLES_USUARIO).includes(rol)) {
      return res.status(400).json({ mensaje: 'El rol propuesto es inválido.' });
    }

    const rolActor = req.user?.rol;

    if (rolActor === ROLES_USUARIO.ADMINISTRADOR && rol !== ROLES_USUARIO.CONDUCTOR) {
      return res.status(403).json({
        mensaje: 'ADMINISTRADOR solo puede ascender a CONDUCTOR.'
      });
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { rol },
      { new: true } // Devuelve el nuevo documento actualizado
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Cuenta de usuario no encontrada en el sistema.' });
    }

    return res.status(200).json({
      mensaje: 'Rol de usuario actualizado con éxito',
      usuario: {
        id: usuarioActualizado._id.toString(),
        nombreUsuario: usuarioActualizado.nombreUsuario,
        correoElectronico: usuarioActualizado.correoElectronico,
        rol: usuarioActualizado.rol
      }
    });

  } catch (error) {
    return res.status(500).json({ mensaje: error.message || 'Error interno.' });
  }
}

module.exports = {
  createUser,
  updateUserRole
};
