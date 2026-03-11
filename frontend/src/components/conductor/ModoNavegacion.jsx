import React from 'react';
import { TriangleAlert, Zap } from 'lucide-react';
import Ruta from './Ruta';
import { Contador, Notificaciones } from './HUD_Components';
import { BarraInferior } from './IniciarFinalizar';

/**
 * HUD Principal que orquesta la información en tiempo real.
 */
const ModoNavegacion = ({
    pasajeros,
    capacidad,
    notificaciones,
    onRemoveNotificacion,
    onOpenReportes,
    onTriggerSOS,
    onStopRoute
}) => {
    return (
        <main className="flex flex-col h-screen w-screen relative pointer-events-none z-10">
            {/* TOP BAR: Información Crítica */}
            <header className="pt-6 pb-2 px-4 pointer-events-auto relative z-20 max-w-3xl mx-auto w-full">
                <div className="bg-slate-900/90 text-white p-4 rounded-2xl shadow-lg hud-panel flex justify-between items-start border border-slate-700">
                    <Ruta />
                    <Contador count={pasajeros} capacity={capacidad} />
                </div>
            </header>

            {/* AREA DE NOTIFICACIONES (TOASTS) */}
            <Notificaciones
                items={notificaciones}
                onRemoveItem={onRemoveNotificacion}
            />

            {/* ESPACIO VACÍO PARA VER EL MAPA */}
            <div className="flex-1"></div>

            {/* CONTROLES INFERIORES */}
            <div className="px-4 pb-2 pointer-events-auto space-y-3">
                {/* Botones de Acción */}
                <div className="grid grid-cols-[1fr_auto] gap-3 max-w-3xl mx-auto w-full">
                    <button
                        onClick={onOpenReportes}
                        className="bg-white/95 text-slate-900 p-4 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center gap-3 font-bold active:scale-95 transition-transform hover:bg-slate-50"
                    >
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <TriangleAlert className="w-5 h-5" />
                        </div>
                        <span>Reportar Incidencia</span>
                    </button>

                    {/* Botón SOS */}
                    <button
                        onClick={onTriggerSOS}
                        className="bg-red-600 text-white p-4 rounded-2xl shadow-lg shadow-red-900/30 flex items-center justify-center font-bold active:scale-95 transition-transform border-2 border-red-500"
                    >
                        <Zap className="w-6 h-6 fill-white" />
                    </button>
                </div>

                {/* Barra Inferior */}
                <BarraInferior onStop={onStopRoute} />
            </div>
        </main>
    );
};

export default ModoNavegacion;
