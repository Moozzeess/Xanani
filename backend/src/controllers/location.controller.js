const Ubicacion = require('../models/Ubicacion');
const Unidad = require('../models/Unidad');

/**
 * Registrar ubicación de una unidad
 */
exports.registerLocation = async (req, res) => {

  try {

    const nuevaUbicacion = new Ubicacion({
      unidadId: req.body.unidadId,
      conductorId: req.body.conductorId,
      rutaId: req.body.rutaId,
      recorridoId: req.body.recorridoId,

      ubicacion: {
        latitud: req.body.ubicacion.latitud,
        longitud: req.body.ubicacion.longitud
      },

      velocidad: req.body.velocidad,
      direccion: req.body.direccion,
      precisionGps: req.body.precisionGps
    });

    await nuevaUbicacion.save();

    res.status(201).json({
      mensaje: "Ubicación registrada",
      ubicacion: nuevaUbicacion
    });

  } catch (error) {

    res.status(500).json({
      mensaje: "Error al registrar ubicación",
      error: error.message
    });

  }

};