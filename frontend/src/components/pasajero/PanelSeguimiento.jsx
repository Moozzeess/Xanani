import React from 'react';
import { Navigation, Clock, Activity, X, MapPin } from 'lucide-react';

/**
 * HUD de seguimiento activo que reemplaza la TarjetaBus cuando el pasajero
 * activa el modo seguimiento de una unidad.
 * Muestra la placa, ETA actualizado, barra de progreso sobre la ruta
 * y el estado de movimiento de la unidad.
 */
const PanelSeguimiento = ({ unidad, progreso = 0, enMovimiento = false, onDetener }) => {
  if (!unidad) return null;

  const etaTexto = unidad.eta != null
    ? unidad.eta < 1 ? '<1 min' : `${unidad.eta} min`
    : '---';

  const colorEstado = enMovimiento
    ? 'text-green-600 bg-green-50'
    : 'text-amber-600 bg-amber-50';

  const textoEstado = enMovimiento ? 'En movimiento' : 'Detenida';

  return (
    <div className="fixed bottom-20 inset-x-0 px-4 z-[1000] pointer-events-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden pointer-events-auto">

        {/* Barra de progreso en la ruta */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <div className="px-4 py-3 flex items-center gap-4">
          {/* Indicador de seguimiento animado */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-slate-800 truncate">{unidad.placa}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorEstado}`}>
                {textoEstado}
              </span>
            </div>
            {/* Barra de progreso textual */}
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] text-slate-500 font-medium">{progreso}% de la ruta</span>
            </div>
          </div>

          {/* ETA */}
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm font-bold">{etaTexto}</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium">ETA estimado</span>
          </div>
        </div>

        {/* Botón dejar de seguir */}
        <div className="px-4 pb-3">
          <button
            id="btn-dejar-seguir"
            onClick={onDetener}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-3.5 h-3.5" /> Dejar de seguir
          </button>
        </div>
      </div>
    </div>
  );
};

export default PanelSeguimiento;
