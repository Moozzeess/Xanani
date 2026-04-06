import React from 'react';
import { User, MapPin, Flag, X, TrendingUp, TrendingDown, Minus, Navigation, Clock, Zap } from 'lucide-react';
import MapaAsientos from './MapaAsientos';

const API_URL = `http://${window.location.hostname}:4000/api`;

/**
 * Convierte el ángulo de dirección en grados a texto cardinal.
 */
function anguloACardinal(grados) {
  if (grados == null) return null;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(grados / 45) % 8];
}

/**
 * Hoja de detalles expandida de una unidad de transporte.
 * Muestra información de interpretación (ETA, dirección, tendencia, proximidad),
 * acciones principales y chips de crowdsourcing rápido.
 */
const TarjetaBus = ({ vehicle, onClose, onReport, onVerRuta, onSeguir }) => {
  if (!vehicle) return null;

  const { eta, distancia, tendencia, pctOcupacion, nivelOcupacion, direccion, velocidad } = vehicle;

  const cardinal = anguloACardinal(direccion);
  const distanciaTexto = distancia != null
    ? distancia < 1000 ? `${Math.round(distancia)}m` : `${(distancia / 1000).toFixed(1)}km`
    : null;

  const etaTexto = eta != null ? (eta < 1 ? '<1 min' : `${eta} min`) : null;

  /**
   * Envía un reporte de ocupación rápido al backend sin abrir el modal completo.
   */
  const enviarCrowdsource = async (tipo) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/reportes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ unidadId: vehicle._id, tipo })
      });
    } catch (e) {
      console.error('Error al enviar crowdsource:', e);
    }
  };

  const iconoTendencia = {
    subiendo: <TrendingUp className="w-3.5 h-3.5 text-red-500" />,
    bajando: <TrendingDown className="w-3.5 h-3.5 text-green-500" />,
    estable: <Minus className="w-3.5 h-3.5 text-slate-400" />,
  }[tendencia || 'estable'];

  const colorOcupacion = {
    Alta: 'text-red-600 bg-red-50',
    Media: 'text-amber-600 bg-amber-50',
    Baja: 'text-green-600 bg-green-50',
  }[nivelOcupacion || 'Baja'];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1100] flex flex-col items-center justify-end h-full pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Contenido del sheet */}
      <div className="w-full bg-white rounded-t-[2rem] shadow-2xl pointer-events-auto relative overflow-hidden pb-8 z-50 animate-in slide-in-from-bottom duration-300">
        {/* Handle de arrastre */}
        <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pt-2 pb-4 max-h-[78vh] overflow-y-auto no-scrollbar">

          {/* Cabecera: placa, conductor, estado */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{vehicle.placa}</h2>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <User className="w-3 h-3" />
                <span>{vehicle.conductor?.username || vehicle.conductor || 'Sin asignar'}</span>
              </div>
            </div>
            <span className={`${vehicle.pillBg || 'bg-slate-100 text-slate-700'} px-3 py-1 rounded-full text-xs font-bold border border-current/10`}>
              {vehicle.estado}
            </span>
          </div>

          {/* Métricas de interpretación */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {etaTexto && (
              <div className="bg-blue-50 rounded-xl p-3 flex flex-col items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-blue-700">{etaTexto}</span>
                <span className="text-[9px] text-blue-400 font-medium">ETA</span>
              </div>
            )}
            {distanciaTexto && (
              <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700">{distanciaTexto}</span>
                <span className="text-[9px] text-slate-400 font-medium">Distancia</span>
              </div>
            )}
            {cardinal && (
              <div className="bg-indigo-50 rounded-xl p-3 flex flex-col items-center gap-1">
                <Navigation className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700">Hacia {cardinal}</span>
                <span className="text-[9px] text-indigo-400 font-medium">Dirección</span>
              </div>
            )}
          </div>

          {/* Indicador de ocupación con tendencia */}
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-4 ${colorOcupacion}`}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-bold">Ocupación {nivelOcupacion || 'Baja'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {iconoTendencia}
              <span className="text-xs font-medium">{pctOcupacion ?? 0}%</span>
            </div>
          </div>

          {/* Mapa de asientos */}
          <MapaAsientos ocupabilidad={nivelOcupacion || vehicle.occ} />

          {/* Crowdsourcing rápido */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => enviarCrowdsource('UNIDAD_LLENA')}
              className="flex-1 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold transition-colors hover:bg-red-100 active:scale-95"
            >
              Va lleno
            </button>
            <button
              onClick={() => enviarCrowdsource('HAY_LUGARES')}
              className="flex-1 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-bold transition-colors hover:bg-green-100 active:scale-95"
            >
              Hay lugares
            </button>
          </div>

          {/* Acciones principales */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onVerRuta}
              className="bg-slate-100 py-3.5 rounded-xl font-bold text-xs hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-4 h-4" /> Ver Ruta
            </button>
            <button
              onClick={() => onSeguir?.(vehicle)}
              className="bg-blue-600 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4" /> Seguir
            </button>
            <button
              onClick={onReport}
              className="bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center gap-1.5"
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
