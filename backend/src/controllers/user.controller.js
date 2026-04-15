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

  if (!username || !email || !role) {
    throw new ErrorApp('Datos incompletos: username, email y role son requeridos.', 400);
  }

  const actorRole = req.user?.role;

  // Verificación de permisos
  if (actorRole === USER_ROLES.ADMINISTRADOR && role !== USER_ROLES.CONDUCTOR) {
    throw new ErrorApp('Permisos insuficientes: Un ADMINISTRADOR solo puede dar de alta CONDUCTORES.', 403);
  }

  if (actorRole !== USER_ROLES.SUPERUSUARIO && actorRole !== USER_ROLES.ADMINISTRADOR) {
    throw new ErrorApp('Acceso denegado: No tienes permisos para crear usuarios.', 403);
  }

  let user = await User.findOne({
    $or: [{ username }, { email: email.toLowerCase() }]
  });

  if (user) {
    // Si el usuario ya es lo que queremos, error de duplicación
    if (user.role === role && role !== USER_ROLES.CONDUCTOR) {
      throw new ErrorApp('Conflicto: El usuario ya está registrado con ese rol.', 409);
    }
    
    // Si existe pero queremos que sea Conductor, lo promovemos
    user.role = role;
    await user.save();
  } else {
    // Si no existe, lo creamos
    if (!password) {
      throw new ErrorApp('La contraseña es obligatoria para usuarios nuevos.', 400);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role
    });
  }

  // Si el rol es CONDUCTOR, aseguramos que tenga su ficha técnica
  if (role === USER_ROLES.CONDUCTOR) {
    const { telefono, licencia, unidad, edad, ruta, rutaAsignadaId } = req.body;
    
    // Usamos findOneAndUpdate con upsert para crear o actualizar la ficha
    await Conductor.findOneAndUpdate(
      { user: user._id },
      {
        telefono: telefono || '',
        licencia: licencia || '',
        unidad: unidad || '',
        ruta: ruta || 'Sin ruta',
        rutaAsignadaId: rutaAsignadaId || null,
        edad: edad || null
      },
      { upsert: true, new: true }
    );
  }

  res.status(201).json({
    status: 'exito',
    mensaje: user.wasNew ? 'Usuario creado correctamente.' : 'Usuario actualizado a nuevo rol.',
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

const getConductores = catchAsync(async (req, res, next) => {
  const users = await User.find({ role: USER_ROLES.CONDUCTOR }, '-passwordHash').lean();
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

/**
 * Lista todos los usuarios con opción de búsqueda.
 */
const getUsers = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query, '-passwordHash').sort({ createdAt: -1 }).lean();

  res.status(200).json({
    status: 'exito',
    resultados: users.length,
    data: users
  });
});

const updateConductor = catchAsync(async (req, res, next) => {
  const { id } = req.params; 
  const { username, email, telefono, licencia, unidad, edad, ruta, rutaAsignadaId } = req.body;

  const user = await User.findById(id);
  if (!user) throw new ErrorApp('Conductor no encontrado', 404);

  if (username || email) {
    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    await user.save();
  }

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

const updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, ...fichaData } = req.body;

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw new ErrorApp('Usuario no encontrado', 404);

  // Si el nuevo rol es CONDUCTOR, creamos/actualizamos la ficha
  if (role === USER_ROLES.CONDUCTOR) {
    await Conductor.findOneAndUpdate(
      { user: id },
      {
        telefono: fichaData.telefono || '',
        licencia: fichaData.licencia || '',
        unidad: fichaData.unidad || '',
        ruta: fichaData.ruta || 'Sin ruta',
        rutaAsignadaId: fichaData.rutaAsignadaId || null,
        edad: fichaData.edad || null
      },
      { upsert: true, new: true }
    );
  }

  res.status(200).json({
    status: 'exito',
    mensaje: `Usuario promovido a ${role} con éxito.`,
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
});

module.exports = {
  createUser,
  getUsers,
  getConductores,
  updateConductor,
  getAdmins,
  updateUserRole
};
