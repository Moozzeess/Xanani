const bcrypt = require('bcryptjs');
const { User, USER_ROLES } = require('../models/User');
const Conductor = require('../models/Conductor');
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

  if (role === USER_ROLES.CONDUCTOR) {
    const { telefono, licencia, unidad, edad, ruta, rutaAsignadaId } = req.body;
    await Conductor.create({
      user: user._id,
      telefono: telefono || '',
      licencia: licencia || '',
      unidad: unidad || '',
      ruta: ruta || 'Sin ruta',
      rutaAsignadaId: rutaAsignadaId || null,
      edad: edad || null
    });
  }

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

const getConductores = catchAsync(async (req, res, next) => {
  const users = await User.find({ role: { $regex: new RegExp(`^${USER_ROLES.CONDUCTOR}$`, 'i') } }, '-passwordHash').lean();
  const userIds = users.map(u => u._id);
  const fichas = await Conductor.find({ user: { $in: userIds } }).lean();

  const conductoresData = users.map(u => {
    const ficha = fichas.find(f => f.user.toString() === u._id.toString()) || {};
    return {
      user: u,
      _id: ficha._id || u._id,
      licencia: ficha.licencia,
      unidad: ficha.unidad,
      ruta: ficha.ruta,
      rutaAsignadaId: ficha.rutaAsignadaId,
      telefono: ficha.telefono,
      edad: ficha.edad
    };
  });

  res.status(200).json({
    status: 'exito',
    resultados: conductoresData.length,
    data: {
      conductores: conductoresData
    }
  });
});

const updateConductor = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Usará el ID del User
  const { username, email, telefono, licencia, unidad, edad, ruta, rutaAsignadaId } = req.body;

  const user = await User.findById(id);
  if (!user) throw new ErrorApp('Conductor no encontrado', 404);

  if (username || email) {
    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    await user.save();
  }

  // Actualiza o crea el conductor si era un conductor fantasma sin sub-documento
  const conductor = await Conductor.findOneAndUpdate(
    { user: id },
    { telefono, licencia, unidad, edad, ruta, rutaAsignadaId },
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json({
    status: 'exito',
    mensaje: 'Información de conductor actualizada',
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      conductor
    }
  });
});
const getAdmins = catchAsync(async (req, res, next) => {
  const admins = await User.find({ role: USER_ROLES.ADMINISTRADOR }, '-passwordHash');
  res.status(200).json({
    status: 'exito',
    resultados: admins.length,
    data: admins
  });
});

module.exports = {
  createUser,
  getConductores,
  updateConductor,
  getAdmins
};
