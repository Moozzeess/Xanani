import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface Aviso {
  _id: string;
  descripcion: string;
  tipo: string;
  emisorId?: {
    nombre: string;
    apellido: string;
  };
}

/**
 * Hook para que los conductores reciban avisos importantes de otros conductores
 * o del sistema en tiempo real.
 * 
 * @param onNewAlert - Callback que se ejecuta cuando se detecta un aviso nuevo.
 */
export const useDriverAlerts = (onNewAlert: (title: string, message: string) => void) => {
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  const fetchAvisos = useCallback(async () => {
    try {
      const response = await api.get('/incidentes/avisos/vigentes');
      const avisos: Aviso[] = response.data;

      if (avisos && avisos.length > 0) {
        const masReciente = avisos[0];
        
        // Si es un aviso nuevo y no es el primero que cargamos al entrar
        if (masReciente._id !== lastAlertId && !isFirstRun.current) {
          const emisor = masReciente.emisorId ? `${masReciente.emisorId.nombre}` : 'Sistema';
          onNewAlert(`Aviso de ${emisor}`, masReciente.descripcion);
          setLastAlertId(masReciente._id);
        } else if (isFirstRun.current) {
          setLastAlertId(masReciente._id);
          isFirstRun.current = false;
        }
      } else {
        isFirstRun.current = false;
      }
    } catch (error) {
      console.error('Error al obtener avisos entre conductores', error);
    }
  }, [lastAlertId, onNewAlert]);

  useEffect(() => {
    const timer = setInterval(fetchAvisos, 20000); // Polling cada 20 segundos
    fetchAvisos(); // Carga inicial
    return () => clearInterval(timer);
  }, [fetchAvisos]);

  return { refetch: fetchAvisos };
};
