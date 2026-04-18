const Ruta = require('../models/Ruta');
const { emitirEvento } = require('./socketService');

/**
 * Servicio de Simulación de Unidades en Backend.
 * Genera movimientos de unidades virtuales sobre rutas reales (geometria).
 */

let intervaloSimulacion = null;
const unidadesSimuladas = [];

/**
 * Inicia la simulación para pasajeros/landing.
 * Busca rutas existentes y genera unidades moviéndose en ellas.
 */
const iniciarSimulacionPasajeros = async () => {
  if (intervaloSimulacion) return; // Ya está corriendo

  try {
    const rutas = await Ruta.find().lean();
    if (rutas.length === 0) {
      console.log('No hay rutas en la BD para simular.');
      return;
    }

    // Inicializar unidades simuladas si no hay
    if (unidadesSimuladas.length === 0) {
      rutas.forEach((ruta, index) => {
        // Buscamos geometría (estandarizado)
        const puntosTrazado = ruta.geometria || ruta.puntos || [];

        if (puntosTrazado.length > 0) {
          unidadesSimuladas.push({
            id: `SIM-${index + 1}`,
            placa: `SIM-00${index + 1}`,
            rutaId: ruta._id,
            rutaNombre: ruta.nombre,
            geometria: puntosTrazado,
            currentIndex: 0,
            capacidadMaxima: ruta.configuracionDespacho?.capacidadMaxima || 15,
            ocupacionActual: Math.floor(Math.random() * (ruta.configuracionDespacho?.capacidadMaxima || 5)),
            isSimulated: true,
            estado: 'en_ruta'
          });
        }
      });
    }

    if (unidadesSimuladas.length === 0) {
      console.warn('Ninguna ruta tiene geometría válida para simular.');
      return;
    }

    intervaloSimulacion = setInterval(() => {
      unidadesSimuladas.forEach(unidad => {
        // Avanzar índice circular
        unidad.currentIndex = (unidad.currentIndex + 1) % unidad.geometria.length;
        const puntoActual = unidad.geometria[unidad.currentIndex];

        // Simular cambio de ocupación ocasional
        if (Math.random() > 0.85) {
          const cambio = Math.random() > 0.5 ? 1 : -1;
          unidad.ocupacionActual = Math.max(0, Math.min(unidad.capacidadMaxima, unidad.ocupacionActual + cambio));
        }

        // Emitir ubicación al canal de sockets
        // Formato [lat, lng] compatible con la Leaflet y la lógica del Pasajero
        emitirEvento('ubicacion_simulada', {
          id: unidad.id,
          placa: unidad.placa,
          pos: [puntoActual.latitud, puntoActual.longitud],
          ocupacionActual: unidad.ocupacionActual,
          capacidadMaxima: unidad.capacidadMaxima,
          isSimulated: true,
          rutaId: unidad.rutaId,
          rutaNombre: unidad.rutaNombre,
          estado: unidad.estado
        });
      });
    }, 3000); // Frecuencia de actualización

  } catch (error) {
    console.error('Error al iniciar simulación:', error);
  }
};

/**
 * Detiene la simulacion.
 */
const detenerSimulacion = () => {
  if (intervaloSimulacion) {
    clearInterval(intervaloSimulacion);
    intervaloSimulacion = null;
  }
};

module.exports = {
  iniciarSimulacionPasajeros,
  detenerSimulacion
};
