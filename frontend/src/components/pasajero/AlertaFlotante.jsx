import React from 'react';
import { TriangleAlert } from 'lucide-react';
/**
 * Botón flotante de alerta para reportar incidencias.
 */
const AlertaFlotante = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 z-[500] group cursor-pointer active:scale-95 transition-transform drop-shadow-2xl"
            aria-label="Abrir reporte de alerta"
        >
            <div className="relative w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
                <div className="absolute inset-0 bg-yellow-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <TriangleAlert className="w-8 h-8 text-yellow-500 fill-yellow-100" />
            </div>
        </button>
    );
};

export default AlertaFlotante;
