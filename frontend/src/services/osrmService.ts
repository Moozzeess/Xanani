/**
 * Obtiene una ruta entre múltiples puntos por vialidades reales usando OSRM.
 * Si el servicio no está disponible (CORS, timeout, error de red),
 * devuelve una línea recta entre los puntos como fallback silencioso.
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

  // OSRM espera formato: lng,lat;lng,lat...
  const coordenadasStr = puntos.map(p => `${p[1]},${p[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/${perfil}/${coordenadasStr}?overview=full&geometries=geojson`;

  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!respuesta.ok) throw new Error(`OSRM respondió con ${respuesta.status}`);

    const datos = await respuesta.json();

    if (datos.code === 'Ok' && datos.routes?.length > 0) {
      return datos.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
    }
  } catch (err) {
    // Fallback silencioso: CORS, timeout o servicio caído (común en OSRM público)
    console.debug(`OSRM (${perfil}) no disponible (externo), usando fallback directo.`, err);
  }

  // Si falla, retornamos los puntos originales (línea recta)
  return puntos;
};
