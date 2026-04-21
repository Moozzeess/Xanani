import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';

/**
 * Capa para renderizar los puntos de parada como círculos minimalistas.
 * Optimizado para una visualización premium sin ruido visual.
 */
const CapaParadas = ({ stops = [] }) => {
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
                radius: 5,
                fillColor: '#ffffff',
                color: '#3b82f6',
                weight: 2,
                opacity: 1,
                fillOpacity: 1,
                pane: 'markerPane'
            });

            marker.bindPopup(`
                <div class="text-center p-1">
                    <div class="text-[10px] font-black text-indigo-500 uppercase">Parada</div>
                    <div class="font-bold text-slate-800 text-xs">${s.nombre || 'Punto de Abordaje'}</div>
                </div>
            `, { offset: [0, 0], className: 'minimal-popup' });

            groupRef.current.addLayer(marker);
        });
    }, [map, stops]);

    return null;
};

export default CapaParadas;


