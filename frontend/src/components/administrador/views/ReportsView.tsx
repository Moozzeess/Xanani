import React, { useState, useEffect, useCallback } from 'react';
import { 
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
  ShieldAlert,
  Megaphone,
  Info,
  Trash2,
  Sparkles
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
  destinatario?: string | null;
  estado: 'PENDIENTE' | 'REVISADO' | 'RESUELTO';
  respuestaAdmin?: string | null;
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
  const [respuestas, setRespuestas] = useState<{[key: string]: string}>({});
  const [enviandoRespuesta, setEnviandoRespuesta] = useState<string | null>(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null);

  const cerrarModal = () => setReporteSeleccionado(null);

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
   * Envía una respuesta administrativa al pasajero.
   */
  const enviarRespuesta = async (id: string) => {
    try {
      const texto = respuestas[id];
      if (!texto || texto.trim() === '') {
        disparar({ tipo: 'advertencia', titulo: 'Respuesta Vacía', mensaje: 'Por favor escribe un mensaje para el pasajero.' });
        return;
      }

      if (!token) return;
      setEnviandoRespuesta(id);

      const res = await api.post(`/reportes/${id}/respuesta`, { respuesta: texto }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReportes(prev => 
        prev.map(r => r._id === id ? { ...r, ...res.data.reporte } : r)
      );

      disparar({
        tipo: 'exito',
        titulo: 'Respuesta Enviada',
        mensaje: 'El pasajero ha sido notificado con tu mensaje.'
      });

      // Limpiar el input local
      setRespuestas(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

    } catch (error: any) {
      dispararError('Error al enviar la respuesta', error.response?.data?.mensaje);
    } finally {
      setEnviandoRespuesta(null);
    }
  };

  /**
   * Elimina un reporte permanentemente.
   */
  const eliminarReporte = async (id: string) => {
    try {
      if (!token) return;
      if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte permanentemente?')) return;

      await api.delete(`/reportes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportes(prev => prev.filter(r => r._id !== id));
      
      disparar({
        tipo: 'exito',
        titulo: 'Reporte Eliminado',
        mensaje: 'El registro ha sido borrado de la base de datos.'
      });
    } catch (error: any) {
      dispararError('Error al eliminar el reporte', error.response?.data?.mensaje);
    }
  };

  /**
   * Limpia todos los reportes resueltos de la vista actual.
   */
  const limpiarResueltos = async () => {
    try {
      if (!token) return;
      const resueltos = reportes.filter(r => r.estado === 'RESUELTO');
      if (resueltos.length === 0) {
        disparar({ tipo: 'info', titulo: 'Nada que limpiar', mensaje: 'No hay reportes marcados como resueltos.' });
        return;
      }

      if (!window.confirm(`Se eliminarán ${resueltos.length} reportes resueltos. ¿Continuar?`)) return;

      setLoading(true);
      await Promise.all(resueltos.map(r => 
        api.delete(`/reportes/${r._id}`, { headers: { Authorization: `Bearer ${token}` } })
      ));
      
      setReportes(prev => prev.filter(r => r.estado !== 'RESUELTO'));
      
      disparar({
        tipo: 'exito',
        titulo: 'Panel Limpio',
        mensaje: 'Se han eliminado todos los reportes resueltos.'
      });
    } catch (error: any) {
      dispararError('Error al limpiar el panel', error.response?.data?.mensaje);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exporta la lista filtrada de reportes actuales a un documento PDF estructurado en tabla.
   * Abre una ventana de impresión con un diseño de control oficial premium y estilos optimizados.
   * 
   * Intención: Permitir la descarga física/digital en PDF del historial operativo de incidencias.
   * Parámetros: Ninguno (consume reportesFiltrados del estado)
   * Retorno: Ninguno (abre el diálogo de impresión nativo del navegador)
   * Reglas de negocio: Verifica que existan registros antes de proceder y aplica el filtro del rol de administrador actual.
   */
  const exportarPDF = () => {
    if (reportesFiltrados.length === 0) {
      disparar({
        tipo: 'advertencia',
        titulo: 'Exportación a PDF',
        mensaje: 'No hay reportes de pasajeros en la lista actual para exportar.'
      });
      return;
    }

    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      dispararError('Bloqueador de ventanas', 'Por favor habilita las ventanas emergentes para poder generar el PDF.');
      return;
    }

    // Construcción de filas de la tabla de reportes
    const filasReportesHTML = reportesFiltrados.map((rep, idx) => {
      const fechaFormateada = new Date(rep.createdAt).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const placaUnidad = rep.unidad?.placa || 'N/A';
      const nombreRuta = rep.ruta?.nombre || 'N/A';
      const tipoReporte = rep.tipo === 'ANUNCIO' ? 'ANUNCIO OFICIAL' : rep.tipo.replace(/_/g, ' ');
      const nombreUsuario = rep.tipo === 'ANUNCIO' ? 'Administrador' : (rep.usuario?.username || 'Anónimo');
      const descripcionIncidencia = rep.descripcion || 'Sin descripción detallada';
      const estadoActual = rep.estado;

      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 11px; font-weight: 600; color: #475569;">${fechaFormateada}</td>
          <td style="padding: 10px; font-size: 11px; font-weight: bold; color: #2563eb;">${tipoReporte}</td>
          <td style="padding: 10px; font-size: 11px; color: #334155;">${nombreUsuario}</td>
          <td style="padding: 10px; font-size: 11px; color: #475569;">${placaUnidad} / ${nombreRuta}</td>
          <td style="padding: 10px; font-size: 11px; color: #1e293b; max-width: 260px; word-wrap: break-word;">${descripcionIncidencia}</td>
          <td style="padding: 10px; font-size: 10px; font-weight: bold; text-align: center;">
            <span style="padding: 4px 8px; border-radius: 6px; font-size: 9px; text-transform: uppercase;
              background-color: ${estadoActual === 'PENDIENTE' ? '#fef3c7' : estadoActual === 'REVISADO' ? '#dbeafe' : '#d1fae5'};
              color: ${estadoActual === 'PENDIENTE' ? '#d97706' : estadoActual === 'REVISADO' ? '#2563eb' : '#059669'};">
              ${estadoActual}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const plantillaContenidoHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vista Previa - Reportes Xanani</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 0; background-color: #f1f5f9; }
            .doc-wrapper { background-color: #ffffff; max-width: 1000px; margin: 40px auto; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
            .header-doc { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header-doc h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
            .header-doc p { font-size: 12px; color: #475569; margin: 4px 0 0 0; font-weight: 600; }
            .meta-doc { font-size: 11px; color: #475569; margin-bottom: 25px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: left; }
            th { background-color: #0f172a; color: #ffffff; padding: 12px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .footer-doc { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 60px; font-weight: 600; }
            
            /* Clases para el control de impresión */
            @media print {
              body { background-color: #ffffff !important; margin: 0 !important; padding: 0 !important; }
              .no-print { display: none !important; }
              .doc-wrapper { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
            }
          </style>
        </head>
        <body>
          <!-- Barra superior de control y vista previa (No imprimible) -->
          <div class="no-print" style="position: sticky; top: 0; left: 0; width: 100%; background-color: #0f172a; color: white; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-bottom: 3px solid #2563eb; z-index: 1000; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-weight: 800; font-size: 12px; letter-spacing: 0.5px; color: #ffffff; text-transform: uppercase;">Vista Previa del Reporte Oficial</span>
              <span style="font-size: 11px; color: #94a3b8; font-weight: 500;">Revise la tabla a continuación. Use el botón azul para descargar o imprimir el PDF oficial.</span>
            </div>
            <div style="display: flex; gap: 12px;">
              <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 10px 18px; font-size: 11px; font-weight: 800; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(37,99,235,0.25); transition: background-color 0.2s;">
                Descargar o Imprimir PDF
              </button>
              <button onclick="window.close()" style="background-color: #334155; color: #e2e8f0; border: none; padding: 10px 18px; font-size: 11px; font-weight: 800; border-radius: 8px; cursor: pointer; transition: background-color 0.2s;">
                Cerrar Vista
              </button>
            </div>
          </div>

          <div class="doc-wrapper">
            <div class="header-doc">
              <div>
                <h1>XANANI - PLATAFORMA DE MOVILIDAD INTELIGENTE</h1>
                <p>Reporte Oficial de Incidencias, Quejas y Sugerencias de Pasajeros</p>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; font-weight: 800; color: #2563eb; border: 2px solid #2563eb; padding: 5px 10px; border-radius: 8px; letter-spacing: 1px;">CONTROL ADM</span>
              </div>
            </div>
            
            <div class="meta-doc">
              <strong>Generado por:</strong> Administrador de Flota Comercial<br/>
              <strong>Fecha y hora de emisión:</strong> ${new Date().toLocaleString('es-MX')}<br/>
              <strong>Total de registros exportados:</strong> ${reportesFiltrados.length} reportes<br/>
              <strong>Filtros activos de la vista:</strong> Estado: ${filtroEstado} | Categoría de Reporte: ${filtroTipo}
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Fecha</th>
                  <th style="width: 20%;">Categoría</th>
                  <th style="width: 15%;">Usuario</th>
                  <th style="width: 15%;">Unidad/Ruta</th>
                  <th style="width: 25%;">Descripción</th>
                  <th style="width: 10%; text-align: center;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${filasReportesHTML}
              </tbody>
            </table>

            <div class="footer-doc">
              Documento de control confidencial generado por la consola administrativa de Xanani. Prohibida su alteración o redistribución externa.
            </div>
          </div>
        </body>
      </html>
    `;

    ventanaImpresion.document.write(plantillaContenidoHTML);
    ventanaImpresion.document.close();
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

        <button 
          onClick={limpiarResueltos}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors ml-auto shadow-sm"
          title="Eliminar todos los reportes resueltos"
        >
          <Sparkles size={16} />
          Limpiar Resueltos
        </button>
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
              onClick={() => setReporteSeleccionado(reporte)}
              className={`report-card cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${reporte.tipo === 'CONDUCCION_PELIGROSA' ? 'report-critical' : ''} ${reporte.tipo === 'ANUNCIO' ? 'report-announcement' : ''}`}
            >
              {/* Header de la tarjeta */}
              <div className="flex justify-between items-start mb-4">
                <div className={`status-badge status-${reporte.estado.toLowerCase()}`}>
                  {reporte.tipo === 'ANUNCIO' ? 'ANUNCIO' : reporte.estado}
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
                <div className={`p-3 rounded-2xl ${
                  reporte.tipo === 'CONDUCCION_PELIGROSA' ? 'bg-red-100 text-red-600' : 
                  reporte.tipo === 'ANUNCIO' ? 'bg-blue-600 text-white shadow-lg' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {reporte.tipo === 'CONDUCCION_PELIGROSA' ? <ShieldAlert size={24} className="type-critical-icon" /> : 
                   reporte.tipo === 'ANUNCIO' ? <Megaphone size={24} /> :
                   <MessageSquare size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 leading-tight">
                    {reporte.tipo === 'ANUNCIO' ? 'ANUNCIO OFICIAL' : reporte.tipo.replace(/_/g, ' ')}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <User size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">
                      {reporte.tipo === 'ANUNCIO' ? 'Administrador' : reporte.usuario.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalles de la Unidad y Ruta o Destinatario */}
              {reporte.tipo === 'ANUNCIO' ? (
                <div className="mb-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-slate-400">Destinatario</span>
                      <span className="text-xs font-bold text-blue-700">{reporte.destinatario || 'Todos'}</span>
                    </div>
                  </div>
                </div>
              ) : (
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
              )}

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
                <div className="report-actions" onClick={e => e.stopPropagation()}>
                  {reporte.estado === 'PENDIENTE' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); gestionarReporte(reporte._id, 'REVISADO'); }}
                      className="btn-action btn-revisar"
                    >
                      <Search size={16} />
                      Marcar Revisado
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); gestionarReporte(reporte._id, 'RESUELTO'); }}
                    className="btn-action btn-resolver"
                  >
                    <CheckCircle2 size={16} />
                    Resolver
                  </button>
                </div>
              )}

              {/* Área de Respuesta Administrativa */}
              <div className="mt-4 pt-4 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                {reporte.respuestaAdmin ? (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Tu Respuesta</span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium italic">"{reporte.respuestaAdmin}"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-xs font-medium focus:border-blue-500 focus:bg-white transition-all outline-none min-h-[60px] resize-none"
                        placeholder="Escribe una respuesta para el pasajero..."
                        value={respuestas[reporte._id] || ''}
                        onChange={(e) => setRespuestas(prev => ({ ...prev, [reporte._id]: e.target.value }))}
                      />
                    </div>
                    <button 
                      onClick={() => enviarRespuesta(reporte._id)}
                      disabled={enviandoRespuesta === reporte._id}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {enviandoRespuesta === reporte._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <MessageSquare size={14} />
                      )}
                      Atender y Enviar Respuesta
                    </button>
                  </div>
                )}
              </div>

              {/* Botón de eliminar (siempre visible para admin) */}
              <button 
                onClick={(e) => { e.stopPropagation(); eliminarReporte(reporte._id); }}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Eliminar reporte permanentemente"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalles del Reporte */}
      {reporteSeleccionado && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={cerrarModal}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden fade-in relative" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className={`p-6 text-white flex justify-between items-start ${
              reporteSeleccionado.tipo === 'CONDUCCION_PELIGROSA' ? 'bg-red-500' : 'bg-blue-600'
            }`}>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  {reporteSeleccionado.tipo === 'CONDUCCION_PELIGROSA' ? <ShieldAlert size={28} /> : 
                   reporteSeleccionado.tipo === 'ANUNCIO' ? <Megaphone size={28} /> : <MessageSquare size={28} />}
                </div>
                <div>
                  <h3 className="text-xl font-black leading-tight">
                    {reporteSeleccionado.tipo === 'ANUNCIO' ? 'ANUNCIO OFICIAL' : reporteSeleccionado.tipo.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-white/80 font-medium mt-1">
                    Enviado el {new Date(reporteSeleccionado.createdAt).toLocaleString('es-MX', {
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
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Pasajero</span>
                  </div>
                  <p className="font-bold text-slate-800">
                    {reporteSeleccionado.tipo === 'ANUNCIO' ? 'Administrador' : reporteSeleccionado.usuario.username}
                  </p>
                  {reporteSeleccionado.tipo !== 'ANUNCIO' && (
                     <p className="text-xs text-slate-500 font-medium mt-1 truncate">{reporteSeleccionado.usuario.email}</p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    {reporteSeleccionado.tipo === 'ANUNCIO' ? <Info size={16} className="text-blue-500" /> : <Bus size={16} className="text-slate-400" />}
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      {reporteSeleccionado.tipo === 'ANUNCIO' ? 'Destinatario' : 'Unidad'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800">
                    {reporteSeleccionado.tipo === 'ANUNCIO' ? (reporteSeleccionado.destinatario || 'Todos') : (reporteSeleccionado.unidad?.placa || 'N/A')}
                  </p>
                </div>
              </div>

              {/* Contenido Completo */}
              <div className="mb-8">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">Queja / Comentario Completo</h4>
                <div className={`p-4 rounded-2xl border ${reporteSeleccionado.tipo === 'CONDUCCION_PELIGROSA' ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
                  <p className="text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                    {reporteSeleccionado.descripcion || 'El usuario no proporcionó detalles adicionales.'}
                  </p>
                </div>
              </div>

              {/* Interacciones */}
              {reporteSeleccionado.tipo !== 'ANUNCIO' && (
                <div className="mb-4">
                  <h4 className="text-[11px] font-black uppercase text-blue-500 tracking-wider mb-2 flex items-center gap-2">
                    <MessageSquare size={12} /> Respuesta Administrativa
                  </h4>
                  {reporteSeleccionado.respuestaAdmin ? (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-emerald-800 font-medium italic whitespace-pre-wrap">"{reporteSeleccionado.respuestaAdmin}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:border-blue-500 focus:bg-white transition-all outline-none resize-none min-h-[100px]"
                        placeholder="Escribe la respuesta oficial que le llegará al pasajero..."
                        value={respuestas[reporteSeleccionado._id] || ''}
                        onChange={(e) => setRespuestas(prev => ({ ...prev, [reporteSeleccionado._id]: e.target.value }))}
                      />
                      <button 
                        onClick={() => { enviarRespuesta(reporteSeleccionado._id); cerrarModal(); }}
                        disabled={enviandoRespuesta === reporteSeleccionado._id || !respuestas[reporteSeleccionado._id]}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {enviandoRespuesta === reporteSeleccionado._id ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
                        Enviar Respuesta y Atender
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de Cambio de Estado Rápidos */}
              {reporteSeleccionado.estado !== 'RESUELTO' && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => { gestionarReporte(reporteSeleccionado._id, 'RESUELTO'); cerrarModal(); }}
                    className="flex-1 py-3.5 rounded-xl text-sm font-black text-white bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-2 hover:bg-slate-900"
                  >
                    <CheckCircle2 size={18} /> Forzar Resolución (Cerrar Ticket)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
