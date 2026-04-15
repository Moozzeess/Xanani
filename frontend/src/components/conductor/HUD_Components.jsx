import React from 'react';
import { Info, TriangleAlert, X } from 'lucide-react';

/**
 * Componente que muestra el contador de pasajeros y progreso de ocupación.
 */
export const Contador = ({ count = 0, capacity = 20 }) => {
    const percentage = Math.min((count / capacity) * 100, 100);

    // Determinar color basado en ocupación
    let barColor = 'bg-green-500';
    if (percentage > 90) barColor = 'bg-red-500';
    else if (percentage > 50) barColor = 'bg-yellow-500';

    return (
        <div className="flex flex-col items-end">
            <div className="bg-slate-800 px-3 py-2 rounded-xl border border-slate-600 text-center">
                <span className="text-2xl font-bold block leading-none text-white">{count}</span>
                <span className="text-[8px] text-slate-400 uppercase font-bold">Pasajeros</span>
            </div>
            <div className="w-full bg-slate-700 h-1 mt-1 rounded-full overflow-hidden">
                <div
                    className={`${barColor} h-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

/**
 * Componente de Toast individual para notificaciones.
 */
const Toast = ({ title, message, type = 'info', onRemove }) => {
    const isAlert = type === 'alert';
    const bgColor = isAlert ? 'bg-red-900/95 border-red-500' : 'bg-slate-800/95 border-slate-600';
    const Icon = isAlert ? TriangleAlert : Info;

    return (
        <div className={`pointer-events-auto w-full p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 animate-slide-down ${bgColor} text-white`}>
            <div className="mt-0.5 shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm leading-tight">{title}</h4>
                <p className="text-xs opacity-90 mt-1 font-medium leading-snug">{message}</p>
            </div>
            <button onClick={onRemove} className="text-white/50 hover:text-white ml-2">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

/**
 * Contenedor de notificaciones que las gestiona dinámicamente.
 */
export const Notificaciones = ({ items = [], onRemoveItem }) => {
    return (
        <div id="toast-container" className="absolute top-36 left-4 right-4 z-30 flex flex-col gap-2">
            {items.map(item => (
                <Toast
                    key={item.id}
                    {...item}
                    onRemove={() => onRemoveItem(item.id)}
                />
            ))}
        </div>
    );
};
