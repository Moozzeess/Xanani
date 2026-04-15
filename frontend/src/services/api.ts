import axios from 'axios';

const host = window.location.hostname;
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

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('xanani_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
