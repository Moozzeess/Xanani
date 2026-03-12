import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus } from 'lucide-react';
import { useAlertaGlobal } from '../../context/AlertaContext';

/**
 * Componente de Mapa reutilizable basado en Leaflet.
 * Se encarga de renderizar el mapa, marcadores y rutas.
 */
const Mapa = ({
  center = [19.4326, -99.1332],
  zoom = 15,
  routeLine = [],
  vehicles = [],
  onVehicleClick = () => { },
  showUserLocation = true,
  centerOnUserTrigger = 0
}) => {
  const { dispararError } = useAlertaGlobal();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markersGroupRef = useRef(L.layerGroup());
  const userMarkerRef = useRef(null);

  useEffect(() => {
    // Inicializar el mapa si no existe
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, zoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(mapInstanceRef.current);

      markersGroupRef.current.addTo(mapInstanceRef.current);
    }

    // Limpieza al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Efecto para manejar la ubicación del usuario
  useEffect(() => {
    if (showUserLocation && navigator.geolocation && mapInstanceRef.current) {
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userPos);
          } else {
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            userMarkerRef.current = L.marker(userPos, { icon: userIcon }).addTo(mapInstanceRef.current);
          }
          mapInstanceRef.current.setView(userPos, zoom);
        },
        (error) => {
          let errorMsg = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Permiso de geolocalización denegado.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Ubicación no disponible.";
              break;
            case error.TIMEOUT:
              errorMsg = "Tiempo de espera agotado.";
              break;
            default:
              errorMsg = "Error de ubicación.";
              break;
          }
          console.warn(errorMsg);
        },
        geoOptions
      );
    } else if (!showUserLocation && userMarkerRef.current) {
      // Eliminar marcador si se desactiva
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [showUserLocation]);


  // Actualizar Polilínea de la Ruta
  useEffect(() => {
    if (mapInstanceRef.current && routeLine && Array.isArray(routeLine) && routeLine.length > 0) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(routeLine);
      } else {
        polylineRef.current = L.polyline(routeLine, {
          color: '#3b82f6',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round'
        }).addTo(mapInstanceRef.current);
      }

      // Ajustar vista a la ruta
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [routeLine]);

  // Actualizar Marcadores de Vehículos
  useEffect(() => {
    if (mapInstanceRef.current) {
      markersGroupRef.current.clearLayers();

      vehicles.forEach(v => {
        if (v.status === 'Inactivo') return;

        const colorClass = v.color || 'bg-blue-500';
        const txtColor = v.text || 'text-white';

        const html = `
          <div class="bus-marker-container relative w-12 h-12 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer">
            <!-- Etiqueta ETA flotante -->
            <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-md whitespace-nowrap z-20 opacity-90">
              ${v.eta || 'Desc.'}
            </div>
            <!-- Fondo decorativo -->
            <div class="absolute inset-0 rounded-xl ${colorClass} opacity-30"></div>
            <!-- Contenedor Principal (Bus) -->
            <div class="relative w-10 h-10 ${colorClass} rounded-xl border-2 border-white shadow-lg flex items-center justify-center ${txtColor}">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'bg-transparent',
          html: html,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const marker = L.marker(v.pos, { icon: icon })
          .on('click', () => onVehicleClick(v));

        markersGroupRef.current.addLayer(marker);
      });
    }
  }, [vehicles]);

  // RE-CENTRAR cuando se active el trigger
  useEffect(() => {
    if (centerOnUserTrigger > 0 && navigator.geolocation) {
      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(userPos, 16, { animate: true });
          }

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(userPos);
          }
        },
        (error) => {
          let errorMsg = "No se pudo obtener la ubicación para centrar.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = "No se puede acceder a la ubicación. Por favor, concede permisos en el navegador.";
          }
          dispararError(errorMsg, error.message, "Error de Mapa");
        },
        geoOptions
      );
    }
  }, [centerOnUserTrigger]);

  // Manejar redimensionamiento
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
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

