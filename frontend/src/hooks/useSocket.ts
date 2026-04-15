import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const host = window.location.hostname;
const SOCKET_URL = `http://${host}:4000`;

// Singleton de socket
let globalSocket: Socket | null = null;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [datosRecibidos, setDatosRecibidos] = useState<any>(null);
  const [conectado, setConectado] = useState<boolean>(globalSocket ? globalSocket.connected : false);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(SOCKET_URL);
    }

    const currentSocket = globalSocket;
    setSocket(currentSocket);

    // Escuchar conexiones
    const onConnect = () => setConectado(true);
    const onDisconnect = () => setConectado(false);
    const onDatosEsp32 = (datos: any) => {
      console.log('Datos recibidos del ESP32:', datos);
      setDatosRecibidos(datos);
    };

    currentSocket.on('connect', onConnect);
    currentSocket.on('disconnect', onDisconnect);
    currentSocket.on('datos_esp32', onDatosEsp32);

    if (currentSocket.connected) {
      setConectado(true);
    }

    return () => {
      currentSocket.off('connect', onConnect);
      currentSocket.off('disconnect', onDisconnect);
      currentSocket.off('datos_esp32', onDatosEsp32);
    };
  }, []);

  return { socket, datosRecibidos, conectado };
};
