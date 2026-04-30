const Notificacion = require('../models/Notificacion');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Obtiene las notificaciones relevantes para el usuario actual según su rol.
 */
exports.obtenerMisNotificaciones = catchAsync(async (req, res, next) => {
  const { role, userId } = req.auth;

  // Buscar notificaciones dirigidas al rol del usuario, a TODOS, o directamente a su ID, 
  // que NO hayan sido leídas por este usuario
  const notificaciones = await Notificacion.find({
    $or: [
      { rolDestino: { $in: [role, 'TODOS'] } },
      { usuarioDestino: userId }
    ],
    leidaPor: { $ne: userId }
  }).sort({ createdAt: -1 }).limit(20);

  // Mapear para incluir un campo booleano 'leida'
  const data = notificaciones.map(n => {
    const doc = n.toObject();
    doc.leida = n.leidaPor.some(id => id.toString() === userId.toString());
    delete doc.leidaPor; // No enviar la lista completa de usuarios
    return doc;
  });

  res.status(200).json({
    status: 'exito',
    data
  });
});

/**
 * Marca una notificación como leída para el usuario actual.
 */
exports.marcarComoLeida = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.auth;

  const notificacion = await Notificacion.findById(id);
  if (!notificacion) {
    throw new ErrorApp('Notificación no encontrada', 404);
  }

  // Agregar al arreglo leidaPor si no está ya presente
  if (!notificacion.leidaPor.includes(userId)) {
    notificacion.leidaPor.push(userId);
    await notificacion.save();
  }

  res.status(200).json({
    status: 'exito',
    mensaje: 'Notificación marcada como leída'
  });
});

/**
 * Crear una notificación (Solo para uso interno o administrativo).
 */
exports.crearNotificacionInterna = async (datos) => {
  try {
    return await Notificacion.create(datos);
  } catch (error) {
    console.error('Error al crear notificación interna:', error);
    return null;
  }
};
