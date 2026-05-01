import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';
import { htmlMarcadorVehiculo } from './Utils/IconosFactory';

/**
 * Capa para gestionar los marcadores de la flota de vehículos de forma eficiente.
 * Evita el lag y la vibración reutilizando instancias de marcadores y actualizando
 * sus posiciones en lugar de recrearlos en cada renderizado.
 */
const CapaVehiculos = ({ vehicles = [], selectedVehicleId = null, onVehicleClick = (v) => {} }) => {
    const map = useMapaInstance();
    const markersGroupRef = useRef(L.layerGroup());
    const markersMapRef = useRef(new Map()); // id -> marker instance

    // Inicializar el grupo de capas en el mapa
    useEffect(() => {
        if (!map) return;
        markersGroupRef.current.addTo(map);

        return () => {
            markersGroupRef.current.remove();
        };
    }, [map]);

    // Sincronizar marcadores con la lista de vehículos
    useEffect(() => {
        if (!map) return;

        const currentIds = new Set();

        vehicles.forEach((v) => {
            const id = v.id || v._id;
            const pos = v.pos || v.posicion;
            if (!id || !pos || !pos[0] || !pos[1]) return;

            currentIds.add(id.toString());
            const enSeguimiento = selectedVehicleId === id;
            
            let marker = markersMapRef.current.get(id.toString());

            if (!marker) {
                // Crear nuevo marcador si no existe
                const icon = L.divIcon({
                    className: 'bg-transparent',
                    html: htmlMarcadorVehiculo(v, enSeguimiento, v.rotation || 0),
                    iconSize: [48, 48],
                    iconAnchor: [24, 24],
                });

                marker = L.marker(pos, { icon });
                
                // Guardar estado actual para comparaciones futuras
                marker._lastRotation = v.rotation || 0;
                marker._lastEnSeguimiento = enSeguimiento;

                // Eventos
                marker.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    onVehicleClick(v);
                });

                markersGroupRef.current.addLayer(marker);
                markersMapRef.current.set(id.toString(), marker);
            } else {
                // Actualizar marcador existente
                marker.setLatLng(pos);
                
                // Solo recrear el icono si el ángulo cambió sustancialmente (>1 grado) o cambió la selección
                const rotationDiff = Math.abs((v.rotation || 0) - (marker._lastRotation || 0));
                if (rotationDiff > 1 || enSeguimiento !== marker._lastEnSeguimiento) {
                    const icon = L.divIcon({
                        className: 'bg-transparent',
                        html: htmlMarcadorVehiculo(v, enSeguimiento, v.rotation || 0),
                        iconSize: [48, 48],
                        iconAnchor: [24, 24],
                    });
                    marker.setIcon(icon);
                    marker._lastRotation = v.rotation || 0;
                    marker._lastEnSeguimiento = enSeguimiento;
                }
            }

            // Actualizar Popup
            const popupContent = `
                <div class="text-center p-1">
                    <div class="font-bold text-slate-800">${v.placa || 'Unidad'}</div>
                    <div class="text-[10px] text-slate-500">${v.conductor || 'Conductor asignado'}</div>
                    ${v.isSimulated ? '<div class="mt-1 text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">SIMULACIÓN</div>' : ''}
                </div>
            `;
            
            if (marker.getPopup()) {
                marker.setPopupContent(popupContent);
            } else {
                marker.bindPopup(popupContent, { offset: [0, -10] });
            }
            
            // Si está seleccionado, asegurar que esté al frente
            if (enSeguimiento) {
                marker.setZIndexOffset(1000);
            } else {
                marker.setZIndexOffset(0);
            }
        });

        // Eliminar marcadores de vehículos que ya no están en la lista
        markersMapRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                markersGroupRef.current.removeLayer(marker);
                markersMapRef.current.delete(id);
            }
        });

    }, [map, vehicles, selectedVehicleId]);

    return null;
};

export default CapaVehiculos;

