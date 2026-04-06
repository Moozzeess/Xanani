import React, { useState } from 'react';
import { X, User, Star, Route, MapPin, Bell, Trash2, LogOut, ChevronRight, Heart } from 'lucide-react';

/**
 * Panel lateral de perfil del pasajero (drawer desde la derecha).
 * Incluye identidad, actividad, rutas/paradas guardadas, configuración y cierre de sesión.
 */
const PanelPerfil = ({
  isOpen,
  onClose,
  usuario,
  historial = [],
  rutasFavoritas = [],
  paradasFavoritas = [],
  notificacionesActivas = false,
  onToggleNotificaciones,
  onLimpiarHistorial,
  onVerRutaFavorita,
  onCentrarParada,
  onLogout,
}) => {
  const [confirmarLogout, setConfirmarLogout] = useState(false);

  const totalViajes = historial.length;
  const calificacionPromedio = historial.filter((v) => v.calificacion).length > 0
    ? (historial.reduce((a, v) => a + (v.calificacion || 0), 0) /
       historial.filter((v) => v.calificacion).length).toFixed(1)
    : null;

  const userInitial = (usuario?.username || 'P').charAt(0).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[1200] backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white z-[1250] shadow-2xl
          flex flex-col transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Cabecera con identidad */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 px-6 pt-12 pb-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {userInitial}
            </div>
            <div>
              <p className="font-bold text-base">{usuario?.username || 'Pasajero'}</p>
              <p className="text-xs text-white/60">{usuario?.email || ''}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-white/15 rounded-full text-[10px] font-bold">
                Pasajero
              </span>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{totalViajes}</p>
              <p className="text-[9px] text-white/60 font-medium">Viajes</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{rutasFavoritas.length}</p>
              <p className="text-[9px] text-white/60 font-medium">Rutas</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{calificacionPromedio || '—'}</p>
              <p className="text-[9px] text-white/60 font-medium">Rating</p>
            </div>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Rutas favoritas */}
          {rutasFavoritas.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <Heart className="w-3 h-3" /> Rutas guardadas
              </p>
              {rutasFavoritas.map((ruta) => (
                <button
                  key={ruta.id}
                  onClick={() => onVerRutaFavorita?.(ruta)}
                  className="w-full flex items-center gap-3 py-2.5 hover:bg-slate-50 rounded-xl px-2 transition-colors"
                >
                  <Route className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium flex-1 text-left truncate">{ruta.nombre}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* Paradas favoritas */}
          {paradasFavoritas.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Paradas guardadas
              </p>
              {paradasFavoritas.map((parada) => (
                <button
                  key={parada.nombre}
                  onClick={() => onCentrarParada?.(parada)}
                  className="w-full flex items-center gap-3 py-2.5 hover:bg-slate-50 rounded-xl px-2 transition-colors"
                >
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium flex-1 text-left truncate">{parada.nombre}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* Historial de viajes */}
          {historial.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Historial</p>
                <button
                  onClick={onLimpiarHistorial}
                  className="text-[10px] text-red-400 font-bold hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Limpiar
                </button>
              </div>
              {historial.slice(0, 5).map((viaje, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{viaje.placa}</p>
                    <p className="text-[10px] text-slate-400">{viaje.fecha} {viaje.ruta && `· ${viaje.ruta}`}</p>
                  </div>
                  {viaje.calificacion && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-600">{viaje.calificacion}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Configuración */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Configuración</p>

            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700 font-medium">Notificaciones</span>
              </div>
              <button
                onClick={onToggleNotificaciones}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  notificacionesActivas ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${notificacionesActivas ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer: cerrar sesión */}
        <div className="px-5 py-4 border-t border-slate-100">
          {confirmarLogout ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarLogout(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold active:scale-95 transition-all"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmarLogout(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default PanelPerfil;
