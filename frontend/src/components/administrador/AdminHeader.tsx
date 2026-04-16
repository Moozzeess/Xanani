import React, { useState } from 'react';
import { Bell, Menu, Megaphone, Send, X } from 'lucide-react';

export interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onTriggerSOS: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onToggleSidebar, onTriggerSOS }) => {
  // --- ESTADOS PARA EL MODAL Y EL FORMULARIO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avisoTexto, setAvisoTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarAvisoGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // Simulación de envío
    console.log("Enviando aviso:", avisoTexto);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Limpiar y cerrar
    setEnviando(false);
    setAvisoTexto('');
    setIsModalOpen(false);
    alert("Aviso enviado con éxito");
  };

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
          <button
            type="button"
            onClick={onTriggerSOS}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
            title="Simular Emergencia"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>

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

              <form onSubmit={enviarAvisoGlobal} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Mensaje del anuncio</label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Tráfico pesado en Av. Central. Tomar precauciones..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 font-medium resize-none"
                    value={avisoTexto}
                    onChange={(e) => setAvisoTexto(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !avisoTexto.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {enviando ? 'Enviando...' : (
                      <>
                        <Send className="w-4 h-4" /> Enviar Aviso
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;