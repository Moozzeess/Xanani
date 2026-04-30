import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';
import { htmlMarcadorUsuario } from './Utils/IconosFactory';

/**
 * Capa para renderizar la ubicación del usuario en tiempo real.
 * Utiliza el marcador premium definido en IconosFactory y añade soporte radial.
 */
const CapaUsuario = ({ posicion, radio = 0 }) => {
    const map = useMapaInstance();
    const markerRef = useRef(null);
    const circleRef = useRef(null);

    // Gestión del Marcador de Usuario
    useEffect(() => {
        if (!map || !posicion) return;

        if (!markerRef.current) {
            const icon = L.divIcon({
                html: htmlMarcadorUsuario(),
                className: 'custom-user-icon',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            markerRef.current = L.marker(posicion, { 
                icon,
                zIndexOffset: 1000 
            }).addTo(map);
        } else {
            markerRef.current.setLatLng(posicion);
        }

        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, [map, posicion]);

    // Gestión del Círculo Radial (Radar)
    useEffect(() => {
        if (!map || !posicion) return;

        if (radio > 0) {
            if (!circleRef.current) {
                circleRef.current = L.circle(posicion, {
                    radius: radio,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    dashArray: '10, 10',
                    weight: 1,
                    interactive: false
                }).addTo(map);
            } else {
                circleRef.current.setLatLng(posicion);
                circleRef.current.setRadius(radio);
            }
        } else if (circleRef.current) {
            circleRef.current.remove();
            circleRef.current = null;
        }

        return () => {
            if (circleRef.current) {
                circleRef.current.remove();
                circleRef.current = null;
            }
        };
    }, [map, posicion, radio]);

    return null; // Componente lógico, renderiza vía Leaflet directo
};

export default CapaUsuario;
