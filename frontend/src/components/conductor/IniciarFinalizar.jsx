import React from 'react';
import { Play, Route, Cpu, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

/**
 * Pantalla de espera del conductor (NoRouteOverlay).
 *
 * Comportamiento automatico del boton central:
 *   - VERDE: el broker detecta telemetria del dispositivo → inicia en modo real.
 *   - AZUL: no hay señal del dispositivo → inicia en modo simulacion automaticamente.
 * El conductor no elige el modo — el sistema lo determina segun el estado del hardware.
 *
 * @param {Function} onStart     - Callback unico de inicio (Conductor.jsx decide el modo).
 * @param {Function} onLogout    - Callback al cerrar sesion.
 * @param {string}  unidadAsignada - Placa o nombre de la unidad.
 * @param {string}  rutaDefecto    - Nombre de la ruta asignada.
 * @param {boolean} isHardwareActive - true si el broker recibio datos del dispositivo recientemente.
 */
export const NoRouteOverlay = ({
    onStart,
    onLogout,
    unidadAsignada = 'Sin Asignar',
    rutaDefecto = 'Sin Ruta',
    isHardwareActive = false
}) => {
    return (
        <React.Fragment>
            <div className="absolute inset-0 bg-slate-900 z-[60] flex flex-col p-6 text-white pb-24 overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 pt-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Inicio</h1>
                        <p className="text-slate-400 font-medium">Panel Principal del Conductor</p>
                    </div>
                </div>

                {/* Tarjetas de informacion rapida */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-lg flex flex-col items-start backdrop-blur-sm">
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Unidad Asignada</span>
                        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">{unidadAsignada}</span>
                    </div>
                    <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 shadow-lg flex flex-col items-start backdrop-blur-sm">
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">Ruta Asignada</span>
                        <div className="flex items-center gap-2">
                            <Route className="w-5 h-5 text-indigo-400" />
                            <span className="text-xl font-bold text-white truncate">{rutaDefecto}</span>
                        </div>
                    </div>
                </div>

                {/* Estado del dispositivo */}
                <div className="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />

                    {/* Icono de estado */}
                    <div className={`w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-2xl relative z-10 border-4 transition-all duration-500 ${
                        isHardwareActive
                            ? 'border-emerald-500/60 shadow-emerald-500/20'
                            : 'border-slate-700/50'
                    }`}>
                        {isHardwareActive
                            ? <ShieldCheck className="w-10 h-10 text-emerald-500 animate-pulse" />
                            : <Cpu className="w-10 h-10 text-slate-400" />
                        }
                    </div>

                    {/* Titulo de estado */}
                    <h2 className="text-xl font-bold text-white mb-1 relative z-10">
                        {isHardwareActive ? 'Dispositivo Conectado' : 'Dispositivo Inactivo'}
                    </h2>

                    {/* Descripcion */}
                    <p className="text-slate-400 text-xs text-center mb-5 max-w-xs relative z-10 leading-relaxed">
                        {isHardwareActive
                            ? 'El broker MQTT está recibiendo telemetría. El recorrido usará datos reales del GPS.'
                            : 'No se detecta señal del dispositivo. El recorrido iniciará en modo simulación.'}
                    </p>

                    {/* Pill de señal */}
                    <div className={`w-full py-3 px-5 rounded-2xl flex items-center justify-center gap-3 border backdrop-blur-md transition-all duration-500 mb-6 ${
                        isHardwareActive
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
                    }`}>
                        {isHardwareActive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isHardwareActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {isHardwareActive ? 'Transmitiendo en tiempo real' : 'Sin señal del dispositivo'}
                        </span>
                    </div>

                    {/* BOTON CENTRAL UNICO — verde=real, azul=simulacion */}
                    <button
                        onClick={onStart}
                        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-base transition-all active:scale-95 shadow-xl ${
                            isHardwareActive
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        }`}
                    >
                        <Play className="w-5 h-5 fill-current" />
                        {isHardwareActive ? 'Iniciar Recorrido' : 'Iniciar Recorrido'}
                    </button>
                </div>
            </div>
        </React.Fragment>
    );
};
