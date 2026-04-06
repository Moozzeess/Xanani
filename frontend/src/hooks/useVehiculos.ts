import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = `http://${window.location.hostname}:4000`;
const API_URL = `http://${window.location.hostname}:4000/api`;

/**
 * Niveles de ocupación calculados a partir del porcentaje de llenado.
 */
export type NivelOcupacion = 'Alta' | 'Media' | 'Baja';

/**
 * Tendencia de ocupación comparada con la lectura anterior.
 */
export type TendenciaOcupacion = 'subiendo' | 'bajando' | 'estable';

/** Vehículo enriquecido con datos calculados en el cliente */
export interface Vehiculo {
  _id: string;
  placa: string;
  estado: string;
  ocupacionActual: number;
  capacidadMaxima: number;
  conductor: any;
  ruta: any;
  dispositivoHardware?: any;
  /** Posición [lat, lng] proveniente del socket o de la base de datos */
  posicion?: [number, number];
  /** Distancia al usuario en metros */
  distancia?: number;
  /** ETA estimado en minutos */
  eta?: number;
  /** Porcentaje de ocupación 0-100 */
  pctOcupacion: number;
  nivelOcupacion: NivelOcupacion;
  tendencia: TendenciaOcupacion;
  velocidad?: number;
  /** Ángulo de dirección en grados (0=Norte, 90=Este, etc.) */
  direccion?: number;
}

export interface FiltrosVehiculo {
  estado?: string[];
  ocupacion?: NivelOcupacion[];
}

/**
 * Calcula la distancia entre dos coordenadas usando la fórmula de Haversine.
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
 * Hook para obtener y enriquecer las unidades de transporte en tiempo real.
 *
 * - Consulta `GET /api/units` cada 15 segundos.
 * - Escucha el evento Socket.IO `datos_esp32` para actualizar posiciones.
 * - Calcula distancia al usuario, ETA, ocupación y tendencia en el cliente.
 */
export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sinUnidades, setSinUnidades] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosVehiculo>({});
  const [posicionUsuario, setPosicionUsuario] = useState<[number, number] | null>(null);

  // Almacena las últimas posiciones recibidas por socket, indexadas por unidadId o hwId
  const posicionesRef = useRef<Record<string, { lat: number; lng: number; velocidad?: number; direccion?: number }>>({});
  // Almacena la ocupación anterior para calcular tendencia
  const ocupacionPreviaRef = useRef<Record<string, number>>({});

  // Obtener posición del usuario una sola vez al montar
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosicionUsuario([pos.coords.latitude, pos.coords.longitude]),
      () => setPosicionUsuario([19.4326, -99.1332]) // CDMX como fallback
    );
  }, []);

  /**
   * Obtiene las unidades de la API y las enriquece con datos calculados.
   */
  const cargarUnidades = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/units`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const datos: any[] = await res.json();

      const enriquecidas: Vehiculo[] = datos
        .filter((u) => u.estado !== 'inactiva')
        .map((u) => {
          // Busca posición desde socket por ID de unidad o dispositivo hardware
          const hwId = u.dispositivoHardware?._id?.toString() || u.dispositivoHardware?.toString();
          const posSocket =
            posicionesRef.current[u._id] ||
            (hwId ? posicionesRef.current[hwId] : undefined);

          const posicion: [number, number] | undefined = posSocket
            ? [posSocket.lat, posSocket.lng]
            : undefined;

          const pctOcupacion =
            u.capacidadMaxima > 0
              ? Math.min(100, Math.round((u.ocupacionActual / u.capacidadMaxima) * 100))
              : 0;

          const nivelOcupacion: NivelOcupacion =
            pctOcupacion >= 80 ? 'Alta' : pctOcupacion >= 40 ? 'Media' : 'Baja';

          const prevPct = ocupacionPreviaRef.current[u._id];
          const tendencia: TendenciaOcupacion =
            prevPct === undefined
              ? 'estable'
              : pctOcupacion > prevPct
              ? 'subiendo'
              : pctOcupacion < prevPct
              ? 'bajando'
              : 'estable';

          ocupacionPreviaRef.current[u._id] = pctOcupacion;

          let distancia: number | undefined;
          let eta: number | undefined;

          if (posicion && posicionUsuario) {
            distancia = haversine(posicionUsuario[0], posicionUsuario[1], posicion[0], posicion[1]);
            const velKmh = posSocket?.velocidad || 20;
            eta = Math.round((distancia / 1000 / velKmh) * 60);
          }

          return {
            ...u,
            posicion,
            distancia,
            eta,
            pctOcupacion,
            nivelOcupacion,
            tendencia,
            velocidad: posSocket?.velocidad,
            direccion: posSocket?.direccion
          };
        });

      setVehiculos(enriquecidas);
      setSinUnidades(enriquecidas.length === 0);
      setCargando(false);
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      setCargando(false);
      setSinUnidades(true);
    }
  }, [posicionUsuario]);

  // Polling cada 15 segundos
  useEffect(() => {
    cargarUnidades();
    const intervalo = setInterval(cargarUnidades, 15000);
    return () => clearInterval(intervalo);
  }, [cargarUnidades]);

  // Escucha de socket para actualizaciones de posición en tiempo real
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('datos_esp32', (evento: { tema: string; payload: any; fecha: string }) => {
      const d = evento.payload;
      if (!d) return;

      // El ESP32 puede enviar lat/lng directamente o anidado en ubicacion{}
      const lat = d.lat ?? d.latitud ?? d.ubicacion?.lat ?? d.ubicacion?.latitud;
      const lng = d.lng ?? d.longitud ?? d.ubicacion?.lng ?? d.ubicacion?.longitud;

      if (lat == null || lng == null) return;

      // Indexar por unidadId del payload, o por el ID del dispositivo
      const clave: string = d.unidadId || d.unitId || d.deviceId || d.mac || evento.tema;

      posicionesRef.current[clave] = {
        lat,
        lng,
        velocidad: d.velocidad ?? d.speed,
        direccion: d.direccion ?? d.heading
      };

      // Actualizar lista sin esperar el polling
      cargarUnidades();
    });

    return () => { socket.close(); };
  }, [cargarUnidades]);

  // Aplicar filtros locales
  const vehiculosFiltrados = vehiculos.filter((v) => {
    if (filtros.estado?.length && !filtros.estado.includes(v.estado)) return false;
    if (filtros.ocupacion?.length && !filtros.ocupacion.includes(v.nivelOcupacion)) return false;
    return true;
  });

  return {
    vehiculos: vehiculosFiltrados,
    todos: vehiculos,
    cargando,
    sinUnidades,
    filtros,
    setFiltros,
    recargar: cargarUnidades
  };
}
