import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../services/api";

// Componentes Comunes
import Mapa from "../../components/common/Mapa";
import Navbar from "../../components/common/Navbar";

// Componentes de Pasajero
import AlertaFlotante from "../../components/pasajero/AlertaFlotante";
import ReporteModal from "../../components/pasajero/ReporteModal";
import UbicacionModal from "../../components/common/UbicacionModal";
import { useAlertaGlobal } from "../../context/AlertaContext";
import { useSocket } from "../../hooks/useSocket";
import ModalAlerta from "../../components/common/ModalAlerta";
import PanelPerfil from "../../components/common/PanelPerfil";
import ModalPerfilPasajero from "../../components/pasajero/ModalPerfilPasajero";

// Capas de Mapa (Modular Premium)
import CapaGeometria from "../../components/common/mapa/CapaGeometria";
import CapaVehiculos from "../../components/common/mapa/CapaVehiculos";
import CapaParadas from "../../components/common/mapa/CapaParadas";

import PanelRutaInteractiva from "../../components/pasajero/PanelRutaInteractiva";
import ListaNotificaciones from "../../components/pasajero/ListaNotificaciones";
import PanelAfluencia from "../../components/common/estadisticas/PanelAfluencia";
import SimPasajero from "../../simulations/SimPasajero";
import { X } from 'lucide-react';

/**
 * Pasajero (Versión Premium Optimizada)
 */
const Pasajero = () => {
    const navigate = useNavigate();
    const { cerrarSesion, usuario, token } = useAuth();
    const { disparar, dispararError } = useAlertaGlobal();
    const { socket } = useSocket();

    const [activeTab, setActiveTab] = useState('map');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [rutasDisponibles, setRutasDisponibles] = useState([]);
    const [rutasFavoritas, setRutasFavoritas] = useState([]);
    const [perfilCompleto, setPerfilCompleto] = useState(null);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [routeLine, setRouteLine] = useState([]);
    const [paradas, setParadas] = useState([]);
    const [mapCenter, setMapCenter] = useState([19.4326, -99.1332]);
    const [mapBounds, setMapBounds] = useState(null);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const username = usuario?.username || 'Pasajero';
    const userInitial = username.charAt(0).toUpperCase();

    // Función Unificada para Actualizar Unidades (Real o Sim)
    const actualizarVehiculo = (datos) => {
        setVehicles(prev => {
            const id = datos.id || datos.placa;
            const index = prev.findIndex(v => v.id === id);
            
            // Si es una actualización de una unidad real recibida por el socket principal
            let finalData = { ...datos };
            if (!datos.isSimulated) {
                let colorClass = 'bg-blue-400';
                let occLabel = 'Baja';
                const pct = (datos.ocupacionActual / datos.capacidadMaxima) * 100;
                if (pct < 33) colorClass = 'bg-green-400';
                else if (pct < 66) { colorClass = 'bg-yellow-400'; occLabel = 'Media'; }
                else { colorClass = 'bg-red-400'; occLabel = 'Alta'; }

                finalData = {
                    ...datos,
                    id,
                    color: colorClass,
                    occ: occLabel,
                    nombreUnidad: datos.nombreUnidad || `Unidad ${id.slice(-4).toUpperCase()}`,
                    conductorNombre: datos.conductor || datos.conductorNombre || 'Operador en Ruta'
                };
            }

            if (index === -1) return [...prev, finalData];
            const newVehicles = [...prev];
            newVehicles[index] = finalData;
            
            if (selectedVehicle?.id === id) setSelectedVehicle(finalData);
            return newVehicles;
        });
    };

    // Listeners de Avisos del Administrador
    useEffect(() => {
        if (!socket) return;
        
        socket.on('aviso_pasajero', (datos) => {
            disparar({
                tipo: 'info',
                titulo: 'Aviso Oficial',
                mensaje: datos.mensaje
            });
            setHasNewNotifications(true);
        });

        return () => socket.off('aviso_pasajero');
    }, [socket, disparar]);

    // Listeners de Unidades Reales
    useEffect(() => {
        if (!socket) return;
        socket.on('ubicacion_conductor', actualizarVehiculo);
        return () => socket.off('ubicacion_conductor');
    }, [socket, selectedVehicle]);


    // Cargar Rutas
    useEffect(() => {
        const fetchRutas = async () => {
            try {
                const res = await api.get('/rutas');
                setRutasDisponibles(res.data || []);
            } catch (e) { console.error("Error cargando rutas", e); }
        };
        if (token) fetchRutas();
    }, [token]);

    // Cargar Perfil y Favoritos
    const fetchPerfil = async () => {
        try {
            const res = await api.get('/usuarios/perfil');
            if (res.data?.data) {
                setPerfilCompleto(res.data.data);
                setRutasFavoritas(res.data.data.rutasFavoritas || []);
            }
        } catch (e) {
            console.error("Error cargando perfil", e);
        }
    };

    useEffect(() => {
        if (token) fetchPerfil();
    }, [token]);

    const handleVehicleClick = (v) => {
        if (selectedVehicle?.id === v.id) {
            setSelectedVehicle(null);
            setRouteLine([]);
            setParadas([]);
            return;
        }

        setSelectedVehicle(v);
        const rid = v.rutaId || v.id_ruta;
        const rutaInfo = rutasDisponibles.find(r => r._id.toString() === rid?.toString());

        if (rutaInfo) {
            if (rutaInfo.geometria) {
                setRouteLine(rutaInfo.geometria.map(p => [p.latitud, p.longitud]));
            }
            setParadas(rutaInfo.paradas || []);
            disparar({ tipo: 'exito', titulo: 'Ruta Detectada', mensaje: `Siguiendo: ${rutaInfo.nombre}` });
        }
    };

    const onLogout = () => {
        cerrarSesion();
        navigate("/LandingPage", { replace: true });
    };

    const handleToggleSuscripcion = async (rutaId) => {
        try {
            const res = await api.post('/usuarios/favoritos', { rutaId });
            if (res.data.status === 'exito') {
                const perfilRes = await api.get('/usuarios/perfil');
                setRutasFavoritas(perfilRes.data.data.rutasFavoritas || []);
                disparar({ 
                    tipo: 'exito', 
                    titulo: 'Suscripción Actualizada', 
                    mensaje: res.data.mensaje 
                });
            }
        } catch (e) {
            dispararError("No se pudo gestionar la suscripción");
        }
    };

    const handleVerRutaFavorita = (ruta) => {
        setIsProfileOpen(false);
        if (ruta.geometria) {
            setRouteLine(ruta.geometria.map(p => [p.latitud, p.longitud]));
        }
        setParadas(ruta.paradas || []);
        disparar({ 
            tipo: 'info', 
            titulo: 'Ruta Seleccionada', 
            mensaje: `Mostrando: ${ruta.nombre}` 
        });
    };

    return (
        <main className="flex flex-col h-screen w-screen relative bg-slate-50 overflow-hidden font-sans">

            <div className="flex-1 relative w-full h-full overflow-hidden">
                {activeTab === 'map' ? (
                    <>
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-[500] pointer-events-none">
                            <div
                                onClick={() => setIsProfileOpen(true)}
                                className="bg-white/80 backdrop-blur-xl p-2.5 rounded-full shadow-2xl pointer-events-auto flex items-center gap-3 pr-5 border border-white/40 cursor-pointer active:scale-95 transition-all"
                            >
                                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-sm">
                                    {userInitial}
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bienvenido</span>
                                    <span className="text-sm font-black text-slate-800">{username}</span>
                                </div>
                            </div>
                        </div>

                        <Mapa center={mapCenter} bounds={mapBounds} onMapClick={() => setSelectedVehicle(null)}>
                            <CapaGeometria routeLine={routeLine} unitPos={selectedVehicle?.pos} />
                            <CapaParadas stops={paradas} />
                            <CapaVehiculos vehicles={vehicles} selectedVehicleId={selectedVehicle?.id} onVehicleClick={handleVehicleClick} />
                        </Mapa>

                        {/* Motor de Simulación Modular */}
                        <SimPasajero 
                            socket={socket} 
                            rutas={rutasDisponibles} 
                            onUpdate={actualizarVehiculo} 
                        />

                        {/* PANEL EVOLUTIVO: Se activa automáticamente al seleccionar unidad */}
                        {selectedVehicle && (
                            <PanelRutaInteractiva
                                vehicle={selectedVehicle}
                                ruta={rutasDisponibles.find(r => r._id.toString() === (selectedVehicle?.rutaId || selectedVehicle?.id_ruta)?.toString())}
                                onReport={() => setIsReportModalOpen(true)}
                                onExpand={(state) => {
                                    if (state === 'full' && paradas.length > 0) {
                                        setMapBounds([selectedVehicle.pos, [paradas[paradas.length - 1].latitud, paradas[paradas.length - 1].longitud]]);
                                    }
                                }}
                            />
                        )}

                        <AlertaFlotante onClick={() => setIsReportModalOpen(true)} />
                    </>
                ) : activeTab === 'notifications' ? (
                    <ListaNotificaciones onNotifUpdate={setHasNewNotifications} />
                ) : (
                    <PanelAfluencia />
                )}
            </div>

            <Navbar
                rol="PASAJERO"
                activeTab={activeTab}
                hasNewNotifications={hasNewNotifications}
                onMapClick={() => setActiveTab('map')}
                onNotificationsClick={() => setActiveTab('notifications')}
                onAfluenciaClick={() => setActiveTab('afluencia')}
                onProfileClick={() => setIsProfileOpen(true)}
            />

            <PanelPerfil
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                usuario={{ ...perfilCompleto, role: 'PASAJERO' }}
                rutasFavoritas={rutasFavoritas}
                rutasDisponibles={rutasDisponibles}
                onToggleSuscripcion={handleToggleSuscripcion}
                onVerRutaFavorita={handleVerRutaFavorita}
                onEditarPerfil={() => setIsProfileEditOpen(true)}
                onLogout={onLogout}
            />

            <ModalPerfilPasajero 
                isOpen={isProfileEditOpen}
                onClose={() => setIsProfileEditOpen(false)}
                usuario={perfilCompleto || usuario}
                stats={{
                    viajes: 0, // Por ahora estático según diseño
                    favoritos: rutasFavoritas.length,
                    puntos: '—'
                }}
                onActualizar={fetchPerfil}
            />

            <ReporteModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                token={token}
            />
        </main>
    );
};

export default Pasajero;
