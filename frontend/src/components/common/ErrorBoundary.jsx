import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Componente ErrorBoundary para capturar errores de renderizado en el frontend.
 * Evita que la aplicación completa se detenga ante un fallo en un componente.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Aquí se podría enviar el error a un servicio externo como Sentry
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-800">Algo no salió bien</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Hemos detectado un fallo inesperado en la interfaz. No te preocupes, tus datos están a salvo.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-100"
              >
                <RefreshCw size={18} /> Reintentar Cargar
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all active:scale-95"
              >
                <Home size={18} /> Ir al Inicio
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div className="pt-4 mt-4 border-t border-slate-50 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detalle Técnico</p>
                <pre className="text-[10px] bg-slate-50 p-3 rounded-lg text-red-400 overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
