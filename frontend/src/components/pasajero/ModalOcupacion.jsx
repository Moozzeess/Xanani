import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { useAlertaGlobal } from '../../context/AlertaContext';

const API_URL = `http://${window.location.hostname}:4000/api`;

const OPCIONES = [
  { tipo: 'HAY_LUGARES', etiqueta: 'Hay lugares', emoji: '🟢', color: 'border-green-200 bg-green-50 hover:bg-green-100 text-green-800' },
  { tipo: 'UNIDAD_LLENA', etiqueta: 'Va lleno', emoji: '🔴', color: 'border-red-200 bg-red-50 hover:bg-red-100 text-red-800' },
  { tipo: 'CONFIRMAR_PASO', etiqueta: 'Pasó por aquí', emoji: '✅', color: 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800' },
  { tipo: 'NO_PASO', etiqueta: 'No ha pasado', emoji: '🚫', color: 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800' },
  { tipo: 'RETRASO', etiqueta: 'Llegó tarde', emoji: '⏱️', color: 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800' },
  { tipo: 'CONDUCCION_PELIGROSA', etiqueta: 'Conducción peligrosa', emoji: '⚠️', color: 'border-red-300 bg-red-100 hover:bg-red-200 text-red-900' },
];

/**
 * Modal de crowdsourcing para que el pasajero reporte el estado real de la unidad.
 * Envía el reporte al backend con autenticación JWT.
 */
const ModalOcupacion = ({ isOpen, onClose, unidad }) => {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { dispararError } = useAlertaGlobal();

  if (!isOpen) return null;

  const enviar = async (tipo) => {
    setEnviando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo,
          unidadId: unidad?._id || null,
          descripcion: `Reporte crowdsource: ${tipo}`
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setEnviado(true);
      setTimeout(() => {
        setEnviado(false);
        onClose();
      }, 1500);
    } catch (error) {
      dispararError('No se pudo enviar el reporte', error.message, 'Error de red');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">¿Cómo va la unidad?</h3>
            {unidad && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">{unidad.placa}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-5 pb-6">
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm font-bold text-slate-700">Reporte enviado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {OPCIONES.map((op) => (
                <button
                  key={op.tipo}
                  onClick={() => enviar(op.tipo)}
                  disabled={enviando}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${op.color}`}
                >
                  <span className="text-2xl leading-none">{op.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight text-center">{op.etiqueta}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalOcupacion;
