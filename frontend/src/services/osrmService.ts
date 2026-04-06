/**
 * Obtiene una ruta entre dos puntos por vialidades reales usando OSRM.
 * Si el servicio no está disponible (CORS, timeout, error de red),
 * devuelve una línea recta como fallback silencioso.
 *
 * @param inicio - Coordenadas de inicio [lat, lng].
 * @param fin    - Coordenadas de destino [lat, lng].
 * @returns Array de coordenadas [lat, lng] que forman la polilínea.
 */
export const obtenerRutaPorCalles = async (
  inicio: [number, number],
  fin: [number, number]
): Promise<[number, number][]> => {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${inicio[1]},${inicio[0]};${fin[1]},${fin[0]}?overview=full&geometries=geojson`;

  try {
    // fetch nativo evita pasar por el interceptor axios (que agrega headers que generan CORS en APIs externas)
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!respuesta.ok) throw new Error(`OSRM respondió con ${respuesta.status}`);

    const datos = await respuesta.json();

    if (datos.routes?.length > 0) {
      return datos.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
    }
  } catch {
    // Fallback silencioso: CORS, timeout o servicio caído → línea recta
  }

  return [inicio, fin];
};
