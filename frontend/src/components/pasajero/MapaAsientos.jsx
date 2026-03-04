import React from 'react';
/**
 * Visualización interactiva de los asientos de un bus.
 */
const MapaAsientos = ({ ocupabilidad }) => {
    // Generar lógica de asientos ocupados según el nivel de ocupabilidad
    const totalAsientos = 16;
    const numOcupados = ocupabilidad === 'Alta' ? 14 : ocupabilidad === 'Media' ? 8 : 2;

    const asientos = Array.from({ length: totalAsientos }, (_, i) => ({
        id: i + 1,
        ocupado: i < numOcupados
    }));

    return (
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disponibilidad</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    {totalAsientos - numOcupados} asientos libres
                </span>
            </div>

            {/* Contenedor simulado de la cabina del bus */}
            <div className="relative border-2 border-slate-200 bg-white rounded-[1.5rem] p-3 max-w-[200px] mx-auto">
                {/* "Nariz" o parte frontal del bus */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-12 bg-slate-100 border-r-2 border-y-2 border-slate-200 rounded-r-lg"></div>

                {/* Cuadrícula de asientos */}
                <div className="grid grid-cols-4 gap-2 justify-items-center">
                    {asientos.map((asiento) => (
                        <div
                            key={asiento.id}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold transition-colors ${asiento.ocupado
                                    ? 'bg-slate-300 text-slate-500'
                                    : 'bg-white border border-green-500 text-green-600'
                                }`}
                        >
                            {asiento.id}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapaAsientos;
