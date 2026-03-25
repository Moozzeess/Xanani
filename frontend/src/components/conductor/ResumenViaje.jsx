import React from 'react';
import { CheckCircle, Users, DollarSign, Route, Clock, Star, ArrowRight } from 'lucide-react';

/**
 * Muestra el resumen estadístico al finalizar la ruta de conducción.
 */
const ResumenViaje = ({
    estadisticas = {
        pasajerosTotales: 0,
        ganancias: 0,
        kmRecorridos: 0,
        tiempoMinutos: 0,
        calificacion: 5.0
    },
    onClose
}) => {
    return (
        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col justify-center items-center p-6 text-white font-sans animate-in fade-in zoom-in duration-300">
            {/* Header de Éxito */}
            <div className="flex flex-col items-center text-center mb-8">
                <div className="bg-green-500/20 p-4 rounded-full mb-4">
                    <CheckCircle className="w-16 h-16 text-green-400" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Ruta Finalizada</h1>
                <p className="text-slate-400 mt-2 text-sm font-medium">¡Gran trabajo en este viaje!</p>
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
                {/* Pasajeros Totales */}
                <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-700 shadow-lg">
                    <Users className="w-6 h-6 text-blue-400 mb-2" />
                    <span className="text-2xl font-bold">{estadisticas.pasajerosTotales}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Pasajeros</span>
                </div>

                {/* Ganancias Estimadas */}
                <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-700 shadow-lg">
                    <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
                    <span className="text-2xl font-bold">${estadisticas.ganancias.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Ganancias aproximadas</span>
                </div>

                {/* Kilómetros Recorridos */}
                <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-700 shadow-lg">
                    <Route className="w-6 h-6 text-indigo-400 mb-2" />
                    <span className="text-2xl font-bold">{estadisticas.kmRecorridos.toFixed(1)}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">KM Recorridos</span>
                </div>

                {/* Tiempo invertido */}
                <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-700 shadow-lg">
                    <Clock className="w-6 h-6 text-orange-400 mb-2" />
                    <span className="text-2xl font-bold">{estadisticas.tiempoMinutos}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Minutos</span>
                </div>

                {/* Calificación */}
                <div className="col-span-2 bg-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-700 shadow-lg">
                    <div className="flex text-yellow-500 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-6 h-6 ${i < Math.floor(estadisticas.calificacion) ? 'fill-yellow-500' : 'fill-slate-600 text-slate-600'}`} />
                        ))}
                    </div>
                    <span className="text-2xl font-bold">{estadisticas.calificacion.toFixed(1)}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Calificación Promedio</span>
                </div>
            </div>

            {/* Botón Volver al Inicio */}
            <button
                onClick={onClose}
                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] flex items-center justify-center space-x-2 transition-transform active:scale-95"
            >
                <span>Volver al Inicio</span>
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ResumenViaje;
