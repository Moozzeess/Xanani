import api from './api';

/**
 * Interfaz para la solicitud de creación de un nuevo usuario/conductor.
 */
export interface SolicitudCrearUsuario {
  username: string;
  email: string;
  password: string;
  role: 'CONDUCTOR' | 'ADMINISTRADOR' | 'PASAJERO';
  // Campos adicionales para conductores
  telefono?: string;
  licencia?: string;
  unidad?: string;
  edad?: number;
  ruta?: string;
}

/**
 * Crea un nuevo usuario (generalmente un conductor) en el sistema.
 * 
 * @param {SolicitudCrearUsuario} datos - Información del usuario.
 * @returns {Promise<any>} Respuesta del servidor.
 */
export async function crearUsuario(datos: SolicitudCrearUsuario) {
  try {
    const { data } = await api.post('/users', datos);
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.mensaje || error.message || 'Error al crear usuario'
    );
  }
}

/**
 * Obtiene la lista de todos los conductores registrados.
 * 
 * @returns {Promise<any[]>} Lista de conductores con sus fichas técnicas.
 */
export async function obtenerConductores() {
  try {
    const { data } = await api.get('/users/conductores');
    return data.data.conductores;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.mensaje || error.message || 'Error al obtener conductores'
    );
  }
}

/**
 * Busca usuarios en el sistema por nombre o correo.
 */
export async function buscarUsuarios(termino: string) {
  try {
    const { data } = await api.get(`/users?search=${termino}`);
    return data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.mensaje || 'Error al buscar usuarios');
  }
}

/**
 * Promueve un usuario existente a conductor agregando sus datos técnicos.
 */
export async function promoverUsuario(id: string, datosFicha: any) {
  try {
    const { data } = await api.patch(`/users/${id}/role`, {
      role: 'CONDUCTOR',
      ...datosFicha
    });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.mensaje || 'Error al promover usuario');
  }
}
