import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ModalAlerta, TipoAlerta } from '../components/common/ModalAlerta';
import api from '../services/api';

interface AlertaContextType {
  disparar: (params: { tipo: TipoAlerta; titulo: string; mensaje: string; detalles?: string }) => void;
  dispararError: (mensaje: string, detalles?: string, titulo?: string) => void;
}

const AlertaContext = createContext<AlertaContextType | undefined>(undefined);

/**
 * Proveedor de Alertas Globales.
 * Encapsula la lógica del modal y configura interceptores para Axios.
 */
export const AlertaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [estado, setEstado] = useState<{
    mostrar: boolean;
    tipo: TipoAlerta;
    titulo: string;
    mensaje: string;
    detalles?: string;
  }>({
    mostrar: false,
    tipo: 'info',
    titulo: '',
    mensaje: ''
  });

  const disparar = useCallback((params: { tipo: TipoAlerta; titulo: string; mensaje: string; detalles?: string }) => {
    setEstado({ ...params, mostrar: true });
  }, []);

  const dispararError = useCallback((mensaje: string, detalles?: string, titulo = 'Ha ocurrido un error') => {
    disparar({ tipo: 'error', titulo, mensaje, detalles });
  }, [disparar]);

  const cerrar = useCallback(() => {
    setEstado(prev => ({ ...prev, mostrar: false }));
  }, []);

  // Configurar interceptor global de la instancia API
  React.useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const mensaje = error.response?.data?.mensaje || 'Error de conexión con el servidor.';
        const detalles = error.response?.data?.errorTecnico || error.message;
        
        // Solo disparamos si no es un error ya manejado o específico
        if (error.config?.mostrarAlertaGlobal !== false) {
          dispararError(mensaje, detalles);
        }
        
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [dispararError]);

  return (
    <AlertaContext.Provider value={{ disparar, dispararError }}>
      {children}
      <ModalAlerta 
        mostrar={estado.mostrar}
        tipo={estado.tipo}
        titulo={estado.titulo}
        mensaje={estado.mensaje}
        detalles={estado.detalles}
        alCerrar={cerrar}
      />
    </AlertaContext.Provider>
  );
};

/**
 * Hook para acceder al servicio de alertas desde cualquier componente.
 */
export const useAlertaGlobal = () => {
  const context = useContext(AlertaContext);
  if (!context) {
    throw new Error('useAlertaGlobal debe ser usado dentro de un AlertaProvider');
  }
  return context;
};
