const Parada = require('../models/Parada');

/**
 * Crear una parada
 */
exports.createStop = async (req, res) => {
  try {
    const nuevaParada = new Parada(req.body);

    const paradaGuardada = await nuevaParada.save();

    res.status(201).json({
      mensaje: 'Parada creada correctamente',
      parada: paradaGuardada
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al crear la parada',
      error: error.message
    });
  }
};


/**
 * Obtener todas las paradas
 */
exports.getStops = async (req, res) => {
  try {

    const paradas = await Parada.find().populate('ruta');

    res.json(paradas);

  } catch (error) {

    res.status(500).json({
      mensaje: 'Error al obtener las paradas',
      error: error.message
    });

  }
};


/**
 * Obtener paradas por ruta
 */
exports.getStopsByRoute = async (req, res) => {

  try {

    const paradas = await Parada.find({
      ruta: req.params.rutaId
    }).sort({ orden: 1 });

    res.json(paradas);

  } catch (error) {

    res.status(500).json({
      mensaje: 'Error al obtener las paradas de la ruta',
      error: error.message
    });

  }

};