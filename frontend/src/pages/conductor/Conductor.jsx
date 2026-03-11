import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

// Importación de estilos específicos
import '../../styles/conductor.css';

// Importación de componentes
import Mapa from '../../components/common/Mapa';
import ModoNavegacion from '../../components/conductor/ModoNavegacion';
import { NoRouteOverlay } from '../../components/conductor/IniciarFinalizar';
import Reportes from '../../components/conductor/Reportes';

const Conductor = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  // Estados del componente
  const [routeLine, setRouteLine] = useState(null);
  const [busPosition, setBusPosition] = useState({ lat: 0, lng: 0 });
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [passengerCount, setPassengerCount] = useState(0);
  const [capacity] = useState(50);
  const [notificaciones, setNotificaciones] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const onLogout = () => {
    cerrarSesion();
    navigate("/", { replace: true });
  };

  // Manejadores de eventos
  const handleStartRoute = () => {
    setIsRouteActive(true);
    // Aquí se podría inicializar la ruta y posición del autobús
    setBusPosition({ lat: 19.4326, lng: -99.1332 }); // Ejemplo: Ciudad de México
  };

  const handleStopRoute = () => {
    setIsRouteActive(false);
    setRouteLine(null);
    setPassengerCount(0);
    setNotificaciones([]);
  };

  const handleTriggerSOS = () => {
    // Lógica para activar SOS
    console.log("SOS activado");
  };

  const removeNotification = (id) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  };

  const handleSubmitReport = (reportData) => {
    // Lógica para enviar reporte
    console.log("Reporte enviado:", reportData);
    setIsReportModalOpen(false);
  };

  // Efecto para simular actualización de pasajeros
  useEffect(() => {
    if (isRouteActive) {
      const interval = setInterval(() => {
        setPassengerCount(prev => Math.min(prev + Math.floor(Math.random() * 3), capacity));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isRouteActive, capacity]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">
      {/* BOTÓN DE LOGOUT */}
      <button
        onClick={onLogout}
        className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
        title="Cerrar sesión"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Cerrar sesión
      </button>

      {/* CAPA DE MAPA */}
      <Mapa
        routeLine={routeLine}
        busPosition={busPosition}
      />

      {/* INTERFAZ HUD */}
      {!isRouteActive ? (
        <NoRouteOverlay onStart={handleStartRoute} />
      ) : (
        <ModoNavegacion
          pasajeros={passengerCount}
          capacidad={capacity}
          notificaciones={notificaciones}
          onRemoveNotificacion={removeNotification}
          onOpenReportes={() => setIsReportModalOpen(true)}
          onTriggerSOS={handleTriggerSOS}
          onStopRoute={handleStopRoute}
        />
      )}

      {/* MODAL DE REPORTES */}
      <Reportes
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
};

export default Conductor;
