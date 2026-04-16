import React, { useEffect, useState } from 'react';

/**
 * Tipos de alerta disponibles para el modal.
 */
export type TipoAlerta = 'error' | 'advertencia' | 'exito' | 'info';

interface ModalAlertaProps {
  mostrar: boolean;
  tipo: TipoAlerta;
  titulo: string;
  mensaje: string;
  detalles?: string;
  alCerrar: () => void;
}

/**
 * Modal dinámico con diseño premium, efectos de desenfoque y micro-animaciones.
 * Utiliza Tailwind CSS para el estilo y es totalmente responsive.
 */
export const ModalAlerta: React.FC<ModalAlertaProps> = ({
  mostrar,
  tipo,
  titulo,
  mensaje,
  detalles,
  alCerrar
}) => {
  const [animado, setAnimado] = useState(false);
  const [verDetalles, setVerDetalles] = useState(false);

  useEffect(() => {
    if (mostrar) {
      setTimeout(() => setAnimado(true), 10);
    } else {
      setAnimado(false);
      setVerDetalles(false); // Resetear detalles al cerrar
    }
  }, [mostrar]);

  if (!mostrar) return null;

  // Configuración de colores e iconos según el tipo (Coinciden con la identidad de Xanani)
  const configs: Record<TipoAlerta, any> = {
    error: {
      bg: 'bg-red-600',
      text: 'text-red-600',
      lightBg: 'bg-red-50',
      icono: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    advertencia: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      lightBg: 'bg-amber-50',
      icono: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    exito: {
      bg: 'bg-[#4ade80]', // Verde éxito del proyecto (status-badge)
      text: 'text-[#064e3b]', 
      lightBg: 'bg-[#4ade80]/10',
      icono: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    info: {
      bg: 'bg-[#2563eb]', // Azul primario Xanani (floating-label)
      text: 'text-[#2563eb]',
      lightBg: 'bg-[#2563eb]/10',
      icono: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const config = configs[tipo];

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${animado ? 'backdrop-blur-sm bg-black/40' : 'bg-black/0'}`}>
      <div 
        className={`w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl transition-all duration-500 transform ${animado ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0'}`}
        role="alertdialog"
        aria-modal="true"
      >
        {/* Cabecera con degradado */}
        <div className={`h-2 w-full ${config.bg}`} />
        
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 p-3 rounded-xl ${config.lightBg} ${config.text}`}>
              {config.icono}
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-slate-800 leading-tight">
                {titulo}
              </h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                {mensaje}
              </p>
            </div>
          </div>

          {detalles && (
            <div className="mt-4">
              <button 
                onClick={() => setVerDetalles(!verDetalles)}
                className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center"
              >
                <span>{verDetalles ? 'Ocultar info técnica' : 'Información para soporte'}</span>
                <svg className={`ml-1 w-3 h-3 transition-transform ${verDetalles ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m19 9-7 7-7-7" />
                </svg>
              </button>
              
              {verDetalles && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-mono text-slate-500 break-all leading-relaxed">
                    <span className="font-bold text-slate-400">DEBUG_LOG:</span> {detalles}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={alCerrar}
              className={`px-6 py-2.5 rounded-xl font-semibold text-white transition-all active:scale-95 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 ${config.bg} brightness-110`}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAlerta;
