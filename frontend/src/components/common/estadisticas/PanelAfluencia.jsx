import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../auth/useAuth';

/**
 * Pestaña de Afluencia Genérica.
 * Muestra histogramas de ocupación de las rutas.
 * Reutilizable entre Pasajero, Conductor y Administrador.
 */
const PanelAfluencia = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/estadisticas/afluencia/RUTA_1', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (error) {
        console.error("Error fetching statistics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return <div className="p-10 text-center animate-pulse">Cargando estadísticas de afluencia...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 p-6 overflow-y-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Afluencia de Rutas</h1>
        <p className="text-slate-500 text-sm">Pronóstico de ocupación basado en el historial diario.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Histograma Mockup */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-80">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Ocupación por Hora (Ruta Centro)
          </h3>
          
          <div className="flex-1 flex items-end gap-1 px-2">
            {data?.histograma.map((item, idx) => (
              <div 
                key={idx} 
                className="flex-1 group relative flex flex-col items-center"
              >
                <div 
                  className={`w-full rounded-t-sm transition-all duration-300 ${item.ocupacion > 80 ? 'bg-red-400' : 'bg-indigo-400 opacity-60'}`}
                  style={{ height: `${item.ocupacion}%` }}
                ></div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   {item.ocupacion}%
                </div>
                {idx % 3 === 0 && <span className="text-[9px] text-slate-400 mt-2">{item.hora}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Panel Informativo de Horas Pico */}
        <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-2">Horas Pico Detectadas</h3>
                <div className="space-y-2">
                    <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg text-sm">
                        <span className="font-medium text-red-700">07:00 - 09:00</span>
                        <span className="text-xs text-red-600 bg-white px-2 py-0.5 rounded-full font-bold">ALTA</span>
                    </div>
                    <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg text-sm">
                        <span className="font-medium text-red-700">18:00 - 20:00</span>
                        <span className="text-xs text-red-600 bg-white px-2 py-0.5 rounded-full font-bold">ALTA</span>
                    </div>
                    <div className="flex justify-between items-center bg-green-50 p-2 rounded-lg text-sm">
                        <span className="font-medium text-green-700">11:00 - 13:00</span>
                        <span className="text-xs text-green-600 bg-white px-2 py-0.5 rounded-full font-bold">BAJA</span>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <h3 className="font-bold mb-1">Xanani Tip</h3>
                <p className="text-indigo-100 text-xs">Para encontrar lugar seguro, intenta abordar antes de las 07:00 o cerca de las 11:00 am.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PanelAfluencia;
