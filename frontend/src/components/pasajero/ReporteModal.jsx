import React from 'react';
import { TriangleAlert, X, OctagonAlert, Clock, Trash2, Shield } from 'lucide-react';

/**
 * Modal de reporte de incidencias para pasajeros.
 */
const ReporteModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const tiposIncidencia = [
        { icon: <OctagonAlert className="text-red-500" />, label: 'Accidente', color: 'hover:bg-red-50 hover:border-red-200' },
        { icon: <Clock className="text-orange-500" />, label: 'Retraso', color: 'hover:bg-orange-50 hover:border-orange-200' },
        { icon: <Trash2 className="text-blue-500" />, label: 'Limpieza', color: 'hover:bg-blue-50 hover:border-blue-200' },
        { icon: <Shield className="text-purple-500" />, label: 'Seguridad', color: 'hover:bg-purple-50 hover:border-purple-200' },
    ];

    return (
        <div className={`fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-200`}>
            <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-200 scale-100">
                {/* Cabecera del modal */}
                <div className="bg-[#1f1f1f] p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2 text-sm tracking-wide">
                        <TriangleAlert className="text-amber-400 w-4 h-4" /> REPORTAR
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido del modal */}
                <div className="p-5">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 text-left">Tipo de incidencia</p>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {tiposIncidencia.map((tipo, idx) => (
                            <button
                                key={idx}
                                className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-colors bg-gray-50 ${tipo.color}`}
                            >
                                {tipo.icon}
                                <span className="text-xs font-bold text-gray-700">{tipo.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-[#1f1f1f] text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wide"
                    >
                        Enviar Reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReporteModal;
