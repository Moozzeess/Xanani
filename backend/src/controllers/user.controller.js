const bcrypt = require('bcryptjs');
const { Usuario, ROLES_USUARIO } = require('../models/User');

/**
 * Alta de usuarios (solo roles privilegiados).
 * Reglas:
 * - SUPERUSUARIO puede crear: SUPERUSUARIO, ADMINISTRADOR, CONDUCTOR, PASAJERO
 * - ADMINISTRADOR puede crear: CONDUCTOR
 */
async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        mensaje: 'username, email, password y role son requeridos.'
      });
    }

    const roleActor = req.user?.role;

    if (roleActor === ROLES_USUARIO.ADMINISTRADOR && role !== ROLES_USUARIO.CONDUCTOR) {
      return res.status(403).json({
        mensaje: 'ADMINISTRADOR solo puede dar de alta CONDUCTOR.'
      });
    }

    if (roleActor !== ROLES_USUARIO.SUPERUSUARIO && roleActor !== ROLES_USUARIO.ADMINISTRADOR) {
      return res.status(403).json({ mensaje: 'No tienes permisos para esta acción.' });
    }

    const existente = await Usuario.findOne({
      $or: [
        { username },
        { email: email.toLowerCase() }
      ]
    });

    if (existente) {
      return res.status(409).json({ mensaje: 'El user o correo ya existe.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Usuario.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role
    });

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message || 'Error interno.' });
  }
}

/**
 * Actualizar el role de un user existente.
 */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ mensaje: 'El campo "role" es requerido.' });
    }

    if (!Object.values(USER_ROLES).includes(role)) {
      return res.status(400).json({ mensaje: 'El role propuesto es inválido.' });
    }

    const roleActor = req.user?.role;

    if (roleActor === ROLES_USUARIO.ADMINISTRADOR && role !== ROLES_USUARIO.CONDUCTOR) {
      return res.status(403).json({
        mensaje: 'ADMINISTRADOR solo puede ascender a CONDUCTOR.'
      });
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { role },
      { new: true } // Devuelve el nuevo documento actualizado
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Cuenta de user no encontrada en el sistema.' });
    }

    return res.status(200).json({
      mensaje: 'Rol de user actualizado con éxito',
      user: {
        id: usuarioActualizado._id.toString(),
        username: usuarioActualizado.username,
        email: usuarioActualizado.email,
        role: usuarioActualizado.role
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
