import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Instancia compartida de Axios para todas las peticiones a la API de Xanani.
 * Esto permite aplicar interceptores de forma global y consistente.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para incluir el token de autenticación en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('xanani_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Aumentamos el tipo de AxiosRequestConfig para soportar flags personalizados si es necesario
declare module 'axios' {
  export interface AxiosRequestConfig {
    mostrarAlertaGlobal?: boolean;
  }
}

export default api;
