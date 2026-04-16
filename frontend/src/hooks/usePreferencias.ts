import { useState, useCallback } from 'react';

const CLAVE_RUTAS = 'xanani_rutas_favoritas';
const CLAVE_PARADAS = 'xanani_paradas_favoritas';
const CLAVE_HISTORIAL = 'xanani_historial_viajes';
const CLAVE_ZONA = 'xanani_zona_interes';
const MAX_HISTORIAL = 10;

export interface RutaFavorita {
  id: string;
  nombre: string;
}

export interface ParadaFavorita {
  nombre: string;
  latitud: number;
  longitud: number;
}

export interface RegistroViaje {
  fecha: string;
  placa: string;
  ruta?: string;
  calificacion?: number;
}

/**
 * Lee un valor del localStorage y lo parsea como JSON.
 * Devuelve el valor por defecto si no existe o falla el parseo.
 */
function leerStorage<T>(clave: string, porDefecto: T): T {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : porDefecto;
  } catch {
    return porDefecto;
  }
}

/**
 * Hook para gestionar las preferencias persistentes del pasajero.
 * Almacena rutas favoritas, paradas guardadas, historial de viajes
 * y zona de interés en localStorage.
 */
export function usePreferencias() {
  const [rutasFavoritas, setRutasFavoritasState] = useState<RutaFavorita[]>(() =>
    leerStorage<RutaFavorita[]>(CLAVE_RUTAS, [])
  );

  const [paradasFavoritas, setParadasFavoritasState] = useState<ParadaFavorita[]>(() =>
    leerStorage<ParadaFavorita[]>(CLAVE_PARADAS, [])
  );

  const [historial, setHistorialState] = useState<RegistroViaje[]>(() =>
    leerStorage<RegistroViaje[]>(CLAVE_HISTORIAL, [])
  );

  const [zonaInteres, setZonaInteresState] = useState<string>(() =>
    leerStorage<string>(CLAVE_ZONA, '')
  );

  /** Guarda o elimina una ruta de favoritos. */
  const toggleRutaFavorita = useCallback((ruta: RutaFavorita) => {
    setRutasFavoritasState((prev) => {
      const existe = prev.some((r) => r.id === ruta.id);
      const nueva = existe ? prev.filter((r) => r.id !== ruta.id) : [...prev, ruta];
      localStorage.setItem(CLAVE_RUTAS, JSON.stringify(nueva));
      return nueva;
    });
  }, []);

  /** Guarda o elimina una parada de favoritos. */
  const toggleParadaFavorita = useCallback((parada: ParadaFavorita) => {
    setParadasFavoritasState((prev) => {
      const existe = prev.some((p) => p.nombre === parada.nombre);
      const nueva = existe ? prev.filter((p) => p.nombre !== parada.nombre) : [...prev, parada];
      localStorage.setItem(CLAVE_PARADAS, JSON.stringify(nueva));
      return nueva;
    });
  }, []);

  /** Agrega un viaje completado al historial (máximo 10 registros). */
  const agregarViaje = useCallback((viaje: RegistroViaje) => {
    setHistorialState((prev) => {
      const nuevo = [viaje, ...prev].slice(0, MAX_HISTORIAL);
      localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(nuevo));
      return nuevo;
    });
  }, []);

  /** Elimina todo el historial de viajes. */
  const limpiarHistorial = useCallback(() => {
    localStorage.removeItem(CLAVE_HISTORIAL);
    setHistorialState([]);
  }, []);

  /** Actualiza la zona de interés del pasajero. */
  const guardarZona = useCallback((zona: string) => {
    localStorage.setItem(CLAVE_ZONA, JSON.stringify(zona));
    setZonaInteresState(zona);
  }, []);

  const esRutaFavorita = (id: string) => rutasFavoritas.some((r) => r.id === id);
  const esParadaFavorita = (nombre: string) => paradasFavoritas.some((p) => p.nombre === nombre);

  return {
    rutasFavoritas,
    paradasFavoritas,
    historial,
    zonaInteres,
    toggleRutaFavorita,
    toggleParadaFavorita,
    agregarViaje,
    limpiarHistorial,
    guardarZona,
    esRutaFavorita,
    esParadaFavorita
  };
}
