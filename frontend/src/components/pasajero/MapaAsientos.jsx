import React, { useMemo } from 'react';

/**
 * Visualización interactiva de los asientos de un bus.
 * Muestra la ocupación real basada en los sensores de la unidad.
 * 
 * @param {number} ocupacionActual - Número de personas actualmente en el bus.
 * @param {number} capacidadMaxima - Capacidad total de asientos de la unidad.
 * @param {string} vehicleId - ID de la unidad para consistencia en la distribución.
 * @param {string} ocupabilidad - Respaldo (Baja, Media, Alta) si no hay datos numéricos.
 */
const MapaAsientos = ({ ocupacionActual, capacidadMaxima, vehicleId, ocupabilidad }) => {
    
    // 1. Determinar el número real de asientos y ocupados
    // Se limita a un máximo de 15 según requerimiento de diseño, o se usa el valor configurado
    const totalAsientos = Math.min(capacidadMaxima || 15, 15);
    
    // Si tenemos ocupacionActual la usamos, si no, usamos el respaldo de etiquetas
    let numOcupados = typeof ocupacionActual === 'number' 
        ? ocupacionActual 
        : (ocupabilidad === 'Alta' ? Math.floor(totalAsientos * 0.8) : ocupabilidad === 'Media' ? Math.floor(totalAsientos * 0.5) : 2);

    // Asegurar que no exceda el total
    if (numOcupados > totalAsientos) numOcupados = totalAsientos;

    // 2. Generar distribución de asientos "fija" para este vehículo
    // Usamos useMemo para que no "bailen" los asientos al actualizarse la posición
    const asientos = useMemo(() => {
        const tempAsientos = Array.from({ length: totalAsientos }, (_, i) => ({
            id: i + 1,
            ocupado: false
        }));

        // Algoritmo simple para distribuir ocupados de forma consistente por vehicleId
        // (Simula que ciertos asientos se ocupan primero o que son los detectados)
        let seed = 0;
        if (vehicleId) {
            for (let i = 0; i < vehicleId.length; i++) {
                seed += vehicleId.charCodeAt(i);
            }
        }

        // Marcar asientos como ocupados basándose en la semilla
        let marcados = 0;
        let index = seed % totalAsientos;
        
        while (marcados < numOcupados) {
            if (!tempAsientos[index].ocupado) {
                tempAsientos[index].ocupado = true;
                marcados++;
            }
            index = (index + 7) % totalAsientos; // Salto consistente
        }

        return tempAsientos;
    }, [totalAsientos, numOcupados, vehicleId]);

    const asientosLibres = totalAsientos - numOcupados;

    return (
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Mapa de Asientos</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${
                    asientosLibres > 5 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                    {asientosLibres} asientos libres
                </span>
            </div>

            {/* Contenedor de la cabina del bus */}
            <div className="relative border-2 border-slate-200 bg-white rounded-[1.5rem] p-4 max-w-[220px] mx-auto shadow-sm">
                {/* Parte frontal del bus (Volante/Conductor) */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-12 bg-slate-100 border-r-2 border-y-2 border-slate-200 rounded-r-lg"></div>
                <div className="absolute top-2 left-2 w-3 h-3 border-2 border-slate-200 rounded-sm opacity-30"></div> {/* Simulación Volante */}

                {/* Cuadrícula de asientos */}
                <div className="grid grid-cols-4 gap-3 justify-items-center">
                    {asientos.map((asiento) => (
                        <div
                            key={asiento.id}
                            title={asiento.ocupado ? "Ocupado" : "Libre"}
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold transition-all duration-500 shadow-sm ${
                                asiento.ocupado
                                    ? 'bg-slate-200 text-slate-400 border border-slate-300'
                                    : 'bg-white border-2 border-green-500 text-green-600 hover:scale-110'
                            }`}
                        >
                            {asiento.id}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-4 flex justify-center gap-4 text-[9px] font-bold uppercase tracking-tighter text-slate-400">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-white border border-green-500"></div> Libre
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-slate-200 border border-slate-300"></div> Ocupado
                </div>
            </div>
        </div>
    );
};

export default MapaAsientos;
