const Reporte = require('../models/Reporte');

/**
 * Crea un reporte enviado por un pasajero.
 * Requiere autenticación (req.auth viene del middleware JWT).
 */
exports.crearReporte = async (req, res) => {
  try {
    const { unidadId, rutaId, tipo, descripcion, calificacion, encontroAsiento } = req.body;

    const nuevoReporte = new Reporte({
      usuario: req.auth.userId,
      unidad: unidadId || null,
      ruta: rutaId || null,
      tipo,
      descripcion: descripcion || null,
      calificacion: calificacion || null,
      encontroAsiento: encontroAsiento ?? null
    });

    await nuevoReporte.save();

    res.status(201).json({
      mensaje: 'Reporte registrado correctamente',
      reporte: nuevoReporte
    });
  } catch (error) {
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
