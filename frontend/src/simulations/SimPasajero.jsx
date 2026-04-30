import React, { useEffect } from 'react';
import ModalAlerta from '../components/common/ModalAlerta';

/**
 * SimPasajero
 * 
 * Componente lógico que gestiona la telemetría simulada para la vista de pasajero.
 * Mantiene la independencia entre los datos reales y los de prueba.
 * 
 * @param {Object} socket - Instancia de socket activa.
 * @param {Array} rutas - Listado de rutas disponibles para vincular paradas.
 * @param {Function} onUpdate - Callback para actualizar la lista de vehículos en el padre.
 */
const SimPasajero = ({ socket, rutas, rutasSuscritas = [], onUpdate }) => {
    
    useEffect(() => {
        if (!socket) return;

        const handleSimulacion = (datos) => {
            const rid = datos.rutaId || datos.id_ruta;
            
            // FILTRO CRÍTICO: Solo mostrar simulaciones de rutas suscritas
            if (!rutasSuscritas.includes(rid?.toString())) {
                return;
            }

            // Aseguramos que los datos simulados tengan el formato correcto y un ID único
            const rawId = datos.id || datos.placa || rid?.slice(-4);
            const id = `SIM-${rawId}`;
            
            // Cálculo de parada más cercana para la simulación
            let indexParadaActual = datos.indexParadaActual || 0;
            const rutaInfo = rutas.find(r => r._id.toString() === rid?.toString());
            
            if (rutaInfo && rutaInfo.paradas && datos.pos) {
                let minDist = Infinity;
                rutaInfo.paradas.forEach((p, idx) => {
                    const d = Math.sqrt(Math.pow(p.latitud - datos.pos[0], 2) + Math.pow(p.longitud - datos.pos[1], 2));
                    if (d < minDist) {
                        minDist = d;
                        indexParadaActual = idx;
                    }
                });
            }

            const vehiculoSimulado = {
                ...datos,
                id,
                isSimulated: true,
                color: 'bg-indigo-400',
                occ: 'Simulado',
                indexParadaActual,
                nombreUnidad: `SIMULACIÓN ${id.slice(-4).toUpperCase()}`,
                conductorNombre: 'SISTEMA XANANI (Sim)'
            };

            onUpdate(vehiculoSimulado);
        };

        socket.on('ubicacion_simulada', handleSimulacion);

        return () => {
            socket.off('ubicacion_simulada');
        };
    }, [socket, rutas, onUpdate]);

    return null; // Componente lógico, no renderiza UI directa
};

export default SimPasajero;
