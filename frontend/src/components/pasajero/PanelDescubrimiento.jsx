import React from 'react';
import { Filter, Circle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const ESTADOS = [
  { valor: 'en_ruta', etiqueta: 'En ruta', color: 'bg-green-100 text-green-700 border-green-200' },
  { valor: 'base', etiqueta: 'En base', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { valor: 'inactiva', etiqueta: 'Sin señal', color: 'bg-slate-100 text-slate-500 border-slate-200' },
];

const OCUPACIONES = [
  { valor: 'Baja', etiqueta: 'Disponible', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { valor: 'Media', etiqueta: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { valor: 'Alta', etiqueta: 'Lleno', color: 'bg-red-100 text-red-700 border-red-200' },
];

/**
 * Panel flotante de descubrimiento ubicado en la parte superior del mapa.
 * Permite filtrar unidades por estado y ocupación, y muestra el estado global
 * del sistema con el conteo de unidades disponibles en el área.
 */
const PanelDescubrimiento = ({
  totalUnidades = 0,
  sinUnidades = false,
  filtros = {},
  onCambiarFiltros,
  onVerDemo,
  onActivarAlerta,
}) => {
  const filtrosEstado = filtros.estado || [];
  const filtrosOcupacion = filtros.ocupacion || [];

  const toggleEstado = (valor) => {
    const nuevo = filtrosEstado.includes(valor)
      ? filtrosEstado.filter((e) => e !== valor)
      : [...filtrosEstado, valor];
    onCambiarFiltros?.({ ...filtros, estado: nuevo.length ? nuevo : undefined });
  };

  const toggleOcupacion = (valor) => {
    const nuevo = filtrosOcupacion.includes(valor)
      ? filtrosOcupacion.filter((o) => o !== valor)
      : [...filtrosOcupacion, valor];
    onCambiarFiltros?.({ ...filtros, ocupacion: nuevo.length ? nuevo : undefined });
  };

  return (
    <div className="panel-descubrimiento absolute top-4 left-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">

      {/* Fila superior: estado del sistema + contador */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-white/60">
          {sinUnidades ? (
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          <span className="text-[11px] font-bold text-slate-700">
            {sinUnidades ? 'Sin unidades activas' : `${totalUnidades} unidad${totalUnidades !== 1 ? 'es' : ''} en área`}
          </span>
        </div>
      </div>

      {/* Fila de chips de filtro */}
      {!sinUnidades && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-0.5">
          {/* Separador visual */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 backdrop-blur shadow text-[10px] text-slate-400 font-bold border border-slate-100 flex-shrink-0">
            <Filter className="w-3 h-3" /> Estado
          </div>

          {ESTADOS.map((e) => (
            <button
              key={e.valor}
              onClick={() => toggleEstado(e.valor)}
              className={`chip-filtro flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 shadow-sm
                ${filtrosEstado.includes(e.valor)
                  ? e.color + ' shadow-md scale-105'
                  : 'bg-white/90 backdrop-blur text-slate-500 border-slate-200'
                }`}
            >
              {e.etiqueta}
            </button>
          ))}

          <div className="w-px bg-slate-200 mx-1 self-stretch flex-shrink-0" />

          {OCUPACIONES.map((o) => (
            <button
              key={o.valor}
              onClick={() => toggleOcupacion(o.valor)}
              className={`chip-filtro flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 shadow-sm
                ${filtrosOcupacion.includes(o.valor)
                  ? o.color + ' shadow-md scale-105'
                  : 'bg-white/90 backdrop-blur text-slate-500 border-slate-200'
                }`}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PanelDescubrimiento;
