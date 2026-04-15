import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';

/**
 * Capa para dibujar el trazado de una ruta (geometría).
 * Soporta efectos de resplandor (Glow) y estilos sólidos o segmentados (Dashed).
 */
const CapaGeometria = ({ routeLine = [], isDashed = false, color = '#3b82f6' }) => {
    const map = useMapaInstance();
    const polylineGlowRef = useRef(null);
    const polylineSolidRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Si no hay ruta, limpiar y salir
        if (!routeLine || routeLine.length === 0) {
            if (polylineGlowRef.current) polylineGlowRef.current.remove();
            if (polylineSolidRef.current) polylineSolidRef.current.remove();
            polylineGlowRef.current = null;
            polylineSolidRef.current = null;
            return;
        }

        // 1. Capa de Resplandor (Glow)
        if (polylineGlowRef.current) {
            polylineGlowRef.current.setLatLngs(routeLine);
        } else {
            polylineGlowRef.current = L.polyline(routeLine, {
                color: color === '#3b82f6' ? '#60a5fa' : color,
                weight: 18,
                opacity: 0.2,
                lineCap: 'round',
            }).addTo(map);
        }

        // 2. Capa Principal (Sólida o Segmentada)
        if (polylineSolidRef.current) {
            polylineSolidRef.current.setLatLngs(routeLine);
            polylineSolidRef.current.setStyle({ 
                dashArray: isDashed ? '12, 12' : null,
                color: color === '#3b82f6' ? '#2563eb' : color,
                weight: 8
            });
        } else {
            polylineSolidRef.current = L.polyline(routeLine, {
                color: color === '#3b82f6' ? '#2563eb' : color,
                weight: 8,
                opacity: 1,
                lineCap: 'round',
                dashArray: isDashed ? '12, 12' : null
            }).addTo(map);
        }
    }, [map, routeLine, isDashed, color]);

    // Limpieza única al desmontar o cambiar de mapa
    useEffect(() => {
        return () => {
            if (polylineGlowRef.current) polylineGlowRef.current.remove();
            if (polylineSolidRef.current) polylineSolidRef.current.remove();
            polylineGlowRef.current = null;
            polylineSolidRef.current = null;
        };
    }, [map]);

    return null; // Componente lógico, no renderiza HTML directo
};

export default CapaGeometria;
