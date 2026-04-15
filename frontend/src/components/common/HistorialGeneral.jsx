import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, MapPin, ChevronRight, TrendingUp, Star } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../auth/useAuth';

/**
 * Componente unificado de Historial para Pasajeros y Conductores.
 * Adapta su contenido y estadísticas según el rol del usuario.
 */
const HistorialGeneral = ({ rol }) => {
  const { usuario, token } = useAuth();
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    personas: 0,
    ganancias: 0,
    distancia: 0
  });

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        let endpoint = '';
        if (rol === 'CONDUCTOR') {
          // El ID del conductor está vinculado al ID del usuario
          endpoint = `/recorridos/historial/conductor/${usuario?.id || usuario?._id}`;
        } else {
          // TODO: Implementar historial para pasajeros si se requiere
          setViajes([]);
          setCargando(false);
          return;
        }

        const res = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setViajes(res.data || []);
        
        // Calcular estadísticas acumuladas
        const s = (res.data || []).reduce((acc, v) => ({
           total: acc.total + 1,
           personas: acc.personas + (v.pasajerosTotales || 0),
           ganancias: acc.ganancias + (v.ganancias || 0),
           distancia: acc.distancia + (v.kmRecorridos || 0)
        }), { total: 0, personas: 0, ganancias: 0, distancia: 0 });
        
        setStats(s);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [rol, usuario, token]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center p-10 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Cargando viajes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24">
      {/* Header con estadísticas resumidas */}
      <div className="bg-slate-900 text-white p-6 pt-12 pb-10 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <h2 className="text-2xl font-bold mb-6">Tu Historial</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wider block mb-1">Viajes Totales</span>
            <div className="flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-blue-400" />
               <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </div>
          
          {rol === 'CONDUCTOR' ? (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <span className="text-green-300 text-[10px] font-bold uppercase tracking-wider block mb-1">Ganancias Totales</span>
              <div className="flex items-center gap-1">
                 <span className="text-xl font-bold text-green-400">$</span>
                 <span className="text-2xl font-bold text-green-400">{stats.ganancias.toLocaleString()}</span>
              </div>
            </div>
          ) : (
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
               <span className="text-purple-300 text-[10px] font-bold uppercase tracking-wider block mb-1">Rutas Usadas</span>
               <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-bold">{viajes.length}</span>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Lista de Viajes */}
      <div className="px-6 -mt-6">
        <div className="flex flex-col gap-4">
          {viajes.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Calendar className="w-8 h-8" />
               </div>
               <p className="font-medium text-slate-500">No hay registros de viajes aún.</p>
            </div>
          ) : (
            viajes.map((viaje) => (
              <div key={viaje._id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow active:scale-[0.98]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                      {new Date(viaje.horaInicio).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {viaje.rutaId?.nombre || 'Ruta General'}
                    </h3>
                  </div>
                  <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">
                    {new Date(viaje.horaInicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl">
                    <Users className="w-4 h-4 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">{viaje.pasajerosTotales}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Pasajeros</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">{viaje.kmRecorridos}km</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Distancia</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-slate-50 rounded-xl">
                    <Star className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">{viaje.calificacion}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Rating</span>
                  </div>
                </div>

                {rol === 'CONDUCTOR' && (
                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">Ganancia Estimada</span>
                    <span className="text-green-600 font-bold text-lg">${viaje.ganancias}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialGeneral;
