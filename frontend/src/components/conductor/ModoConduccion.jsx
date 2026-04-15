import React, { useState, useEffect } from 'react';
import { MinusSquare, TriangleAlert, Zap, CornerUpRight, Clock, Gauge } from 'lucide-react';
import { Contador, Notificaciones } from './HUD_Components';

/**
 * Modo Conducción: Interfaz inmersiva para conductores, optimizada para uso en ruta.
 * Panel superior sólido con indicaciones de ruta.
 * Panel inferior sólido con estado (velocidad, hora llegada).
 * FABs para emergencias.
 */
const ModoConduccion = ({
    pasajeros,
    capacidad,
    notificaciones,
    onRemoveNotificacion,
    onOpenReportes,
    onTriggerSOS,
    onStopRoute,
    // Datos simulados o props que vendrían del estado real:
    siguienteParada = "Av. Principal",
    velocidad = "40",
    tiempoRestante = "15"
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
        <main className="flex flex-col h-screen w-screen relative pointer-events-none z-10">
            
            {/* PANEL SUPERIOR (Estilo Navegador GPS) */}
            <header className="pointer-events-auto relative z-20 w-full bg-[#1e2333] shadow-md border-b border-slate-700/50">
                <div className="flex flex-row items-center justify-between p-4 max-w-3xl mx-auto w-full">
                    {/* Indicación de Próxima parada */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-slate-400 font-bold text-[10px] tracking-widest uppercase mb-1">Próxima Parada</span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">{siguienteParada}</span>
                        </div>
                    </div>

                    {/* Botón para Finalizar la Ruta en la parte superior */}
                    <button 
                        onClick={onStopRoute}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg border-2 border-red-500 flex flex-col items-center justify-center font-bold"
                        title="Finalizar Ruta"
                    >
                        Terminar
                    </button>
                </div>
            </header>

            {/* AREA DE NOTIFICACIONES */}
            <Notificaciones
                items={notificaciones}
                onRemoveItem={onRemoveNotificacion}
            />

            {/* ESPACIO VACÍO PARA EL MAPA */}
            <div className="flex-1"></div>

            {/* BOTONES DE EMERGENCIA (Laterales flotantes, justo encima del panel inferior) */}
            <div className="px-4 pb-4 pointer-events-auto space-y-3 relative z-20">
                <div className="flex justify-between items-end max-w-3xl mx-auto w-full">
                    
                    {/* Botón Reportar (Izquierdo) */}
                    <button
                        onClick={onOpenReportes}
                        className="bg-white/95 text-slate-900 w-14 h-14 rounded-full shadow-lg border border-slate-200 flex items-center justify-center active:scale-95 transition-transform"
                        title="Reportar Incidencia"
                    >
                        <TriangleAlert className="w-6 h-6 text-yellow-600" />
                    </button>

                    {/* Botón SOS (Derecho) */}
                    <button
                        onClick={onTriggerSOS}
                        className="bg-red-600 text-white w-16 h-16 rounded-full shadow-xl shadow-red-900/50 flex items-center justify-center active:scale-95 transition-transform border-[3px] border-white"
                        title="Emergencia SOS"
                    >
                        <Zap className="w-7 h-7 fill-white" />
                    </button>
                </div>
            </div>

            {/* PANEL INFERIOR (Status de conducción estilo Waze) */}
            <footer className="pointer-events-auto relative z-20 w-full bg-[#1e2333] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-slate-700/50">
                <div className="flex flex-row items-center justify-between p-4 max-w-3xl mx-auto w-full">
                    
                    {/* Velocidad */}
                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                        <span className="text-2xl font-bold text-white transition-all">{velocidad}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">km/h</span>
                    </div>

                    {/* Línea Divisoria */}
                    <div className="h-10 w-[1px] bg-slate-700/50"></div>

                    {/* Tiempo Restante / ETA */}
                    <div className="flex flex-col items-center justify-center flex-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white tracking-wide">{tiempoRestante}</span>
                            <span className="text-sm font-semibold text-slate-300">min</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ETA</span>
                    </div>

                    {/* Línea Divisoria */}
                    <div className="h-10 w-[1px] bg-slate-700/50"></div>

                    {/* Reloj del Sistema */}
                    <div className="flex flex-col items-center justify-center flex-1">
                        <span className="text-2xl font-bold text-white tracking-wide">{horaActual || '--:--'}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Hora</span>
                        </div>
                    </div>

                    {/* Línea Divisoria */}
                    <div className="h-10 w-[1px] bg-slate-700/50"></div>

                    {/* Asientos / Afluencia */}
                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                        <div className="text-2xl font-bold flex items-baseline gap-0.5 text-white">
                            <span className={pasajeros >= capacidad ? 'text-red-400' : 'text-blue-400'}>{pasajeros}</span>
                            <span className="text-sm text-slate-500 font-medium">/{capacidad}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Pax</span>
                    </div>
                </div>
            </footer>
        </main>
    );
};

export default ModoConduccion;
