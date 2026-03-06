const Ubicacion = require('../models/Ubicacion');

async function actualizarUbicacion(req, res) {
  try {
    const { conductorId, latitud, longitud, velocidad } = req.body;

    if (!conductorId || latitud == null || longitud == null) {
      return res.status(400).json({
        mensaje: 'conductorId, latitud y longitud son requeridos.'
      });
    }

    const ubicacion = await Ubicacion.create({
      conductorId,
      ubicacion: {
        latitud,
        longitud
      },
      velocidad
    });

    return res.status(201).json(ubicacion);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message || 'Error interno.' });
  }
}

module.exports = { actualizarUbicacion };
