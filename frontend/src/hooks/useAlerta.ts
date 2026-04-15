import { useState, useCallback } from 'react';
import { TipoAlerta } from '../components/common/ModalAlerta';

interface EstadoAlerta {
  mostrar: boolean;
  tipo: TipoAlerta;
  titulo: string;
  mensaje: string;
  detalles?: string;
}

/**
 * Hook para controlar fácilmente el componente ModalAlerta.
 * Permite disparar diferentes tipos de notificaciones desde cualquier componente.
 */
export const useAlerta = () => {
  const [estado, setEstado] = useState<EstadoAlerta>({
    mostrar: false,
    tipo: 'info',
    titulo: '',
    mensaje: ''
  });

  /**
   * Dispara una nueva alerta.
   */
  const disparar = useCallback((params: Omit<EstadoAlerta, 'mostrar'>) => {
    setEstado({ ...params, mostrar: true });
  }, []);

  /**
   * Cierra la alerta actual.
   */
  const cerrar = useCallback(() => {
    setEstado(prev => ({ ...prev, mostrar: false }));
  }, []);

  /**
   * Atajo para errores técnicos/API.
   */
  const dispararError = useCallback((mensaje: string, detalles?: string, titulo = 'Ha ocurrido un error') => {
    disparar({ tipo: 'error', titulo, mensaje, detalles });
  }, [disparar]);

  return {
    ...estado,
    disparar,
    dispararError,
    cerrar
  };
};
