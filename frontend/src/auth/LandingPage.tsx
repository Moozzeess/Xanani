import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import { MarcadorBus, EstadoBus, crearMarcadorBus } from '../components/common/MarcadorBus';
import TarjetaInformativa from '../components/pasajero/TarjetaInformativa';
import UbicacionModal from '../components/common/UbicacionModal';
import { obtenerRutaPorCalles } from '../services/osrmService';




const PassengerLanding: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [estadoBusActual] = useState<EstadoBus>(EstadoBus.ACTIVO);
  const marcadorBusRef = useRef<MarcadorBus | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([19.4326, -99.1332]);



  useEffect(() => {
    // 1. Inicializar Mapa (sin vista aún para evitar parpadeo en CDMX)
    if (containerRef.current && !mapRef.current) {
      mapRef.current = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        minZoom: 13, // Restricción de alejamiento
        maxZoom: 18,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }

    // 2. Priorizar Geolocalización Inmediata
    const hasPermission = localStorage.getItem('locationPermissionGranted') === 'true';
    if (hasPermission) {
      requestUserLocation();
    } else {
      // Si no hay permiso manual previo, centrar en lo que tengamos y abrir modal
      mapRef.current?.setView(userLocation, 15);
      updateMapElements(userLocation[0], userLocation[1]);
      setIsUbicacionModalOpen(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const updateMapElements = async (latitude: number, longitude: number) => {
    if (!mapRef.current) return;

    const userPos: [number, number] = [latitude, longitude];
    const busPos: [number, number] = [latitude + 0.003, longitude + 0.003];

    // Restringir el mapa a un rango de 1.5km alrededor del usuario (Geofence)
    const southWest = L.latLng(latitude - 0.015, longitude - 0.015);
    const northEast = L.latLng(latitude + 0.015, longitude + 0.015);
    const bounds = L.latLngBounds(southWest, northEast);
    mapRef.current.setMaxBounds(bounds);

    // 1. Marcador Usuario
    const userIcon = L.divIcon({
      className: '',
      html: `<div style="display:flex;align-items:center;justify-content:center;"><div class="user-pulse"></div><div class="user-dot"></div></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPos);
    } else {
      userMarkerRef.current = L.marker(userPos, { icon: userIcon }).addTo(mapRef.current);
    }

    // 2. Marcador Bus
    if (marcadorBusRef.current) {
      marcadorBusRef.current.removerDelMapa();
    }
    marcadorBusRef.current = crearMarcadorBus(busPos, estadoBusActual, mapRef.current);

    // 3. Polilínea por calles (Utilizando servicio común)
    const coordenadas = await obtenerRutaPorCalles(userPos, busPos);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(coordenadas);
    } else {
      polylineRef.current = L.polyline(coordenadas, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 12'
      }).addTo(mapRef.current);
    }

    mapRef.current.setView(userPos, 16, { animate: true });
  };




  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        updateMapElements(latitude, longitude);
      }, (error) => {
        console.error("Error obteniendo ubicación:", error);
      });
    }
  };


  const handleAcceptLocation = () => {
    localStorage.setItem('locationPermissionGranted', 'true');
    setIsUbicacionModalOpen(false);
    requestUserLocation();
  };


  // Efecto para sincronizar cambios de estado
  useEffect(() => {
    if (marcadorBusRef.current) {
      marcadorBusRef.current.actualizarEstado(estadoBusActual);
    }
  }, [estadoBusActual]);

  return (
    <div className="passenger-body" ref={containerRef}>
      {/* HEADER */}
      <header className="fixed-header">
        <div>
          <h1 className="header-title">Xanani</h1>
          <p className="header-subtitle">Modo Invitado</p>
        </div>
        <button className="btn-login" onClick={() => navigate('/login')}>
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

      {/* MODAL DE UBICACION */}
      <UbicacionModal
        isOpen={isUbicacionModalOpen}
        onClose={() => setIsUbicacionModalOpen(false)}
        onAccept={handleAcceptLocation}
      />
    </div>
  );
};

export default PassengerLanding;