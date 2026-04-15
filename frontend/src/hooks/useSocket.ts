import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Ajustar la URL según el puerto del backend y el host actual (por defecto 4000)
const host = window.location.hostname;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? `http://${host}:3000`;

/**
 * Hook personalizado para gestionar la conexión con el servidor de Socket.io.
 * @returns {Object} Un objeto que contiene los últimos datos recibidos y el estado de conexión.
 */
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [datosRecibidos, setDatosRecibidos] = useState<any>(null);
  const [conectado, setConectado] = useState<boolean>(false);

  useEffect(() => {
    // Inicializar conexión
    const nuevaConexion = io(SOCKET_URL);

    nuevaConexion.on('connect', () => {
      console.log('Conectado al servidor de WebSockets');
      setConectado(true);
    });

    nuevaConexion.on('disconnect', () => {
      console.log('Desconectado del servidor de WebSockets');
      setConectado(false);
    });

    // Escuchar datos del ESP32 retransmitidos por el backend
    nuevaConexion.on('datos_esp32', (datos) => {
      console.log('Datos recibidos del ESP32:', datos);
      setDatosRecibidos(datos);
    });

    setSocket(nuevaConexion);

    // Limpiar al desmontar
    return () => {
      nuevaConexion.close();
    };
  }, []);

  return { socket, datosRecibidos, conectado };
};
