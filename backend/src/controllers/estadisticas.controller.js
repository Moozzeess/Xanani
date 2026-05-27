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
        const query = {};
        if (req.auth && String(req.auth.role).toUpperCase() === 'ADMINISTRADOR' && req.auth.flotilla) {
            query.flotilla = req.auth.flotilla;
        }

        const rutas = await Ruta.find(query).lean();
        
        // Calcular afluencia media (Simulado por ahora pero basado en las rutas reales de la flota)
        const resumen = rutas.map(ruta => {
            // Lógica para determinar color basado en un valor aleatorio determinista por ahora
            const afluenciaNum = Math.floor(Math.random() * 100);
            let color = 'text-green-500';
            if (afluenciaNum > 70) color = 'text-red-500';
            else if (afluenciaNum > 40) color = 'text-yellow-500';

            return {
                nombre: ruta.nombre,
                afluenciaMedia: `${afluenciaNum}%`,
                color
            };
        });

        res.status(200).json(resumen);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener resumen informativo', error: error.message });
    }
}

/**
 * Obtiene las estadísticas consolidadas para el Dashboard del Administrador.
 * Realiza agregaciones reales sobre la base de datos.
 */
/**
 * Obtiene las estadísticas consolidadas para el Dashboard del Administrador.
 * Realiza agregaciones reales sobre la base de datos y calcula proyecciones de ganancias.
 * 
 * Intención: Proporcionar datos de resumen y series de tiempo para gráficos premium de afluencia y finanzas.
 * Parámetros: req (Request), res (Response)
 * Retorno: Objeto JSON con datos de resumen, gráficos (afluencia, distribución, ganancias próximas) y alertas recientes.
 * Reglas de negocio: Considera la flotilla asignada al administrador para filtrar datos reales de unidades, viajes e incidencias.
 */
exports.obtenerDashboardAdmin = async (req, res) => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Fecha de inicio de la semana actual (Lunes a las 00:00)
        const inicioSemana = new Date();
        const diaSemanaActual = inicioSemana.getDay();
        const diferenciaDias = inicioSemana.getDate() - diaSemanaActual + (diaSemanaActual === 0 ? -6 : 1);
        inicioSemana.setDate(diferenciaDias);
        inicioSemana.setHours(0, 0, 0, 0);

        // Fecha de hace 30 días para cálculos históricos reales
        const haceUnMes = new Date();
        haceUnMes.setDate(haceUnMes.getDate() - 30);
        haceUnMes.setHours(0, 0, 0, 0);

        const query = {};
        if (req.auth && String(req.auth.role).toUpperCase() === 'ADMINISTRADOR' && req.auth.flotilla) {
            query.flotilla = req.auth.flotilla;
        }

        // 1. Resumen de tarjetas y viajes
        const [totalUnidades, unidadesActivas, incidentesActivos, pasajerosHoy, viajesDetalles, viajesSemana, totalViajesHistoricos] = await Promise.all([
            Unidad.countDocuments(query),
            Unidad.countDocuments({ ...query, estado: { $in: ['activa', 'en_ruta'] } }),
            Incidencia.countDocuments({ ...query, estado: 'ACTIVO' }),
            HistorialViaje.countDocuments({ ...query, createdAt: { $gte: hoy } }),
            HistorialViaje.find({ ...query, createdAt: { $gte: hoy } }).populate('ruta', 'flotilla').lean(),
            HistorialViaje.find({ ...query, createdAt: { $gte: inicioSemana } }).populate('ruta', 'flotilla').lean(),
            HistorialViaje.countDocuments({ ...query, createdAt: { $gte: haceUnMes } })
        ]);

        // 1.1 Calcular ganancias reales de hoy basadas en los viajes reales
        let gananciasHoy = 0;
        viajesDetalles.forEach(viaje => {
            const tarifa = viaje.ruta?.flotilla === 'ESCOM' ? 10.00 : 12.00;
            gananciasHoy += tarifa;
        });

        // 2. Viajes Totales por Ruta (para Gráfico de Pastel)
        const viajesPorRuta = await HistorialViaje.aggregate([
            { $match: query },
            { $group: { _id: '$ruta', cantidad: { $sum: 1 } } }
        ]);

        // Obtener detalles del nombre de la ruta correspondientes
        const rutaIds = viajesPorRuta.map(v => v._id);
        const rutasDetalles = await Ruta.find({ _id: { $in: rutaIds } }).select('nombre').lean();
        const mapaRutas = {};
        rutasDetalles.forEach(r => {
            mapaRutas[r._id.toString()] = r.nombre;
        });

        const distribucionViajes = viajesPorRuta.map(v => ({
            ruta: mapaRutas[v._id.toString()] || 'Ruta Desconocida',
            cantidad: v.cantidad
        })).filter(item => item.cantidad > 0);

        // Si la distribución de viajes reales está vacía, incluir las rutas registradas con cantidad 0
        if (distribucionViajes.length === 0) {
            const rutasFlota = await Ruta.find(query).select('nombre').lean();
            rutasFlota.forEach(r => {
                distribucionViajes.push({
                    ruta: r.nombre,
                    cantidad: 0
                });
            });
        }

        // 3. Histograma de Afluencia Real por hora (Hoy)
        const afluenciaHoy = await HistorialViaje.aggregate([
            { $match: { ...query, createdAt: { $gte: hoy } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 3.1 Obtener la demanda/promedio histórico real por hora de los últimos 30 días
        const demandaHistoricaReal = await HistorialViaje.aggregate([
            { $match: { ...query, createdAt: { $gte: haceUnMes } } },
            {
                $group: {
                    _id: {
                        dia: { $dayOfMonth: '$createdAt' },
                        hora: { $hour: '$createdAt' }
                    },
                    cantidad: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.hora',
                    promedio: { $avg: '$cantidad' }
                }
            }
        ]);

        const horasDia = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
        
        // Mapear afluencia real de hoy
        const mapaAfluenciaReal = {};
        afluenciaHoy.forEach(item => {
            const hStr = `${String(item._id).padStart(2, '0')}:00`;
            mapaAfluenciaReal[hStr] = item.cantidad;
        });

        // Mapear demanda histórica real
        const mapaDemandaHistorica = {};
        demandaHistoricaReal.forEach(item => {
            const hStr = `${String(item._id).padStart(2, '0')}:00`;
            mapaDemandaHistorica[hStr] = Math.round(item.promedio * 10) / 10;
        });

        const afluenciaCompleta = horasDia.map(h => {
            const pasajeros = mapaAfluenciaReal[h] || 0;
            const demandaEsperada = mapaDemandaHistorica[h] || 0;
            return {
                hora: h,
                pasajeros,
                demandaEsperada
            };
        });

        // 4. Calcular Ganancias Reales de la Semana y Proyecciones no ficticias
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const diaActualIndex = (new Date().getDay() + 6) % 7; // Lunes=0, Domingo=6

        const tarifaPromedio = query.flotilla === 'ESCOM' ? 10.00 : 12.00;
        const promedioGananciaDiariaReal = totalViajesHistoricos > 0 ? (totalViajesHistoricos * tarifaPromedio) / 30 : 0;

        const gananciasPorDiaReal = Array(7).fill(0);
        viajesSemana.forEach(viaje => {
            const diaIndex = (new Date(viaje.createdAt).getDay() + 6) % 7;
            const tarifa = viaje.ruta?.flotilla === 'ESCOM' ? 10.00 : 12.00;
            gananciasPorDiaReal[diaIndex] += tarifa;
        });

        const gananciasSemana = diasSemana.map((dia, index) => {
            let real = 0;
            let proyectado = 0;

            if (index < diaActualIndex) {
                // Días pasados: Valor real exacto guardado
                real = gananciasPorDiaReal[index];
                proyectado = real;
            } else if (index === diaActualIndex) {
                // Hoy
                real = gananciasPorDiaReal[index];
                proyectado = Math.max(real, Math.round(promedioGananciaDiariaReal));
            } else {
                // Días futuros: Proyección próxima basada en el promedio histórico diario real
                proyectado = Math.round(promedioGananciaDiariaReal);
            }

            return {
                dia,
                real,
                proyectado
            };
        });

        // 5. Últimas 5 Alertas Críticas
        const alertasRecientes = await Incidencia.find({ ...query, estado: 'ACTIVO' })
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
                eficiencia: totalUnidades > 0 ? Math.round((unidadesActivas / totalUnidades) * 100) : 100,
                gananciasHoy
            },
            graficos: {
                afluencia: afluenciaCompleta,
                viajesPorRuta: distribucionViajes,
                gananciasProximas: gananciasSemana
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

                // Calcular horario y precio dinámicos
                const horarioRuta = (ruta.configuracionDespacho?.horario && ruta.configuracionDespacho.horario.length > 0)
                    ? ruta.configuracionDespacho.horario.join(', ')
                    : `06:00 - 22:00 (Cada ${ruta.configuracionDespacho?.intervaloMinutos || 15} min)`;
                const precioRuta = ruta.flotilla === 'ESCOM' ? 10.00 : 12.00;

                return {
                    rutaId: ruta._id,
                    nombre: ruta.nombre,
                    color: ruta.color || '#3b82f6',
                    horario: horarioRuta,
                    precio: precioRuta,
                    histograma
                };
            })
        );

        res.json(suscripciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener afluencia de suscripciones', error: error.message });
    }
};
