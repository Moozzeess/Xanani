import api from './api';

/**
 * Interfaz para el resumen de estadísticas del dashboard.
 */
export interface ResumenDashboard {
  totalUnidades: number;
  unidadesActivas: number;
  incidentesActivos: number;
  pasajerosHoy: number;
  eficiencia: number;
}

/**
 * Interfaz para los gráficos analíticos.
 */
export interface GraficosDashboard {
  afluencia: Array<{ hora: string; pasajeros: number }>;
  distribucionUnidades: Array<{ estado: string; cantidad: number }>;
  incidentesPorTipo: Array<{ tipo: string; cantidad: number }>;
}

/**
 * Respuesta consolidada del endpoint de dashboard.
 */
export interface DashboardAdminResponse {
  resumen: ResumenDashboard;
  graficos: GraficosDashboard;
  alertasRecientes: any[];
}

/**
 * Servicio para la gestión de estadísticas y análisis de datos.
 * Intención: Proporcionar datos consolidados para el panel de administración.
 */
export const estadisticasService = {
  /**
   * Obtiene los datos consolidados para el dashboard del administrador.
   * @returns {Promise<DashboardAdminResponse>} Datos de resumen, gráficos y alertas.
   */
  obtenerDashboardAdmin: async (): Promise<DashboardAdminResponse> => {
    const response = await api.get('/estadisticas/admin/dashboard');
    return response.data;
  },

  /**
   * Obtiene la afluencia de las rutas suscritas del usuario.
   * @returns {Promise<any[]>} Lista de rutas con sus histogramas.
   */
  obtenerAfluenciaSuscripciones: async (): Promise<any[]> => {
    const response = await api.get('/estadisticas/suscripciones');
    return response.data;
  }
};
