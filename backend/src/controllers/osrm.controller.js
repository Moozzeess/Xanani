const catchAsync = require('../utils/catchAsync');
const osrmService = require('../services/osrm.service');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Intención: Controlador para manejar peticiones de rutas OSRM.
 * Función: Recibe coordenadas y perfil, y devuelve la ruta procesada por el servicio.
 */

/**
 * Obtiene una ruta entre múltiples puntos.
 * Espera req.body: { puntos: [[lat, lng], ...], perfil: 'driving'|'walking' }
 */
const obtenerRuta = catchAsync(async (req, res, next) => {
  const { puntos, perfil } = req.body;

  if (!puntos || !Array.isArray(puntos) || puntos.length < 2) {
    throw new ErrorApp('Datos inválidos: Se requiere un array de al menos 2 puntos [[lat, lng], ...].', 400);
  }

  try {
    const ruta = await osrmService.obtenerRutaOSRM(puntos, perfil);
    
    res.status(200).json({
      status: 'exito',
      data: ruta
    });
  } catch (error) {
    throw new ErrorApp(error.mensajeUsuario || 'Error al obtener la ruta de OSRM.', error.codigo || 500);
  }
});

module.exports = {
  obtenerRuta
};
