import React from 'react';
import { Navigation } from 'lucide-react';

/**
 * Componente que muestra la información de navegación de la ruta.
 */
const Ruta = ({ stops = [], currentStopIndex = 0, distance = '350m', time = '2 min' }) => {
    const nextStop = stops[currentStopIndex] || "Av. Central";

    return (
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span id="status-indicator" className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">En Ruta</span>
                </div>
                <h1 className="text-2xl font-bold leading-none">Próx: {nextStop}</h1>
                <p className="text-slate-400 text-xs font-medium mt-1 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {distance} • Llegada en {time}
                </p>
            </div>
        </div>
    );
};

export default Ruta;
