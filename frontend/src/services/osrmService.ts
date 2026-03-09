/**
 * Servicio de ruteo común utilizando la API pública de OSRM.
 * Permite obtener trayectorias que siguen las calles para navegación.
 */

export interface PuntoRuta {
    lat: number;
    lng: number;
}

/**
 * Obtiene una ruta entre dos puntos siguiendo las vialidades reales.
 * @param inicio Coordenadas de inicio [lat, lng]
 * @param fin Coordenadas de destino [lat, lng]
 * @returns Promesa con un arreglo de coordenadas [lat, lng] que forman la ruta
 */
export const obtenerRutaPorCalles = async (
    inicio: [number, number],
    fin: [number, number]
): Promise<[number, number][]> => {
    try {
        // OSRM espera el formato [longitude, latitude]
        const url = `https://router.project-osrm.org/route/v1/driving/${inicio[1]},${inicio[0]};${fin[1]},${fin[0]}?overview=full&geometries=geojson`;

        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            throw new Error(`Error en la solicitud OSRM: ${respuesta.statusText}`);
        }

        const datos = await respuesta.json();

        if (datos.routes && datos.routes.length > 0) {
            // Invertir coordenadas de [lng, lat] a [lat, lng] para Leaflet
            return datos.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        }

        // Fallback a línea recta si no se encuentra ruta
        console.warn("No se encontró una ruta válida en OSRM, usando línea recta.");
        return [inicio, fin];
    } catch (error) {
        console.error("Error al obtener ruta de OSRM:", error);
        // Fallback absoluto a línea recta
        return [inicio, fin];
    }
};
