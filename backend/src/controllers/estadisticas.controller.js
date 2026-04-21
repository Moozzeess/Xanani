const HistorialViaje = require('../models/HistorialViaje');
const Ruta = require('../models/Ruta');
const Unidad = require('../models/Unidad');
const Incidencia = require('../models/Incidencia');
const { Usuario } = require('../models/Usuario');

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

/**
 * Obtiene las estadísticas consolidadas para el Dashboard del Administrador.
 * Realiza agregaciones reales sobre la base de datos.
 */
exports.obtenerDashboardAdmin = async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // 1. Resumen de tarjetas
        const [totalUnidades, unidadesActivas, incidentesActivos, pasajerosHoy] = await Promise.all([
            Unidad.countDocuments(),
            Unidad.countDocuments({ estado: { $in: ['activa', 'en_ruta'] } }),
            Incidencia.countDocuments({ estado: 'ACTIVO' }),
            HistorialViaje.countDocuments({ createdAt: { $gte: hoy } })
        ]);

        // 2. Distribución de Unidades por Estado
        const distribucionUnidades = await Unidad.aggregate([
            { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
            { $project: { estado: '$_id', cantidad: 1, _id: 0 } }
        ]);

        // 3. Histograma de Afluencia (Pasajeros por hora hoy)
        const afluenciaHoy = await HistorialViaje.aggregate([
            { $match: { createdAt: { $gte: hoy } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } },
            { $project: { hora: { $concat: [{ $toString: '$_id' }, ':00'] }, pasajeros: '$cantidad', _id: 0 } }
        ]);

        // 4. Incidentes por Tipo (Análisis de problemas)
        const incidentesPorTipo = await Incidencia.aggregate([
            { $group: { _id: '$tipo', cantidad: { $sum: 1 } } },
            { $project: { tipo: '$_id', cantidad: 1, _id: 0 } }
        ]);

        // 5. Últimas 5 Alertas Críticas
        const alertasRecientes = await Incidencia.find({ estado: 'ACTIVO' })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('unidad', 'placa')
            .lean();

        res.json({
            resumen: {
                totalUnidades,
                unidadesActivas,
                incidentesActivos,
                pasajerosHoy,
                eficiencia: 94.2 // Placeholder hasta implementar lógica de tiempos
            },
            graficos: {
                afluencia: afluenciaHoy,
                distribucionUnidades,
                incidentesPorTipo
            },
            alertasRecientes
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al generar dashboard', error: error.message });
    }
};

/**
 * Obtiene la afluencia para todas las rutas a las que el usuario está suscrito.
 */
exports.obtenerAfluenciaSuscripciones = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const usuario = await Usuario.findById(userId).populate('rutasFavoritas').lean();

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const suscripciones = await Promise.all(
            usuario.rutasFavoritas.map(async (ruta) => {
                // Generar histograma (Mock dinámico basado en la ruta para variedad)
                const seed = ruta.nombre.length;
                const histograma = Array.from({ length: 17 }, (_, i) => {
                    const hora = 6 + i;
                    const esPico = (hora >= 7 && hora <= 9) || (hora >= 18 && hora <= 20);
                    // Lógica determinista basada en la ruta para que no cambie en cada refresh
                    const baseOcupacion = esPico ? 70 : 20;
                    const variacion = (seed * hora) % 15;
                    return {
                        hora: `${hora.toString().padStart(2, '0')}:00`,
                        ocupacion: Math.min(100, baseOcupacion + variacion)
                    };
                });

                return {
                    rutaId: ruta._id,
                    nombre: ruta.nombre,
                    color: ruta.color || '#3b82f6',
                    histograma
                };
            })
        );

        res.json(suscripciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener afluencia de suscripciones', error: error.message });
    }
};
