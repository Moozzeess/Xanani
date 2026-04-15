import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  Star, 
  User, 
  Bus, 
  Navigation, 
  FileText, 
  Loader2, 
  Search, 
  Filter, 
  Clock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useSocket } from '../../../hooks/useSocket';
import { useAlerta } from '../../../hooks/useAlerta';
import { useAuth } from '../../../auth/useAuth';
import api from '../../../services/api';
import '../../../Styles/reportes.css';

/**
 * @interface Reporte
 * Representa la estructura de un reporte de pasajero poblado.
 */
interface Reporte {
  _id: string;
  usuario: {
    username: string;
    email: string;
  };
  unidad: {
    placa: string;
  } | null;
  ruta: {
    nombre: string;
  } | null;
  tipo: string;
  descripcion: string | null;
  calificacion: number | null;
  encontroAsiento: boolean | null;
  estado: 'PENDIENTE' | 'REVISADO' | 'RESUELTO';
  createdAt: string;
}

/**
 * @view ReportsView
 * @description Vista administrativa para gestionar quejas y opiniones de pasajeros.
 */
const ReportsView: React.FC = () => {
  const { socket } = useSocket();
  const { token } = useAuth();
  const { disparar, dispararError } = useAlerta();
  
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  /**
   * Carga inicial de reportes desde el servidor.
   */
  const cargarReportes = useCallback(async () => {
    try {
      if (!token) return;
      setLoading(true);
      const res = await api.get('/reportes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(res.data);
    } catch (error: any) {
      console.error('Error al cargar reportes:', error);
      dispararError('No se pudieron cargar los reportes de pasajeros', error.response?.data?.mensaje);
    } finally {
      setLoading(false);
    }
  }, [dispararError]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  /**
   * Escuchar nuevos reportes en tiempo real vía Socket.io.
   */
  useEffect(() => {
    if (!socket) return;

    const handleNuevoReporte = (nuevoReporte: Reporte) => {
      setReportes(prev => {
        // Evitar duplicados
        if (prev.find(r => r._id === nuevoReporte._id)) return prev;
        
        // Si es Conducción Peligrosa, disparar una alerta especial
        if (nuevoReporte.tipo === 'CONDUCCION_PELIGROSA') {
          disparar({
            tipo: 'error',
            titulo: '¡ALERTA CRÍTICA!',
            mensaje: `Se ha recibido un reporte de CONDUCCIÓN PELIGROSA en la unidad ${nuevoReporte.unidad?.placa || 'desconocida'}.`,
            detalles: nuevoReporte.descripcion || 'Sin descripción adicional.'
          });
        }
        
        return [nuevoReporte, ...prev];
      });
    };

    socket.on('nuevo_reporte_pasajero', handleNuevoReporte);
    return () => {
      socket.off('nuevo_reporte_pasajero', handleNuevoReporte);
    };
  }, [socket, disparar]);

  /**
   * Actualiza el estado de un reporte.
   * @param id - ID del reporte.
   * @param nuevoEstado - Estado a asignar.
   */
  const gestionarReporte = async (id: string, nuevoEstado: 'REVISADO' | 'RESUELTO') => {
    try {
      if (!token) return;
      await api.patch(`/reportes/${id}`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(prev => 
        prev.map(r => r._id === id ? { ...r, estado: nuevoEstado } : r)
      );
      
      disparar({
        tipo: 'exito',
        titulo: 'Reporte Actualizado',
        mensaje: `El reporte ha sido marcado como ${nuevoEstado.toLowerCase()}.`
      });
    } catch (error: any) {
      dispararError('Error al actualizar el estado del reporte', error.response?.data?.mensaje);
    }
  };

  /**
   * Simulación de exportación a PDF (requerido a futuro).
   */
  const exportarPDF = () => {
    disparar({
      tipo: 'info',
      titulo: 'Exportación a PDF',
      mensaje: 'La funcionalidad de exportación a PDF se está preparando en la lógica de negocio.'
    });
  };

  /**
   * Filtrado de reportes locales.
   */
  const reportesFiltrados = reportes.filter(r => {
    const coincideEstado = filtroEstado === 'TODOS' || r.estado === filtroEstado;
    const coincideTipo = filtroTipo === 'TODOS' || r.tipo === filtroTipo;
    return coincideEstado && coincideTipo;
  });

  /**
   * Renderiza las estrellas de calificación.
   */
  const renderStars = (rating: number) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={14} 
            className={star <= rating ? 'star-filled' : 'star-empty'} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
        <span className="font-bold text-lg">Cargando reportes de pasajeros...</span>
      </div>
    );
  }

  return (
    <div id="view-reports" className="space-y-6 reports-container fade-in">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" />
            Atención a Pasajeros
          </h2>
          <p className="text-slate-500 font-medium">Gestiona quejas, opiniones y experiencias del servicio.</p>
        </div>
        <button 
          onClick={exportarPDF}
          className="bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
        >
          <FileText size={18} />
          Exportar PDF
        </button>
      </div>

      <div className="filters-bar">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-500">Filtrar por:</span>
        </div>
        
        <select 
          className="filter-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="REVISADO">Revisados</option>
          <option value="RESUELTO">Resueltos</option>
        </select>

        <select 
          className="filter-select"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="TODOS">Todos los Tipos</option>
          <option value="EXPERIENCIA">Experiencia de Viaje</option>
          <option value="CONDUCCION_PELIGROSA">Conducción Peligrosa</option>
          <option value="UNIDAD_LLENA">Unidad Llena</option>
          <option value="HAY_LUGARES">Hay Lugares</option>
          <option value="NO_PASO">No Pasó</option>
          <option value="RETRASO">Retraso</option>
          <option value="OTRO">Otros</option>
        </select>
      </div>

      {/* Lista de Reportes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportesFiltrados.length === 0 ? (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 p-16 rounded-3xl flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-slate-700">Sin reportes pendientes</h3>
            <p className="max-w-xs mt-2 font-medium">No se encontraron reportes que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          reportesFiltrados.map((reporte) => (
            <div 
              key={reporte._id} 
              className={`report-card ${reporte.tipo === 'CONDUCCION_PELIGROSA' ? 'report-critical' : ''}`}
            >
              {/* Header de la tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div className={`status-badge status-${reporte.estado.toLowerCase()}`}>
                  {reporte.estado}
                </div>
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(reporte.createdAt).toLocaleString('es-MX', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Información del Usuario y Tipo */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${reporte.tipo === 'CONDUCCION_PELIGROSA' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {reporte.tipo === 'CONDUCCION_PELIGROSA' ? <ShieldAlert size={24} className="type-critical-icon" /> : <MessageSquare size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 leading-tight">
                    {reporte.tipo.replace(/_/g, ' ')}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">{reporte.usuario.username}</span>
                  </div>
                </div>
              </div>

              {/* Detalles de la Unidad y Ruta */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Bus size={14} className="text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Unidad</span>
                    <span className="text-xs font-bold text-slate-700">{reporte.unidad?.placa || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <Navigation size={14} className="text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Ruta</span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{reporte.ruta?.nombre || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contenido/Descripción */}
              {reporte.descripcion && (
                <p className="text-sm text-slate-600 font-medium mb-4 line-clamp-3">
                  "{reporte.descripcion}"
                </p>
              )}

              {/* Datos de Experiencia (si aplica) */}
              {(reporte.calificacion || reporte.encontroAsiento !== null) && (
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  {reporte.calificacion && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-black text-slate-400">Calificación</span>
                      {renderStars(reporte.calificacion)}
                    </div>
                  )}
                  {reporte.encontroAsiento !== null && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-black text-slate-400">Encontró Asiento</span>
                      <div className={`text-xs font-bold ${reporte.encontroAsiento ? 'text-emerald-600' : 'text-red-600'}`}>
                        {reporte.encontroAsiento ? 'Sí' : 'No'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              {reporte.estado !== 'RESUELTO' && (
                <div className="report-actions">
                  {reporte.estado === 'PENDIENTE' && (
                    <button 
                      onClick={() => gestionarReporte(reporte._id, 'REVISADO')}
                      className="btn-action btn-revisar"
                    >
                      <Search size={16} />
                      Marcar Revisado
                    </button>
                  )}
                  <button 
                    onClick={() => gestionarReporte(reporte._id, 'RESUELTO')}
                    className="btn-action btn-resolver"
                  >
                    <CheckCircle2 size={16} />
                    Resolver
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

export default ReportsView;
