import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import { EstadoBus } from '../components/common/MarcadorBus';
import TarjetaInformativa from '../components/pasajero/TarjetaInformativa';
import { io, Socket } from 'socket.io-client';
import Mapa from '../components/common/Mapa';
import CapaVehiculos from '../components/common/mapa/CapaVehiculos';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

/**
 * Página de aterrizaje (Landing) para pasajeros en modo invitado.
 * Muestra actividad limitada para incentivar el inicio de sesión.
 */
const LandingPasajero: React.FC = () => {
  const navegar = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Efecto para gestionar WebSockets
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    const handleUbicacion = (datos: any) => {
      const id = datos.id || datos.placa;
      
      setSelectedVehicle((prev: any) => {
        const newVehicle = formatVehicle(datos);

        // Si no hay unidad previa, esta es la elegida (la primera que llegue es aleatoria)
        if (!prev) return newVehicle;

        // Si es la misma unidad, actualizamos su posición para el movimiento fluido
        if (prev.id === id) return newVehicle;

        // Mantenemos la unidad actual una vez fijada para evitar saltos de cámara bruscos
        return prev;
      });
    };

    const formatVehicle = (datos: any) => {
      let estado = EstadoBus.SIN_SENAL;
      if (datos.isSimulated) {
        estado = EstadoBus.SIMULADO;
      } else {
        const pct = (datos.ocupacionActual / (datos.capacidadMaxima || 15)) * 100;
        if (pct < 33) estado = EstadoBus.BAJA;
        else if (pct < 66) estado = EstadoBus.MEDIA;
        else estado = EstadoBus.ALTA;
      }

      let colorClass = 'bg-blue-400';
      if (!datos.isSimulated) {
        if (estado === EstadoBus.BAJA) colorClass = 'bg-green-400';
        else if (estado === EstadoBus.MEDIA) colorClass = 'bg-yellow-400';
        else if (estado === EstadoBus.ALTA) colorClass = 'bg-red-400';
      }

      return {
        ...datos,
        id: datos.id || datos.placa,
        estado,
        color: colorClass,
        pos: datos.pos
      };
    };

    socketRef.current.on('ubicacion_conductor', handleUbicacion);
    socketRef.current.on('ubicacion_simulada', handleUbicacion);
    socketRef.current.emit('solicitar_simulacion');

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleRedirectLogin = () => navegar('/login');

  return (
    <div className="passenger-body">
      {/* CABECERA (HEADER) */}
      <header className="fixed-header">
        <div>
          <h1 className="header-title">Xanani</h1>
          <p className="header-subtitle">Modo Invitado</p>
        </div>
        <button className="btn-login" onClick={handleRedirectLogin}>
          Iniciar Sesión
        </button>
      </header>

      {/* MAPA MODULAR */}
      <Mapa
        center={selectedVehicle?.pos || [19.4326, -99.1332]}
        zoom={16}
        onMapClick={handleRedirectLogin}
      >
        <CapaVehiculos
          vehicles={(selectedVehicle ? [selectedVehicle] : []) as any}
          onVehicleClick={handleRedirectLogin}
        />
      </Mapa>

      {/* TARJETA INFORMATIVA */}
      <TarjetaInformativa
        unidad={selectedVehicle?.placa || "Buscando..."}
        ocupabilidad={selectedVehicle ? (selectedVehicle.estado === EstadoBus.SIMULADO ? "Simulada" : (selectedVehicle.ocupacionActual > 10 ? "Alta" : "Baja")) : "..."}
        estado={selectedVehicle?.estado || EstadoBus.SIN_SENAL}
        distancia={selectedVehicle ? "Unidad Activa" : "..."}
        ultimaActualizacion={selectedVehicle ? "Ahora" : "..."}
      />
    </div>
  );
};

export default LandingPasajero;
