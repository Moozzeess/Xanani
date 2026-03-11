import React from 'react';
import { MapPinOff, Play, CircleStop } from 'lucide-react';

/**
 * Overlay de pantalla completa cuando la unidad no está en ruta.
 */
export const NoRouteOverlay = ({ onStart }) => {
    return (
        <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-8 text-center pointer-events-auto">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <MapPinOff className="w-10 h-10 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Unidad en Espera</h2>
            <p className="text-slate-400 text-sm mb-8">El sistema de navegación está en espera. Inicia ruta para activar el rastreo.</p>

            <button
                onClick={onStart}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                <Play className="w-5 h-5 fill-current" /> Iniciar Ruta
            </button>
        </div>
    );
};

/**
 * Controles de la barra inferior para finalizar ruta y ver info.
 */
export const BarraInferior = ({ onStop, speed = '45 km/h', time = '10:42' }) => {
    return (
        <div className="px-4 pb-6 pointer-events-auto space-y-3">
            <div className="bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl flex justify-between items-center shadow-lg border-t border-slate-800 max-w-3xl mx-auto">
                <button
                    onClick={onStop}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold"
                >
                    <CircleStop className="w-5 h-5" />
                    Finalizar
                </button>

                <div className="h-4 w-[1px] bg-slate-700"></div>

                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-400 uppercase">Velocidad</span>
                        <span className="font-mono font-bold text-sm">{speed}</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-[10px] text-slate-400 uppercase">Hora</span>
                        <span className="font-mono font-bold text-sm">{time}</span>
                    </div>
                </div>
            </div>

            <div className="w-full flex justify-center pt-1">
                <div className="w-32 h-1 bg-gray-300/50 rounded-full"></div>
            </div>
        </div>
    );
};
