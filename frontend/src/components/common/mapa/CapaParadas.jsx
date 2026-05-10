import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';

/**
 * Capa para renderizar los puntos de parada como círculos minimalistas.
 * Optimizado para una visualización premium sin ruido visual.
 */
const CapaParadas = ({ stops = [], onStopClick }) => {
    const map = useMapaInstance();
    const groupRef = useRef(L.layerGroup());

    useEffect(() => {
        if (!map) return;
        groupRef.current.addTo(map);
        return () => {
            groupRef.current.remove();
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        groupRef.current.clearLayers();

        stops.forEach((s, idx) => {
            const lat = parseFloat(s.latitud);
            const lng = parseFloat(s.longitud);
            if (isNaN(lat) || isNaN(lng)) return;

            // Renderizar como punto pequeño minimalista
            const marker = L.circleMarker([lat, lng], {
                radius: 6,
                fillColor: '#ffffff',
                color: '#3b82f6',
                weight: 2,
                opacity: 1,
                fillOpacity: 1,
                pane: 'markerPane'
            });

            marker.on('click', () => {
                if (onStopClick) onStopClick(s);
            });

            groupRef.current.addLayer(marker);
        });
    }, [map, stops, onStopClick]);

    return null;
};

export default CapaParadas;


