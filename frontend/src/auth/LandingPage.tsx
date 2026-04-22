import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import { EstadoBus } from '../components/common/MarcadorBus';
import TarjetaInformativa from '../components/pasajero/TarjetaInformativa';
import UbicacionModal from '../components/common/UbicacionModal';
import { useAlertaGlobal } from '../context/AlertaContext';
import { io, Socket } from 'socket.io-client';
import Mapa from '../components/common/Mapa';
import CapaVehiculos from '../components/common/mapa/CapaVehiculos';

const SOCKET_URL = 'http://localhost:4000'; 

/**
 * Página de aterrizaje (Landing) para pasajeros en modo invitado.
 */
const LandingPasajero: React.FC = () => {
  const { dispararError } = useAlertaGlobal();
  const navegar = useNavigate();
  const [estaAbiertoModalUbicacion, setEstaAbiertoModalUbicacion] = useState(false);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<[number, number]>([19.4326, -99.1332]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Efecto para gestionar WebSockets y ubicación inicial
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    const handleUbicacion = (datos: any) => {
      let estado = EstadoBus.SIN_SENAL;
      if (datos.isSimulated) {
        estado = EstadoBus.SIMULADO;
      } else {
        const pct = (datos.ocupacionActual / datos.capacidadMaxima) * 100;
        if (pct < 33) estado = EstadoBus.BAJA;
        else if (pct < 66) estado = EstadoBus.MEDIA;
        else estado = EstadoBus.ALTA;
      }

      setVehicles(prev => {
        const id = datos.id || datos.placa;
        const index = prev.findIndex(v => v.id === id);
        
        // Determinar colores para el componente Mapa
        let colorClass = 'bg-blue-400';
        if (!datos.isSimulated) {
            if (estado === EstadoBus.BAJA) colorClass = 'bg-green-400';
            else if (estado === EstadoBus.MEDIA) colorClass = 'bg-yellow-400';
            else if (estado === EstadoBus.ALTA) colorClass = 'bg-red-400';
        }

        const newVehicle = {
          ...datos,
          id,
          color: colorClass,
          pos: datos.pos
        };

        if (index === -1) return [...prev, newVehicle];
        const newVehicles = [...prev];
        newVehicles[index] = newVehicle;
        return newVehicles;
      });
    };

    socketRef.current.on('ubicacion_conductor', handleUbicacion);
    socketRef.current.on('ubicacion_simulada', handleUbicacion);
    socketRef.current.emit('solicitar_simulacion');

    const permisoConcedido = localStorage.getItem('locationPermissionGranted') === 'true';
    if (permisoConcedido) {
      solicitarUbicacionUsuario();
    } else {
      setEstaAbiertoModalUbicacion(true);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Solicita la ubicación actual del usuario.
   */
  const solicitarUbicacionUsuario = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((posicion) => {
        const { latitude, longitude } = posicion.coords;
        setUbicacionUsuario([latitude, longitude]);
      }, (error) => {
        let mensaje = "No se pudo obtener tu ubicación actual.";
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = "Geolocalización denegada. Usando ubicación predeterminada.";
        }
        dispararError(mensaje, error.message, "Error de Ubicación");
      });
    }
  };

  const manejarAceptarUbicacion = () => {
    localStorage.setItem('locationPermissionGranted', 'true');
    setEstaAbiertoModalUbicacion(false);
    solicitarUbicacionUsuario();
  };

  return (
    <div className="passenger-body">
      {/* CABECERA (HEADER) */}
      <header className="fixed-header">
        <div>
          <h1 className="header-title">Xanani</h1>
          <p className="header-subtitle">Modo Invitado</p>
        </div>
        <button className="btn-login" onClick={() => navegar('/login')}>
          Iniciar Sesión
        </button>
      </header>

      {/* MAPA REFACTORIZADO */}
      <Mapa 
        center={ubicacionUsuario}
      >
        <CapaVehiculos vehicles={vehicles as any} />
      </Mapa>

      {/* LEYENDA DE COLORES */}
      <div className="absolute bottom-24 left-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-slate-200 text-[10px] space-y-2">
        <p className="font-bold text-slate-700 border-b pb-1 mb-1">Capacidad / Estado</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
          <span className="text-slate-600">Baja (Libre)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
          <span className="text-slate-600">Media</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <span className="text-slate-600">Alta (Lleno)</span>
        </div>
        <div className="flex items-center gap-2 border-t pt-1">
          <div className="w-3 h-3 rounded-full bg-[#a855f7]"></div>
          <span className="text-slate-600">Sin Señal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
          <span className="text-slate-600">Simulación</span>
        </div>
      </div>

      {/* TARJETA INFORMATIVA */}
      <TarjetaInformativa
        unidad="Selecciona una unidad"
        ocupabilidad="..."
        estado={EstadoBus.BAJA}
        distancia="..."
        ultimaActualizacion="..."
      />

      {/* MODAL DE UBICACIÓN */}
      <UbicacionModal
        isOpen={estaAbiertoModalUbicacion}
        onClose={() => setEstaAbiertoModalUbicacion(false)}
        onAccept={manejarAceptarUbicacion}
      />
    </div>
  );
};

export default LandingPasajero;
