import React from 'react';
import { X, MessageSquare, AlertCircle, MapPin, Bus, Clock, FileText, CheckCircle2 } from 'lucide-react';

/**
 * Modal de sólo lectura para mostrar los detalles y estado de un reporte enviado.
 */
const DetalleReporteModal = ({ isOpen, onClose, reporte }) => {
  if (!isOpen || !reporte) return null;

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'RESUELTO': return 'text-green-600 bg-green-50 border-green-200';
      case 'REVISADO': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const StatusIcon = (estado) => {
    switch (estado) {
      case 'RESUELTO': return <CheckCircle2 className="w-5 h-5" />;
      case 'REVISADO': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const folio = reporte._id.toString().slice(-6).toUpperCase();

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-slate-900 p-5 flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <MessageSquare className="w-32 h-32 -mr-10 -mt-10" />
          </div>
          <div>
            <h3 className="text-white font-black text-lg tracking-wide relative z-10">Detalle de Reporte</h3>
            <p className="text-slate-400 text-xs font-bold tracking-widest relative z-10">FOLIO #{folio}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors relative z-10 p-2 bg-white/10 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Estado principal */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${getStatusColor(reporte.estado)}`}>
            {StatusIcon(reporte.estado)}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Estado actual</p>
              <p className="font-bold">{reporte.estado}</p>
            </div>
          </div>

          {/* Información del reporte */}
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5" /> Tipo de Incidencia
              </p>
              <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 inline-block">
                {reporte.tipo.replace('_', ' ')}
              </p>
            </div>

            {(reporte.unidad || reporte.ruta) && (
              <div className="flex gap-4">
                {reporte.unidad && (
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Bus className="w-3.5 h-3.5" /> Unidad
                    </p>
                    <p className="text-sm font-bold text-slate-700">{reporte.unidad.placa || 'Desconocida'}</p>
                  </div>
                )}
                {reporte.ruta && (
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Ruta
                    </p>
                    <p className="text-sm font-bold text-slate-700">{reporte.ruta.nombre || 'No especificada'}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descripción</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                {reporte.descripcion || 'Sin descripción adicional.'}
              </p>
            </div>
          </div>

          {/* Respuesta del administrador (si existe) */}
          {reporte.respuestaAdmin && (
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <MessageSquare className="w-16 h-16" />
              </div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 relative z-10">Respuesta de Administración</p>
              <p className="text-sm text-slate-800 font-medium leading-relaxed relative z-10 italic">
                "{reporte.respuestaAdmin}"
              </p>
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-center text-[10px] font-bold text-slate-400">Enviado el {new Date(reporte.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleReporteModal;
