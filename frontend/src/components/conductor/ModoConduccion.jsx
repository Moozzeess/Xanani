import React, { useState, useEffect } from 'react';
import { TriangleAlert, Zap, Clock } from 'lucide-react';
import { Notificaciones } from './HUD_Components';

/**
 * Modo Conducción: Interfaz inmersiva para conductores, optimizada para uso en ruta.
 * Panel superior flotante con indicaciones de ruta.
 * Panel inferior flotante con estado (velocidad, hora llegada).
 * FABs para emergencias y reportes.
 *
 * @param {boolean} esSimulacion - true = modo simulacion (sin hardware). false = GPS real.
 */
const ModoConduccion = ({
    pasajeros = 0,
    capacidad = 20,
    seats = [],
    notificaciones = [],
    onRemoveNotificacion,
    onOpenReportes,
    onTriggerSOS,
    onStopRoute,
    siguienteParada = "Av. Principal",
    velocidad = "40",
    tiempoRestante = "15",
    esSimulacion = false
}) => {
    // Reloj del sistema
    const [horaActual, setHoraActual] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setHoraActual(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 30000); // Actualiza cada 30 seg
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="fixed inset-0 w-screen h-screen pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6">

            {/* BADGE DE MODO: indica visualmente si es simulacion o hardware real */}
            <div className="absolute top-4 left-4 z-50 pointer-events-none">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${
                    esSimulacion
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${esSimulacion ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
                    {esSimulacion ? 'Simulación' : 'GPS Real'}
                </div>
            </div>

            {/* PANEL SUPERIOR (Tarjeta de Indicación Flotante) */}
            <header className="pointer-events-auto w-full max-w-lg mx-auto transform transition-all duration-700 ease-out translate-y-0 opacity-100">
                <div className="glass-card rounded-[2rem] p-5 shadow-2xl flex items-center justify-between gap-4 border-white/20">
                    <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-blue-400 font-bold text-[10px] tracking-[0.2em] uppercase mb-1">Próxima Parada</span>
                        <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight">
                            {siguienteParada}
                        </h2>
                    </div>
                    
                    <button
                        onClick={onStopRoute}
                        className="bg-red-500/90 hover:bg-red-600 text-white h-14 px-5 rounded-2xl transition-all active:scale-95 shadow-lg border border-red-400/50 flex items-center justify-center font-bold text-sm"
                    >
                        Terminar
                    </button>
                </div>
            </header>

            {/* AREA DE NOTIFICACIONES */}
            <div className="absolute top-32 left-4 right-4 max-w-md mx-auto z-30 pointer-events-none">
                <Notificaciones
                    items={notificaciones}
                    onRemoveItem={onRemoveNotificacion}
                />
            </div>

            {/* CONTROLES LATERALES (FABs) */}
            <div className="flex flex-col gap-4 absolute right-4 bottom-32 pointer-events-auto">
                <button
                    onClick={onTriggerSOS}
                    className="bg-red-600 text-white w-16 h-16 rounded-full shadow-2xl shadow-red-900/40 flex items-center justify-center active:scale-90 transition-all border-4 border-white animate-pulse"
                    title="Emergencia SOS"
                >
                    <Zap className="w-8 h-8 fill-white" />
                </button>
                
                <button
                    onClick={onOpenReportes}
                    className="glass-card text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all border-white/20"
                    title="Reportar Incidencia"
                >
                    <TriangleAlert className="w-6 h-6 text-yellow-400" />
                </button>
            </div>

            {/* PANEL INFERIOR (Tarjeta de Status Flotante - "Waze Style") */}
            <footer className="pointer-events-auto w-full max-w-2xl mx-auto transform transition-all duration-700 ease-out translate-y-0 opacity-100">
                <div className="glass-card rounded-[2.5rem] p-1 shadow-2xl overflow-hidden border-white/10">
                    <div className="flex flex-row items-center justify-around py-4 px-6 gap-2">

                        {/* Velocidad */}
                        <div className="flex flex-col items-center justify-center min-w-[70px]">
                            <span className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{velocidad}</span>
                            <span className="text-[9px] text-blue-300 font-black uppercase tracking-widest">km/h</span>
                        </div>

                        {/* Separador */}
                        <div className="h-10 w-[1px] bg-white/10"></div>

                        {/* Tiempo y ETA */}
                        <div className="flex flex-col items-center justify-center flex-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-emerald-400 tabular-nums">{tiempoRestante}</span>
                                <span className="text-xs font-bold text-emerald-500/80">min</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-white/40" />
                                <span className="text-[10px] text-white/50 font-bold">{horaActual}</span>
                            </div>
                        </div>

                        {/* Separador */}
                        <div className="h-10 w-[1px] bg-white/10"></div>

                        {/* Ocupación / Pasajeros */}
                        <div className="flex flex-col items-center justify-center min-w-[70px]">
                            <div className="flex items-baseline gap-0.5">
                                <span className={`text-3xl font-black tabular-nums ${pasajeros >= capacidad ? 'text-red-400' : 'text-blue-400'}`}>
                                    {pasajeros}
                                </span>
                                <span className="text-xs font-bold text-white/30">/{capacidad}</span>
                            </div>
                            <span className="text-[9px] text-white/50 font-black uppercase tracking-widest">Pasajeros</span>
                        </div>

                        {/* Asientos Detectados */}
                        {seats && seats.length > 0 && (
                            <>
                                <div className="h-10 w-[1px] bg-white/10"></div>
                                <div className="flex flex-col items-center justify-center min-w-[100px]">
                                    <span className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-1">Asientos</span>
                                    <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5">
                                        {seats.map((ocupado, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-3.5 h-3.5 rounded-md transition-all duration-300 ${
                                                    ocupado ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                                }`}
                                                title={`Asiento ${idx + 1}: ${ocupado ? 'Ocupado' : 'Libre'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                    
                    {/* Barra de progreso de ocupación sutil en el fondo del panel */}
                    <div className="w-full bg-white/5 h-1.5 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${pasajeros >= capacidad ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${(pasajeros / capacidad) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default ModoConduccion;
