import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';

/**
 * CapaInvitacion
 * Muestra un trazado vial desde el usuario hasta la parada detectada
 * e indica la parada con el icono oficial y la ETA si está disponible.
 */
const CapaInvitacion = ({ trazo = [], parada = null, eta = null }) => {
    const map = useMapaInstance();
    const lineRef = useRef(null);
    const markerRef = useRef(null);

    // 1. Gestión del Trazado (Línea punteada)
    useEffect(() => {
        if (!map) return;

        if (Array.isArray(trazo) && trazo.length > 1) {
            if (!lineRef.current) {
                lineRef.current = L.polyline(trazo, {
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '8, 12',
                    lineCap: 'round',
                    interactive: false
                }).addTo(map);
            } else {
                lineRef.current.setLatLngs(trazo);
            }
        } else if (lineRef.current) {
            lineRef.current.remove();
            lineRef.current = null;
        }

        return () => {
            if (lineRef.current) {
                lineRef.current.remove();
                lineRef.current = null;
            }
        };
    }, [map, trazo]);

    // 2. Gestión del Marcador y Popup de ETA
    useEffect(() => {
        if (!map) return;

        // Validar datos mínimos antes de operar con Leaflet
        const tieneDatosValidos = parada && 
                                 !isNaN(parseFloat(parada.latitud)) && 
                                 !isNaN(parseFloat(parada.longitud)) && 
                                 Array.isArray(trazo) && 
                                 trazo.length > 0;

        if (tieneDatosValidos) {
            const pos = [parseFloat(parada.latitud), parseFloat(parada.longitud)];
            
            // Generar contenido del popup (se actualiza si cambia la ETA)
            const etaHtml = eta ? `
                <div class="mt-2 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span class="text-[10px] font-black">LLEGA EN ${eta} MIN</span>
                </div>
            ` : '';

            const popupContent = `
                <div class="text-center p-2 min-w-[120px]">
                    <p class="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-wider">Tu parada cercana</p>
                    <p class="text-sm font-bold text-slate-800 leading-tight">${parada.nombre || 'Parada detectada'}</p>
                    ${etaHtml}
                </div>
            `;

            if (!markerRef.current) {
                const icon = L.divIcon({
                    html: `
                        <div class="invitation-stop-marker">
                            <div class="pulse-invitation"></div>
                            <div class="stop-icon-container">
                                <img src="/parada_bus.svg" style="width: 28px; height: 28px;" />
                            </div>
                        </div>
                    `,
                    className: 'custom-invitation-icon',
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                markerRef.current = L.marker(pos, { icon, zIndexOffset: 900 }).addTo(map);
                markerRef.current.bindPopup(popupContent, { 
                    closeButton: false, 
                    className: 'minimal-popup',
                    offset: [0, -10]
                }).openPopup();
            } else {
                // Actualizar posición y contenido si ya existe
                markerRef.current.setLatLng(pos);
                markerRef.current.setPopupContent(popupContent);
                
                // Asegurar que el popup esté abierto si hay cambios importantes
                if (!markerRef.current.isPopupOpen()) {
                    markerRef.current.openPopup();
                }
            }
        } else if (markerRef.current) {
            // Limpiar si los datos dejan de ser válidos
            markerRef.current.remove();
            markerRef.current = null;
        }

        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, [map, parada, trazo, eta]);

    return null;
};

export default CapaInvitacion;
