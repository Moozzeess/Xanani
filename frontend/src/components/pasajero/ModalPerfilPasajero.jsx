import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Mail, MapPin, Save, Edit2 } from 'lucide-react';
import api from '../../services/api';
import { useAlertaGlobal } from '../../context/AlertaContext';

/**
 * ModalPerfilPasajero
 * Intención: Permitir al pasajero editar su información de perfil.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla la visibilidad del modal.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {Object} props.usuario - Datos actuales del usuario.
 * @param {Object} props.stats - Estadísticas (viajes, favoritos, puntos).
 * @param {function} props.onActualizar - Función a llamar tras una actualización exitosa.
 */
const ModalPerfilPasajero = ({ isOpen, onClose, usuario, stats, onActualizar }) => {
    const { disparar, dispararError } = useAlertaGlobal();
    const [cargando, setCargando] = useState(false);

    // Estado local para los campos del formulario
    const [formData, setFormData] = useState({
        username: '',
        fechaNacimiento: '',
        email: '',
        nacionalidad: ''
    });

    // Inicializar el formulario con los datos del usuario
    useEffect(() => {
        if (usuario) {
            setFormData({
                username: usuario.username || '',
                fechaNacimiento: usuario.fechaNacimiento ? new Date(usuario.fechaNacimiento).toISOString().split('T')[0] : '',
                email: usuario.email || '',
                nacionalidad: usuario.nacionalidad || ''
            });
        }
    }, [usuario, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardar = async () => {
        setCargando(true);
        try {
            const res = await api.put('/usuarios/perfil', formData);
            if (res.data.status === 'exito') {
                disparar({
                    tipo: 'exito',
                    titulo: 'Éxito',
                    mensaje: 'Perfil actualizado correctamente'
                });
                onActualizar?.();
                onClose();
            }
        } catch (err) {
            console.error("Error al actualizar perfil:", err);
            dispararError('No se pudo actualizar el perfil');
        } finally {
            setCargando(false);
        }
    };

    const userInitial = (formData.username || usuario?.username || 'P').charAt(0).toUpperCase();

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Contenedor del Modal */}
            <div className="relative bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* Cabecera Oscura */}
                <div className="bg-[#1e293b] px-6 py-4 flex items-center justify-between text-white">
                    <h3 className="text-lg font-bold w-full text-center">Mi Perfil</h3>
                    <button
                        onClick={onClose}
                        className="absolute right-6 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body del Perfil */}
                <div className="px-8 pt-20 pb-8 relative">

                    {/* Avatar Absoluto (estilo solapado) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-28 h-28 bg-slate-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl font-black text-slate-600">
                            {userInitial}
                        </div>
                    </div>

                    {/* Identidad Básica */}
                    <div className="text-center mb-8">
                        <h4 className="text-2xl font-black text-slate-800">{usuario?.username || 'Pasajero'}</h4>
                        <p className="text-slate-400 text-sm font-medium">{usuario?.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-around border-y border-slate-100 py-4 mb-8">
                        <div className="text-center">
                            <p className="text-xl font-black text-slate-800">{stats?.viajes || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viajes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-slate-800">{stats?.favoritos || 0}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favoritos</p>
                        </div>

                    </div>

                    {/* Formulario */}
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Nombre de usuario"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Fecha de nacimiento</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    name="fechaNacimiento"
                                    value={formData.fechaNacimiento}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Correo electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Ciudad de origen</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="nacionalidad"
                                    value={formData.nacionalidad}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Ej. Ciudad de México"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="mt-10 space-y-3">
                        <button
                            disabled={cargando}
                            className="w-full py-4 bg-white border-2 border-red-100 text-red-500 font-black text-sm rounded-2xl hover:bg-red-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" /> Editar
                        </button>
                        <button
                            onClick={handleGuardar}
                            disabled={cargando}
                            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-black text-sm rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {cargando ? (
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalPerfilPasajero;
