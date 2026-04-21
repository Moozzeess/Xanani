const Reporte = require('../models/Reporte');
const Notificacion = require('../models/Notificacion');
const socketService = require('../services/socketService');

/**
 * Crea un reporte enviado por un pasajero.
 * Requiere autenticación (req.auth viene del middleware JWT).
 */
exports.crearReporte = async (req, res) => {
  try {
    console.log("Cuerpo del reporte recibido:", req.body);
    const { unidadId, rutaId, tipo, descripcion, calificacion, encontroAsiento, destinatario, estado } = req.body;

    const nuevoReporte = new Reporte({
      usuario: req.auth.userId,
      unidad: unidadId || null,
      ruta: rutaId || null,
      tipo,
      descripcion: descripcion || null,
      calificacion: calificacion || null,
      encontroAsiento: encontroAsiento ?? null,
      destinatario: destinatario || null,
      estado: estado || 'PENDIENTE'
    });

    await nuevoReporte.save();

    // Si es un ANUNCIO, crear también una Notificación persistente para los destinatarios
    if (tipo === 'ANUNCIO' && descripcion) {
      try {
        await Notificacion.create({
          titulo: 'Aviso del Administrador',
          mensaje: descripcion,
          tipo: 'SISTEMA',
          rolDestino: destinatario === 'TODOS' ? 'TODOS' : (destinatario === 'CONDUCTORES' ? 'CONDUCTOR' : 'PASAJERO')
        });
      } catch (notifError) {
        console.error("Error al crear la notificación persistente:", notifError);
        // No bloqueamos el flujo principal si falla la notificación persistente
      }
    }

    // Poblar para enviar datos completos por socket
    const reportePoblado = await Reporte.findById(nuevoReporte._id)
      .populate('usuario', 'username email')
      .populate('unidad', 'placa')
      .populate('ruta', 'nombre');

    // Emitir evento para el panel de administración
    socketService.emitirEvento('nuevo_reporte_pasajero', reportePoblado);

    res.status(201).json({
      mensaje: 'Reporte registrado correctamente',
      reporte: reportePoblado
    });
  } catch (error) {
    console.error("Error en crearReporte:", error);
    const esTipoInvalido = error.name === 'ValidationError';
    res.status(esTipoInvalido ? 400 : 500).json({
      mensaje: esTipoInvalido
        ? 'Tipo de reporte no válido'
        : 'Error al registrar el reporte',
      error: error.message
    });
  }
};

/**
 * Obtiene todos los reportes (uso administrativo).
 * Requiere autenticación.
 */
exports.obtenerReportes = async (req, res) => {
  try {
    const reportes = await Reporte.find()
      .populate('usuario', 'username email')
      .populate('unidad', 'placa')
      .populate('ruta', 'nombre')
      .sort({ createdAt: -1 });

    res.json(reportes);
  } catch (error) {
    console.error("Error en obtenerReportes:", error);
    res.status(500).json({
      mensaje: 'Error al obtener los reportes',
      error: error.message
    });
  }
};

/**
 * Obtiene los reportes enviados por el usuario autenticado.
 */
exports.misReportes = async (req, res) => {
  try {
    const reportes = await Reporte.find({ usuario: req.auth.userId })
      .populate('unidad', 'placa')
      .populate('ruta', 'nombre')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(reportes);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener tus reportes',
      error: error.message
    });
  }
};

/**
 * Actualiza el estado de un reporte (uso administrativo).
 * @param {string} req.params.id - ID del reporte.
 * @param {string} req.body.estado - Nuevo estado ('REVISADO', 'RESUELTO').
 */
exports.actualizarEstadoReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado permitido
    const estadosPermitidos = ['PENDIENTE', 'REVISADO', 'RESUELTO'];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado no válido'
      });
    }

    const reporteActualizado = await Reporte.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    ).populate('usuario', 'username email')
     .populate('unidad', 'placa')
     .populate('ruta', 'nombre');

    if (!reporteActualizado) {
      return res.status(404).json({
        mensaje: 'Reporte no encontrado'
      });
    }

    res.json({
      mensaje: 'Estado del reporte actualizado correctamente',
      reporte: reporteActualizado
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar el estado del reporte',
      error: error.message
    });
  }
};

/**
 * Elimina un reporte de la base de datos (uso administrativo).
 * @param {string} req.params.id - ID del reporte.
 */
exports.eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const reporteEliminado = await Reporte.findByIdAndDelete(id);

    if (!reporteEliminado) {
      return res.status(404).json({
        mensaje: 'Reporte no encontrado'
      });
    }

    res.json({
      mensaje: 'Reporte eliminado correctamente'
    });
  } catch (error) {
    console.error("Error en eliminarReporte:", error);
    res.status(500).json({
      mensaje: 'Error al eliminar el reporte',
      error: error.message
    });
  }
};
