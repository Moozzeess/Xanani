import React, { useState } from 'react';
import { TriangleAlert, X, OctagonAlert, Clock, Trash2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAlertaGlobal } from '../../context/AlertaContext';

const API_URL = `http://${window.location.hostname}:4000/api`;

const TIPOS_INCIDENCIA = [
  { tipo: 'CONDUCCION_PELIGROSA', icono: OctagonAlert, etiqueta: 'Conducción peligrosa', color: 'hover:bg-red-50 hover:border-red-200 text-red-500' },
  { tipo: 'RETRASO', icono: Clock, etiqueta: 'Retraso', color: 'hover:bg-orange-50 hover:border-orange-200 text-orange-500' },
  { tipo: 'OTRO', icono: Trash2, etiqueta: 'Limpieza / otro', color: 'hover:bg-blue-50 hover:border-blue-200 text-blue-500' },
  { tipo: 'NO_PASO', icono: Shield, etiqueta: 'No pasó', color: 'hover:bg-purple-50 hover:border-purple-200 text-purple-500' },
];

/**
 * Modal de reporte de incidencias conectado al backend real.
 * Envía autenticado con JWT e incluye el ID de la unidad seleccionada.
 */
const ReporteModal = ({ isOpen, onClose, unidadId }) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('idle'); // idle | enviando | exito | error
  const { dispararError } = useAlertaGlobal();

  if (!isOpen) return null;

  const handleEnviar = async () => {
    if (!tipoSeleccionado) {
      dispararError('Selecciona un tipo de incidencia', '', 'Reporte incompleto');
      return;
    }

    setEstado('enviando');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: tipoSeleccionado,
          unidadId: unidadId || null,
          descripcion: descripcion.trim() || null
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setEstado('exito');
      setTimeout(() => {
        setEstado('idle');
        setTipoSeleccionado(null);
        setDescripcion('');
        onClose();
      }, 2000);
    } catch (error) {
      setEstado('error');
      dispararError('No se pudo enviar el reporte', error.message, 'Error de red');
      setTimeout(() => setEstado('idle'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="bg-[#1f1f1f] p-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2 text-sm tracking-wide">
            <TriangleAlert className="text-amber-400 w-4 h-4" /> REPORTAR INCIDENCIA
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {estado === 'exito' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <p className="font-bold text-slate-700">Reporte enviado correctamente</p>
            </div>
          ) : estado === 'error' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="w-14 h-14 text-red-500" />
              <p className="font-bold text-slate-700">No se pudo enviar</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Tipo de incidencia</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {TIPOS_INCIDENCIA.map(({ tipo, icono: Icono, etiqueta, color }) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoSeleccionado(tipo)}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-colors bg-gray-50 ${color}
                      ${tipoSeleccionado === tipo ? 'ring-2 ring-slate-900 scale-95' : ''}`}
                  >
                    <Icono className="w-5 h-5" />
                    <span className="text-xs font-bold text-gray-700">{etiqueta}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional..."
                maxLength={200}
                rows={2}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 resize-none outline-none focus:border-slate-400 transition-colors mb-4"
              />

              <button
                onClick={handleEnviar}
                disabled={estado === 'enviando'}
                className="w-full py-3.5 bg-[#1f1f1f] text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all text-sm uppercase tracking-wide disabled:opacity-60"
              >
                {estado === 'enviando' ? 'Enviando...' : 'Enviar Reporte'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteModal;
