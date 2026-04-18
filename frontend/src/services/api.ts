import axios from 'axios';

const host = window.location.hostname;
//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${host}:4000/api`;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${host}:4000/api`;

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

// Aumentamos el tipo de AxiosRequestConfig para soportar flags personalizados si es necesario
declare module 'axios' {
  export interface AxiosRequestConfig {
    mostrarAlertaGlobal?: boolean;
  }
}

export default api;
