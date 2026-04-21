import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapaInstance } from './MapaContext';

/**
 * Capa para dibujar el trazado de una ruta (geometría) con segmentación de progreso.
 * Muestra el tramo recorrido en gris y el restante en azul vibrante.
 */
const CapaGeometria = ({ routeLine = [], unitPos = null, color = '#3b82f6' }) => {
    const map = useMapaInstance();
    
    // Referencias para capas de progreso
    const polyPastRef = useRef(null);
    const polyFutureRef = useRef(null);
    const glowFutureRef = useRef(null);

    useEffect(() => {
        if (!map || !routeLine || routeLine.length === 0) {
            limpiarCapas();
            return;
        }

        let tramoRecorrido = [];
        let tramoRestante = routeLine;

        // Si hay posición de la unidad, segmentamos la geometría
        if (unitPos && unitPos[0] && unitPos[1]) {
            let indexCercano = 0;
            let minDist = Infinity;

            // Encontrar el punto de la geometría más cercano a la unidad
            routeLine.forEach((p, idx) => {
                const d = Math.sqrt(Math.pow(p[0] - unitPos[0], 2) + Math.pow(p[1] - unitPos[1], 2));
                if (d < minDist) {
                    minDist = d;
                    indexCercano = idx;
                }
            });

            tramoRecorrido = routeLine.slice(0, indexCercano + 1);
            tramoRestante = routeLine.slice(indexCercano);
        }

        // 1. Tramo Recorrido (Gris Tenue)
        if (tramoRecorrido.length > 1) {
            if (polyPastRef.current) {
                polyPastRef.current.setLatLngs(tramoRecorrido);
            } else {
                polyPastRef.current = L.polyline(tramoRecorrido, {
                    color: '#94a3b8',
                    weight: 6,
                    opacity: 0.4,
                    lineCap: 'round'
                }).addTo(map);
            }
        } else if (polyPastRef.current) {
            polyPastRef.current.remove();
            polyPastRef.current = null;
        }

        // 2. Resplandor del Tramo Restante (Glow)
        if (tramoRestante.length > 1) {
            if (glowFutureRef.current) {
                glowFutureRef.current.setLatLngs(tramoRestante);
            } else {
                glowFutureRef.current = L.polyline(tramoRestante, {
                    color: color,
                    weight: 16,
                    opacity: 0.15,
                    lineCap: 'round'
                }).addTo(map);
            }

            // 3. Tramo Restante (Azul Fuerte)
            if (polyFutureRef.current) {
                polyFutureRef.current.setLatLngs(tramoRestante);
            } else {
                polyFutureRef.current = L.polyline(tramoRestante, {
                    color: color,
                    weight: 8,
                    opacity: 1,
                    lineCap: 'round'
                }).addTo(map);
            }
        }

    }, [map, routeLine, unitPos, color]);

    const limpiarCapas = () => {
        if (polyPastRef.current) polyPastRef.current.remove();
        if (polyFutureRef.current) polyFutureRef.current.remove();
        if (glowFutureRef.current) glowFutureRef.current.remove();
        polyPastRef.current = null;
        polyFutureRef.current = null;
        glowFutureRef.current = null;
    };

    useEffect(() => {
        return () => limpiarCapas();
    }, [map]);

    return null;
};

export default CapaGeometria;

