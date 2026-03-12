import api from './api';

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
        const url = `https://router.project-osrm.org/route/v1/driving/${inicio[1]},${inicio[0]};${fin[1]},${fin[0]}?overview=full&geometries=geojson`;

        // Usamos la instancia api para tener el interceptor
        // Marcamos con mostrarAlertaGlobal: true (por defecto ya es true en el interceptor)
        const { data: datos } = await api.get(url);

        if (datos.routes && datos.routes.length > 0) {
            return datos.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        }

        return [inicio, fin];
    } catch (error) {
        // En este caso específico, el fallback a línea recta es mejor que bloquear al usuario
        // pero el interceptor ya habrá mostrado el modal de advertencia/error.
        return [inicio, fin];
    }
};
