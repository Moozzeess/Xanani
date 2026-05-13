import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapaProvider } from './mapa/MapaContext';

const DEFAULT_PADDING = [50, 50];

/**
 * Componente de Mapa Padre.
 * Inicializa el lienzo de Leaflet y provee el contexto para las capas hijas.
 */
const Mapa = ({
  center = [19.4326, -99.1332],
  zoom = 50,
  bounds = null,
  tileTheme = 'standard', // 'standard' (color) o 'light' (claro/gris)
  children,
  onMapClick = (latlng) => {},
  onMapLongPress = (latlng) => {},
  autoFitPadding = DEFAULT_PADDING,
  followDuration = 1, // Duración de la animación de seguimiento (por defecto 1.5s)
  allowManualUnlock = false // Si es true, permite al usuario "liberar" la cámara al interactuar
}) => {
  const mapContainerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);
  const longPressTimerRef = useRef(null);
  const lastForcedCenterRef = useRef(center);
  const lastForcedBoundsRef = useRef(null);

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

    L.tileLayer(tileUrl, { maxZoom: 40 }).addTo(instance);

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

    // Control manual: Si el usuario mueve el mapa, desactivamos el seguimiento automático
    instance.on('dragstart zoomstart', () => {
        if (allowManualUnlock) {
            setIsManuallyControlled(true);
        }
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
        // Si el centro cambió externamente de forma significativa, retomamos el control
        const centerChangedExternally = Math.sqrt(
            Math.pow(lastForcedCenterRef.current[0] - center[0], 2) + 
            Math.pow(lastForcedCenterRef.current[1] - center[1], 2)
        ) > 0.001; // Umbral para detectar un cambio de "objetivo" (no solo un pequeño ajuste de seguimiento)

        if (centerChangedExternally) {
            setIsManuallyControlled(false);
            lastForcedCenterRef.current = center;
        }

        if (allowManualUnlock && isManuallyControlled) return;

        const currentCenter = mapInstance.getCenter();
        const dist = Math.sqrt(
            Math.pow(currentCenter.lat - center[0], 2) + 
            Math.pow(currentCenter.lng - center[1], 2)
        );

        // Umbral de movimiento
        if (dist > 0.00001) {
            if (followDuration <= 0.5) {
                // Modo Navegación: seguimiento instantáneo sin animaciones pesadas
                mapInstance.setView(center, mapInstance.getZoom(), { animate: false });
            } else {
                // Modo Vista General: salto suave con animación
                mapInstance.flyTo(center, mapInstance.getZoom(), {
                    animate: true,
                    duration: followDuration,
                    easeLinearity: 0.25
                });
            }
        }
    }
  }, [center, mapInstance, bounds, followDuration, allowManualUnlock, isManuallyControlled]);

  // 3. Reactividad de los límites (Bounds)
  useEffect(() => {
    if (mapInstance && bounds && bounds.length > 0) {
        // Detectar si los límites cambiaron externamente (nuevo objetivo)
        const boundsStr = JSON.stringify(bounds);
        const boundsChangedExternally = !lastForcedBoundsRef.current || lastForcedBoundsRef.current !== boundsStr;

        if (boundsChangedExternally) {
            setIsManuallyControlled(false);
            lastForcedBoundsRef.current = boundsStr;
        }

        // Si el usuario tiene el control manual, no forzamos el ajuste de límites
        if (allowManualUnlock && isManuallyControlled) return;

        mapInstance.fitBounds(bounds, { padding: autoFitPadding });
    } else if (mapInstance && !bounds) {
        // Si se limpian los límites, limpiamos la referencia
        lastForcedBoundsRef.current = null;
    }
  }, [bounds, mapInstance, autoFitPadding, allowManualUnlock, isManuallyControlled]);

  // 4. Reactividad del zoom
  useEffect(() => {
    if (mapInstance && zoom) {
        // Solo forzamos el zoom si no estamos en control manual o si el zoom prop cambió
        if (!allowManualUnlock || !isManuallyControlled) {
            mapInstance.setZoom(zoom);
        }
    }
  }, [zoom, mapInstance, allowManualUnlock, isManuallyControlled]);

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