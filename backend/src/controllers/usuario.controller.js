const bcrypt = require('bcryptjs');
const { Usuario, USER_ROLES } = require('../models/Usuario');
const Conductor = require('../models/Conductor');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Intención: Crea de forma administrativa a un usuario, permitiendo anidar un perfil de Conductor.
 */
const crearUsuario = catchAsync(async (req, res, next) => {
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

  const existing = await Usuario.findOne({
    $or: [{ username }, { email: email.toLowerCase() }]
  });

  if (existing) {
    throw new ErrorApp('Conflicto: El nombre de usuario o el correo ya están registrados.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await Usuario.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role
  });

  if (role === USER_ROLES.CONDUCTOR) {
    const { telefono, licencia, unidad, fechaNacimiento, ruta, rutaAsignadaId } = req.body;
    await Conductor.create({
      user: user._id,
      telefono: telefono || '',
      licencia: licencia || '',
      unidad: unidad || '',
      ruta: ruta || 'Sin ruta',
      rutaAsignadaId: rutaAsignadaId || null,
      fechaNacimiento: fechaNacimiento || null
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

/**
 * Intención: Recuperar personal interno de la aplicación que administra las flotillas.
 */
const obtenerAdministradores = catchAsync(async (req, res, next) => {
  const admins = await Usuario.find({ role: USER_ROLES.ADMINISTRADOR }, '-passwordHash');
  res.status(200).json({
    status: 'exito',
    resultados: admins.length,
    data: admins
  });
});

/**
 * Intención: Actualizar el perfil personal de un usuario (principalmente pasajeros).
 */
const actualizarPerfil = catchAsync(async (req, res, next) => {
  const userId = req.auth?.userId; // Usar el ID del token para seguridad
  const { username, email, fechaNacimiento, genero, nacionalidad, password } = req.body;

  const user = await Usuario.findById(userId);
  if (!user) throw new ErrorApp('Usuario no encontrado', 404);

  if (username) user.username = username;
  if (email) user.email = email.toLowerCase();
  if (fechaNacimiento) user.fechaNacimiento = fechaNacimiento;
  if (genero) user.genero = genero;
  if (nacionalidad) user.nacionalidad = nacionalidad;

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  res.status(200).json({
    status: 'exito',
    mensaje: 'Perfil actualizado correctamente',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      fechaNacimiento: user.fechaNacimiento,
      genero: user.genero,
      nacionalidad: user.nacionalidad
    }
  });
});

/**
 * Intención: Agregar o quitar una ruta de la lista de favoritos del pasajero.
 */
const gestionarFavorito = catchAsync(async (req, res, next) => {
  const userId = req.auth?.userId;
  const { rutaId } = req.body;

  if (!rutaId) throw new ErrorApp('El rutaId es requerido', 400);

  const user = await Usuario.findById(userId);
  if (!user) throw new ErrorApp('Usuario no encontrado', 404);

  const index = user.rutasFavoritas.indexOf(rutaId);
  if (index === -1) {
    user.rutasFavoritas.push(rutaId);
  } else {
    user.rutasFavoritas.splice(index, 1);
  }

  await user.save();

  res.status(200).json({
    status: 'exito',
    mensaje: index === -1 ? 'Ruta agregada a favoritos' : 'Ruta eliminada de favoritos',
    rutasFavoritas: user.rutasFavoritas
  });
});

/**
 * Intención: Obtener el perfil completo del usuario autenticado.
 */
const obtenerPerfil = catchAsync(async (req, res, next) => {
  const userId = req.auth?.userId;
  const user = await Usuario.findById(userId, '-passwordHash').populate('rutasFavoritas');
  
  if (!user) throw new ErrorApp('Usuario no encontrado', 404);

  res.status(200).json({
    status: 'exito',
    data: user
  });
});

module.exports = {
  crearUsuario,
  obtenerAdministradores,
  actualizarPerfil,
  gestionarFavorito,
  obtenerPerfil
};
