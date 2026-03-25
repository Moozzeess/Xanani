import React from 'react';
import { Route, Navigation } from 'lucide-react';
import Ruta from './Ruta';
import { Contador, Notificaciones } from './HUD_Components';
import Navbar from '../common/Navbar'; // Importando el Navbar del pasajero

/**
 * Modo Navegación (Dashboard)
 * Incluye más detalles de la ruta, el Navbar del pasajero,
 * y un layout más extendido y manejable para el conductor.
 */
const ModoNavegacion = ({
    pasajeros,
    capacidad,
    notificaciones,
    onRemoveNotificacion,
    onChangeToConduccion,
    onStopRoute,
    onLogout
}) => {
    return (
        <main className="flex flex-col h-screen w-screen relative pointer-events-none z-10">
            {/* TOP BAR: Dashboard Style Header */}
            <header className="pt-6 pb-2 px-4 pointer-events-auto relative z-20 max-w-3xl mx-auto w-full">
                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl flex flex-col gap-4 border border-slate-700/80 backdrop-blur-md">
                    <div className="flex justify-between items-center w-full">
                        <Ruta />
                        <Contador count={pasajeros} capacity={capacidad} className="scale-90" />
                    </div>
                    <hr className="border-slate-700/50" />
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2 text-slate-300">
                            <Route className="w-5 h-5 text-blue-400" />
                            <span className="text-sm font-semibold">Dashboard Activo</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onStopRoute}
                                className="bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white px-3 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-red-900/40 border border-red-500 text-sm"
                            >
                                Terminar Ruta
                            </button>
                            <button
                                onClick={onChangeToConduccion}
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white px-3 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-900/40 border border-blue-500 text-sm"
                            >
                                <Navigation className="w-4 h-4" />
                                <span>Conducción</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* AREA DE NOTIFICACIONES */}
            <Notificaciones
                items={notificaciones}
                onRemoveItem={onRemoveNotificacion}
            />

            {/* ESPACIO VACÍO PARA VER EL MAPA EN EL CENTRO */}
            <div className="flex-1"></div>

            {/* NAVBAR INFERIOR (Estilo Pasajero) */}
            <div className="pointer-events-auto z-50">
                <Navbar 
                    onLogout={onLogout} 
                    onCenterLocation={() => { console.log("Recentrar mapa desde Modo Navegación"); }}
                />
            </div>
        </main>
    );
};

export default ModoNavegacion;
