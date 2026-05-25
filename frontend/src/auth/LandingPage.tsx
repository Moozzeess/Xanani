import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import { EstadoBus } from '../components/common/MarcadorBus';
import TarjetaInformativa from '../components/pasajero/TarjetaInformativa';
import { io, Socket } from 'socket.io-client';
import Mapa from '../components/common/Mapa';
import CapaVehiculos from '../components/common/mapa/CapaVehiculos';

//const SOCKET_URL = 'http://localhost:4000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://34.239.216.75:3000';

/**
 * Calcula la distancia entre dos coordenadas en kilómetros usando la fórmula de Haversine.
 */
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

/**
 * Página de aterrizaje (Landing) para pasajeros en modo invitado.
 * Muestra actividad limitada para incentivar el inicio de sesión.
 */
const LandingPasajero: React.FC = () => {
  const navegar = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  // Estados de ubicación y vehículos
  const [userLocation, setUserLocation] = useState<[number, number]>([19.4326, -99.1332]);
  const [vehiculosActivos, setVehiculosActivos] = useState<Record<string, any>>({});

  // Efecto para obtener la ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("No se pudo obtener la ubicación, usando predeterminada.", error);
        }
      );
    }
  }, []);

  // Efecto para gestionar WebSockets
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

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

    const handleUbicacion = (datos: any) => {
      const id = datos.id || datos.placa;
      setVehiculosActivos((prev) => ({
        ...prev,
        [id]: formatVehicle(datos)
      }));
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

  // Obtener los vehículos más cercanos
  const vehiculosCercanos = useMemo(() => {
    const lista = Object.values(vehiculosActivos);
    if (lista.length === 0) return [];

    const conDistancia = lista.map(v => {
      const dist = calcularDistancia(userLocation[0], userLocation[1], v.pos[0], v.pos[1]);
      return { ...v, dist };
    });

    conDistancia.sort((a, b) => a.dist - b.dist);
    return conDistancia.slice(0, 3); // Mostrar las 3 unidades más cercanas
  }, [vehiculosActivos, userLocation]);

  const nearestVehicle = vehiculosCercanos[0] || null;

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
        center={userLocation}
        zoom={14}
        onMapClick={handleRedirectLogin}
      >
        <CapaVehiculos
          vehicles={vehiculosCercanos as any}
          onVehicleClick={handleRedirectLogin}
        />
      </Mapa>

      {/* TARJETA INFORMATIVA */}
      <TarjetaInformativa
        unidad={nearestVehicle?.placa || "Buscando cercanas..."}
        ocupabilidad={nearestVehicle ? (nearestVehicle.estado === EstadoBus.SIMULADO ? "Simulada" : (nearestVehicle.ocupacionActual > 10 ? "Alta" : "Baja")) : "..."}
        estado={nearestVehicle?.estado || EstadoBus.SIN_SENAL}
        distancia={nearestVehicle ? `${nearestVehicle.dist.toFixed(2)} km` : "..."}
        ultimaActualizacion={nearestVehicle ? "Ahora" : "..."}
      />
    </div>
  );
};

export default LandingPasajero;
