const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Obtiene las notificaciones relevantes para el usuario actual.
 * NOTA: Con la nueva política de no persistencia, este método devuelve una lista vacía.
 * Las notificaciones ahora se entregan exclusivamente en tiempo real vía WebSockets.
 */
exports.obtenerMisNotificaciones = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'exito',
    data: []
  });
});

/**
 * Marca una notificación como leída.
 * NOTA: Con la nueva política de no persistencia, este método es un no-op.
 */
exports.marcarComoLeida = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'exito',
    mensaje: 'Notificación procesada (volátil)'
  });
});

/**
 * Envía una notificación en tiempo real sin guardarla en la base de datos.
 * Esto evita la saturación de datos innecesarios.
 * 
 * @param {Object} datos - { titulo, mensaje, tipo, rolDestino, usuarioDestino, flotilla, data }
 */
exports.crearNotificacionInterna = async (datos) => {
  try {
    const { emitirEvento } = require('../services/socketService');
    
    // Determinar destinatario
    let sala = null;
    if (datos.usuarioDestino) {
      // Notificación privada a un usuario
      emitirEvento('notificacion_sistema', datos, null, datos.usuarioDestino);
    } else if (datos.flotilla) {
      // Notificación segmentada por flota
      sala = `fleet_${datos.flotilla}`;
      emitirEvento('notificacion_sistema', datos, null, null, sala);
    } else if (datos.rolDestino === 'TODOS') {
      // Notificación global
      emitirEvento('notificacion_sistema', datos);
    } else if (datos.rolDestino) {
      // Notificación por rol (aquí se podría mejorar segmentando salas por rol, 
      // por ahora se emite global y el front filtra o se asume broadcast controlado)
      emitirEvento('notificacion_sistema', datos);
    }

    return { status: 'enviada', timestamp: new Date() };
  } catch (error) {
    console.error('Error al emitir notificación volátil:', error);
    return null;
  }
};
