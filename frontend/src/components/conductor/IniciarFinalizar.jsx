import React from 'react';
import { MapPinOff, Play, LogOut, Route } from 'lucide-react';
import Navbar from '../common/Navbar';

/**
 * Vista de Inicio (Espera)
 * Fusiona el Dashboard de visualización (antes navegación)
 * y el estado de inactividad, incluyendo el Navbar del pasajero.
 */
export const NoRouteOverlay = ({ onStart, onLogout, unidadAsignada = "Sin Asignar", rutaDefecto = "Sin Ruta" }) => {
    return (
        <React.Fragment>
            <div className="absolute inset-0 bg-slate-900 z-[60] flex flex-col p-6 text-white pb-24 overflow-y-auto">
                
                {/* Header / Perfil */}
                <div className="flex justify-between items-center mb-6 pt-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Inicio</h1>
                        <p className="text-slate-400 font-medium">Panel Principal del Conductor</p>
                    </div>
                </div>

                {/* Tarjetas de Información Rápida (Datos listos para backend) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-lg flex flex-col items-start backdrop-blur-sm">
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Unidad Asignada</span>
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">{unidadAsignada}</span>
                    </div>
                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-lg flex flex-col items-start backdrop-blur-sm">
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Ruta Defecto</span>
                        <div className="flex items-center gap-2">
                            <Route className="w-5 h-5 text-indigo-400" />
                            <span className="text-xl font-bold text-white">{rutaDefecto}</span>
                        </div>
                    </div>
                </div>

                {/* Sección Central de Estado */}
                <div className="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 mt-4 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                    
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-2xl relative z-10 border-4 border-slate-700/50">
                        <MapPinOff className="w-10 h-10 text-slate-400" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Unidad en Espera</h2>
                    <p className="text-slate-400 text-sm text-center mb-8 max-w-xs relative z-10 leading-relaxed font-medium">
                        El seguimiento GPS y el contador de pasajeros se activarán en el recorrido.
                    </p>

                    <button
                        onClick={onStart}
                        className="w-full relative z-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-[0_4px_30px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 border border-blue-400"
                    >
                        <Play className="w-6 h-6 fill-current" /> INICIAR RUTA
                    </button>
                </div>
            </div>

            {/* NAVBAR INFERIOR (Estilo Pasajero en el Inicio) */}
            <div className="pointer-events-auto z-[70]">
                <Navbar 
                    onLogout={onLogout} 
                    onCenterLocation={() => { console.log("Recentrar en el Inicio"); }}
                />
            </div>
        </React.Fragment>
    );
};
