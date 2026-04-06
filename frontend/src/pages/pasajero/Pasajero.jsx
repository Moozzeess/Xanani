import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { useAlertaGlobal } from '../../context/AlertaContext';

// Hooks de dominio
import { useVehiculos } from '../../hooks/useVehiculos';
import { useSeguimiento } from '../../hooks/useSeguimiento';
import { usePreferencias } from '../../hooks/usePreferencias';

// Componentes comunes
import Mapa from '../../components/common/Mapa';
import UbicacionModal from '../../components/common/UbicacionModal';

// Componentes del pasajero
import NavbarPasajero from '../../components/pasajero/NavbarPasajero';
import PanelDescubrimiento from '../../components/pasajero/PanelDescubrimiento';
import TarjetaBus from '../../components/pasajero/TarjetaBus';
import PanelSeguimiento from '../../components/pasajero/PanelSeguimiento';
import ReporteModal from '../../components/pasajero/ReporteModal';
import ModalOcupacion from '../../components/pasajero/ModalOcupacion';
import ModalSuscripcion from '../../components/pasajero/ModalSuscripcion';
import ModalExperiencia from '../../components/pasajero/ModalExperiencia';
import PanelPerfil from '../../components/pasajero/PanelPerfil';
import PanelRutas from '../../components/pasajero/PanelRutas';
import ModoDemostracion from '../../components/pasajero/ModoDemostracion';

const API_URL = `http://${window.location.hostname}:4000/api`;

/**
 * Página principal del Pasajero.
 * Orquesta todos los módulos de interacción: descubrimiento, seguimiento,
 * crowdsourcing, experiencia post-viaje, perfil y modo demostración.
 */
const Pasajero = () => {
  const navigate = useNavigate();
  const { cerrarSesion, usuario } = useAuth();
  const { dispararError } = useAlertaGlobal();

  // ── Hooks de dominio ──────────────────────────────────────────────────────
  const { vehiculos, todos, cargando, sinUnidades, filtros, setFiltros, recargar } = useVehiculos();
  const seguimiento = useSeguimiento();
  const preferencias = usePreferencias();

  // ── Estado UI ─────────────────────────────────────────────────────────────
  const [tabActivo, setTabActivo] = useState('mapa');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [routeLine, setRouteLine] = useState([]);
  const [unidadesDemoMapa, setUnidadesDemoMapa] = useState([]);
  const [modoDemoActivo, setModoDemoActivo] = useState(false);
  const [notificacionesActivas, setNotificacionesActivas] = useState(false);

  // Permisos de ubicación
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [showMapUserLocation, setShowMapUserLocation] = useState(false);

  // Modales
  const [modalReporte, setModalReporte] = useState(false);
  const [modalOcupacion, setModalOcupacion] = useState(false);
  const [modalSuscripcion, setModalSuscripcion] = useState(false);
  const [modalExperiencia, setModalExperiencia] = useState(false);
  const [panelPerfil, setPanelPerfil] = useState(false);

  // Rutas cargadas para suscripción
  const [rutasDisponibles, setRutasDisponibles] = useState([]);

  // ── Inicialización de permisos de ubicación ───────────────────────────────
  useEffect(() => {
    const tienePermiso = localStorage.getItem('locationPermissionGranted') === 'true';
    if (tienePermiso) {
      setShowMapUserLocation(true);
    } else {
      setIsUbicacionModalOpen(true);
    }
  }, []);

  // ── Detección automática de abordaje ─────────────────────────────────────
  useEffect(() => {
    if (seguimiento.abordajeDetectado && !modalExperiencia) {
      setModalExperiencia(true);
    }
  }, [seguimiento.abordajeDetectado]);

  // ── Actualizar posición de la unidad seguida en el hook ───────────────────
  useEffect(() => {
    if (!seguimiento.unidadSeguida) return;
    const unidadActual = todos.find((v) => v._id === seguimiento.unidadSeguida._id);
    if (unidadActual?.posicion) {
      seguimiento.actualizarPosicionUnidad(unidadActual.posicion, unidadActual.velocidad);
    }
  }, [todos, seguimiento.unidadSeguida]);

  // ── Cargar rutas para modal de suscripción ────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/routes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setRutasDisponibles(await res.json());
      } catch {/* no crítico */}
    };
    cargar();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAceptarUbicacion = () => {
    localStorage.setItem('locationPermissionGranted', 'true');
    setShowMapUserLocation(true);
    setIsUbicacionModalOpen(false);
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  const handleVehiculoClick = (v) => {
    if (seguimiento.unidadSeguida) return; // No cambiar si está siguiendo
    setVehiculoSeleccionado(v);
    setRouteLine([]);
  };

  const handleMapClick = useCallback(() => {
    // Tap en zona vacía limpia la selección
    if (!seguimiento.unidadSeguida) {
      setVehiculoSeleccionado(null);
    }
  }, [seguimiento.unidadSeguida]);

  const handleMapLongPress = useCallback((_latlng) => {
    // El círculo visual ya lo dibuja el Mapa; aquí se puede mostrar info adicional
  }, []);

  const handleVerRuta = async () => {
    try {
      setVehiculoSeleccionado(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/routes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const rutaConGeometria = data.find((r) => r.geometria?.length > 0);

      if (rutaConGeometria) {
        const linea = rutaConGeometria.geometria.map((p) => [p.latitud, p.longitud]);
        setRouteLine(linea);
        dispararError('Ruta cargada', `Ruta: ${rutaConGeometria.nombre}`, 'Exito');
      } else {
        dispararError('Sin trazado', 'La ruta no tiene geometría asignada.', 'Info');
      }
    } catch (error) {
      dispararError('Error de conexión', 'No se pudo cargar la ruta.', 'Error');
    }
  };

  const handleSeguir = (vehiculo) => {
    setVehiculoSeleccionado(null);
    seguimiento.seguir(vehiculo);
    dispararError('Siguiendo unidad', `Siguiendo a ${vehiculo.placa}`, 'Info');
  };

  const handleDetenerSeguimiento = () => {
    seguimiento.detener();
    setModoDemoActivo(false);
  };

  const handleCalificacion = ({ calificacion, encontroAsiento }) => {
    const unidad = seguimiento.unidadSeguida;
    preferencias.agregarViaje({
      fecha: new Date().toLocaleDateString('es-MX'),
      placa: unidad?.placa || 'Desconocida',
      ruta: unidad?.ruta?.nombre,
      calificacion,
    });
    seguimiento.detener();
  };

  const handleVerRutaFavorita = async (ruta) => {
    setPanelPerfil(false);
    const rutaCompleta = rutasDisponibles.find((r) => r._id === ruta.id);
    if (rutaCompleta?.geometria?.length) {
      setRouteLine(rutaCompleta.geometria.map((p) => [p.latitud, p.longitud]));
      setTabActivo('mapa');
    }
  };

  const handleCentrarParada = (parada) => {
    setPanelPerfil(false);
    setCenterTrigger((p) => p + 1);
    setTabActivo('mapa');
  };

  // Vehículos que se muestran en el mapa: reales o demo
  const vehiculosEnMapa = modoDemoActivo ? unidadesDemoMapa : vehiculos;

  const idVehiculoSeguido = seguimiento.unidadSeguida?._id || seguimiento.unidadSeguida?.id;

  const username = usuario?.username || 'Pasajero';
  const userInitial = username.charAt(0).toUpperCase();

  return (
    <main className="flex flex-col h-screen w-screen relative bg-slate-200 overflow-hidden">

      {/* ── HEADER FLOTANTE ─────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 pt-4 px-5 pb-2 flex justify-between items-center z-[500] pointer-events-none">
        <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 pr-4 mt-1 border border-white/50">
          <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {userInitial}
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Hola</span>
            <span className="text-xs font-bold text-slate-800">{username}</span>
          </div>
        </div>
      </div>

      {/* ── MAPA PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <Mapa
          vehicles={vehiculosEnMapa}
          onVehicleClick={handleVehiculoClick}
          onMapClick={handleMapClick}
          onMapLongPress={handleMapLongPress}
          showUserLocation={showMapUserLocation}
          centerOnUserTrigger={centerTrigger}
          routeLine={routeLine}
          vehiculoEnSeguimientoId={idVehiculoSeguido}
        />

        {/* Panel de descubrimiento (flotante sobre mapa) */}
        {tabActivo === 'mapa' && (
          <PanelDescubrimiento
            totalUnidades={vehiculos.length}
            sinUnidades={sinUnidades && !modoDemoActivo}
            filtros={filtros}
            onCambiarFiltros={setFiltros}
            onVerDemo={() => setModoDemoActivo(true)}
            onActivarAlerta={() => setModalSuscripcion(true)}
          />
        )}

        {/* Panel de rutas (overlay sobre mapa) */}
        {tabActivo === 'rutas' && (
          <PanelRutas
            rutasFavoritas={preferencias.rutasFavoritas}
            onToggleFavorita={preferencias.toggleRutaFavorita}
            esRutaFavorita={preferencias.esRutaFavorita}
            onVerRuta={(ruta) => {
              if (ruta.geometria?.length) {
                setRouteLine(ruta.geometria.map((p) => [p.latitud, p.longitud]));
                setTabActivo('mapa');
              }
            }}
          />
        )}

        {/* Modo demostración */}
        <ModoDemostracion
          activo={modoDemoActivo}
          onActivarAlerta={() => { setModoDemoActivo(false); setModalSuscripcion(true); }}
          onSalir={() => setModoDemoActivo(false)}
          onUnidadesDemoChange={setUnidadesDemoMapa}
        />
      </div>

      {/* ── NAVBAR DEL PASAJERO ─────────────────────────────────────────── */}
      <NavbarPasajero
        tabActivo={tabActivo}
        onCambiarTab={(tab) => {
          if (tab === 'perfil') {
            setPanelPerfil(true);
          } else if (tab === 'alertas') {
            setModalSuscripcion(true);
          } else {
            setTabActivo(tab);
          }
        }}
        onCentrarUbicacion={() => setCenterTrigger((p) => p + 1)}
      />

      {/* ── TARJETA DE DETALLE DE BUS ────────────────────────────────────── */}
      {!seguimiento.unidadSeguida && (
        <TarjetaBus
          vehicle={vehiculoSeleccionado}
          onClose={() => setVehiculoSeleccionado(null)}
          onReport={() => setModalReporte(true)}
          onVerRuta={handleVerRuta}
          onSeguir={handleSeguir}
        />
      )}

      {/* ── HUD DE SEGUIMIENTO ACTIVO ───────────────────────────────────── */}
      {seguimiento.unidadSeguida && (
        <PanelSeguimiento
          unidad={seguimiento.unidadSeguida}
          progreso={seguimiento.progresoRuta}
          enMovimiento={seguimiento.enMovimiento}
          onDetener={handleDetenerSeguimiento}
        />
      )}

      {/* ── MODALES ───────────────────────────────────────────────────────── */}
      <ReporteModal
        isOpen={modalReporte}
        onClose={() => setModalReporte(false)}
        unidadId={vehiculoSeleccionado?._id}
      />

      <ModalOcupacion
        isOpen={modalOcupacion}
        onClose={() => setModalOcupacion(false)}
        unidad={vehiculoSeleccionado}
      />

      <ModalSuscripcion
        isOpen={modalSuscripcion}
        onClose={() => setModalSuscripcion(false)}
        rutas={rutasDisponibles}
      />

      <ModalExperiencia
        isOpen={modalExperiencia}
        unidad={seguimiento.unidadSeguida}
        onClose={() => {
          setModalExperiencia(false);
          seguimiento.resetearAbordaje();
        }}
        onCalificar={handleCalificacion}
      />

      {/* ── PANEL DE PERFIL (DRAWER) ─────────────────────────────────────── */}
      <PanelPerfil
        isOpen={panelPerfil}
        onClose={() => setPanelPerfil(false)}
        usuario={usuario}
        historial={preferencias.historial}
        rutasFavoritas={preferencias.rutasFavoritas}
        paradasFavoritas={preferencias.paradasFavoritas}
        notificacionesActivas={notificacionesActivas}
        onToggleNotificaciones={() => setNotificacionesActivas((p) => !p)}
        onLimpiarHistorial={preferencias.limpiarHistorial}
        onVerRutaFavorita={handleVerRutaFavorita}
        onCentrarParada={handleCentrarParada}
        onLogout={handleLogout}
      />

      {/* ── MODAL DE PERMISO DE UBICACIÓN ───────────────────────────────── */}
      <UbicacionModal
        isOpen={isUbicacionModalOpen}
        onClose={() => {
          setIsUbicacionModalOpen(false);
        }}
        onAccept={handleAceptarUbicacion}
      />
    </main>
  );
};

export default Pasajero;
