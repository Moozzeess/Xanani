import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';
import { htmlMarcadorParada } from './Utils/IconosFactory';

/**
 * Capa para renderizar los puntos de parada de una ruta.
 * Incluye numeración secuencial y badges de estilo Premium.
 */
const CapaParadas = ({ stops = [] }) => {
    const map = useMapaInstance();
    const stopsGroupRef = useRef(L.layerGroup());

    useEffect(() => {
        if (!map) return;
        stopsGroupRef.current.addTo(map);

        return () => {
            stopsGroupRef.current.remove();
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        stopsGroupRef.current.clearLayers();

        if (stops && stops.length > 0) {
            stops.forEach((s, idx) => {
                const lat = parseFloat(s.latitud);
                const lng = parseFloat(s.longitud);
                
                if (isNaN(lat) || isNaN(lng)) return;

                const icon = L.divIcon({
                    className: 'bg-transparent',
                    html: htmlMarcadorParada(idx),
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker([lat, lng], { icon });
                marker.bindPopup(`
                    <div class="font-bold text-sm text-slate-800">
                        ${s.nombre || 'Parada ' + (idx + 1)}
                    </div>
                `);

                stopsGroupRef.current.addLayer(marker);
            });
            
            // Autozoom a las paradas si hay cambios significativos (opcional)
            // if (stops.length > 1) {
            //    map.fitBounds(L.featureGroup(stopsGroupRef.current.getLayers()).getBounds(), { padding: [50, 50] });
            // }
        }
    }, [map, stops]);

    return null;
};

export default CapaParadas;
