import React, { useState } from 'react';
import { Bell, X, MapPin, Route, CheckCircle } from 'lucide-react';

/**
 * Ruta de demostración CDMX con puntos icónicos para el modo sin unidades.
 * Se usa solo cuando no hay unidades reales en el sistema.
 */
const RUTA_DEMO = [
  { nombre: 'Zócalo', lat: 19.4326, lng: -99.1332 },
  { nombre: 'Eje Central', lat: 19.4380, lng: -99.1413 },
  { nombre: 'Paseo de la Reforma', lat: 19.4278, lng: -99.1640 },
  { nombre: 'Polanco', lat: 19.4327, lng: -99.1900 },
  { nombre: 'Tlatelolco', lat: 19.4510, lng: -99.1411 },
];

/**
 * Modal para suscribirse a alertas de una ruta o parada.
 * Usa la Notification API del navegador para alertas futuras.
 * Muestra horarios estimados basados en la configuración de despacho de la ruta.
 */
const ModalSuscripcion = ({ isOpen, onClose, rutas = [] }) => {
  const [suscrito, setSuscrito] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);

  if (!isOpen) return null;

  const solicitarNotificacion = async () => {
    if (!('Notification' in window)) {
      setSuscrito(true); // Fallback si no hay soporte
      return;
    }

    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      setSuscrito(true);
      // Notificación de confirmación inmediata
      new Notification('Xanani — Alerta activada', {
        body: rutaSeleccionada
          ? `Te avisaremos cuando haya unidades en la ruta: ${rutaSeleccionada.nombre}`
          : 'Te avisaremos cuando haya unidades disponibles en tu zona.',
        icon: '/vite.svg'
      });
    } else {
      setPermisoDenegado(true);
    }
  };

  /**
   * Calcula el horario estimado de siguiente unidad basado en el intervalo de la ruta.
   */
  const calcularHorario = (ruta) => {
    if (!ruta?.configuracionDespacho?.intervaloMinutos) return null;
    const minutos = ruta.configuracionDespacho.intervaloMinutos;
    const ahora = new Date();
    const proxima = new Date(ahora.getTime() + minutos * 60 * 1000);
    return proxima.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden pb-2">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Activar alerta</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-5">
          {suscrito ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-sm font-bold text-slate-700 text-center">
                Alerta activada. Te notificaremos cuando haya unidades disponibles.
              </p>
              <button onClick={onClose} className="text-blue-600 text-sm font-bold">Entendido</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-4">
                No hay unidades activas en este momento. Suscríbete para recibir una notificación cuando estén disponibles.
              </p>

              {/* Selección de ruta */}
              {rutas.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ruta específica (opcional)</p>
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                    {rutas.map((ruta) => {
                      const horario = calcularHorario(ruta);
                      return (
                        <button
                          key={ruta._id}
                          onClick={() => setRutaSeleccionada(ruta === rutaSeleccionada ? null : ruta)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                            ${rutaSeleccionada?._id === ruta._id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                        >
                          <Route className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{ruta.nombre}</p>
                            {horario && (
                              <p className="text-[10px] text-slate-400">Próxima estimada: {horario}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Próximas paradas */}
              <div className="mb-4 p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Puntos de servicio activos</p>
                {RUTA_DEMO.slice(0, 3).map((p) => (
                  <div key={p.nombre} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                    <MapPin className="w-3 h-3 text-blue-400" /> {p.nombre}
                  </div>
                ))}
              </div>

              {permisoDenegado && (
                <p className="text-xs text-red-500 mb-3 text-center">
                  Permisos de notificación denegados. Actívalos en la configuración del navegador.
                </p>
              )}

              <button
                onClick={solicitarNotificacion}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-blue-600/25"
              >
                <Bell className="w-4 h-4 inline mr-2" />
                Activar notificación
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalSuscripcion;
