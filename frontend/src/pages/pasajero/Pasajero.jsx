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
import { X } from 'lucide-react';

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

  // Estado para el centro del mapa controlado
  const [mapCenter, setMapCenter] = useState([19.4326, -99.1332]);
  const [mapBounds, setMapBounds] = useState(null);
  const [lastRadarUpdate, setLastRadarUpdate] = useState(0);
  const [rutasSuscritasIds, setRutasSuscritasIds] = useState([]);
  const [rutasSuscritasFull, setRutasSuscritasFull] = useState([]);
  const [defaultRutaId, setDefaultRutaId] = useState(null);
  const [activeRouteAlert, setActiveRouteAlert] = useState(null); // { rutaNombre, pos, unitId }


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

    socket.on('ruta_activa', (datos) => {
      const { rutaId, rutaNombre, pos, unidadId } = datos;
      if (rutasSuscritasIds.includes(rutaId?.toString())) {
        // Alerta Modal
        setActiveRouteAlert({ rutaNombre, pos, unidadId });
        
        // Notificación persistente en panel
        disparar({
          tipo: 'info',
          titulo: '¡Ruta Activa!',
          mensaje: `Unidades reales ya están circulando en la ruta "${rutaNombre}".`
        });
      }
    });

    return () => {
      socket.off('ubicacion_conductor');
      socket.off('ubicacion_simulada');
      socket.off('ruta_activa');
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
        const rutas = res.data || [];
        setRutasDisponibles(rutas);
        if (rutas.length > 0) {
          setDefaultRutaId(rutas[0]._id.toString());
        }
      } catch (e) {
        console.error("Error cargando diccionario de rutas:", e.message, e.response?.data);
      }
    };
    if (token) fetchRutas();
  }, [token]);

  // Cargar perfil completo para obtener suscripciones (rutasFavoritas)
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get('/usuarios/perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const full = res.data.data.rutasFavoritas || [];
        setRutasSuscritasFull(full);
        setRutasSuscritasIds(full.map(r => r._id || r));
      } catch (e) {
        console.error("Error al cargar perfil:", e);
      }
    };
    if (token) fetchPerfil();
  }, [token]);

  const handleGestionarSuscripcion = async (rutaId) => {
    try {
      const res = await api.post('/usuarios/favoritos', { rutaId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar estados locales tras el cambio
      const nuevasSuscripciones = res.data.rutasFavoritas;
      setRutasSuscritasIds(nuevasSuscripciones);
      
      // Re-sincronizar los objetos completos de rutas usando comparaciones de string
      const full = rutasDisponibles.filter(r => 
        nuevasSuscripciones.some(id => id.toString() === r._id.toString())
      );
      setRutasSuscritasFull(full);

      disparar({
        tipo: 'exito',
        titulo: 'Suscripción actualizada',
        mensaje: nuevasSuscripciones.includes(rutaId) ? 'Te has suscrito a la ruta.' : 'Suscripción eliminada.'
      });
    } catch (e) {
      dispararError('No se pudo actualizar la suscripción');
    }
  };

  // Lógica de Radar de Rutas Cercanas
  useEffect(() => {
    if (!userLocation || rutasDisponibles.length === 0) return;
    
    // Evitar disparos excesivos (cada 15 segundos máximo)
    const ahora = Date.now();
    if (ahora - lastRadarUpdate < 15000) return;

    const radioBusquedaKm = 0.5; // 500 metros
    
    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const rutasCercanas = rutasDisponibles.filter(ruta => {
      const tieneParadaCerca = ruta.paradas?.some(p => 
        calcularDistancia(userLocation[0], userLocation[1], p.latitud, p.longitud) < radioBusquedaKm
      );
      if (tieneParadaCerca) return true;

      return ruta.geometria?.some((g, index) => 
        index % 10 === 0 && 
        calcularDistancia(userLocation[0], userLocation[1], g.latitud, g.longitud) < radioBusquedaKm
      );
    });

    if (rutasCercanas.length > 0) {
      setLastRadarUpdate(ahora);
      disparar({
        tipo: 'info',
        titulo: 'Radar: Rutas Cercanas',
        mensaje: `Detectamos ${rutasCercanas.length} rutas cerca de ti: ${rutasCercanas.map(r => r.nombre).join(', ')}.`,
        duracion: 6000
      });
    }
  }, [userLocation, rutasDisponibles, lastRadarUpdate]);

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

  // Permisos de ubicación
  useEffect(() => {
    const hasPermission = localStorage.getItem('locationPermissionGranted') === 'true';
    if (hasPermission) {
      setUbicacionPermitida(true);
      setShowMapUserLocation(true);
      requestUserLocation();
    } else {
      setIsUbicacionModalOpen(true);
    }
  }, []);


  // Efecto para centrar el mapa en la simulación cuando se activa
  useEffect(() => {
    if (isSimulatedMode && vehicles.length > 0) {
      const simulado = vehicles.find(v => v.isSimulated);
      if (simulado && simulado.pos) {
        setMapCenter([...simulado.pos]);
        // No forzamos bounds aquí para permitir que el flyTo de Mapa.jsx haga el acercamiento suave
        disparar({
          tipo: 'info',
          titulo: 'Simulación Activa',
          mensaje: 'Centrando vista en unidades simuladas.',
          duracion: 3000
        });
      }
    }
  }, [isSimulatedMode, vehicles.length > 0]);


  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        setUserLocation(coords);
        setMapCenter(coords); // Centrar al inicio
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

  // Función auxiliar para buscar información de ruta de forma robusta
  const buscarRutaInfo = (vehiculo) => {
    if (!vehiculo || rutasDisponibles.length === 0) return null;
    
    const rid = vehiculo.rutaId || vehiculo.id_ruta;
    const nombre = vehiculo.rutaNombre || vehiculo.nombre_ruta;

    return rutasDisponibles.find(r => 
      (rid && r._id.toString() === rid.toString()) || 
      (nombre && r.nombre === nombre)
    );
  };

  const handleVehicleClick = (v) => {
    if (selectedVehicle?.id === v.id) {
      setSelectedVehicle(null);
      return;
    }

    setSelectedVehicle(v);
    
    // Centrar suavemente en el vehículo seleccionado
    if (v.pos) {
        setMapCenter([...v.pos]);
    }

    const rutaInfo = buscarRutaInfo(v);
    if (rutaInfo && rutaInfo.geometria) {
      const mappedLine = rutaInfo.geometria.map(p => [p.latitud, p.longitud]);
      setRouteLine(mappedLine);
      setParadas(rutaInfo.paradas || []);
      
      if (mappedLine.length > 0) {
          setMapBounds(mappedLine);
      }

      disparar({
        tipo: 'exito',
        titulo: 'Ruta Seleccionada',
        mensaje: `Visualizando: ${rutaInfo.nombre}`
      });
    }
  };

  const handleVerRuta = async () => {
    let rutaParaMostrar = buscarRutaInfo(selectedVehicle);

    // Fallback si no hay vehículo seleccionado o no se encontró su ruta específica
    if (!rutaParaMostrar && rutasDisponibles.length > 0) {
        // Intentar buscar la primera ruta con geometría que no sea la de simulación si es posible
        rutaParaMostrar = rutasDisponibles.find(r => r.geometria?.length > 0) || rutasDisponibles[0];
    }

    if (rutaParaMostrar && rutaParaMostrar.geometria) {
        const mappedLine = rutaParaMostrar.geometria.map(p => [p.latitud, p.longitud]);
        setRouteLine(mappedLine);
        setParadas(rutaParaMostrar.paradas || []);
        setMapBounds(mappedLine);
        disparar({ tipo: 'exito', titulo: 'Ruta trazada', mensaje: `Visualizando: ${rutaParaMostrar.nombre}` });
    } else {
        dispararError('Sin trazado', 'Esta unidad no tiene una ruta con geometría definida.');
    }
  };

  const handleLimpiarMapa = () => {
    setRouteLine([]);
    setParadas([]);
    setMapBounds(null);
    setSelectedVehicle(null);
    disparar({ tipo: 'info', titulo: 'Mapa Limpio', mensaje: 'Se ha quitado el trazado de la ruta.' });
  };

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
  };

  // Lógica de seguimiento de viaje
  useEffect(() => {
    if (userLocation && vehicles.length > 0 && !onboardedVehicle) {
      const closeVehicle = vehicles.find(v => {
        if (v.isSimulated) return false;
        const dist = Math.sqrt(Math.pow(v.pos[0] - userLocation[0], 2) + Math.pow(v.pos[1] - userLocation[1], 2));
        return dist < 0.0003; 
      });

      if (closeVehicle) {
        setOnboardedVehicle(closeVehicle);
        disparar({ tipo: 'info', titulo: '¡Viaje detectado!', mensaje: `Parece que has abordado la unidad ${closeVehicle.placa}.` });
      }
    } else if (onboardedVehicle && userLocation) {
      const v = vehicles.find(veh => veh.id === onboardedVehicle.id);
      if (v) {
        const dist = Math.sqrt(Math.pow(v.pos[0] - userLocation[0], 2) + Math.pow(v.pos[1] - userLocation[1], 2));
        if (dist > 0.001) { 
          setOnboardedVehicle(null);
          disparar({ tipo: 'exito', titulo: 'Viaje terminado', mensaje: 'Detectamos que has bajado de la unidad.' });
          setIsReportModalOpen(true); 
        }
      }
    }
  }, [userLocation, vehicles, onboardedVehicle]);

  return (
    <main className="flex flex-col h-screen w-screen relative bg-slate-200 overflow-hidden">
      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {activeTab === 'map' ? (
          <>
            {/* HEADER FLOTANTE - Solo en Mapa */}
            <div className="absolute top-4 left-5 right-5 flex justify-between items-center z-[500] pointer-events-none">
              <div
                onClick={() => setIsProfileOpen(true)}
                className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 pr-4 border border-white/50 cursor-pointer active:scale-95 transition-transform"
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

            <Mapa 
              tileTheme="standard"
              center={mapCenter}
              bounds={mapBounds}
              onMapClick={() => setSelectedVehicle(null)}
            >
               <CapaGeometria routeLine={routeLine} isDashed={false} />
               <CapaParadas stops={paradas} />
               <CapaVehiculos 
                 vehicles={
                   vehicles.filter(v => {
                     const rid = (v.rutaId || v.id_ruta)?.toString();
                     // La ruta por defecto siempre se muestra; las demás solo si hay suscripción
                     return rid === defaultRutaId || rutasSuscritasIds.includes(rid);
                   })
                 } 
                 selectedVehicleId={selectedVehicle?.id || onboardedVehicle?.id} 
                 onVehicleClick={handleVehicleClick} 
               />
            </Mapa>

            {/* BOTÓN LIMPIAR RUTA */}
            {routeLine.length > 0 && (
                <button
                    onClick={handleLimpiarMapa}
                    className="absolute top-20 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200 text-[10px] font-bold text-slate-700 pointer-events-auto active:scale-95 transition-all flex items-center gap-2"
                >
                    <X className="w-3 h-3 text-red-500" /> Limpiar Ruta
                </button>
            )}

            {/* LEYENDA */}
            <div className="absolute bottom-32 right-2 z-[1000] bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-slate-100 text-[10px] space-y-2 pointer-events-auto">
              <p className="font-bold text-slate-700 border-b pb-1 mb-1">Capacidad / Estado</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                <span className="text-slate-600">Baja</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#facc15]"></div>
                <span className="text-slate-600">Media</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                <span className="text-slate-600">Alta</span>
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
          <ListaNotificaciones 
            onSuscribir={handleGestionarSuscripcion}
            onVerRuta={(rid) => {
              const r = rutasDisponibles.find(ruta => ruta._id === rid);
              if (r) {
                setActiveTab('map');
                handleVehicleClick({ id_ruta: r._id, nombre_ruta: r.nombre });
              }
            }}
            suscripcionesIds={rutasSuscritasIds}
          />
        ) : (
          <div className="p-10 text-center text-slate-500">Próximamente...</div>
        )}
      </div>

      {/* NAVEGACIÓN INFERIOR */}
      <Navbar
        rol="PASAJERO"
        activeTab={isProfileOpen ? 'profile' : activeTab}
        onMapClick={() => setActiveTab('map')}
        onAfluenciaClick={() => setActiveTab('afluencia')}
        onNotificationsClick={() => setActiveTab('notifications')}
        onProfileClick={() => setIsProfileOpen(true)}
        onCenterLocation={() => {
          setActiveTab('map');
          if (userLocation) setMapCenter([...userLocation]);
          disparar({ tipo: 'info', titulo: 'Ubicación', mensaje: 'Centrando mapa en tu posición.' });
        }}
      />

      {/* MODALES */}
      <PanelPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        usuario={{ ...usuario, role: 'PASAJERO' }}
        rutasFavoritas={rutasSuscritasFull.filter(r => r._id.toString() !== defaultRutaId)}
        rutasDisponibles={rutasDisponibles.filter(r => r._id.toString() !== defaultRutaId)}
        onToggleSuscripcion={handleGestionarSuscripcion}
        onVerRutaFavorita={(r) => {
          setIsProfileOpen(false);
          handleVehicleClick({ id_ruta: r._id, nombre_ruta: r.nombre });
        }}
        onLogout={onLogout}
        onEditarPerfil={() => navigate('/perfil')}
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
        token={token}
      />

      {/* MODAL DE RUTA ACTIVA */}
      {activeRouteAlert && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-indigo-600 p-6 text-white flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Route className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black text-center">¡Ruta Activa!</h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm text-center leading-relaxed">
                Se han detectado unidades reales en movimiento en la ruta 
                <span className="font-bold text-slate-800"> "{activeRouteAlert.rutaNombre}"</span>.
              </p>
              
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (activeRouteAlert.pos) {
                      setMapCenter([...activeRouteAlert.pos]);
                      setActiveTab('map');
                      // Intentar seleccionar la unidad si es posible
                      const unit = vehicles.find(v => v.id === activeRouteAlert.unidadId);
                      if (unit) setSelectedVehicle(unit);
                    }
                    setActiveRouteAlert(null);
                  }}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> Ver en Mapa
                </button>
                <button
                  onClick={() => setActiveRouteAlert(null)}
                  className="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalAlerta
        mostrar={showSimAlert}
        tipo="advertencia"
        titulo="Modo de Simulación"
        mensaje="No hay unidades activas cercanas. Mostrando simulación ilustrativa."
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
