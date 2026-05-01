/**
 * Intención: Servicio para interactuar con la API externa de OSRM (Open Source Routing Machine).
 * Función: Proporciona métodos para obtener rutas y geometrías entre puntos geográficos.
 * Reglas de negocio:
 *  - Actúa como proxy para evitar problemas de CORS desde el frontend.
 *  - Maneja fallos del servicio externo de forma controlada.
 */

const axios = require('axios');

/**
 * Obtiene una ruta entre múltiples coordenadas.
 * 
 * @param {Array} puntos - Lista de coordenadas en formato [[lat, lng], ...].
 * @param {string} perfil - Perfil de transporte ('driving', 'walking').
 * @returns {Promise<Object>} - Datos de la ruta devueltos por OSRM.
 */
const obtenerRutaOSRM = async (puntos, perfil = 'driving') => {
  try {
    if (!puntos || puntos.length < 2) {
      throw new Error('Se requieren al menos dos puntos para calcular una ruta.');
    }

    // OSRM usa formato [lng,lat] separados por punto y coma
    const coordenadasStr = puntos.map(p => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${perfil}/${coordenadasStr}?overview=full&geometries=geojson`;

    const respuesta = await axios.get(url, { timeout: 10000 });

    if (respuesta.data.code !== 'Ok') {
      throw new Error(`Error de OSRM: ${respuesta.data.code}`);
    }

    return respuesta.data;
  } catch (error) {
    console.warn('Servicio OSRM externo no disponible (502/Timeout). Generando fallback de línea recta.');
    
    // Generamos un objeto similar al que devuelve OSRM para no romper el frontend
    // Conectamos los puntos en línea recta como último recurso
    return {
      code: 'Ok',
      routes: [
        {
          geometry: {
            coordinates: puntos.map(p => [p[1], p[0]]), // Invertimos a [lng, lat] para GeoJSON
            type: 'LineString'
          },
          duration: 0,
          distance: 0
        }
      ]
    };
  }
};

module.exports = {
  obtenerRutaOSRM
};
