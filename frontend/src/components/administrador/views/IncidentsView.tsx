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
  Search,
  PhoneCall,
  Navigation
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
  detalleAtencion?: string;
}

const IncidentsView: React.FC = () => {
  const { socket } = useSocket();
  const { token } = useAuth();
  const { disparar, dispararError } = useAlerta();
  
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('PENDIENTE');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [notaAtencion, setNotaAtencion] = useState('');

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
      await api.patch(`/incidentes/admin/gestionar/${id}`, { 
          estado: nuevoEstado, 
          detalleAtencion: notaAtencion || undefined 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncidencias(prev =>
        prev.map((inc) => (inc._id === id ? { ...inc, estado: nuevoEstado, detalleAtencion: notaAtencion || inc.detalleAtencion } : inc))
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

  const cerrarModal = () => {
    setIncidenciaSeleccionada(null);
    setNotaAtencion('');
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
              onClick={() => {
                setIncidenciaSeleccionada(inc);
                setNotaAtencion(inc.detalleAtencion || '');
              }}
              className={`relative bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                inc.tipo === 'SOS' 
                  ? 'border-red-100 shadow-red-100/50 hover:border-red-300' 
                  : inc.estado === 'RESUELTO' 
                    ? 'border-slate-100 opacity-75 hover:opacity-100' 
                    : 'border-orange-100 shadow-orange-100/50 hover:border-orange-300'
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
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
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

      {/* Modal de Detalles de la Incidencia */}
      {incidenciaSeleccionada && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden fade-in relative">
            
            {/* Header */}
            <div className={`p-6 text-white flex justify-between items-start ${
              incidenciaSeleccionada.tipo === 'SOS' ? 'bg-red-500' : 'bg-orange-500'
            }`}>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  {incidenciaSeleccionada.tipo === 'SOS' ? <Zap size={28} /> : <Wrench size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-black">
                    {incidenciaSeleccionada.tipo === 'SOS' ? 'EMERGENCIA SOS' : incidenciaSeleccionada.tipo.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-white/80 font-medium opacity-90">
                    Reportado el {new Date(incidenciaSeleccionada.createdAt).toLocaleString('es-MX', {
                      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button onClick={cerrarModal} className="text-white/60 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors">
                 ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-slate-400" />
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Conductor</span>
                  </div>
                  <p className="font-bold text-slate-800">
                    {incidenciaSeleccionada.conductor ? `${incidenciaSeleccionada.conductor.nombre} ${incidenciaSeleccionada.conductor.apellido}` : 'Desconocido'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Bus size={16} className="text-slate-400" />
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Unidad / Placa</span>
                  </div>
                  <p className="font-bold text-slate-800">
                    {incidenciaSeleccionada.unidad?.placa || incidenciaSeleccionada.unidadId || 'No asignada'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Coordenadas de Reporte</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {incidenciaSeleccionada.ubicacion ? `${incidenciaSeleccionada.ubicacion.latitud.toFixed(6)}, ${incidenciaSeleccionada.ubicacion.longitud.toFixed(6)}` : 'Sin datos de ubicación'}
                  </p>
                  {incidenciaSeleccionada.ubicacion && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${incidenciaSeleccionada.ubicacion.latitud},${incidenciaSeleccionada.ubicacion.longitud}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2 font-black text-xs shadow-sm"
                      title="Abrir ubicación real en Google Maps"
                    >
                      <Navigation size={16} /> MAPS
                    </a>
                  )}
                </div>
              </div>

              {/* Botón de Emergencia para Admin */}
              {incidenciaSeleccionada.tipo === 'SOS' && (
                <div className="mb-6">
                  <a 
                    href="tel:911"
                    className="w-full bg-red-50 text-red-600 border-2 border-red-200 p-4 rounded-2xl flex items-center justify-center gap-3 font-black hover:bg-red-100 transition-colors shadow-sm"
                  >
                    <PhoneCall size={20} className="animate-pulse" /> LLAMAR A EMERGENCIAS (911)
                  </a>
                </div>
              )}

              <div className="mb-8">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">Descripción del Conductor</h4>
                <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-slate-700 font-medium whitespace-pre-wrap">
                    {incidenciaSeleccionada.descripcion || 'Sin descripción adicional.'}
                  </p>
                </div>
              </div>

              {/* Notas de Atención (Administrador) */}
              <div className="mb-4">
                <h4 className="text-[11px] font-black uppercase text-blue-500 tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle size={12} /> Notas de Atención (Opcional)
                </h4>
                {incidenciaSeleccionada.estado !== 'RESUELTO' ? (
                  <textarea
                    value={notaAtencion}
                    onChange={(e) => setNotaAtencion(e.target.value)}
                    placeholder="Escribe aquí los detalles de la atención, acciones tomadas o resoluciones..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none min-h-[80px]"
                  />
                ) : (
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-slate-700 font-medium whitespace-pre-wrap">
                      {incidenciaSeleccionada.detalleAtencion || 'No se registraron notas de atención para este caso.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              {incidenciaSeleccionada.estado !== 'RESUELTO' ? (
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                  {incidenciaSeleccionada.estado === 'PENDIENTE' && (
                    <button 
                      onClick={() => { gestionarIncidencia(incidenciaSeleccionada._id, 'ATENDIDO'); cerrarModal(); }}
                      className="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-3.5 rounded-xl text-sm font-black hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                      <Search size={18} /> Marcar en Atención
                    </button>
                  )}
                  <button 
                    onClick={() => { gestionarIncidencia(incidenciaSeleccionada._id, 'RESUELTO'); cerrarModal(); }}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                      incidenciaSeleccionada.tipo === 'SOS' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                    }`}
                  >
                    <CheckCircle size={18} /> Finalizar Caso
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center text-emerald-600 font-black gap-2 bg-emerald-50 p-3 rounded-xl">
                  <CheckCircle size={18} /> CASO RESUELTO
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsView;
