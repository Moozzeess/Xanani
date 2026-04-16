import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { useAlertaGlobal } from '../../context/AlertaContext';

const API_URL = `http://${window.location.hostname}:4000/api`;

/**
 * Modal de experiencia post-viaje activado automáticamente por el sistema
 * cuando detecta que el pasajero abordó la unidad (GPS < 50m por 30s).
 * No pregunta si abordó; lo infiere del contexto de seguimiento.
 */
const ModalExperiencia = ({ isOpen, unidad, onClose, onCalificar }) => {
  const [encontroAsiento, setEncontroAsiento] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const { dispararError } = useAlertaGlobal();

  if (!isOpen) return null;

  const handleEnviar = async () => {
    if (calificacion === 0) return;

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
          tipo: 'EXPERIENCIA',
          unidadId: unidad?._id || null,
          calificacion,
          encontroAsiento,
          descripcion: `Calificación post-viaje: ${calificacion}/5. Asiento: ${encontroAsiento === null ? 'no indicado' : encontroAsiento ? 'sí' : 'no'}`
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setCompletado(true);
      onCalificar?.({ calificacion, encontroAsiento });
      setTimeout(() => {
        setCompletado(false);
        setCalificacion(0);
        setEncontroAsiento(null);
        onClose();
      }, 2000);
    } catch (error) {
      dispararError('No se pudo guardar la calificación', error.message, 'Error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">

        {completado ? (
          <div className="flex flex-col items-center gap-3 py-10 px-5">
            <CheckCircle className="w-14 h-14 text-green-500" />
            <p className="text-sm font-bold text-slate-700 text-center">Gracias por tu feedback</p>
          </div>
        ) : (
          <>
            {/* Cabecera con detección automática */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                Abordaje detectado
              </p>
              <h3 className="text-sm font-bold">
                Detectamos que abordaste{' '}
                <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono">
                  {unidad?.placa || 'la unidad'}
                </span>
              </h3>
            </div>

            <div className="p-5">
              {/* Pregunta: encontró asiento */}
              <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                ¿Encontraste asiento?
              </p>
              <div className="flex gap-3 mb-5">
                {[{ val: true, label: 'Sí' }, { val: false, label: 'No' }].map(({ val, label }) => (
                  <button
                    key={String(val)}
                    onClick={() => setEncontroAsiento(val)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all
                      ${encontroAsiento === val
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Calificación 1-5 estrellas */}
              <p className="text-xs font-bold text-slate-500 uppercase mb-3">Califica el servicio</p>
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setCalificacion(n)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className="w-9 h-9 transition-colors"
                      fill={(hovered || calificacion) >= n ? '#fbbf24' : 'none'}
                      stroke={(hovered || calificacion) >= n ? '#fbbf24' : '#cbd5e1'}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={handleEnviar}
                disabled={calificacion === 0 || enviando}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-40"
              >
                {enviando ? 'Enviando...' : 'Enviar calificación'}
              </button>

              <button
                onClick={onClose}
                className="w-full mt-2 py-2 text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
              >
                Omitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalExperiencia;
