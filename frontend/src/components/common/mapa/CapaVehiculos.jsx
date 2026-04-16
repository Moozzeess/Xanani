import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';
import { htmlMarcadorVehiculo } from './Utils/IconosFactory';

/**
 * Capa para gestionar los marcadores de la flota de vehículos.
 * Maneja la actualización eficiente de posiciones y popups según los roles.
 */
const CapaVehiculos = ({ vehicles = [], selectedVehicleId = null, onVehicleClick = (v) => {} }) => {
    const map = useMapaInstance();
    const markersGroupRef = useRef(L.layerGroup());

    useEffect(() => {
        if (!map) return;
        markersGroupRef.current.addTo(map);

        return () => {
            markersGroupRef.current.remove();
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        markersGroupRef.current.clearLayers();

        vehicles.forEach((v) => {
            const pos = v.pos || v.posicion;
            if (!pos || !pos[0] || !pos[1]) return;

            const enSeguimiento = selectedVehicleId === v._id || selectedVehicleId === v.id;
            
            const icon = L.divIcon({
                className: 'bg-transparent',
                html: htmlMarcadorVehiculo(v, enSeguimiento),
                iconSize: [48, 48],
                iconAnchor: [24, 24],
            });

            const marker = L.marker(pos, { icon });
            
            // Eventos
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                onVehicleClick(v);
            });

            // Popup para información rápida (común a todos los roles)
            const popupContent = `
                <div class="text-center p-1">
                    <div class="font-bold text-slate-800">${v.placa || 'Unidad'}</div>
                    <div class="text-[10px] text-slate-500">${v.conductor || 'Conductor asignado'}</div>
                    ${v.isSimulated ? '<div class="mt-1 text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">SIMULACIÓN</div>' : ''}
                </div>
            `;
            marker.bindPopup(popupContent, { offset: [0, -10] });

            markersGroupRef.current.addLayer(marker);
        });
    }, [map, vehicles, selectedVehicleId]);

    return null;
};

export default CapaVehiculos;
