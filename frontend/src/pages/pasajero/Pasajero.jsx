import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../services/api";

// Componentes Comunes
import Mapa from "../../components/common/Mapa";
import Navbar from "../../components/common/Navbar";

// Componentes de Pasajero
import AlertaFlotante from "../../components/pasajero/AlertaFlotante";
import ReporteModal from "../../components/pasajero/ReporteModal";
import TarjetaBus from "../../components/pasajero/TarjetaBus";
import UbicacionModal from "../../components/common/UbicacionModal";
import { useAlertaGlobal } from "../../context/AlertaContext";
import { useSocket } from "../../hooks/useSocket";
import ModalAlerta from "../../components/common/ModalAlerta";
import PanelPerfil from "../../components/common/PanelPerfil";

// Capas de Mapa (Modular)
import CapaGeometria from "../../components/common/mapa/CapaGeometria";
import CapaVehiculos from "../../components/common/mapa/CapaVehiculos";
import CapaParadas from "../../components/common/mapa/CapaParadas";

import ListaNotificaciones from "../../components/pasajero/ListaNotificaciones";
import PanelAfluencia from "../../components/common/estadisticas/PanelAfluencia";



/**
 * Página principal del Pasajero.
 * Integra el mapa, navegación, alertas y detalles de vehículos.
 */
const Pasajero = () => {
  const navigate = useNavigate();
  const { cerrarSesion, usuario, token } = useAuth();
  const { disparar, dispararError } = useAlertaGlobal();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [centerOnUserTrigger, setCenterOnUserTrigger] = useState(0);
  const [routeLine, setRouteLine] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [paradas, setParadas] = useState([]);
  const { socket } = useSocket();

  // Estados de simulación y tracking
  const [showSimAlert, setShowSimAlert] = useState(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [onboardedVehicle, setOnboardedVehicle] = useState(null);

  // Estados de permisos de ubicación
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showMapUserLocation, setShowMapUserLocation] = useState(false);
  const [isUbicacionPermitida, setUbicacionPermitida] = useState(false);
  const [rutasDisponibles, setRutasDisponibles] = useState([]);


  // Obtener inicial e información del usuario autenticado
  const username = usuario?.username || 'Pasajero';
  const userInitial = username.charAt(0).toUpperCase();

  // Conexión Socket - Manejo de ubicaciones
  useEffect(() => {
    if (!socket) return;

    const handleUbicacion = (datos) => {
      setVehicles(prev => {
        const id = datos.id || datos.placa;
        const index = prev.findIndex(v => v.id === id);

        let colorClass = 'bg-blue-400';
        let occLabel = 'Simulado';

        if (!datos.isSimulated) {
          const pct = (datos.ocupacionActual / datos.capacidadMaxima) * 100;
          if (pct < 33) { colorClass = 'bg-green-400'; occLabel = 'Baja'; }
          else if (pct < 66) { colorClass = 'bg-yellow-400'; occLabel = 'Media'; }
          else { colorClass = 'bg-red-400'; occLabel = 'Alta'; }
        }

        const newVehicle = {
          ...datos,
          id,
          color: colorClass,
          occ: occLabel,
          pos: datos.pos
        };

        if (index === -1) return [...prev, newVehicle];
        const newVehicles = [...prev];
        newVehicles[index] = newVehicle;
        return newVehicles;
      });
    };

    socket.on('ubicacion_conductor', (datos) => {
      setIsSimulatedMode(false);
      handleUbicacion(datos);
    });

    socket.on('ubicacion_simulada', (datos) => {
      handleUbicacion(datos);
    });

    return () => {
      socket.off('ubicacion_conductor');
      socket.off('ubicacion_simulada');
    };
  }, [socket]);

  // Cargar lista de rutas al iniciar para vinculación rápida
  useEffect(() => {
    const fetchRutas = async () => {
      try {
        const res = await api.get('/rutas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Rutas cargadas exitosamente:", res.data?.length);
        setRutasDisponibles(res.data || []);
      } catch (e) {
        console.error("Error cargando diccionario de rutas:", e.message, e.response?.data);
      }
    };
    if (token) fetchRutas();
  }, [token]);

  // Verificar si hay unidades reales, si no, avisar simulación
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasReal = vehicles.some(v => !v.isSimulated);
      if (!hasReal && !isSimulatedMode) {
        setShowSimAlert(true);
        setIsSimulatedMode(true);
        if (socket) socket.emit('solicitar_simulacion');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [vehicles, isSimulatedMode, socket]);

  // Generar vehículos cerca del usuario cuando se obtiene su ubicación
  useEffect(() => {
    // Verificar si el usuario ya otorgó permiso o si necesitamos mostrar el modal
    const hasPermission = localStorage.getItem('locationPermissionGranted') === 'true';

    if (hasPermission) {
      setUbicacionPermitida(true);
      setShowMapUserLocation(true);
      requestUserLocation();
    } else {
      setIsUbicacionModalOpen(true);
    }
  }, []);


  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      }, (error) => {
        let mensaje = "No se pudo obtener tu ubicación actual.";
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = "No se puede acceder a la ubicación. Por favor, concede permisos en tu navegador.";
        }
        dispararError(mensaje, error.message, "Error de Ubicación");
        setIsUbicacionModalOpen(true);
      });
    } else {
      dispararError("Tu navegador no soporta geolocalización.", "navigator.geolocation is undefined", "Error de Sistema");
    }
  };

  const setDefaultVehicles = () => {
    // Fallback a ubicación por defecto (Ciudad de México) si falla el permiso
    const defaultLat = 19.4326;
    const defaultLon = -99.1332;
    setVehicles([
      { id: 1, plate: 'MX-001', status: 'En ruta', color: 'bg-green-400', text: 'text-green-900', pillBg: 'bg-green-100 text-green-700', eta: '2 min', occ: 'Alta', pos: [defaultLat + 0.002, defaultLon + 0.002], driver: 'Juan P.' },
      { id: 2, plate: 'MX-002', status: 'Terminal', color: 'bg-amber-400', text: 'text-amber-900', pillBg: 'bg-amber-100 text-amber-700', eta: '5 min', occ: 'Baja', pos: [defaultLat - 0.003, defaultLon + 0.001], driver: 'Luis G.' },
    ]);
  };

  const handleAcceptLocation = () => {
    localStorage.setItem('locationPermissionGranted', 'true');
    setUbicacionPermitida(true);
    setIsUbicacionModalOpen(false);
    setShowMapUserLocation(true);
    requestUserLocation();
  };


  const onLogout = () => {
    cerrarSesion();
    navigate("/LandingPage", { replace: true });
  };

  const [activeTab, setActiveTab] = useState('map');

  const handleVehicleClick = (v) => {
    setSelectedVehicle(v);

    // Trazado automático al hacer clic en un vehículo
    if (v.rutaId && rutasDisponibles.length > 0) {
      const rutaInfo = rutasDisponibles.find(r => r._id === v.rutaId);
      if (rutaInfo && rutaInfo.geometria) {
        const mappedLine = rutaInfo.geometria.map(p => [p.latitud, p.longitud]);
        setRouteLine(mappedLine);
        if (rutaInfo.paradas) setParadas(rutaInfo.paradas);
      }
    } else {
      setRouteLine([]);
    }
  };

  const handleVerRuta = async () => {
    try {
      setSelectedVehicle(null);
      const res = await api.get('/rutas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;

      if (data && data.length > 0) {
        // Buscar la ruta que coincida con el vehículo seleccionado o la primera con geometría
        const rutaReal = data.find(r => r.geometria && r.geometria.length > 0) || data[0];

        if (rutaReal && rutaReal.geometria && rutaReal.geometria.length > 0) {
          const mappedLine = rutaReal.geometria.map(p => [p.latitud, p.longitud]);
          setRouteLine(mappedLine);

          if (rutaReal.paradas) {
            setParadas(rutaReal.paradas);
          }

          disparar({
            tipo: 'exito',
            titulo: 'Ruta trazada',
            mensaje: `Visualizando trazado de: ${rutaReal.nombre}`
          });
        } else {
          dispararError('No hay trazado', 'La ruta seleccionada no tiene geometría asignada.');
        }
      }
    } catch (error) {
      console.error("Error detallado en handleVerRuta:", error.message, error.response?.data);
      dispararError('Error de Conexión', `No se pudo cargar la ruta: ${error.message}`);
    }
  };

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
  };

  // Lógica de seguimiento de viaje
  useEffect(() => {
    if (userLocation && vehicles.length > 0 && !onboardedVehicle) {
      // Detectar si el usuario está muy cerca de una unidad real
      const closeVehicle = vehicles.find(v => {
        if (v.isSimulated) return false;
        const dist = Math.sqrt(Math.pow(v.pos[0] - userLocation[0], 2) + Math.pow(v.pos[1] - userLocation[1], 2));
        return dist < 0.0003; // ~30 metros
      });

      if (closeVehicle) {
        setOnboardedVehicle(closeVehicle);
        dispararError('¡Viaje detectado!', `Parece que has abordado la unidad ${closeVehicle.placa}. Estamos siguiendo tu viaje.`, 'info');
      }
    } else if (onboardedVehicle && userLocation) {
      // Detectar si el usuario se bajó (se alejó demasiado del vehículo detectado)
      const v = vehicles.find(veh => veh.id === onboardedVehicle.id);
      if (v) {
        const dist = Math.sqrt(Math.pow(v.pos[0] - userLocation[0], 2) + Math.pow(v.pos[1] - userLocation[1], 2));
        if (dist > 0.001) { // ~100 metros de separación
          setOnboardedVehicle(null);
          dispararError('Viaje terminado', 'Detectamos que has bajado de la unidad. Por favor, califica tu experiencia.', 'exito');
          setIsReportModalOpen(true); // Abrir reporte para calificar (Modo Experiencia)
        }
      }
    }
  }, [userLocation, vehicles, onboardedVehicle]);

  return (
    <main className="flex flex-col h-screen w-screen relative bg-slate-200 overflow-hidden">
      {/* HEADER FLOTANTE (Perfil de Usuario) */}
      <div className="fixed top-0 left-0 right-0 px-5 top-4 pb-4 flex justify-between items-center z-[500] pointer-events-none">
        <div
          onClick={() => setIsProfileOpen(true)}
          className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 pr-4 mt-2 border border-white/50 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {userInitial}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Hola</span>
            <span className="text-xs font-bold text-slate-800">{username}</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL SEGÚN TAB */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {activeTab === 'map' ? (
          <>
            <Mapa 
              tileTheme="standard"
              onMapClick={(latlng) => console.log("Click en mapa:", latlng)}
            >
               <CapaGeometria routeLine={routeLine} isDashed={false} />
               <CapaParadas stops={paradas} />
               <CapaVehiculos 
                 vehicles={vehicles} 
                 selectedVehicleId={onboardedVehicle?.id} 
                 onVehicleClick={handleVehicleClick} 
               />
            </Mapa>

            {/* LEYENDA DE COLORES */}
            <div className="absolute bottom-120 right-2 z-[1000] bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-slate-100 text-[10px] space-y-2">
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

            <AlertaFlotante onClick={handleOpenReport} />
          </>
        ) : activeTab === 'afluencia' ? (
          <PanelAfluencia />
        ) : activeTab === 'notifications' ? (
          <ListaNotificaciones />
        ) : (
          <div className="p-10">Más secciones próximamente...</div>
        )}
      </div>

      {/* NAVEGACIÓN INFERIOR */}
      <Navbar
        activeTab={activeTab}
        onMapClick={() => setActiveTab('map')}
        onAfluenciaClick={() => setActiveTab('afluencia')}
        onNotificationsClick={() => setActiveTab('notifications')}
        onProfileClick={() => setIsProfileOpen(true)}
        onCenterLocation={() => {
          setActiveTab('map');
          setCenterOnUserTrigger(prev => prev + 1);
        }}
      />

      {/* COMPONENTES LATERALES Y MODALES */}
      <PanelPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        usuario={usuario}
        onLogout={onLogout}
        onEditarPerfil={() => navigate('/perfil')} // Ejemplo: Redirigir a settings
      />

      <TarjetaBus
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onReport={handleOpenReport}
        onVerRuta={handleVerRuta}
      />

      <ReporteModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <ModalAlerta
        mostrar={showSimAlert}
        tipo="advertencia"
        titulo="Modo de Simulación"
        mensaje="No hay unidades activas cercanas a tu ubicación, se procederá a un modo de simulación ilustrativo."
        alCerrar={() => setShowSimAlert(false)}
      />

      <UbicacionModal
        isOpen={isUbicacionModalOpen}
        onClose={() => setIsUbicacionModalOpen(false)}
        onAccept={handleAcceptLocation}
      />
    </main>
  );
};

export default Pasajero;
