import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Bookmark, Info, TrendingUp, Search } from 'lucide-react';
import { estadisticasService } from '../../../services/estadisticasService';

/**
 * PanelAfluencia: Muestra histogramas de ocupación de las rutas suscritas del pasajero.
 * Intención: Ayudar al pasajero a planificar sus viajes basados en la afluencia histórica.
 */
const PanelAfluencia = ({ onDiscover }) => {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const data = await estadisticasService.obtenerAfluenciaSuscripciones();
        setRutas(data);
      } catch (error) {
        console.error("Error fetching statistics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Analizando afluencia de tus rutas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto p-4 md:p-8 pb-24">
      <header className="mb-8 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tu Afluencia</h1>
        <p className="text-slate-500 mt-2 text-lg">Pronóstico de ocupación basado en tus rutas favoritas.</p>
      </header>

      {rutas.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl">
          {rutas.map((ruta) => (
            <div key={ruta.rutaId} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col h-[400px]">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                    <Bookmark className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xl">{ruta.nombre}</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Histograma de 24h</p>
                  </div>
                </div>
                <div className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  <span>Optimizado</span>
                </div>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="99%" aspect={1.7} minWidth={0}>
                  <BarChart data={ruta.histograma} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hora"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc', radius: 4 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value) => [`${value}%`, 'Ocupación']}
                    />
                    <Bar
                      dataKey="ocupacion"
                      radius={[4, 4, 0, 0]}
                    >
                      {ruta.histograma.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.ocupacion > 75 ? '#ef4444' : entry.ocupacion > 40 ? '#3b82f6' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-tight">
                  Las barras <span className="text-red-500 font-bold">rojas</span> indican alta demanda. Recomendamos planificar tu viaje fuera de estos horarios.
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 max-w-2xl">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
            <Bookmark className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No tienes rutas suscritas</h3>
          <p className="text-slate-500 text-center max-w-md px-6 mb-8">
            Suscríbete a tus rutas frecuentes para ver sus horarios de afluencia y planificar mejor tus traslados.
          </p>
          <button
            onClick={onDiscover}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Search className="w-5 h-5" />
            Descubrir Rutas
          </button>
        </div>
      )}

    </div>
  );
};

export default PanelAfluencia;
