import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../auth/useAuth';
import { Bell, MessageSquare, AlertTriangle, CheckCircle, Route, Eye, Heart } from 'lucide-react';

/**
 * Panel de Notificaciones y Seguimiento de Reportes.
 * Permite al pasajero ver alertas de rutas y el estado de sus reportes.
 */
const ListaNotificaciones = ({ 
    onSuscribir, 
    onVerRuta, 
    suscripcionesIds = [] 
}) => {
    const { token } = useAuth();
    const [reportes, setReportes] = useState([]);
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                setNotificaciones(resNotificaciones.data.data);

            } catch (error) {
                console.error("Error al obtener datos", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const getStatusStyles = (estado) => {
        switch (estado) {
            case 'RESUELTO': return 'bg-green-100 text-green-700 border-green-200';
            case 'REVISADO': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 p-6 overflow-y-auto pb-24">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-indigo-500" />
                    Alertas y Avisos
                </h1>
                <p className="text-slate-500 text-sm">Novedades del sistema y seguimiento de reportes.</p>
            </header>

            <div className="space-y-4">
                {/* Notificaciones del Sistema */}
                {notificaciones.length > 0 ? (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Avisos del Sistema
                        </h3>
                        {notificaciones.map((notif) => {
                            const esNuevaRuta = notif.tipo === 'RUTA_NUEVA';
                            const yaSuscrito = esNuevaRuta && suscripcionesIds.includes(notif.data?.rutaId);

                            return (
                                <div key={notif._id} className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col gap-3">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-sm">
                                            {esNuevaRuta ? <Route className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-indigo-900 text-sm">{notif.titulo}</h4>
                                            <p className="text-indigo-700 text-xs leading-relaxed">{notif.mensaje}</p>
                                            <span className="text-[10px] text-indigo-400 mt-2 block">
                                                {new Date(notif.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {esNuevaRuta && (
                                        <div className="flex gap-2 mt-1">
                                            <button 
                                                onClick={() => onVerRuta?.(notif.data?.rutaId)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-indigo-100 rounded-xl text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                                            >
                                                <Eye className="w-3 h-3" /> Ver Ruta
                                            </button>
                                            <button 
                                                onClick={() => onSuscribir?.(notif.data?.rutaId)}
                                                disabled={yaSuscrito}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all ${
                                                    yaSuscrito 
                                                    ? 'bg-green-100 text-green-600 border border-green-200' 
                                                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                }`}
                                            >
                                                {yaSuscrito ? <CheckCircle className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                                                {yaSuscrito ? 'Suscrito' : 'Suscribirse'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-100/50 border border-dashed border-slate-200 p-6 rounded-2xl text-center">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-xs font-medium">No hay avisos nuevos en este momento.</p>
                        <p className="text-slate-400 text-[10px] mt-1">Suscríbete a rutas desde tu perfil para recibir alertas.</p>
                    </div>
                )}

                <div className="border-b border-slate-200 my-6"></div>

                <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    Tus Reportes
                </h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(n => <div key={n} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
                    </div>
                ) : reportes.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-xs">No has realizado reportes recientemente.</p>
                    </div>
                ) : (
                    reportes.map((rep) => (
                        <div key={rep._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start hover:border-slate-300 transition-colors">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rep.tipo}</span>
                                <p className="text-sm font-medium text-slate-700 mt-1">{rep.descripcion || 'Sin descripción'}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{new Date(rep.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${getStatusStyles(rep.estado)}`}>
                                {rep.estado}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ListaNotificaciones;
