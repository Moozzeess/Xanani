import React, { useEffect, useState } from 'react';
import { CarFront, Cone, Wrench, X } from 'lucide-react';

/**
 * Modal Bottom-Sheet para reportar incidencias rápidamente.
 */
const Reportes = ({ isOpen, onClose, onSubmit }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    return (
        <div className={`absolute left-4 right-4 bottom-32 z-[100] transition-all duration-500 transform ${isOpen ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
            <div className="glass-card rounded-[2.5rem] shadow-2xl overflow-hidden border-white/20 max-w-lg mx-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-white px-2">¿Qué sucede en el camino?</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6 text-white/50" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => onSubmit('ACCIDENTE')}
                            className="bg-red-500/20 border border-red-500/40 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 active:scale-90 transition-all hover:bg-red-500/30 group"
                        >
                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <CarFront className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xs text-red-200">Accidente</span>
                        </button>

                        <button
                            onClick={() => onSubmit('TRAFICO')}
                            className="bg-yellow-500/20 border border-yellow-500/40 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 active:scale-90 transition-all hover:bg-yellow-500/30 group"
                        >
                            <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Cone className="w-6 h-6 text-black" />
                            </div>
                            <span className="font-bold text-xs text-yellow-200">Tráfico</span>
                        </button>

                        <button
                            onClick={() => onSubmit('FALLA_MECANICA')}
                            className="bg-orange-500/20 border border-orange-500/40 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 active:scale-90 transition-all hover:bg-orange-500/30 group"
                        >
                            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Wrench className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xs text-orange-200">Avería</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;
