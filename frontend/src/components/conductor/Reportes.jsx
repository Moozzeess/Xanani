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
        <div className={`absolute inset-0 z-50 flex items-end justify-center bg-slate-900/90 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div
                className={`bg-white w-full rounded-t-[2rem] shadow-2xl overflow-hidden transform transition-transform duration-300 pb-8 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="p-6">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Reporte Rápido</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={() => onSubmit('Accidente')}
                            className="aspect-square bg-red-50 border-2 border-red-100 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-red-100"
                        >
                            <CarFront className="w-8 h-8 text-red-600" />
                            <span className="font-bold text-red-800">Accidente</span>
                        </button>

                        <button
                            onClick={() => onSubmit('Tráfico')}
                            className="aspect-square bg-yellow-50 border-2 border-yellow-100 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-yellow-100"
                        >
                            <Cone className="w-8 h-8 text-yellow-600" />
                            <span className="font-bold text-yellow-800">Tráfico</span>
                        </button>

                        <button
                            onClick={() => onSubmit('Falla Mecánica')}
                            className="aspect-square bg-orange-50 border-2 border-orange-100 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-orange-100"
                        >
                            <Wrench className="w-8 h-8 text-orange-600" />
                            <span className="font-bold text-orange-800">Mecánico</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="aspect-square bg-slate-100 border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <X className="w-8 h-8 text-slate-500" />
                            <span className="font-bold text-slate-600">Cancelar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reportes;
