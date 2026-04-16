import React, { useState, useEffect } from 'react';
import { Wrench, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';

const IncidentsView: React.FC = () => {
  const { socket } = useSocket();
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga inicial desde la API
  useEffect(() => {
    const fetchIncidencias = async () => {
      try {
        const res = await api.get('/incidentes/admin/lista');
        setIncidencias(res.data);
      } catch (error) {
        console.error('Error al cargar historial de incidencias:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidencias();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleIncidencia = (incidencia: any) => {
      // Evitar duplicados si ya se cargó por API
      setIncidencias(prev => {
        if (prev.find(i => i._id === incidencia._id)) return prev;
        return [incidencia, ...prev];
      });
    };
    socket.on('reporte_incidencia', handleIncidencia);
    return () => {
      socket.off('reporte_incidencia', handleIncidencia);
    };
  }, [socket]);

  const atenderIncidencia = async (id: string) => {
    try {
      await api.patch(`/incidentes/admin/gestionar/${id}`, { estado: 'ATENDIDO' });
      setIncidencias(prev =>
        prev.map((inc) => (inc._id === id ? { ...inc, estado: 'ATENDIDO' } : inc))
      );
    } catch (error) {
      console.error('Error al atender incidencia:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span className="font-bold">Cargando incidencias...</span>
      </div>
    );
  }

  return (
    <div id="view-incidents" className="space-y-6 fade-in">
      <div className="grid grid-cols-1 gap-4">
        {incidencias.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-xl flex flex-col items-center justify-center text-slate-400">
            <CheckCircle className="w-12 h-12 mb-3 text-emerald-400 opacity-50" />
            <h3 className="text-lg font-bold">Todo Despejado</h3>
            <p className="text-sm">No hay reportes de incidencias activos en este momento.</p>
          </div>
        ) : (
          incidencias.map((inc, idx) => {
            const isSOS = inc.tipo === 'SOS';
            const isAtendido = inc.estado === 'ATENDIDO';

            return (
              <div key={inc._id || idx} className={`border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition-all ${isAtendido ? 'bg-slate-50 border-slate-200 opacity-60' : isSOS ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isAtendido ? 'bg-slate-200 text-slate-500' : isSOS ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600'}`}>
                    {isSOS ? <Zap className="w-7 h-7" /> : <Wrench className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className={`font-black text-lg ${isAtendido ? 'text-slate-600' : isSOS ? 'text-red-900' : 'text-slate-900'}`}>
                      {inc.tipo}: Unidad {inc.unidad?.placa || inc.unidadId || 'Oculta'}
                    </h3>
                    <p className={`text-sm mt-1 font-medium ${isAtendido ? 'text-slate-500' : isSOS ? 'text-red-700' : 'text-slate-600'}`}>
                      {inc.descripcion} {inc.ubicacion && `(Lat: ${inc.ubicacion.latitud?.toFixed(4)}, Lng: ${inc.ubicacion.longitud?.toFixed(4)})`}
                    </p>
                    <div className="flex gap-2 mt-3 items-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${isAtendido ? 'bg-slate-100 text-slate-500 border-slate-200' : isSOS ? 'bg-red-600 text-white border-red-700' : 'bg-orange-200 text-orange-800 border-orange-300'}`}>
                        {isAtendido ? 'Atendido' : 'Reporte Activo'}
                      </span>
                      {inc.conductor && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          Reportado por: {inc.conductor.nombre || inc.conductor.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isAtendido && (
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      type="button" 
                      onClick={() => atenderIncidencia(inc._id)} 
                      className={`w-full md:w-auto text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 ${isSOS ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}
                    >
                      Marcar como Atendido
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

      </div>
    </div>
  );
};

export default IncidentsView;
