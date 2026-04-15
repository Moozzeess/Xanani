import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../services/api";
import { io } from "socket.io-client";

import '../../styles/conductor.css';

import Navbar from '../../components/common/Navbar';
import Mapa from '../../components/common/Mapa';
import CapaGeometria from '../../components/common/mapa/CapaGeometria';
import CapaParadas from '../../components/common/mapa/CapaParadas';
import CapaVehiculos from '../../components/common/mapa/CapaVehiculos';
import ModoConduccion from '../../components/conductor/ModoConduccion';
import Reportes from '../../components/conductor/Reportes';
import ResumenViaje from '../../components/conductor/ResumenViaje';
import HistorialGeneral from '../../components/common/HistorialGeneral';
import PanelPerfil from '../../components/common/PanelPerfil';
import { NoRouteOverlay } from '../../components/conductor/IniciarFinalizar';
import { useConductorSimulation } from '../../simulations/conductorSimulation';


const Conductor = () => {
  const navigate = useNavigate();
  const { cerrarSesion, token, usuario } = useAuth();

  const [routeLine, setRouteLine] = useState([]);
  const [paradas, setParadas] = useState([]); 
  const [viewMode, setViewMode] = useState('espera'); 

  const [passengerCount, setPassengerCount] = useState(0);
  const [unidadActual, setUnidadActual] = useState("Sin Asignar");
  const [rutaActual, setRutaActual] = useState("Sin Ruta");
  const [rawIds, setRawIds] = useState({ unidadId: null, rutaId: null, conductorProfileId: null });
  const [capacity, setCapacity] = useState(15);
  const [notificaciones, setNotificaciones] = useState([]);

  // Estados de gestión de viaje y simulación
  const [socket, setSocket] = useState(null);
  
  // Integración del Hook de Simulación Profunda
  const { 
    isTesting, 
    setIsTesting, 
    simulatedPosition, 
    siguienteParada: paradaSiguienteSimulada,
    resetSimulation 
  } = useConductorSimulation(routeLine, paradas, viewMode === 'conduccion');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [ubicacionReal, setUbicacionReal] = useState(null);

  // Obtener ubicación real del dispositivo con seguimiento continuo
  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUbicacionReal([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.error("Error al rastrear ubicación real del conductor:", error);
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Inicializar Socket
  useEffect(() => {
    const host = window.location.hostname;
    const newSocket = io(`http://${host}:4000`);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Efecto para consultar la asignación de ruta y unidad
  useEffect(() => {
    const cargarAsignacion = async () => {
      try {
        const res = await api.get('/conductores/perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const { conductor } = res.data.data;
        if (conductor && conductor.rutaAsignadaId) {
          setProfileData(conductor);
          setUnidadActual(conductor.unidadAsignadaId?.placa || "Unidad Asignada");
          setRutaActual(conductor.rutaAsignadaId?.nombre || "Sin Ruta");
          setCapacity(15);
          setRawIds({
            unidadId: conductor.unidadAsignadaId?._id || null,
            rutaId: conductor.rutaAsignadaId?._id || null,
            conductorProfileId: conductor._id
          });
          
          // 1. Mapear paradas primero (son la fuente de verdad de la ruta)
          let paradasMapeadas = [];
          if (conductor.rutaAsignadaId.paradas && Array.isArray(conductor.rutaAsignadaId.paradas)) {
            paradasMapeadas = conductor.rutaAsignadaId.paradas.map(p => ({
              ...p,
              latitud: parseFloat(p.latitud !== undefined ? p.latitud : p.lat),
              longitud: parseFloat(p.longitud !== undefined ? p.longitud : (p.long || p.lng || p.lon))
            })).filter(p => !isNaN(p.latitud) && !isNaN(p.longitud));
            setParadas(paradasMapeadas);
          }

          // 2. Mapear geometría con fallback a las paradas si está vacía
          const geometriaOriginal = conductor.rutaAsignadaId.geometria || [];
          let geometriaValidada = geometriaOriginal.map(p => {
            const lat = parseFloat(p.latitud !== undefined ? p.latitud : p.lat);
            const lng = parseFloat(p.longitud !== undefined ? p.longitud : (p.long || p.lng || p.lon));
            return [lat, lng];
          }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

          // FALLBACK CRÍTICO: Si no hay geometría pero hay paradas, usar las paradas como geometría
          if (geometriaValidada.length === 0 && paradasMapeadas.length > 0) {
            console.warn("Geometría vacía detectada, usando paradas como respaldo.");
            geometriaValidada = paradasMapeadas.map(p => [p.latitud, p.longitud]);
          }
          
          if (geometriaValidada.length > 0) {
            setRouteLine(prev => {
              if (JSON.stringify(prev) === JSON.stringify(geometriaValidada)) return prev;
              return geometriaValidada;
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar asignación:", error);
      }
    };
    
    if (token) cargarAsignacion();
  }, [token, usuario]);

  // Emisión de ubicación en tiempo real
  useEffect(() => {
    if (socket && (simulatedPosition || ubicacionReal) && viewMode === 'conduccion') {
      const posActual = (isTesting && simulatedPosition) ? simulatedPosition : ubicacionReal;
      if (!posActual) return;

      socket.emit('ubicacion_conductor', {
        id: rawIds.unidadId || 'test-bus',
        placa: unidadActual,
        pos: posActual,
        rutaId: rawIds.rutaId,
        conductorId: rawIds.conductorProfileId,
        isSimulated: isTesting,
        ocupacionActual: passengerCount,
        capacidadMaxima: capacity
      });
    }
  }, [simulatedPosition, ubicacionReal, isTesting, socket, viewMode, rawIds, unidadActual, passengerCount, capacity]);

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

  const handleCloseResumen = () => {
    setViewMode('espera');
    setPassengerCount(0);
    setNotificaciones([]);
    setWasSimulated(false);
    resetSimulation();
  };

  const handleTriggerSOS = () => {
    addToastNotification('SOS Registrado', 'Autoridades alertadas discretamente.', 'alert');
    if (socket) {
      const posActual = (isTesting && simulatedPosition) ? simulatedPosition : ubicacionReal;
      socket.emit('reporte_incidencia', {
        conductorId: rawIds.conductorProfileId || usuario?._id,
        unidadId: rawIds.unidadId,
        tipo: 'SOS',
        descripcion: 'Botón de pánico activado por el conductor.',
        ubicacion: posActual ? { latitud: posActual[0], longitud: posActual[1] } : null
      });
    }
  };

  const handleFastReport = () => {
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = (tipo) => {
    addToastNotification('Reporte Enviado', `Se ha marcado un evento de "${tipo}" en tu ubicación.`, 'info');
    if (socket) {
      const posActual = (isTesting && simulatedPosition) ? simulatedPosition : ubicacionReal;
      socket.emit('reporte_incidencia', {
        conductorId: rawIds.conductorProfileId || usuario?._id,
        unidadId: rawIds.unidadId,
        tipo: tipo,
        descripcion: `Incidencia de ${tipo} reportada por el conductor.`,
        ubicacion: posActual ? { latitud: posActual[0], longitud: posActual[1] } : null
      });
    }
    setIsReportModalOpen(false);
  };

  const removeNotification = (id) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
  };

  const handleStartRoute = () => {
    setViewMode('conduccion');
    setPassengerCount(0);
    setTripStats({
      timeStarted: Date.now(),
      pasajerosTotales: 0,
      ganancias: 0,
      kmRecorridos: 0,
      calificacion: parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1))
    });
  };

  const handleStopRoute = async () => {
    resetSimulation();
    const timeEnded = Date.now();
    const durationMs = timeEnded - (tripStats.timeStarted || timeEnded);
    const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));

    const kmSimulados = parseFloat((Math.random() * 20 + 5).toFixed(1));
    const califSimulada = parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1));

    setViewMode('resumen');
    setTripStats(prev => ({
      ...prev,
      kmRecorridos: kmSimulados,
      calificacion: califSimulada,
      tiempoMinutos: durationMinutes
    }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0f172a] font-sans">

      {/* MAPA BASE (Omnipresente) */}
      <div className="absolute inset-0 z-0">
        <Mapa 
          center={
            (isTesting && simulatedPosition) ? simulatedPosition : 
            (ubicacionReal || (routeLine && routeLine.length > 0 ? routeLine[0] : [19.4326, -99.1332]))
          } 
          tileTheme="standard"
          zoom={viewMode === 'conduccion' ? 18 : 16}
        >
          <CapaGeometria routeLine={routeLine} isDashed={false} />
          <CapaParadas stops={paradas} />
          <CapaVehiculos 
            vehicles={[{ 
              id: 'self', 
              pos: (isTesting && simulatedPosition) ? simulatedPosition : 
                   (ubicacionReal || (routeLine && routeLine.length > 0 ? routeLine[0] : [19.4326, -99.1332])), 
              color: 'bg-emerald-500', 
              text: 'text-white',
              eta: 'Tú'
            }]} 
            selectedVehicleId="self"
          />
        </Mapa>
      </div>

      {/* BOTÓN FLOTANTE MODO PRUEBA */}
      {viewMode === 'conduccion' && (
        <button
          onClick={() => setIsTesting(!isTesting)}
          className={`fixed top-6 right-6 z-[60] w-14 h-14 rounded-2xl shadow-2xl transition-all active:scale-90 flex items-center justify-center border border-white/20 backdrop-blur-md ${isTesting
            ? 'bg-red-500/90 text-white animate-pulse'
            : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          title={isTesting ? 'Detener Prueba' : 'Iniciar Simulación de Ruta'}
        >
          <img
            src="/bus_icon_126644.svg"
            alt="Simulación"
            className={`w-8 h-8 ${isTesting ? 'invert animate-bounce' : 'grayscale-0'}`}
          />
        </button>
      )}

      {/* CAPAS DE UI (Sobre el mapa) */}
      <div className="relative z-10 h-full w-full pointer-events-none">
        
        {/* VISTA DE INICIO (Overlay) */}
        {viewMode === 'espera' && (
          <div className="pointer-events-auto h-full w-full bg-slate-900/40 backdrop-blur-[2px]">
            <NoRouteOverlay
              onStart={handleStartRoute}
              onLogout={onLogout}
              unidadAsignada={unidadActual}
              rutaDefecto={rutaActual}
            />
          </div>
        )}

        {/* VISTA DE CONDUCCIÓN (HUD Inmersivo) */}
        {viewMode === 'conduccion' && (
          <ModoConduccion
            pasajeros={passengerCount}
            capacidad={capacity}
            notificaciones={notificaciones}
            onRemoveNotificacion={removeNotification}
            onOpenReportes={handleFastReport}
            onTriggerSOS={handleTriggerSOS}
            onStopRoute={handleStopRoute}
            siguienteParada={paradaSiguienteSimulada}
            velocidad={isTesting ? (Math.floor(Math.random() * 5) + 38).toString() : "0"}
            tiempoRestante="12"
          />
        )}

        {/* VISTA DE RESUMEN */}
        {viewMode === 'resumen' && (
          <div className="pointer-events-auto h-full w-full flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
            <ResumenViaje
              estadisticas={tripStats}
              onClose={handleCloseResumen}
            />
          </div>
        )}

        {/* VISTA DE HISTORIAL */}
        {viewMode === 'historial' && (
          <div className="pointer-events-auto h-full w-full bg-[#0f172a]">
             <HistorialGeneral rol="CONDUCTOR" />
             <button 
                onClick={() => setViewMode('espera')}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-[100]"
             >
                Volver al Mapa
             </button>
          </div>
        )}
        
        {/* COMPONENTE DE REPORTES (Discreto) */}
        <Reportes 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleSubmitReport}
        />
      </div>

      {/* NAVBAR (Solo en modo espera o historial) */}
      {(viewMode === 'espera' || viewMode === 'historial') && (
        <div className="pointer-events-auto">
          <Navbar
            onLogout={onLogout}
            onCenterLocation={() => { }}
            onHistoryClick={() => setViewMode('historial')}
            onMapClick={() => setViewMode('espera')}
            onProfileClick={() => setIsProfileOpen(true)}
            activeTab={viewMode === 'espera' ? 'map' : viewMode === 'historial' ? 'afluencia' : ''}
          />
        </div>
      )}

      {/* PANEL DE PERFIL */}
      <PanelPerfil 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        usuario={usuario}
        conductorData={profileData}
        onLogout={onLogout}
      />
    </div>
  );
};

export default Conductor;
