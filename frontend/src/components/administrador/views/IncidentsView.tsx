import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, 
  Zap, 
  CheckCircle, 
  Loader2, 
  Filter, 
  Clock, 
  MapPin, 
  AlertTriangle,
  User,
  Bus,
  Search
} from 'lucide-react';
import { useSocket } from '../../../hooks/useSocket';
import { useAlerta } from '../../../hooks/useAlerta';
import { useAuth } from '../../../auth/useAuth';
import api from '../../../services/api';

/**
 * @interface Incidencia
 * Representa la estructura de una incidencia de conductor.
 */
interface Incidencia {
  _id: string;
  tipo: 'MECANICA' | 'TRAFICO' | 'SOS' | 'OTRO';
  descripcion: string;
  estado: 'PENDIENTE' | 'ATENDIDO' | 'RESUELTO';
  ubicacion?: { latitud: number; longitud: number };
  unidad?: { placa: string };
  unidadId?: string;
  conductor?: { nombre: string; apellido: string; username: string };
  createdAt: string;
}

const IncidentsView: React.FC = () => {
  const { socket } = useSocket();
  const { token } = useAuth();
  const { disparar, dispararError } = useAlerta();
  
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('PENDIENTE');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  /**
   * Carga inicial de incidencias desde el servidor.
   */
  const cargarIncidencias = useCallback(async () => {
    try {
      if (!token) return;
      setLoading(true);
      const res = await api.get('/incidentes/admin/lista', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidencias(res.data);
    } catch (error: any) {
      console.error('Error al cargar incidencias:', error);
      dispararError('No se pudieron cargar las incidencias', error.response?.data?.mensaje);
    } finally {
      setLoading(false);
    }
  }, [token, dispararError]);

  useEffect(() => {
    cargarIncidencias();
  }, [cargarIncidencias]);

  /**
   * Escuchar incidencias en tiempo real.
   */
  useEffect(() => {
    if (!socket) return;

    const handleNuevaIncidencia = (nueva: Incidencia) => {
      setIncidencias(prev => {
        if (prev.find(i => i._id === nueva._id)) return prev;
        
        if (nueva.tipo === 'SOS') {
          disparar({
            tipo: 'error',
            titulo: '¡ALERTA SOS!',
            mensaje: `Emergencia activa en la unidad ${nueva.unidad?.placa || nueva.unidadId || 'desconocida'}.`,
            detalles: nueva.descripcion
          });
        }
        
        return [nueva, ...prev];
      });
    };

    socket.on('reporte_incidencia', handleNuevaIncidencia);
    return () => {
      socket.off('reporte_incidencia', handleNuevaIncidencia);
    };
  }, [socket, disparar]);

  const gestionarIncidencia = async (id: string, nuevoEstado: 'ATENDIDO' | 'RESUELTO') => {
    try {
      if (!token) return;
      await api.patch(`/incidentes/admin/gestionar/${id}`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidencias(prev =>
        prev.map((inc) => (inc._id === id ? { ...inc, estado: nuevoEstado } : inc))
      );
      disparar({
        tipo: 'exito',
        titulo: 'Incidencia Actualizada',
        mensaje: `La incidencia ha sido marcada como ${nuevoEstado.toLowerCase()}.`
      });
    } catch (error: any) {
      dispararError('Error al gestionar incidencia', error.response?.data?.mensaje);
    }
  };

  const incidenciasFiltradas = incidencias.filter(inc => {
    const coincideEstado = filtroEstado === 'TODOS' || inc.estado === filtroEstado;
    const coincideTipo = filtroTipo === 'TODOS' || inc.tipo === filtroTipo;
    return coincideEstado && coincideTipo;
  });

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-500" />
        <span className="font-bold text-lg">Cargando centro de incidencias...</span>
      </div>
    );
  }

  return (
    <div id="view-incidents" className="space-y-6 fade-in">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Centro de Incidencias
          </h2>
          <p className="text-slate-500 font-medium">Monitoreo y respuesta a reportes de conductores en tiempo real.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-500">Filtrar:</span>
        </div>
        
        <select 
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ATENDIDO">En Atención</option>
          <option value="RESUELTO">Resueltos</option>
        </select>

        <select 
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="TODOS">Todos los Tipos</option>
          <option value="SOS">Emergencias SOS</option>
          <option value="MECANICA">Falla Mecánica</option>
          <option value="TRAFICO">Tráfico Pesado</option>
          <option value="OTRO">Otros</option>
        </select>
      </div>

      {/* Lista de Incidencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incidenciasFiltradas.length === 0 ? (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-3xl flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-700">Sin incidencias pendientes</h3>
            <p className="max-w-xs mt-2 font-medium">No hay reportes activos que requieran atención inmediata.</p>
          </div>
        ) : (
          incidenciasFiltradas.map((inc) => (
            <div 
              key={inc._id} 
              className={`relative bg-white p-6 rounded-3xl border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${
                inc.tipo === 'SOS' 
                  ? 'border-red-100 shadow-red-100/50' 
                  : inc.estado === 'RESUELTO' 
                    ? 'border-slate-100 opacity-75' 
                    : 'border-orange-100 shadow-orange-100/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  inc.estado === 'PENDIENTE' 
                    ? 'bg-red-50 text-red-600 border-red-100' 
                    : inc.estado === 'ATENDIDO' 
                      ? 'bg-orange-50 text-orange-600 border-orange-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {inc.estado}
                </div>
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(inc.createdAt).toLocaleString('es-MX', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-2xl ${
                  inc.tipo === 'SOS' ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600'
                }`}>
                  {inc.tipo === 'SOS' ? <Zap size={24} /> : <Wrench size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 leading-tight">
                    {inc.tipo === 'SOS' ? 'EMERGENCIA SOS' : inc.tipo.replace(/_/g, ' ')}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">
                      {inc.conductor ? `${inc.conductor.nombre} ${inc.conductor.apellido}` : 'Desconocido'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Bus size={14} className="text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Unidad</span>
                    <span className="text-xs font-bold text-slate-700">{inc.unidad?.placa || inc.unidadId || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <MapPin size={14} className="text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Ubicación</span>
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {inc.ubicacion ? `${inc.ubicacion.latitud.toFixed(4)}, ${inc.ubicacion.longitud.toFixed(4)}` : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 font-medium mb-6 line-clamp-3">
                "{inc.descripcion}"
              </p>

              {inc.estado !== 'RESUELTO' && (
                <div className="flex gap-2">
                  {inc.estado === 'PENDIENTE' && (
                    <button 
                      onClick={() => gestionarIncidencia(inc._id, 'ATENDIDO')}
                      className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Search size={14} /> Atender
                    </button>
                  )}
                  <button 
                    onClick={() => gestionarIncidencia(inc._id, 'RESUELTO')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                      inc.tipo === 'SOS' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                    }`}
                  >
                    <CheckCircle size={14} /> Finalizar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IncidentsView;
