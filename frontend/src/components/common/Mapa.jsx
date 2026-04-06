import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAlertaGlobal } from '../../context/AlertaContext';

/**
 * Radio en metros del círculo visual al hacer long press en el mapa.
 */
const RADIO_BUSQUEDA = 500;

/**
 * Genera el HTML del marcador de una unidad.
 * Si la unidad está siendo seguida, añade la clase CSS de pulso activo.
 */
function htmlMarcador(v, enSeguimiento = false) {
  const colorClass = v.color || 'bg-blue-400';
  const txtColor = v.text || 'text-white';
  const labelEta = v.eta != null ? (v.eta < 1 ? '<1m' : `${v.eta}m`) : v.eta || 'Desc.';
  const esDemoStyle = v.esDemo ? ' opacity-80 saturate-50' : '';

  return `
    <div class="bus-marker-container relative w-12 h-12 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer${esDemoStyle}">
      <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-md whitespace-nowrap z-20 opacity-90">
        ${v.esDemo ? '[DEMO] ' : ''}${labelEta}
      </div>
      <div class="absolute inset-0 rounded-xl ${colorClass} opacity-30${enSeguimiento ? ' animate-ping' : ''}"></div>
      <div class="relative w-10 h-10 ${colorClass} rounded-xl border-2 border-white shadow-lg flex items-center justify-center ${txtColor}${enSeguimiento ? ' ring-4 ring-blue-300' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
      </div>
    </div>
  `;
}

/**
 * Componente de Mapa reutilizable basado en Leaflet.
 * Renderiza marcadores de vehículos, ruta, ubicación del usuario
 * e interacciones táctiles (tap y long press).
 */
const Mapa = ({
  center = [19.4326, -99.1332],
  zoom = 15,
  routeLine = [],
  vehicles = [],
  onVehicleClick = () => {},
  onMapClick,
  onMapLongPress,
  showUserLocation = true,
  centerOnUserTrigger = 0,
  lockedToUser = false,
  vehiculoEnSeguimientoId = null,
}) => {
  const { dispararError } = useAlertaGlobal();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markersGroupRef = useRef(L.layerGroup());
  const userMarkerRef = useRef(null);
  const puntoBusquedaRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // Inicializar mapa
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: !lockedToUser,
      touchZoom: !lockedToUser,
      doubleClickZoom: !lockedToUser,
      scrollWheelZoom: !lockedToUser,
      boxZoom: !lockedToUser,
      keyboard: !lockedToUser,
    }).setView(center, zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    markersGroupRef.current.addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Interacciones táctiles: tap y long press
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMouseDown = (e) => {
      longPressTimerRef.current = setTimeout(() => {
        const latlng = e.latlng;

        // Limpiar punto anterior
        if (puntoBusquedaRef.current) {
          puntoBusquedaRef.current.remove();
          puntoBusquedaRef.current = null;
        }

        // Dibujar círculo de búsqueda
        puntoBusquedaRef.current = L.circle(latlng, {
          radius: RADIO_BUSQUEDA,
          color: '#3b82f6',
          fillColor: '#3b82f620',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '6,4',
        }).addTo(map);

        onMapLongPress?.(latlng);
      }, 500);
    };

    const handleMouseUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleClick = (e) => {
      onMapClick?.(e.latlng);
    };

    map.on('mousedown', handleMouseDown);
    map.on('touchstart', handleMouseDown);
    map.on('mouseup', handleMouseUp);
    map.on('touchend', handleMouseUp);
    map.on('click', handleClick);

    return () => {
      map.off('mousedown', handleMouseDown);
      map.off('touchstart', handleMouseDown);
      map.off('mouseup', handleMouseUp);
      map.off('touchend', handleMouseUp);
      map.off('click', handleClick);
    };
  }, [onMapClick, onMapLongPress]);

  // Ubicación del usuario
  useEffect(() => {
    let watchId;
    if (showUserLocation && navigator.geolocation && mapInstanceRef.current) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userPos);
          } else {
            const icon = L.divIcon({
              className: 'user-location-marker',
              html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            userMarkerRef.current = L.marker(userPos, { icon }).addTo(mapInstanceRef.current);
          }

          if (lockedToUser) {
            mapInstanceRef.current.setView(userPos, zoom, { animate: true });
          }
        },
        (error) => {
          const msgs = {
            1: 'Permiso de geolocalización denegado.',
            2: 'Ubicación no disponible.',
            3: 'Tiempo de espera agotado.',
          };
          console.warn(msgs[error.code] || 'Error de ubicación.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (!showUserLocation && userMarkerRef.current && mapInstanceRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [showUserLocation, lockedToUser, zoom]);

  // Centrar en usuario al activar trigger
  useEffect(() => {
    if (centerOnUserTrigger <= 0 || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 16, { animate: true });
        userMarkerRef.current?.setLatLng([latitude, longitude]);
      },
      (error) => {
        const msg = error.code === 1
          ? 'No se puede acceder a la ubicación. Concede permisos en el navegador.'
          : 'No se pudo obtener la ubicación para centrar.';
        dispararError(msg, error.message, 'Error de Mapa');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [centerOnUserTrigger]);

  // Actualizar polilínea de ruta
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLine?.length) return;

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(routeLine);
    } else {
      polylineRef.current = L.polyline(routeLine, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        lineCap: 'round',
      }).addTo(mapInstanceRef.current);
    }

    mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
  }, [routeLine]);

  // Actualizar marcadores de vehículos
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersGroupRef.current.clearLayers();

    vehicles.forEach((v) => {
      const pos = v.posicion;
      if (!pos) return;

      const enSeguimiento = vehiculoEnSeguimientoId === v._id || vehiculoEnSeguimientoId === v.id;

      const icon = L.divIcon({
        className: 'bg-transparent',
        html: htmlMarcador(v, enSeguimiento),
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker(pos, { icon }).on('click', () => onVehicleClick(v));
      markersGroupRef.current.addLayer(marker);
    });
  }, [vehicles, vehiculoEnSeguimientoId]);

  // Redimensionamiento
  useEffect(() => {
    const handleResize = () => mapInstanceRef.current?.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      id="map"
      ref={mapRef}
      className="absolute inset-0 z-0"
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default Mapa;