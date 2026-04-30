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
import { Bell, CheckCircle, MessageSquare, Trash2 } from 'lucide-react';
import ModalAlerta from '../../components/common/ModalAlerta';


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
  const [showSimModal, setShowSimModal] = useState(false);
  const [isHardwareActive, setIsHardwareActive] = useState(false);
  const [hardwareId, setHardwareId] = useState(null);
  const hardwareTimeoutRef = React.useRef(null);
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
          // No loguear error de permisos repetidamente, solo si es algo crítico
          if (error.code !== 1) { // 1 = PERMISSION_DENIED
             console.warn("Señal GPS no disponible actualmente.");
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
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
          
          // Configurar datos de la unidad asignada desde el objeto unidadAsignada
          const unidadInfo = conductor.unidadAsignada;
          setUnidadActual(unidadInfo?.placa || conductor.unidad || "Sin Unidad");
          setCapacity(unidadInfo?.capacidad || 15);
          
          setRutaActual(conductor.rutaAsignadaId?.nombre || "Sin Ruta");
          setRawIds({
            unidadId: unidadInfo?._id || null,
            rutaId: conductor.rutaAsignadaId?._id || null,
            conductorProfileId: conductor._id
          });

          // Extraer ID de hardware para monitoreo en tiempo real
          const hwId = unidadInfo?.dispositivoHardware?.Id_Dispositivo_Hardware;
          if (hwId) {
            setHardwareId(hwId);
          }
          
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
  
  // Listener para Avisos del Administrador en Tiempo Real
  useEffect(() => {
    if (!socket) return;

    socket.on('aviso_conductor', (datos) => {
      // Mostrar toast inmediato
      addToastNotification('Aviso de Administración', datos.mensaje, 'info');
      // Recargar notificaciones si estamos en la vista de avisos
      if (viewMode === 'avisos') {
        cargarNotificaciones();
      }
    });

    return () => {
      socket.off('aviso_conductor');
    };
  }, [socket, viewMode]);

  // Listener para Actividad de Hardware en Tiempo Real
  useEffect(() => {
    if (!socket || !hardwareId) return;

    // Suscribirse a la sala del dispositivo para recibir su telemetría
    socket.emit('suscribir_dispositivo', hardwareId);

    const manejarDatosHardware = (data) => {
      const payload = data.payload;
      if (!payload || payload.id !== hardwareId) return;

      // Si recibimos datos, el hardware está activo
      setIsHardwareActive(true);

      // Reiniciar el temporizador de desconexión (30 segundos)
      if (hardwareTimeoutRef.current) {
        clearTimeout(hardwareTimeoutRef.current);
      }

      hardwareTimeoutRef.current = setTimeout(() => {
        setIsHardwareActive(false);
        console.log(`Hardware ${hardwareId} marcado como offline por inactividad.`);
      }, 30000);
    };

    socket.on('datos_esp32', manejarDatosHardware);

    return () => {
      socket.off('datos_esp32', manejarDatosHardware);
      socket.emit('desuscribir_dispositivo', hardwareId);
      if (hardwareTimeoutRef.current) {
        clearTimeout(hardwareTimeoutRef.current);
      }
    };
  }, [socket, hardwareId]);

  // Cargar Notificaciones desde el Backend
  const cargarNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.data;
      // Mapear al formato que espera el componente (id, title, message, type, leida)
      const mapped = data.map(n => ({
        id: n._id,
        title: n.titulo,
        message: n.mensaje,
        type: n.tipo === 'ADVERTENCIA' ? 'alert' : 'info',
        leida: n.leida,
        fecha: n.createdAt
      }));
      setNotificaciones(mapped);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  // Cargar avisos al entrar en la vista correspondiente
  useEffect(() => {
    if (viewMode === 'avisos') {
      cargarNotificaciones();
    }
  }, [viewMode]);

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

  const removeNotification = async (id) => {
    // Si el ID es numérico (toast temporal), solo filtrar localmente
    if (typeof id === 'number') {
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
      return;
    }

    // Si es un ID de MongoDB, marcar como leída en el backend
    try {
      await api.patch(`/notificaciones/${id}/leida`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error("Error al marcar como leída:", error);
      // Fallback: eliminar localmente aunque falle el backend para no bloquear al usuario
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    }
  };

  const handleStartRoute = () => {
    if (!isHardwareActive) {
      setShowSimModal(true);
      return;
    }
    ejecutarInicioRuta(false);
  };

  const ejecutarInicioRuta = (simular) => {
    setIsTesting(simular);
    setViewMode('conduccion');
    setPassengerCount(0);
    setTripStats({
      timeStarted: Date.now(),
      pasajerosTotales: 0,
      ganancias: 0,
      kmRecorridos: 0,
      calificacion: parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1))
    });
    setShowSimModal(false);
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

      {/* BOTÓN FLOTANTE MODO PRUEBA ELIMINADO SEGÚN REQUERIMIENTO */}

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
              isHardwareActive={isHardwareActive}
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

        {/* VISTA DE AVISOS / NOTIFICACIONES */}
        {viewMode === 'avisos' && (
          <div className="pointer-events-auto h-full w-full bg-[#0f172a] p-6 overflow-y-auto">
             <header className="mb-6 flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Bell className="w-6 h-6 text-blue-400" />
                      Avisos y Reportes
                   </h1>
                   <p className="text-slate-400 text-sm">Mensajes del administrador y estado de incidencias.</p>
                </div>
             </header>
 
             <div className="space-y-4 max-w-2xl mx-auto">
                {/* Mensaje de Bienvenida / Estado */}
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-4">
                   <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400">
                      <CheckCircle className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="font-bold text-blue-100 text-sm">Sistema Operativo</h4>
                      <p className="text-blue-200/70 text-xs">No hay incidencias críticas reportadas en tu ruta actual. ¡Buen viaje!</p>
                      <span className="text-[10px] text-blue-400 mt-1 block">Ahora</span>
                   </div>
                </div>
 
                <div className="border-b border-white/10 my-6"></div>
 
                <h3 className="font-bold text-white/80 mb-2 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4" />
                   Historial de Avisos
                </h3>
 
                {notificaciones.length === 0 ? (
                   <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No tienes avisos o notificaciones pendientes.</p>
                   </div>
                ) : (
                   <div className="space-y-3">
                      {notificaciones.map((n) => (
                         <div key={n.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-start pointer-events-auto">
                            <div className="flex-1">
                               <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{n.title}</span>
                               </div>
                               <p className="text-sm text-slate-200 mt-1">{n.message}</p>
                            </div>
                            <button 
                               onClick={() => removeNotification(n.id)}
                               className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                               title="Marcar como leído"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                      
                      <button 
                         onClick={() => {
                            // Marcar todas como leídas (limpiar pantalla)
                            notificaciones.forEach(n => removeNotification(n.id));
                         }}
                         className="w-full py-4 text-xs font-bold text-slate-400 hover:text-white transition-colors border-t border-white/5 pointer-events-auto"
                      >
                         Limpiar todos los avisos
                      </button>
                   </div>
                )}
             </div>
 
             <button 
                onClick={() => setViewMode('espera')}
                className="fixed bottom-24 right-6 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] font-bold active:scale-95 transition-transform"
             >
                Volver al Inicio
             </button>
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
            rol="CONDUCTOR"
            onCenterLocation={handleStartRoute}
            onAfluenciaClick={() => setViewMode('historial')}
            onNotificationsClick={() => setViewMode('avisos')}
            onMapClick={() => setViewMode('espera')}
            onProfileClick={() => setIsProfileOpen(true)}
            activeTab={
              viewMode === 'espera' ? 'map' : 
              viewMode === 'historial' ? 'afluencia' : 
              viewMode === 'avisos' ? 'notifications' :
              isProfileOpen ? 'profile' : ''
            }
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

      {/* MODAL DE SIMULACIÓN AUTOMÁTICA */}
      <ModalAlerta 
        mostrar={showSimModal}
        tipo="advertencia"
        titulo="Hardware no detectado"
        mensaje={`La unidad ${unidadActual} se encuentra offline. Se iniciará el recorrido en modo de simulación para mantener el servicio activo.`}
        alCerrar={() => ejecutarInicioRuta(true)}
      />
    </div>
  );
};

export default Conductor;
