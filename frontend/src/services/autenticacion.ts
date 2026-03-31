import axios from 'axios';
import type {
  RespuestaAutenticacion,
  SolicitudInicioSesion,
  SolicitudRegistro
} from '../types/autenticacion';

const URL_BASE_API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

const http = axios.create({
  baseURL: URL_BASE_API,
  headers: {
    'Content-Type': 'application/json'
  }
});

function obtenerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.mensaje ||
      error.response?.data?.message ||
      error.message ||
      'Ocurrió un error en la solicitud.'
    );
  }

  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export async function iniciarSesion(
  payload: SolicitudInicioSesion
): Promise<RespuestaAutenticacion> {
  try {
    const { data } = await http.post<RespuestaAutenticacion>(
      '/auth/login',
      payload
    );
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error));
  }
}

export async function registrar(
  payload: SolicitudRegistro
): Promise<RespuestaAutenticacion> {
  try {
    const { data } = await http.post<RespuestaAutenticacion>(
      '/auth/register',
      payload
    );
    return data;
  } catch (error) {
    throw new Error(obtenerMensajeError(error));
  }
}
