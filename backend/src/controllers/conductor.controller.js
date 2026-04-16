const { Usuario, USER_ROLES } = require('../models/Usuario');
const Conductor = require('../models/Conductor');
const Unidad = require('../models/Unidad');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Calcula la edad exacta basada en la fecha de nacimiento.
 */
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

/**
 * Intención: Obtener todos los conductores para el panel administrativo.
 */
const obtenerConductores = catchAsync(async (req, res, next) => {
  const conductores = await Conductor.find().populate({
    path: 'user',
    select: '-passwordHash'
  }).populate('rutaAsignadaId').lean();

  const dataMapeada = conductores.map(c => ({
    ...c,
    edad: calcularEdad(c.fechaNacimiento),
    username: c.user?.username || 'Sin nombre',
    email: c.user?.email || 'Sin email'
  }));

  res.status(200).json({
    status: 'exito',
    resultados: dataMapeada.length,
    data: {
      conductores: dataMapeada
    }
  });
});

/**
 * Intención: Crea un nuevo Usuario y su ficha de Conductor asociada.
 */
const crearConductor = catchAsync(async (req, res, next) => {
  const { username, email, password, telefono, licencia, unidad, fechaNacimiento, rutaAsignadaId } = req.body;

  if (unidad) {
    const unidadExistente = await Unidad.findOne({ placa: unidad });
    if (!unidadExistente) {
      throw new ErrorApp(`La unidad ${unidad} no existe.`, 404);
    }
  }

  const passwordHash = await require('bcryptjs').hash(password, 10);
  const user = await Usuario.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: USER_ROLES.CONDUCTOR
  });

  const conductor = await Conductor.create({
    user: user._id,
    telefono,
    licencia,
    unidad,
    fechaNacimiento,
    rutaAsignadaId
  });

  res.status(201).json({
    status: 'exito',
    mensaje: 'Conductor creado correctamente.',
    data: { user, conductor }
  });
});

/**
 * Intención: Actualizar la ficha de un conductor por un administrador.
 */
const actualizarConductor = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { telefono, licencia, unidad, fechaNacimiento, rutaAsignadaId } = req.body;

  if (unidad) {
    const unidadExistente = await Unidad.findOne({ placa: unidad });
    if (!unidadExistente) {
      throw new ErrorApp(`La unidad con placa ${unidad} no está registrada.`, 404);
    }
  }

  const conductor = await Conductor.findByIdAndUpdate(
    id,
    { telefono, licencia, unidad, fechaNacimiento, rutaAsignadaId },
    { new: true, runValidators: true }
  ).populate('user', '-passwordHash').populate('rutaAsignadaId');

  if (!conductor) {
    throw new ErrorApp('Ficha de conductor no encontrada.', 404);
  }

  res.status(200).json({
    status: 'exito',
    data: {
      conductor: {
        ...conductor.toObject(),
        edad: calcularEdad(conductor.fechaNacimiento)
      }
    }
  });
});

/**
 * Intención: Permite a un conductor ver su propio perfil y asignaciones.
 */
const obtenerMiPerfil = catchAsync(async (req, res, next) => {
  const userId = req.auth?.userId; // Corregido: usando userId del middleware

  const user = await Usuario.findById(userId).select('-passwordHash').lean();
  const conductor = await Conductor.findOne({ user: userId }).populate('rutaAsignadaId').lean();

  if (!user) throw new ErrorApp('Usuario no encontrado.', 404);

  res.status(200).json({
    status: 'exito',
    data: {
      user,
      conductor: conductor ? {
        ...conductor,
        edad: calcularEdad(conductor.fechaNacimiento)
      } : null
    }
  });
});

module.exports = {
  obtenerConductores,
  actualizarConductor,
  obtenerMiPerfil,
  crearConductor
};
