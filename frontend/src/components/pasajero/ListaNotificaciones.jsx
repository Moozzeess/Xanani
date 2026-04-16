import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../auth/useAuth';
import { Bell, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Panel de Notificaciones y Seguimiento de Reportes.
 * Permite al pasajero ver alertas de rutas y el estado de sus reportes.
 */
const ListaNotificaciones = () => {
    const { token } = useAuth();
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportes = async () => {
            try {
                // Suponiendo un endpoint que devuelva los reportes del usuario autenticado
                const res = await api.get('/reportes/usuario', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReportes(res.data);
            } catch (error) {
                console.error("Error al obtener reportes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportes();
    }, [token]);

    const getStatusStyles = (estado) => {
        switch (estado) {
            case 'RESUELTO': return 'bg-green-100 text-green-700 border-green-200';
            case 'REVISADO': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 p-6 overflow-y-auto">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-indigo-500" />
                    Notificaciones
                </h1>
                <p className="text-slate-500 text-sm">Seguimiento de tus reportes y alertas del sistema.</p>
            </header>

            <div className="space-y-4">
                {/* Alertas Globales Simuladas */}
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-900 text-sm">Ruta con menor afluencia</h4>
                        <p className="text-indigo-700 text-xs">La ruta 'Centro' tiene menos pasajeros de lo habitual hoy. ¡Aprovecha!</p>
                        <span className="text-[10px] text-indigo-400 mt-1 block">Hace 10 min</span>
                    </div>
                </div>

                <div className="border-b border-slate-200 my-4"></div>

                <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Tus Reportes
                </h3>

                {loading ? (
                    <p className="text-center text-slate-400 text-xs py-10">Cargando reportes...</p>
                ) : reportes.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-xs">No has realizado reportes recientemente.</p>
                    </div>
                ) : (
                    reportes.map((rep) => (
                        <div key={rep._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rep.tipo}</span>
                                <p className="text-sm font-medium text-slate-700 mt-1">{rep.descripcion || 'Sin descripción'}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{new Date(rep.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusStyles(rep.estado)}`}>
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
