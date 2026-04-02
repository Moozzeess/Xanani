import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

// Componentes Comunes
import Mapa from "../../components/common/Mapa";
import Navbar from "../../components/common/Navbar";

// Componentes de Pasajero
import AlertaFlotante from "../../components/pasajero/AlertaFlotante";
import ReporteModal from "../../components/pasajero/ReporteModal";
import TarjetaBus from "../../components/pasajero/TarjetaBus";
import UbicacionModal from "../../components/common/UbicacionModal";
import { useAlertaGlobal } from "../../context/AlertaContext";



/**
 * Página principal del Pasajero.
 * Integra el mapa, navegación, alertas y detalles de vehículos.
 */
const Pasajero = () => {
  const navigate = useNavigate();
  const { cerrarSesion, usuario } = useAuth();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [centerOnUserTrigger, setCenterOnUserTrigger] = useState(0);
  const [routeLine, setRouteLine] = useState([]);

  // Estados de permisos de ubicación
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [ubicacionPermitida, setUbicacionPermitida] = useState(false);
  const [showMapUserLocation, setShowMapUserLocation] = useState(false);


  // Obtener inicial e información del usuario autenticado
  const username = usuario?.username || 'Pasajero';
  const userInitial = username.charAt(0).toUpperCase();

  // Datos simulados (Mock Data) que se actualizarán según la ubicación del usuario
  const [vehicles, setVehicles] = useState([]);

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

  const { dispararError } = useAlertaGlobal();

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        // Generar 4 vehículos con pequeños offsets aleatorios para simular cercanía
        const nearbyVehicles = [
          { id: 1, plate: 'MX-001', status: 'En ruta', color: 'bg-green-400', text: 'text-green-900', pillBg: 'bg-green-100 text-green-700', eta: '2 min', occ: 'Alta', pos: [latitude + 0.002, longitude + 0.002], driver: 'Juan P.' },
          { id: 2, plate: 'MX-002', status: 'Terminal', color: 'bg-amber-400', text: 'text-amber-900', pillBg: 'bg-amber-100 text-amber-700', eta: '5 min', occ: 'Baja', pos: [latitude - 0.003, longitude + 0.001], driver: 'Luis G.' },
          { id: 3, plate: 'MX-003', status: 'En ruta', color: 'bg-blue-400', text: 'text-blue-900', pillBg: 'bg-blue-100 text-blue-700', eta: '8 min', occ: 'Media', pos: [latitude + 0.001, longitude - 0.004], driver: 'Ana R.' },
          { id: 4, plate: 'MX-004', status: 'Sin señal', color: 'bg-purple-400', text: 'text-purple-900', pillBg: 'bg-purple-100 text-purple-700', eta: 'Desc.', occ: 'Media', pos: [latitude - 0.002, longitude - 0.002], driver: 'Pedro' },
        ];

        setVehicles(nearbyVehicles);
      }, (error) => {
        let mensaje = "No se pudo obtener tu ubicación actual.";
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = "No se puede acceder a la ubicación. Por favor, concede permisos en tu navegador.";
        }
        dispararError(mensaje, error.message, "Error de Ubicación");
        setIsUbicacionModalOpen(true); // Reabrir el modal en caso de error
        setDefaultVehicles();
      });
    } else {
      dispararError("Tu navegador no soporta geolocalización.", "navigator.geolocation is undefined", "Error de Sistema");
      setDefaultVehicles();
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
    navigate("/", { replace: true });
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setRouteLine([]); // Limpiar ruta previa al ver otra combi
  };

  const handleVerRuta = async () => {
    try {
      // Como los vehículos actualmente son Mocks, obtendremos las rutas de la DB
      // para demostrar el trazado dinámico real.
      setSelectedVehicle(null); // Ocultar tarjeta para que el usuario vea el mapa
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/routes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        // Tomaremos la primera ruta de la DB, idealmente la que tenga geometría
        const rutaReal = data.find(r => r.geometria && r.geometria.length > 0) || data[0];
        
        if (rutaReal && rutaReal.geometria && rutaReal.geometria.length > 0) {
          const mappedLine = rutaReal.geometria.map(p => [p.latitud, p.longitud]);
          setRouteLine(mappedLine);
          dispararError('Ruta Cargada', `Se trazó la ruta: ${rutaReal.nombre}`, 'Exito');
        } else {
          dispararError('No hay trazado', 'La ruta seleccionada no tiene geometría asignada.');
        }
      } else {
        dispararError('Sin Rutas', 'No hay rutas guardadas en la base de datos.');
      }
    } catch (error) {
       console.error("Error obteniendo ruta real", error);
       dispararError('Error de Conexión', 'No se pudo cargar la ruta del servidor.');
    }
  };

  const handleOpenReport = () => {
    setIsReportModalOpen(true);
  };

  return (
    <main className="flex flex-col h-screen w-screen relative bg-slate-200 overflow-hidden">
      {/* HEADER FLOTANTE (Perfil de Usuario) */}
      <div className="fixed top-0 left-0 right-0 px-5 top-4 pb-4 flex justify-between items-center z-[500] pointer-events-none">
        <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 pr-4 mt-2 border border-white/50">
          <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {userInitial}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Hola</span>
            <span className="text-xs font-bold text-slate-800">{username}</span>
          </div>
        </div>
      </div>

      {/* MAPA PRINCIPAL */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <Mapa
          vehicles={vehicles}
          onVehicleClick={handleVehicleClick}
          showUserLocation={showMapUserLocation}
          centerOnUserTrigger={centerOnUserTrigger}
          routeLine={routeLine}
        />

        {/* BOTÓN DE ALERTA FLOTANTE */}
        <AlertaFlotante onClick={handleOpenReport} />
      </div>

      {/* NAVEGACIÓN INFERIOR */}
      <Navbar
        onLogout={onLogout}
        onCenterLocation={() => setCenterOnUserTrigger(prev => prev + 1)}
      />

      {/* DETAILS SHEET (Bottom Sheet) */}
      <TarjetaBus
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onReport={handleOpenReport}
        onVerRuta={handleVerRuta}
      />

      {/* MODAL DE REPORTE */}
      <ReporteModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* MODAL DE UBICACION */}
      <UbicacionModal
        isOpen={isUbicacionModalOpen}
        onClose={() => {
          setIsUbicacionModalOpen(false);
          setDefaultVehicles();
        }}
        onAccept={handleAcceptLocation}
      />
    </main>
  );
};

export default Pasajero;
