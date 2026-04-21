const { Usuario, USER_ROLES } = require('../models/Usuario');
const Conductor = require('../models/Conductor');
const Unidad = require('../models/Unidad');
const Recorrido = require('../models/Recorrido');
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

  // Obtener conductores que tienen un viaje en curso actualmente
  const recorridosActivos = await Recorrido.find({ estado: 'en_curso' }).select('conductorId');
  const idsEnRuta = recorridosActivos.map(r => r.conductorId.toString());

  const dataMapeada = conductores.map(c => ({
    ...c,
    edad: calcularEdad(c.fechaNacimiento),
    username: c.user?.username || 'Sin nombre',
    email: c.user?.email || 'Sin email',
    enRuta: idsEnRuta.includes(c._id.toString())
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

  let unidadDocumento = null;
  // Solo buscar unidad si se proporcionó una placa no vacía
  if (unidad && unidad.trim() !== '') {
    unidadDocumento = await Unidad.findOne({ placa: unidad.trim().toUpperCase() });
    if (!unidadDocumento) {
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

  // Si se asignó una unidad, actualizar el documento de la unidad para que apunte a este usuario
  if (unidadDocumento) {
    // Primero desvincular al conductor anterior de esta unidad si existe
    await Unidad.findByIdAndUpdate(unidadDocumento._id, { conductor: user._id });
  }

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

  const conductorAnterior = await Conductor.findById(id);
  if (!conductorAnterior) {
    throw new ErrorApp('Ficha de conductor no encontrada.', 404);
  }

  // Si la unidad cambió, manejar la sincronización
  if (unidad !== undefined && unidad !== conductorAnterior.unidad) {
    // Si tenía una unidad anterior, quitar el conductor de esa unidad
    if (conductorAnterior.unidad && conductorAnterior.unidad.trim() !== '') {
      await Unidad.findOneAndUpdate(
        { placa: conductorAnterior.unidad },
        { $unset: { conductor: 1 } }
      );
    }

    // Si se asignó una nueva unidad (no vacía), vincular al conductor
    if (unidad && unidad.trim() !== '') {
      const nuevaUnidad = await Unidad.findOneAndUpdate(
        { placa: unidad.trim().toUpperCase() },
        { conductor: conductorAnterior.user }
      );
      if (!nuevaUnidad) {
        throw new ErrorApp(`La unidad con placa ${unidad} no está registrada.`, 404);
      }
    }
  }

  const conductor = await Conductor.findByIdAndUpdate(
    id,
    { telefono, licencia, unidad, fechaNacimiento, rutaAsignadaId },
    { new: true, runValidators: true }
  ).populate('user', '-passwordHash').populate('rutaAsignadaId');

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
  const userId = req.auth?.userId;

  const user = await Usuario.findById(userId).select('-passwordHash').lean();
  const conductor = await Conductor.findOne({ user: userId }).populate('rutaAsignadaId').lean();

  if (!user) throw new ErrorApp('Usuario no encontrado.', 404);

  // Buscar la unidad asignada a este usuario
  const unidad = await Unidad.findOne({ conductor: userId })
    .populate('dispositivoHardware')
    .lean();

  res.status(200).json({
    status: 'exito',
    data: {
      user,
      conductor: conductor ? {
        ...conductor,
        edad: calcularEdad(conductor.fechaNacimiento),
        unidadAsignada: unidad // Incluimos el objeto completo de la unidad
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
