import api from './api';

/**
 * Obtiene una ruta entre múltiples puntos por vialidades reales usando el proxy del backend (que consulta OSRM).
 * Si el servicio no está disponible, devuelve una línea recta entre los puntos como fallback silencioso.
 *
 * @param puntos - Array de coordenadas [lat, lng].
 * @param perfil - Perfil de ruta ('driving' o 'walking'). Por defecto 'driving'.
 * @returns Array de coordenadas [lat, lng] que forman la polilínea.
 */
export const obtenerRutaPorCalles = async (
  puntos: [number, number][],
  perfil: 'driving' | 'walking' = 'driving'
): Promise<[number, number][]> => {
  if (!puntos || puntos.length < 2) return puntos;

  try {
    const respuesta = await api.post('/osrm/ruta', {
      puntos,
      perfil
    });

    if (respuesta.data.status === 'exito' && respuesta.data.data.routes?.length > 0) {
      return respuesta.data.data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
    }
  } catch (err) {
    // Fallback silencioso: El backend reportará el error si el servicio externo falla
    console.debug(`Servicio de rutas no disponible, usando fallback directo.`, err);
  }

  // Si falla, retornamos los puntos originales (línea recta)
  return puntos;
};
