import React, { useState } from 'react';
import { X, User, Star, Route, MapPin, Bell, Trash2, LogOut, ChevronRight, Heart, Pencil, Briefcase, Truck, CreditCard } from 'lucide-react';

/**
 * Panel lateral de perfil (drawer desde la derecha).
 * Unificado para Pasajero y Conductor con lógica de edición protegida.
 */
const PanelPerfil = ({
    isOpen,
    onClose,
    usuario,
    conductorData = null, // Datos técnicos si el rol es CONDUCTOR
    historial = [],
    rutasFavoritas = [],
    rutasDisponibles = [],
    paradasFavoritas = [],
    notificacionesActivas = false,
    onToggleNotificaciones,
    onLimpiarHistorial,
    onToggleSuscripcion, // Cambiado de onQuitarFavorito
    onVerRutaFavorita,
    onCentrarParada,
    onLogout,
    onEditarPerfil // Función para abrir el modal/formulario de edición
}) => {
    const [confirmarLogout, setConfirmarLogout] = useState(false);

    const totalViajes = historial.length;
    const isConductor = usuario?.role === 'CONDUCTOR';

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
                <div className="bg-gradient-to-br from-slate-900 to-slate-700 px-6 pt-12 pb-6 text-white relative h-fit">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/10">
                            {userInitial}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg truncate max-w-[150px]">{usuario?.username || 'Usuario'}</p>
                                {!isConductor && (
                                    <button
                                        onClick={onEditarPerfil}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Editar perfil"
                                    >
                                        <Pencil className="w-4 h-4 text-white/60" />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-white/60 truncate">{usuario?.email || ''}</p>
                            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isConductor ? 'bg-amber-400 text-amber-900' : 'bg-blue-500 text-white'}`}>
                                {isConductor ? 'Conductor' : 'Pasajero'}
                            </span>
                        </div>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-md">
                            <p className="text-xl font-black">{isConductor ? (conductorData?.viajesTotales || 0) : totalViajes}</p>
                            <p className="text-[9px] text-white/60 font-bold uppercase">Viajes</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-md">
                            <p className="text-xl font-black">{isConductor ? '1' : rutasFavoritas.length}</p>
                            <p className="text-[9px] text-white/60 font-bold uppercase">{isConductor ? 'Ruta' : 'Favoritos'}</p>
                        </div>

                    </div>
                </div>

                {/* Contenido scrollable */}
                <div className="flex-1 overflow-y-auto no-scrollbar">

                    {/* Información Técnica (Solo Conductores) */}
                    {isConductor && conductorData && (
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                                <Briefcase className="w-3 h-3" /> Ficha Técnica
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Unidad Asignada</p>
                                        <p className="text-sm font-black text-slate-700">{conductorData.unidad || 'Pendiente'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Licencia Conducir</p>
                                        <p className="text-sm font-black text-slate-700">{conductorData.licencia || 'Verificando...'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                        <Route className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Ruta Activa</p>
                                        <p className="text-sm font-black text-slate-700">{conductorData.rutaAsignadaId?.nombre || conductorData.ruta || 'Sin Ruta'}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-[9px] text-center text-slate-400 italic">
                                Para cambios en tu unidad o ruta, contacta a tu supervisor.
                            </p>
                        </div>
                    )}

                    {/* Rutas favoritas (Pasajeros) */}
                    {!isConductor && rutasFavoritas.length > 0 && (
                        <div className="px-5 py-4 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                                <Heart className="w-3 h-3" /> Rutas guardadas
                            </p>
                            {rutasFavoritas.map((ruta) => (
                                <div
                                    key={ruta._id || ruta.id}
                                    className="w-full flex items-center gap-3 py-2 hover:bg-slate-50 rounded-xl px-2 group transition-colors"
                                >
                                    <button
                                        onClick={() => onVerRutaFavorita?.(ruta)}
                                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                                    >
                                        <Route className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 font-medium truncate">{ruta.nombre}</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSuscripcion?.(ruta._id || ruta.id);
                                        }}
                                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-400 transition-all"
                                        title="Quitar suscripción"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:hidden" />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Descubrir Rutas (Si no hay o para agregar más) */}
                    {!isConductor && (
                        <div className="px-5 py-4 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                                <Route className="w-3 h-3" /> {rutasFavoritas.length === 0 ? 'Descubrir Rutas' : 'Explorar más'}
                            </p>
                            <div className="space-y-2">
                                {rutasDisponibles
                                    .filter(r => !rutasFavoritas.some(f => (f._id || f.id) === (r._id || r.id)))
                                    .slice(0, 3)
                                    .map((ruta) => (
                                        <div
                                            key={ruta._id || ruta.id}
                                            className="w-full flex items-center gap-3 py-2 hover:bg-slate-50 rounded-xl px-2 transition-colors border border-dashed border-transparent hover:border-slate-200"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700 font-medium truncate">{ruta.nombre}</p>
                                            </div>
                                            <button
                                                onClick={() => onToggleSuscripcion?.(ruta._id || ruta.id)}
                                                className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                Suscribirse
                                            </button>
                                        </div>
                                    ))
                                }
                                {rutasDisponibles.filter(r => !rutasFavoritas.some(f => (f._id || f.id) === (r._id || r.id))).length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic text-center py-2">No hay más rutas disponibles por ahora.</p>
                                )}
                            </div>
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
                                className={`relative w-10 h-5 rounded-full transition-colors ${notificacionesActivas ? 'bg-blue-600' : 'bg-slate-300'
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
