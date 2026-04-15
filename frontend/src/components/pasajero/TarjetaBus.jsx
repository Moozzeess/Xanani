import React from 'react';
import { User, MapPin, Flag, X } from 'lucide-react';
import MapaAsientos from './MapaAsientos';

/**
 * Hoja de detalles del vehículo (Bottom Sheet).
 */
const TarjetaBus = ({ vehicle, onClose, onReport, onVerRuta }) => {
    if (!vehicle) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[1100] flex flex-col items-center justify-end h-full pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div className="w-full bg-white rounded-t-[2rem] shadow-2xl pointer-events-auto relative overflow-hidden pb-8 z-50 animate-in slide-in-from-bottom duration-300">
                <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>

                <div className="px-6 pt-2 pb-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{vehicle.plate}</h2>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                <User className="w-3 h-3" /> {vehicle.driver}
                            </div>
                        </div>
                        <span className={`${vehicle.pillBg} px-3 py-1 rounded-full text-xs font-bold border border-current/10`}>
                            {vehicle.status}
                        </span>
                    </div>

                    {/* Componente de Asientos */}
                    <MapaAsientos ocupabilidad={vehicle.occ} />

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onVerRuta}
                            className="bg-slate-100 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2">
                            <MapPin className="w-4 h-4" /> Ver Ruta
                        </button>
                        <button
                            onClick={onReport}
                            className="bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                        >
                            <Flag className="w-4 h-4" /> Reportar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TarjetaBus;
