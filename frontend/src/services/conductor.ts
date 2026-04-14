import axios from 'axios';

const URL_BASE_API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export interface SolicitudCrearConductor {
  nombreUsuario: string;
  correoElectronico: string;
  contrasena: string;
  numeroLicencia: string;
}

export async function crearConductor(datos: SolicitudCrearConductor, token: string) {
  try {
    const { data } = await axios.post(`${URL_BASE_API}/driver`, datos, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    return data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.mensaje || error.message || 'Error al crear conductor'
    );
  }
}
