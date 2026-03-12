import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import { MarcadorBus, EstadoBus, crearMarcadorBus } from '../components/common/MarcadorBus';
import TarjetaInformativa from '../components/pasajero/TarjetaInformativa';
import UbicacionModal from '../components/common/UbicacionModal';
import { obtenerRutaPorCalles } from '../services/osrmService';
import { useAlertaGlobal } from '../context/AlertaContext';

/**
 * Página de aterrizaje (Landing) para pasajeros en modo invitado.
 * Muestra un mapa con la ubicación del usuario y el vehículo más cercano,
 * permitiendo la visualización de rutas en tiempo real.
 */
const LandingPasajero: React.FC = () => {
  const { dispararError } = useAlertaGlobal();
  const navegar = useNavigate();
  const mapaRef = useRef<L.Map | null>(null);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [estadoBusActual] = useState<EstadoBus>(EstadoBus.ACTIVO);
  const marcadorBusRef = useRef<MarcadorBus | null>(null);
  const marcadorUsuarioRef = useRef<L.Marker | null>(null);
  const polilineaRef = useRef<L.Polyline | null>(null);
  const [estaAbiertoModalUbicacion, setEstaAbiertoModalUbicacion] = useState(false);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<[number, number]>([19.4326, -99.1332]);

  // Efecto para inicializar el mapa y gestionar permisos de ubicación
  useEffect(() => {
    // 1. Inicializar Mapa (sin vista aún para evitar parpadeo en CDMX)
    if (contenedorRef.current && !mapaRef.current) {
      mapaRef.current = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        minZoom: 13, // Restricción de alejamiento
        maxZoom: 18,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapaRef.current);
    }

    // 2. Priorizar Geolocalización Inmediata
    const permisoConcedido = localStorage.getItem('locationPermissionGranted') === 'true';
    if (permisoConcedido) {
      solicitarUbicacionUsuario();
    } else {
      // Si no hay permiso manual previo, centrar en lo que tengamos y abrir modal
      mapaRef.current?.setView(ubicacionUsuario, 15);
      actualizarElementosMapa(ubicacionUsuario[0], ubicacionUsuario[1]);
      setEstaAbiertoModalUbicacion(true);
    }

    return () => {
      if (mapaRef.current) {
        mapaRef.current.remove();
        mapaRef.current = null;
      }
    };
  }, []);

  /**
   * Actualiza los elementos visuales del mapa (marcadores y rutas).
   * 
   * @param {number} latitud - Latitud de la ubicación.
   * @param {number} longitud - Longitud de la ubicación.
   */
  const actualizarElementosMapa = async (latitud: number, longitud: number) => {
    if (!mapaRef.current) return;

    const posUsuario: [number, number] = [latitud, longitud];
    const posBus: [number, number] = [latitud + 0.003, longitud + 0.003];

    // Restringir el mapa a un rango de 1.5km alrededor del usuario (Geofence)
    const suroeste = L.latLng(latitud - 0.015, longitud - 0.015);
    const noreste = L.latLng(latitud + 0.015, longitud + 0.015);
    const limites = L.latLngBounds(suroeste, noreste);
    mapaRef.current.setMaxBounds(limites);

    // 1. Marcador Usuario
    const iconoUsuario = L.divIcon({
      className: '',
      html: `<div style="display:flex;align-items:center;justify-content:center;"><div class="user-pulse"></div><div class="user-dot"></div></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (marcadorUsuarioRef.current) {
      marcadorUsuarioRef.current.setLatLng(posUsuario);
    } else {
      marcadorUsuarioRef.current = L.marker(posUsuario, { icon: iconoUsuario }).addTo(mapaRef.current);
    }

    // 2. Marcador Bus
    if (marcadorBusRef.current) {
      marcadorBusRef.current.removerDelMapa();
    }
    marcadorBusRef.current = crearMarcadorBus(posBus, estadoBusActual, mapaRef.current);

    // 3. Polilínea por calles (Utilizando servicio común)
    const coordenadas = await obtenerRutaPorCalles(posUsuario, posBus);
    if (polilineaRef.current) {
      polilineaRef.current.setLatLngs(coordenadas);
    } else {
      polilineaRef.current = L.polyline(coordenadas, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 12'
      }).addTo(mapaRef.current);
    }

    mapaRef.current.setView(posUsuario, 16, { animate: true });
  };

  /**
   * Solicita la ubicación actual del usuario a través de la API del navegador.
   */
  const solicitarUbicacionUsuario = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((posicion) => {
        const { latitude, longitude } = posicion.coords;
        setUbicacionUsuario([latitude, longitude]);
        actualizarElementosMapa(latitude, longitude);
      }, (error) => {
        let mensaje = "No se pudo obtener tu ubicación actual.";
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = "No se puede acceder a la ubicación. Por favor, concede permisos en tu navegador.";
        }
        dispararError(mensaje, error.message, "Error de Ubicación");
        setEstaAbiertoModalUbicacion(true); // Reabrir el modal en caso de error
      });
    }
  };

  /**
   * Manejador para cuando el usuario acepta compartir su ubicación.
   */
  const manejarAceptarUbicacion = () => {
    localStorage.setItem('locationPermissionGranted', 'true');
    setEstaAbiertoModalUbicacion(false);
    solicitarUbicacionUsuario();
  };


  // Efecto para sincronizar cambios de estado del autobús
  useEffect(() => {
    if (marcadorBusRef.current) {
      marcadorBusRef.current.actualizarEstado(estadoBusActual);
    }
  }, [estadoBusActual]);

  return (
    <div className="passenger-body" ref={contenedorRef}>
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

      {/* MAPA */}
      <div id="map"></div>

      {/* TARJETA INFORMATIVA */}
      <TarjetaInformativa
        unidad="001"
        ocupabilidad="Alta"
        estado={estadoBusActual}
        distancia="250 metros"
        ultimaActualizacion="ahora"
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
