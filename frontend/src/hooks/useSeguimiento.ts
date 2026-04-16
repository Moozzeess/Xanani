import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = `http://${window.location.hostname}:4000/api`;

/**
 * Umbral de distancia en metros para inferir que el pasajero abordó la unidad.
 */
const UMBRAL_ABORDAJE_METROS = 50;

/**
 * Tiempo continuo en milisegundos dentro del umbral para confirmar el abordaje.
 */
const TIEMPO_ABORDAJE_MS = 30000;

/**
 * Calcula la distancia entre dos coordenadas usando Haversine.
 * @returns Distancia en metros.
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula el porcentaje de avance sobre una ruta dada una posición actual.
 * Busca el segmento más cercano ya superado.
 *
 * @param geometria - Array de puntos [lat, lng] de la ruta.
 * @param posActual - Posición actual [lat, lng].
 * @returns Porcentaje 0-100.
 */
function calcularProgreso(geometria: [number, number][], posActual: [number, number]): number {
  if (!geometria.length) return 0;

  let indiceMasCercano = 0;
  let distanciaMin = Infinity;

  geometria.forEach(([lat, lng], i) => {
    const d = haversine(posActual[0], posActual[1], lat, lng);
    if (d < distanciaMin) {
      distanciaMin = d;
      indiceMasCercano = i;
    }
  });

  return Math.round((indiceMasCercano / (geometria.length - 1)) * 100);
}

/**
 * Hook para gestionar el seguimiento activo de una unidad de transporte.
 *
 * - Monitorea continuamente la posición del usuario con watchPosition.
 * - Si el usuario está a menos de 50m de la unidad durante más de 30s,
 *   activa `abordajeDetectado` automáticamente.
 * - Calcula el progreso de la unidad sobre la ruta.
 */
export function useSeguimiento() {
  const [unidadSeguida, setUnidadSeguida] = useState<any | null>(null);
  const [progresoRuta, setProgresoRuta] = useState(0);
  const [abordajeDetectado, setAbordajeDetectado] = useState(false);
  const [enMovimiento, setEnMovimiento] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const timerAbordajeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geometriaRef = useRef<[number, number][]>([]);
  const posicionUnidadRef = useRef<[number, number] | null>(null);

  /**
   * Carga la geometría de la ruta asociada a la unidad.
   */
  const cargarGeometria = useCallback(async (rutaId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/routes/${rutaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const ruta = await res.json();
      geometriaRef.current = (ruta.geometria || []).map((p: any) => [p.latitud, p.longitud]);
    } catch (e) {
      console.error('Error al cargar geometría de ruta:', e);
    }
  }, []);

  /**
   * Inicia el seguimiento de una unidad.
   * @param vehiculo - Objeto de la unidad a seguir (debe incluir posicion y ruta).
   */
  const seguir = useCallback(
    (vehiculo: any) => {
      setUnidadSeguida(vehiculo);
      setAbordajeDetectado(false);
      setProgresoRuta(0);

      // Cargar geometría si hay ruta
      const rutaId = vehiculo.ruta?._id || vehiculo.ruta;
      if (rutaId) cargarGeometria(rutaId);

      // Monitorear posición del usuario
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const usuarioPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            const unidadPos = posicionUnidadRef.current;

            if (!unidadPos) return;

            const distancia = haversine(usuarioPos[0], usuarioPos[1], unidadPos[0], unidadPos[1]);
            const cercano = distancia < UMBRAL_ABORDAJE_METROS;

            // Gestionar el temporizador de abordaje
            if (cercano && !timerAbordajeRef.current) {
              timerAbordajeRef.current = setTimeout(() => {
                setAbordajeDetectado(true);
              }, TIEMPO_ABORDAJE_MS);
            } else if (!cercano && timerAbordajeRef.current) {
              clearTimeout(timerAbordajeRef.current);
              timerAbordajeRef.current = null;
            }

            // Calcular progreso sobre la ruta
            if (geometriaRef.current.length > 0) {
              setProgresoRuta(calcularProgreso(geometriaRef.current, unidadPos));
            }
          },
          null,
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      }
    },
    [cargarGeometria]
  );

  /**
   * Actualiza la posición conocida de la unidad seguida.
   * Debe llamarse externamente cuando llegan datos de socket.
   */
  const actualizarPosicionUnidad = useCallback((pos: [number, number], velocidad?: number) => {
    posicionUnidadRef.current = pos;
    setEnMovimiento((velocidad ?? 0) > 2);
  }, []);

  /**
   * Detiene el seguimiento y limpia todos los efectos secundarios.
   */
  const detener = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerAbordajeRef.current) {
      clearTimeout(timerAbordajeRef.current);
      timerAbordajeRef.current = null;
    }
    setUnidadSeguida(null);
    setProgresoRuta(0);
    setAbordajeDetectado(false);
    setEnMovimiento(false);
    geometriaRef.current = [];
    posicionUnidadRef.current = null;
  }, []);

  // Limpiar al desmontar el componente que use este hook
  useEffect(() => {
    return () => detener();
  }, [detener]);

  return {
    unidadSeguida,
    progresoRuta,
    abordajeDetectado,
    enMovimiento,
    seguir,
    detener,
    actualizarPosicionUnidad,
    resetearAbordaje: () => setAbordajeDetectado(false)
  };
}
