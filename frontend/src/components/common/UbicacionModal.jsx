import React, { useState } from 'react';
import { MapPin, Shield, Check } from 'lucide-react';

/**
 * Modal para solicitar permisos de ubicación al usuario.
 * Proporciona una explicación clara de por qué es necesaria la ubicación.
 */
const UbicacionModal = ({ isOpen, onClose, onAccept }) => {
    const [isAccepted, setIsAccepted] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (isAccepted) {
            onAccept();
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-300 border border-white/20">

                {/* Header*/}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col items-center text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MapPin size={120} />
                    </div>

                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 ring-8 ring-white/10">
                        <MapPin size={40} className="text-white fill-white/20" />
                    </div>

                    <h2 className="text-2xl font-bold text-center">Activa tu Ubicación</h2>
                    <p className="text-indigo-100 text-sm text-center mt-2 font-medium">
                        Mejora tu experiencia de viaje con Xanani
                    </p>
                </div>

                {/* Contenido */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start group">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Privacidad</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Solo usamos tu ubicación para mostrar las unidades más cercanas a ti.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex-shrink-0 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                <Check size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Tiempo Real</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Visualiza el tiempo exacto de llegada de las unidades de acuerdo  tu ubicación actual.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Selector de Permiso (Checkbox/Toggle Estilizado) */}
                    <label
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none
              ${isAccepted
                                ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                    >
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isAccepted}
                                onChange={() => setIsAccepted(!isAccepted)}
                                className="hidden"
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                ${isAccepted
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-slate-300'}`}
                            >
                                {isAccepted && <Check size={16} className="text-white" />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <span className={`text-sm font-bold block ${isAccepted ? 'text-blue-700' : 'text-slate-700'}`}>
                                Autorizar Geolocalización
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                                Permitir que Xanani acceda a mi ubicación
                            </span>
                        </div>
                    </label>

                    {/* Botones de Acción */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            Ahora no
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isAccepted}
                            className={`px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95
                ${isAccepted
                                    ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-blue-200'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UbicacionModal;
