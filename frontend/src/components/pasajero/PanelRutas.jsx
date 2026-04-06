import React, { useEffect, useState } from 'react';
import { Route, Star, Heart, Clock, Info } from 'lucide-react';

const API_URL = `http://${window.location.hostname}:4000/api`;

/**
 * Horas pico de demanda por franja horaria.
 * Permite estimar si es buen momento para viajar sin necesidad de datos históricos complejos.
 */
const HORAS_PICO = [
  { hora: '6-7h', nivel: 30 },
  { hora: '7-8h', nivel: 90 },
  { hora: '8-9h', nivel: 95 },
  { hora: '9-10h', nivel: 70 },
  { hora: '10-12h', nivel: 40 },
  { hora: '12-14h', nivel: 75 },
  { hora: '14-16h', nivel: 55 },
  { hora: '16-18h', nivel: 80 },
  { hora: '18-20h', nivel: 92 },
  { hora: '20-22h', nivel: 50 },
];

/**
 * Calcula la probabilidad de encontrar espacio basada en la hora actual.
 * @returns Porcentaje 0-100 (mayor = más probable encontrar lugar).
 */
function calcularProbabilidadEspacio() {
  const hora = new Date().getHours();
  const franja = HORAS_PICO.find((h) => {
    const [inicio] = h.hora.split('-').map((v) => parseInt(v));
    return hora >= inicio && hora < inicio + 2;
  });
  return franja ? Math.max(0, 100 - franja.nivel) : 60;
}

/**
 * Panel de rutas disponibles con información de anticipación:
 * lista de rutas de la BD, probabilidad de espacio, horas pico y rutas favoritas del usuario.
 */
const PanelRutas = ({
  rutasFavoritas = [],
  onToggleFavorita,
  esRutaFavorita,
  onVerRuta,
}) => {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const probabilidad = calcularProbabilidadEspacio();
  const horaActual = new Date().getHours();

  useEffect(() => {
    const cargar = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/routes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Sin rutas');
        const data = await res.json();
        setRutas(data);
      } catch {
        setRutas([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const colorProbabilidad =
    probabilidad >= 70 ? 'text-green-600 bg-green-50' :
    probabilidad >= 40 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';

  return (
    <div className="absolute inset-0 bg-white z-[400] overflow-y-auto no-scrollbar pb-20">
      <div className="px-5 pt-6">

        {/* Probabilidad de espacio */}
        <div className={`flex items-center justify-between p-4 rounded-2xl mb-5 ${colorProbabilidad}`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">Ahora mismo</p>
            <p className="text-2xl font-bold mt-0.5">{probabilidad}%</p>
            <p className="text-xs font-medium opacity-80">probabilidad de encontrar lugar</p>
          </div>
          <div className="text-4xl leading-none">
            {probabilidad >= 70 ? '🟢' : probabilidad >= 40 ? '🟡' : '🔴'}
          </div>
        </div>

        {/* Horas pico — heatmap */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Demanda por hora
          </p>
          <div className="flex gap-1 items-end h-16">
            {HORAS_PICO.map((h) => {
              const [inicio] = h.hora.split('-').map((v) => parseInt(v));
              const esActual = horaActual >= inicio && horaActual < inicio + 2;
              return (
                <div key={h.hora} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      esActual ? 'ring-2 ring-blue-500' : ''
                    } ${h.nivel >= 75 ? 'bg-red-400' : h.nivel >= 50 ? 'bg-amber-400' : 'bg-green-400'}`}
                    style={{ height: `${(h.nivel / 100) * 48}px` }}
                  />
                  <span className={`text-[8px] font-medium ${esActual ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                    {h.hora.split('-')[0]}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de rutas */}
        <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5" /> Rutas disponibles
        </p>

        {cargando ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : rutas.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin rutas configuradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rutas.map((ruta) => {
              const intervalo = ruta.configuracionDespacho?.intervaloMinutos;
              const favorita = esRutaFavorita?.(ruta._id);
              return (
                <div key={ruta._id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{ruta.nombre}</h4>
                      {intervalo && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cada {intervalo} min · {ruta.paradas?.length || 0} paradas
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleFavorita?.({ id: ruta._id, nombre: ruta.nombre })}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-200 transition-colors active:scale-90"
                    >
                      <Heart
                        className="w-4 h-4 transition-colors"
                        fill={favorita ? '#ef4444' : 'none'}
                        stroke={favorita ? '#ef4444' : '#94a3b8'}
                      />
                    </button>
                  </div>

                  <button
                    onClick={() => onVerRuta?.(ruta)}
                    className="w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
                  >
                    Ver en mapa
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelRutas;
