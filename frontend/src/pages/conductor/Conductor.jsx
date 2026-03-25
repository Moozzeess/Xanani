import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

import '../../styles/conductor.css';

import Mapa from '../../components/common/Mapa';
import ModoConduccion from '../../components/conductor/ModoConduccion';
import ResumenViaje from '../../components/conductor/ResumenViaje';
import { NoRouteOverlay } from '../../components/conductor/IniciarFinalizar';

const Conductor = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  const [routeLine, setRouteLine] = useState(null);
  const [busPosition, setBusPosition] = useState({ lat: 0, lng: 0 });
  const [viewMode, setViewMode] = useState('espera');

  const [passengerCount, setPassengerCount] = useState(0);
  const [unidadActual, setUnidadActual] = useState("Sin Asignar");
  const [rutaActual, setRutaActual] = useState("Sin Ruta");
  const [capacity, setCapacity] = useState(15);
  const [notificaciones, setNotificaciones] = useState([]);

  // Efecto para consultar la asignación de ruta y unidad
  useEffect(() => {
    const cargarAsignacion = async () => {
    const data = await api.getAsignacion();
    setUnidadActual(data.unidad);
    setRutaActual(data.ruta);
    setCapacity(data.capacidad);
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
    if (viewMode === 'conduccion') {
      const interval = setInterval(() => {
        const newPassengers = Math.floor(Math.random() * 3);
        if (newPassengers > 0) {
          setPassengerCount(prev => Math.min(prev + newPassengers, capacity));
          setTripStats(prev => ({
            ...prev,
            pasajerosTotales: prev.pasajerosTotales + newPassengers,
            ganancias: prev.ganancias + (newPassengers * 15)
          }));
        }
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [viewMode, capacity]);

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
          rutaDefecto={rutaActual}
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
