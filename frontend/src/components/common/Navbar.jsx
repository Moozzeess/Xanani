import React from 'react';
import { Map, Clock, Navigation, User, LogOut } from 'lucide-react';
/**
 * Componente de navegación inferior (Bottom Navigation Bar).
 * Proporciona acceso rápido a las secciones principales de la app.
 */
const Navbar = ({ onLogout, onCenterLocation }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[1000] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center h-16 px-4 max-w-md mx-auto">
                <button className="text-slate-900 flex flex-col items-center gap-1 w-14 transition-colors">
                    <Map className="w-6 h-6 stroke-[2.5]" />
                    <span className="text-[10px] font-bold">Mapa</span>
                </button>

                <button className="text-slate-400 hover:text-slate-600 flex flex-col items-center gap-1 w-14 transition-colors">
                    <Clock className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Historial</span>
                </button>

                <div className="relative -top-5">
                    <button
                        onClick={onCenterLocation}
                        className="w-14 h-14 bg-blue-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-lg shadow-blue-600/40 active:scale-95 transition-all border-4 border-white"
                    >
                        <Navigation className="w-6 h-6 -rotate-45" />
                    </button>
                </div>

                <button className="text-slate-400 hover:text-slate-600 flex flex-col items-center gap-1 w-14 transition-colors">
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Perfil</span>
                </button>

                <button
                    onClick={onLogout}
                    className="text-slate-400 hover:text-red-500 flex flex-col items-center gap-1 w-14 transition-colors"
                >
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Salir</span>
                </button>
            </div>

            {/* Indicador de barra de inicio (estilo iOS) */}
            <div className="w-full flex justify-center pb-2">
                <div className="w-20 h-1 bg-gray-200 rounded-full"></div>
            </div>
        </div>
    );
};

export default Navbar;
