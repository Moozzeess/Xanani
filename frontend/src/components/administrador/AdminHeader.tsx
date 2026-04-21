import React, { useState } from 'react';
import { Bell, Menu, Megaphone, Send, X, Siren, Users, User, Info } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAlerta } from '../../hooks/useAlerta';
import FormularioAnuncio from './FormularioAnuncio';

export interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onTriggerSOS: () => void;
  notificaciones?: any[];
  onClearNotificaciones?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  onToggleSidebar,
  onTriggerSOS,
  notificaciones = [],
  onClearNotificaciones
}) => {
  // const { socket } = useSocket();
  // const { disparar, dispararError } = useAlerta();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const hayAlertas = notificaciones.length > 0;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onToggleSidebar} className="lg:hidden text-slate-500 hover:text-slate-800">
            <Menu className="w-6 h-6" />
          </button>
          <h2 id="page-title" className="text-xl font-bold text-slate-800">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
              title="Notificaciones"
            >
              <Bell className="w-6 h-6" />
              {hayAlertas && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h4 className="font-bold text-slate-800">Notificaciones</h4>
                  {hayAlertas && (
                    <button
                      onClick={onClearNotificaciones}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    notificaciones.map((notif, idx) => (
                      <div
                        key={idx}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${notif.tipo === 'SOS' ? 'bg-red-50' : ''}`}
                        onClick={() => {
                          if (notif.tipo === 'SOS') onTriggerSOS();
                          setIsNotifOpen(false);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${notif.tipo === 'SOS' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {notif.tipo === 'SOS' ? <Siren className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${notif.tipo === 'SOS' ? 'text-red-700' : 'text-slate-800'}`}>
                              {notif.tipo === 'SOS' ? '¡EMERGENCIA SOS!' : 'Nuevo Reporte'}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {notif.descripcion || 'Se ha recibido una nueva alerta.'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.timestamp || Date.now()).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)} // Abrir modal
            className="hidden md:flex bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 items-center gap-2 shadow-lg shadow-slate-900/10"
          >
            <Megaphone className="w-4 h-4" /> Nuevo Anuncio
          </button>
        </div>
      </header>

      {/* --- MODAL DE NUEVO AVISO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop (Fondo oscuro) */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Contenedor del Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Send className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Emisión de Aviso a Flotilla</h3>
                    <p className="text-xs text-slate-500">Notificación inmediata para todos los conductores.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <FormularioAnuncio
                onExito={() => setIsModalOpen(false)}
                onCancelar={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;