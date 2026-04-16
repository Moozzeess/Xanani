const HistorialViaje = require('../models/HistorialViaje');
const Ruta = require('../models/Ruta');

/**
 * Controlador de Estadísticas y Afluencia.
 * Proporciona datos analíticos para histogramas y gráficos de uso.
 */

/**
 * Obtiene la afluencia (ocupación promedio) por hora para una ruta específica.
 * Actualmente devuelve datos Mock optimizados para el diseño del frontend.
 */
exports.obtenerAfluenciaPorRuta = async (req, res) => {
  try {
    const { rutaId } = req.params;

    // TODO: En el futuro, realizar agregación real sobre HistorialViaje
    // const estadisticas = await HistorialViaje.aggregate([...]);
    
    // Mock Data: 24 horas del día con niveles de ocupación
    const datosMock = [
      { hora: '06:00', ocupacion: 20 },
      { hora: '07:00', ocupacion: 85 }, // Hora pico
      { hora: '08:00', ocupacion: 95 }, // Hora pico
      { hora: '09:00', ocupacion: 60 },
      { hora: '10:00', ocupacion: 40 },
      { hora: '11:00', ocupacion: 35 },
      { hora: '12:00', ocupacion: 45 },
      { hora: '13:00', ocupacion: 70 },
      { hora: '14:00', ocupacion: 90 }, // Hora pico escolar/comida
      { hora: '15:00', ocupacion: 80 },
      { hora: '16:00', ocupacion: 50 },
      { hora: '17:00', ocupacion: 65 },
      { hora: '18:00', ocupacion: 95 }, // Hora pico salida trabajo
      { hora: '19:00', ocupacion: 85 },
      { hora: '20:00', ocupacion: 40 },
      { hora: '21:00', ocupacion: 20 },
      { hora: '22:00', ocupacion: 10 }
    ];

    res.status(200).json({
      rutaId,
      nombreRuta: 'Ruta Ejemplo',
      histograma: datosMock
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
  }
};

/**
 * Obtiene un resumen general de afluencia de todas las rutas (para Admin).
 */
exports.obtenerResumenGeneral = async (req, res) => {
    try {
        const resumen = [
            { nombre: 'Ruta Centro', afluenciaMedia: '75%', color: 'text-red-500' },
            { nombre: 'Ruta Hospitales', afluenciaMedia: '40%', color: 'text-yellow-500' },
            { nombre: 'Ruta Sur', afluenciaMedia: '15%', color: 'text-green-500' }
        ];
        res.status(200).json(resumen);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener resumen informativo', error: error.message });
    }
}
