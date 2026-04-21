import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../auth/useAuth';
import { Bell, MessageSquare, AlertTriangle, CheckCircle, Route, Eye, Heart, Trash2, CheckCircle2 } from 'lucide-react';
import { useAlertaGlobal } from '../../context/AlertaContext';

/**
 * Panel de Notificaciones y Seguimiento de Reportes.
 * Permite al pasajero ver alertas de rutas y el estado de sus reportes.
 * Ahora incluye gestión de lectura y limpieza de notificaciones.
 */
const ListaNotificaciones = ({ 
    onSuscribir, 
    onVerRuta, 
    suscripcionesIds = [],
    onNotifUpdate // Callback para avisar al Navbar si hay pendientes
}) => {
    const { token } = useAuth();
    const { disparar } = useAlertaGlobal();
    const [reportes, setReportes] = useState([]);
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // Obtener reportes
            const resReportes = await api.get('/reportes/usuario', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportes(resReportes.data);

            // Obtener notificaciones del sistema
            const resNotificaciones = await api.get('/notificaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = resNotificaciones.data.data;
            setNotificaciones(data);
            
            // Informar al padre si hay alguna no leída
            const hayPendientes = data.some(n => !n.leida);
            onNotifUpdate?.(hayPendientes);

        } catch (error) {
            console.error("Error al obtener datos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleMarcarLeida = async (id) => {
        try {
            await api.patch(`/notificaciones/${id}/leida`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Actualizar localmente eliminando de la lista para dar efecto de "limpieza"
            setNotificaciones(prev => {
                const updated = prev.filter(n => n._id !== id);
                onNotifUpdate?.(updated.some(un => !un.leida));
                return updated;
            });
        } catch (error) {
            console.error("Error al marcar como leída", error);
        }
    };

    const handleLimpiarTodo = async () => {
        try {
            const noLeidas = notificaciones.filter(n => !n.leida);
            await Promise.all(noLeidas.map(n => 
                api.patch(`/notificaciones/${n._id}/leida`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ));
            
            disparar({
                tipo: 'exito',
                titulo: 'Bandeja Limpia',
                mensaje: 'Se han marcado todas las notificaciones como leídas.'
            });
            
            fetchData();
        } catch (error) {
            disparar({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudieron limpiar las notificaciones.' });
        }
    };

    const getStatusStyles = (estado) => {
        switch (estado) {
            case 'RESUELTO': return 'bg-green-100 text-green-700 border-green-200';
            case 'REVISADO': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 overflow-y-auto pb-24">
            <header className="p-6 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 flex justify-between items-end border-b border-slate-200/50">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-600" />
                        Alertas
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">Avisos del sistema y reportes</p>
                </div>
                {notificaciones.some(n => !n.leida) && (
                    <button 
                        onClick={handleLimpiarTodo}
                        className="text-[10px] font-bold text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marcar todo como leído
                    </button>
                )}
            </header>

            <div className="p-6 space-y-8">
                {/* Notificaciones del Sistema */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" /> Avisos Recientes
                    </h3>
                    
                    {notificaciones.length > 0 ? (
                        <div className="space-y-3">
                            {notificaciones.map((notif) => {
                                const esNuevaRuta = notif.tipo === 'RUTA_NUEVA';
                                const yaSuscrito = esNuevaRuta && suscripcionesIds.includes(notif.data?.rutaId);

                                return (
                                    <div 
                                        key={notif._id} 
                                        onClick={() => !notif.leida && handleMarcarLeida(notif._id)}
                                        className={`group relative border transition-all duration-300 p-4 rounded-2xl flex flex-col gap-3 ${
                                            notif.leida 
                                            ? 'bg-white/40 border-slate-100 opacity-70 grayscale-[0.5]' 
                                            : 'bg-white border-indigo-100 shadow-md shadow-indigo-100/50 border-l-4 border-l-indigo-600'
                                        } cursor-pointer hover:scale-[1.01]`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                                notif.leida ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                                {esNuevaRuta ? <Route className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`font-bold text-sm ${notif.leida ? 'text-slate-500' : 'text-slate-900'}`}>
                                                        {notif.titulo}
                                                    </h4>
                                                    {!notif.leida && (
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                                    )}
                                                </div>
                                                <p className={`text-xs leading-relaxed mt-1 ${notif.leida ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {notif.mensaje}
                                                </p>
                                                <span className="text-[9px] text-slate-400 mt-2 block font-medium">
                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleMarcarLeida(notif._id); }}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Eliminar notificación"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        {esNuevaRuta && (
                                            <div className="flex gap-2 mt-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onVerRuta?.(notif.data?.rutaId); }}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Ver Ruta
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onSuscribir?.(notif.data?.rutaId); }}
                                                    disabled={yaSuscrito}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                                                        yaSuscrito 
                                                        ? 'bg-green-50 text-green-600 border border-green-100' 
                                                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                    }`}
                                                >
                                                    {yaSuscrito ? <CheckCircle className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                                                    {yaSuscrito ? 'Suscrito' : 'Suscribirse'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-100 p-8 rounded-3xl text-center">
                            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-bold">Todo al día</p>
                            <p className="text-slate-400 text-[10px] mt-1 max-w-[200px] mx-auto">No tienes avisos pendientes. Las novedades de tus rutas favoritas aparecerán aquí.</p>
                        </div>
                    )}
                </section>

                {/* Tus Reportes */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Historial de Reportes
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(n => <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : reportes.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-100">
                            <p className="text-slate-400 text-xs">No has realizado reportes recientemente.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reportes.map((rep) => (
                                <div key={rep._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start hover:shadow-md transition-all duration-300">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{rep.tipo}</span>
                                            <span className="text-[9px] text-slate-400 font-medium">{new Date(rep.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 mt-2 leading-tight">{rep.descripcion || 'Sin descripción'}</p>
                                    </div>
                                    <div className={`text-[9px] font-black px-2.5 py-1 rounded-full border shadow-sm ${getStatusStyles(rep.estado)}`}>
                                        {rep.estado}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ListaNotificaciones;

