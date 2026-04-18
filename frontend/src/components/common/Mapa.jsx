import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapaProvider } from './mapa/MapaContext';

/**
 * Componente de Mapa Padre.
 * Inicializa el lienzo de Leaflet y provee el contexto para las capas hijas.
 */
const Mapa = ({
  center = [19.4326, -99.1332],
  zoom = 15,
  bounds = null,
  tileTheme = 'standard', // 'standard' (color) o 'light' (claro/gris)
  children,
  onMapClick = (latlng) => {},
  onMapLongPress = (latlng) => {},
  autoFitPadding = [50, 50]
}) => {
  const mapContainerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const longPressTimerRef = useRef(null);

  // 1. Inicialización de la instancia de Leaflet
  useEffect(() => {
    if (mapInstance || !mapContainerRef.current) return;

    const instance = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, zoom);

    // Selección de proveedor según tema
    const tileUrl = tileTheme === 'light' 
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(instance);

    // Configuración de eventos básicos del mapa
    instance.on('click', (e) => {
        onMapClick(e.latlng);
    });

    instance.on('mousedown', (e) => {
        longPressTimerRef.current = setTimeout(() => {
            onMapLongPress(e.latlng);
        }, 800);
    });

    instance.on('mouseup mousemove', () => {
        clearTimeout(longPressTimerRef.current);
    });

    setMapInstance(instance);

    // Invalidar tamaño para asegurar renderizado correcto en contenedores dinámicos
    setTimeout(() => instance.invalidateSize(), 200);

    return () => {
      instance.remove();
      setMapInstance(null);
    };
  }, [tileTheme]);

  // 2. Reactividad del centro
  useEffect(() => {
    if (mapInstance && center && !bounds) {
        const currentCenter = mapInstance.getCenter();
        const dist = Math.sqrt(
            Math.pow(currentCenter.lat - center[0], 2) + 
            Math.pow(currentCenter.lng - center[1], 2)
        );

        if (dist > 0.0001) {
            mapInstance.flyTo(center, mapInstance.getZoom(), {
                animate: true,
                duration: 1.5
            });
        }
    }
  }, [center, mapInstance, bounds]);

  // 3. Reactividad de los límites (Bounds)
  useEffect(() => {
    if (mapInstance && bounds && bounds.length > 0) {
        mapInstance.fitBounds(bounds, { padding: autoFitPadding });
    }
  }, [bounds, mapInstance, autoFitPadding]);

  // 4. Reactividad del zoom
  useEffect(() => {
    if (mapInstance && zoom) {
        mapInstance.setZoom(zoom);
    }
  }, [zoom, mapInstance]);

  return (
    <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full bg-slate-100">
      {mapInstance && (
        <MapaProvider map={mapInstance}>
          {children}
        </MapaProvider>
      )}
    </div>
  );
};

export default Mapa;