const bcrypt = require('bcryptjs');
const { User, USER_ROLES } = require('../models/User');

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
      return res
        .status(400)
        .json({ message: 'username, email, password y role son requeridos.' });
    }

    const actorRole = req.auth?.role;

    if (actorRole === USER_ROLES.ADMINISTRADOR && role !== USER_ROLES.CONDUCTOR) {
      return res.status(403).json({
        message: 'ADMINISTRADOR solo puede dar de alta CONDUCTOR.'
      });
    }

    if (actorRole !== USER_ROLES.SUPERUSUARIO && actorRole !== USER_ROLES.ADMINISTRADOR) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción.' });
    }

    const existing = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }]
    });

    if (existing) {
      return res.status(409).json({ message: 'Usuario o correo ya existe.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
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
    return res.status(500).json({ message: error.message || 'Error interno.' });
  }
}

module.exports = {
  createUser
};
