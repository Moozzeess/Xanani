import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useSocket } from "../../hooks/useSocket";

import '../../styles/conductor.css';

import Mapa from '../../components/common/Mapa';
import ModoConduccion from '../../components/conductor/ModoConduccion';
import ResumenViaje from '../../components/conductor/ResumenViaje';
import { NoRouteOverlay } from '../../components/conductor/IniciarFinalizar';

import api from '../../services/api';

const Conductor = () => {
  const navigate = useNavigate();
  const { cerrarSesion, token, usuario } = useAuth();

  const [routeLine, setRouteLine] = useState(null);
  const [busPosition, setBusPosition] = useState({ lat: 0, lng: 0 });
  const [viewMode, setViewMode] = useState('espera');

  const [passengerCount, setPassengerCount] = useState(0);
  const [unidadActual, setUnidadActual] = useState("Sin Asignar");
  const [rutaActual, setRutaActual] = useState("Sin Ruta");
  const [capacity, setCapacity] = useState(15);
  const [notificaciones, setNotificaciones] = useState([]);
  const [macAsignada, setMacAsignada] = useState("");

  const { socket, datosRecibidos } = useSocket();

  // Efecto para consultar la asignación de ruta y unidad
  useEffect(() => {
    const cargarAsignacion = async () => {
      try {
        if (!token) return;
        
        const response = await api.get('/units/my-unit', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'driver-id': usuario?._id || usuario?.id || ''
          }
        });
        
        const data = response.data;
        if (data && data.unidad) {
          const hw = data.unidad.dispositivoHardware;
          const hwName = hw ? hw.Id_Dispositivo_Hardware : 'Sin Hardware';
          setUnidadActual(`${data.unidad.placa} | ${hwName}`);
          setMacAsignada(hw ? (hw.Direccion_Mac || hw.Id_Dispositivo_Hardware) : "");
          setRutaActual(data.ruta || "Sin Ruta");
          setCapacity(data.capacidad || 15);
          
          if (data.routeLine && data.routeLine.length > 0) {
            // Mapeamos array {latitud, longitud} a Leaflet LatLngTuple [lat, lng]
            const line = data.routeLine.map(p => [p.latitud, p.longitud]);
            setRouteLine(line);
          } else {
            setRouteLine(null);
          }
        } else {
          setUnidadActual("Sin Asignar");
          setRutaActual("Sin Ruta");
          setRouteLine(null);
        }
      } catch (e) {
        console.error("Error cargando asignacion", e);
        setUnidadActual("Sin Asignar");
        setRutaActual("Sin Ruta");
        setRouteLine(null);
      }
    }
    cargarAsignacion();
  }, []);

  const [tripStats, setTripStats] = useState({
    timeStarted: null,
    pasajerosTotales: 0,
    ganancias: 0,
    kmRecorridos: 0,
    calificacion: 5.0
  });

  const onLogout = () => {
    cerrarSesion();
    navigate("/", { replace: true });
  };

  const addToastNotification = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotificaciones(prev => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  const handleStartRoute = () => {
    setViewMode('conduccion');
    setBusPosition({ lat: 19.4326, lng: -99.1332 });
    setPassengerCount(0);
    setTripStats({
      timeStarted: Date.now(),
      pasajerosTotales: 0,
      ganancias: 0,
      kmRecorridos: 0,
      calificacion: parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1))
    });

    // Enviar señal de activación y reinicio al ESP32 conectado
    if (socket) {
      socket.emit('enviar_comando_hardware', { action: 'power_toggle', status: 'ON', id: macAsignada });
    }
  };

  const handleStopRoute = () => {
    const timeEnded = Date.now();
    const durationMs = timeEnded - (tripStats.timeStarted || timeEnded);
    const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));
    const km = parseFloat((Math.random() * 20 + 5).toFixed(1));

    setTripStats(prev => ({
      ...prev,
      kmRecorridos: prev.kmRecorridos > 0 ? prev.kmRecorridos : km,
      tiempoMinutos: durationMinutes
    }));

    setViewMode('resumen');

    // Enviar señal de desactivación al ESP32
    if (socket) {
      socket.emit('enviar_comando_hardware', { action: 'power_toggle', status: 'OFF', id: macAsignada });
      socket.emit('enviar_comando_hardware', { action: 'reset_counters', id: macAsignada });
    }
  };

  const handleCloseResumen = () => {
    setViewMode('espera');
    setRouteLine(null);
    setPassengerCount(0);
    setNotificaciones([]);
  };

  const handleTriggerSOS = () => {
    addToastNotification(
      'SOS Registrado',
      'Autoridades alertadas discretamente.',
      'alert'
    );
  };

  const handleFastReport = () => {
    addToastNotification(
      'Incidencia Marcada',
      'Se ha guardado un reporte en tu ubicación actual.',
      'info'
    );
  };

  const removeNotification = (id) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  };

  useEffect(() => {
    if (viewMode === 'conduccion' && datosRecibidos) {
      const payload = datosRecibidos.payload;
      // Verificar que el payload contiene datos y corresponde a esta unidad
      if (payload && payload.id && payload.id === macAsignada) {
        setPassengerCount(payload.actual ?? 0);
        
        // Simular cálculo de ganancias basadas en entradas (esto es referencial, se podría ajustar)
        setTripStats(prev => ({
          ...prev,
          pasajerosTotales: payload.entradas ?? prev.pasajerosTotales,
          ganancias: (payload.entradas ?? prev.pasajerosTotales) * 15
        }));

        // Si error_code indica límite de capacidad
        if (payload.error_code === 1) {
          // Evitar spam de notificaciones, se puede manejar si la última notificación no fue la misma
          addToastNotification(
            'Alerta de Capacidad',
            'La unidad ha alcanzado su límite de capacidad dictado por el sensor.',
            'alert'
          );
        }
      }
    }
  }, [datosRecibidos, viewMode, macAsignada]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">

      {/* CAPA DE MAPA (Oculta en modo espera) */}
      {viewMode !== 'espera' && (
        <Mapa
          routeLine={routeLine}
          lockedToUser={true} // Obliga al mapa a ser fijo y seguir al conductor
        />
      )}

      {/* VISTA DE INICIO (Espera / Dashboard) */}
      {viewMode === 'espera' && (
        <NoRouteOverlay
          onStart={handleStartRoute}
          onLogout={onLogout}
          unidadAsignada={unidadActual}
          rutaAsignada={rutaActual}
        />
      )}

      {/* VISTA DE CONDUCCIÓN (Ruta Activa) */}
      {viewMode === 'conduccion' && (
        <ModoConduccion
          pasajeros={passengerCount}
          capacidad={capacity}
          notificaciones={notificaciones}
          onRemoveNotificacion={removeNotification}
          onOpenReportes={handleFastReport}
          onTriggerSOS={handleTriggerSOS}
          onStopRoute={handleStopRoute}
        />
      )}

      {/* VISTA DE RESUMEN AL FINALIZAR */}
      {viewMode === 'resumen' && (
        <ResumenViaje
          estadisticas={tripStats}
          onClose={handleCloseResumen}
        />
      )}
    </div>
  );
};

export default Conductor;
