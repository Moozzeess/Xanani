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
import NavbarPasajero from "../../components/pasajero/NavbarPasajero";
import PanelDescubrimiento from "../../components/pasajero/PanelDescubrimiento";
import CapaUsuario from "../../components/common/mapa/CapaUsuario";
import CapaInvitacion from "../../components/common/mapa/CapaInvitacion";
import { X, Navigation, MapPin, Clock, Bus, User, Star, ChevronUp, ChevronDown, Flag } from 'lucide-react';

// Función Helper para distancia Haversine
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3; // Metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

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
    const [unidadIdParaReportar, setUnidadIdParaReportar] = useState(null);
    const [userPos, setUserPos] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [paradaDetectada, setParadaDetectada] = useState(null);
    const [trazoInvitacion, setTrazoInvitacion] = useState([]);
    const [mostrarRadar, setMostrarRadar] = useState(false);
    const [filtros, setFiltros] = useState({});

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
                // 1. Determinar el número real de asientos y ocupados
                // Se limita a un máximo de 15 según requerimiento de diseño, o se usa el valor configurado
                const totalAsientos = Math.min(datos.capacidadMaxima || 15, 15);
                const pct = (datos.ocupacionActual / totalAsientos) * 100;
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

    // Solicitar Simulación Automáticamente
    useEffect(() => {
        if (socket) {
            socket.emit('solicitar_simulacion');
        }
    }, [socket]);

    // Geolocalización Inicial
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = [pos.coords.latitude, pos.coords.longitude];
                    setUserPos(coords);
                    setMapCenter(coords);
                },
                (err) => console.warn("Geolocalización denegada", err)
            );
        }
    }, []);

    // Listeners de Avisos del Administrador
    useEffect(() => {
        if (!socket) return;

        // Unirse a la sala privada del usuario para recibir alertas segmentadas
        if (usuario?._id) {
            socket.emit('suscribir_usuario', usuario._id);
        }

        socket.on('aviso_pasajero', (datos) => {
            // SEGURIDAD: Validar si la notificación es global o específica para este usuario
            if (datos.usuarioDestino && datos.usuarioDestino !== usuario?._id) {
                return; // Ignorar si no es para nosotros
            }

            disparar({
                tipo: datos.tipo || 'info',
                titulo: datos.titulo || 'Aviso Oficial',
                mensaje: datos.mensaje
            });
            setHasNewNotifications(true);
        });

        return () => socket.off('aviso_pasajero');
    }, [socket, disparar, usuario]);

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
            setSelectedRoute(rutaInfo);
            disparar({ tipo: 'exito', titulo: 'Ruta Detectada', mensaje: `Siguiendo: ${rutaInfo.nombre}` });
        }
    };

    // Función unificada para seleccionar y cargar una ruta
    const seleccionarRuta = (ruta) => {
        setTrazoInvitacion([]); // Limpiar trazo de invitación al seleccionar una ruta
        if (!ruta) {
            setSelectedRoute(null);
            setSelectedVehicle(null);
            setRouteLine([]);
            setParadas([]);
            return;
        }

        setSelectedRoute(ruta);
        
        // Cargar geometría si existe (asegurar que sea un array de coordenadas)
        if (ruta.geometria && Array.isArray(ruta.geometria)) {
            const coords = ruta.geometria[0]?.latitud 
                ? ruta.geometria.map(p => [p.latitud, p.longitud])
                : ruta.geometria; // Ya viene formateado
            setRouteLine(coords);
        } else {
            setRouteLine([]);
        }

        // Cargar paradas
        setParadas(ruta.paradas || []);

        // Calcular Bounds para hacer Zoom a la ruta completa
        if (ruta.paradas && ruta.paradas.length > 0) {
            const points = ruta.paradas.map(p => [parseFloat(p.latitud), parseFloat(p.longitud)]);
            setMapBounds(points);
        } else if (ruta.geometria && ruta.geometria.length > 0) {
            const points = ruta.geometria[0]?.latitud 
                ? ruta.geometria.map(p => [p.latitud, p.longitud])
                : ruta.geometria;
            setMapBounds(points);
        }

        disparar({
            tipo: 'info',
            titulo: 'Ruta Seleccionada',
            mensaje: `Mostrando: ${ruta.nombre}`
        });
    };

    const handleCentrarUsuario = () => {
        if (userPos) {
            setMapCenter([...userPos]);
            setMostrarRadar(true);
            setTimeout(() => setMostrarRadar(false), 3000); // El radar desaparece tras 3s
            
            // LÓGICA DE DESCUBRIMIENTO: Buscar parada más cercana
            let paradaCercana = null;
            let rutaAsociada = null;
            let minDist = 1000; // Umbral de 1km

            rutasDisponibles.forEach(ruta => {
                ruta.paradas?.forEach(parada => {
                    const d = calcularDistancia(userPos[0], userPos[1], parada.latitud, parada.longitud);
                    if (d < minDist) {
                        minDist = d;
                        paradaCercana = parada;
                        rutaAsociada = ruta;
                    }
                });
            });

            if (paradaCercana && rutaAsociada) {
                // Centrar para ver ambos: usuario y parada
                setMapBounds([[userPos[0], userPos[1]], [paradaCercana.latitud, paradaCercana.longitud]]);
                setParadaDetectada({ parada: paradaCercana, ruta: rutaAsociada });

                // Lógica de ETA: Solo si el usuario ya está suscrito a esta ruta
                const rid = (rutaAsociada._id || rutaAsociada.id).toString();
                const estaSuscrito = rutasFavoritas.some(f => (f._id || f.id).toString() === rid);
                
                let etaMinutos = null;
                if (estaSuscrito) {
                    const unidadesEnRuta = vehicles.filter(v => (v.rutaId || v.id_ruta)?.toString() === rid);
                    if (unidadesEnRuta.length > 0) {
                        let minDistUnidad = Infinity;
                        unidadesEnRuta.forEach(u => {
                            const d = calcularDistancia(u.pos[0], u.pos[1], paradaCercana.latitud, paradaCercana.longitud);
                            if (d < minDistUnidad) {
                                minDistUnidad = d;
                            }
                        });
                        // Estimación simple: 300 metros por minuto
                        etaMinutos = Math.max(1, Math.round(minDistUnidad / 300));
                    }
                }

                setParadaDetectada(prev => ({ ...prev, eta: etaMinutos }));
                
                // Obtener trazado vial real (OSRM)
                fetch(`https://router.project-osrm.org/route/v1/walking/${userPos[1]},${userPos[0]};${paradaCercana.longitud},${paradaCercana.latitud}?overview=full&geometries=geojson`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.routes?.[0]?.geometry?.coordinates) {
                            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                            setTrazoInvitacion(coords);
                        }
                    })
                    .catch(err => console.error("Error obteniendo ruta peatonal:", err));

                disparar({
                    tipo: 'info',
                    titulo: `Radar: Parada Detectada`,
                    mensaje: `${paradaCercana.nombre}`
                });
            } else {
                setTrazoInvitacion([]);
                disparar({ 
                    tipo: 'info', 
                    titulo: 'Radar: Búsqueda Finalizada', 
                    mensaje: `No hay paradas en un radio de 1km.` 
                });
            }
        } else {
            dispararError("Ubicación no disponible", "Asegúrate de dar permisos de geolocalización");
        }
    };

    const handleCentrarEnParada = (parada) => {
        setMapCenter([parada.latitud, parada.longitud]);
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
        seleccionarRuta(ruta);
        setIsProfileOpen(false);
        setActiveTab('map');
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

                        <Mapa center={mapCenter} bounds={mapBounds} onMapClick={() => seleccionarRuta(null)}>
                            <CapaGeometria routeLine={routeLine} unitPos={selectedVehicle?.pos} />
                            <CapaParadas stops={paradas} />
                            <CapaInvitacion 
                                trazo={trazoInvitacion} 
                                parada={paradaDetectada?.parada} 
                                eta={paradaDetectada?.eta}
                            />
                            <CapaVehiculos vehicles={vehicles} selectedVehicleId={selectedVehicle?.id} onVehicleClick={handleVehicleClick} />
                            {userPos && <CapaUsuario posicion={userPos} radio={mostrarRadar ? 1000 : 0} />}
                        </Mapa>

                        {/* Radar de Descubrimiento */}
                        <PanelDescubrimiento
                            totalUnidades={vehicles.length}
                            sinUnidades={vehicles.length === 0}
                            filtros={filtros}
                            onCambiarFiltros={setFiltros}
                            onActivarAlerta={() => setIsReportModalOpen(true)}
                        />

                        {/* Motor de Simulación Modular */}
                        <SimPasajero
                            socket={socket}
                            rutas={rutasDisponibles}
                            rutasSuscritas={rutasFavoritas.map(r => (r._id || r.id).toString())}
                            onUpdate={actualizarVehiculo}
                        />

                        {/* PANEL EVOLUTIVO: Se activa al seleccionar unidad o ruta */}
                        {(selectedVehicle || selectedRoute) && (
                            <PanelRutaInteractiva
                                vehicle={selectedVehicle}
                                ruta={selectedRoute || rutasDisponibles.find(r => r._id.toString() === (selectedVehicle?.rutaId || selectedVehicle?.id_ruta)?.toString())}
                                onReport={() => {
                                    setUnidadIdParaReportar(selectedVehicle?.id || selectedVehicle?._id);
                                    setIsReportModalOpen(true);
                                }}
                                onClose={() => seleccionarRuta(null)}
                                onExpand={(state) => {
                                    if (state === 'full' && paradas.length > 0) {
                                        setMapBounds([(selectedVehicle?.pos || userPos), [paradas[paradas.length - 1].latitud, paradas[paradas.length - 1].longitud]]);
                                    }
                                }}
                            />
                        )}

                        <AlertaFlotante onClick={() => setIsReportModalOpen(true)} />

                        {/* Banner de Invitación del Radar */}
                        {paradaDetectada && (
                            <div className="fixed top-24 left-4 right-4 z-[600] animate-in slide-in-from-top-10 duration-500">
                                <div className="bg-white/90 backdrop-blur-xl border border-blue-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Cerca de ti</p>
                                        <p className="text-sm font-black text-slate-800 truncate">{paradaDetectada.parada.nombre}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Ruta: {paradaDetectada.ruta.nombre}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                seleccionarRuta(paradaDetectada.ruta);
                                                setParadaDetectada(null);
                                            }}
                                            className="px-4 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg active:scale-95 transition-all"
                                        >
                                            Ver ruta
                                        </button>
                                        <button
                                            onClick={() => setParadaDetectada(null)}
                                            className="p-2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'notifications' ? (
                    <ListaNotificaciones onNotifUpdate={setHasNewNotifications} />
                ) : (
                    <PanelAfluencia onDiscover={() => setActiveTab('map')} />
                )}
            </div>

            <NavbarPasajero
                tabActivo={activeTab === 'map' ? 'mapa' : activeTab === 'notifications' ? 'alertas' : (activeTab === 'afluencia' ? 'rutas' : 'perfil')}
                onCambiarTab={(tab) => {
                    if (tab === 'mapa') setActiveTab('map');
                    else if (tab === 'alertas') setActiveTab('notifications');
                    else if (tab === 'rutas') setActiveTab('afluencia');
                    else if (tab === 'perfil') setIsProfileOpen(true);
                }}
                onCentrarUbicacion={handleCentrarUsuario}
                badgeAlertas={hasNewNotifications ? 1 : 0}
            />

            <PanelPerfil
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                usuario={{ ...perfilCompleto, role: 'PASAJERO' }}
                rutasFavoritas={rutasFavoritas}
                rutasDisponibles={rutasDisponibles}
                onToggleSuscripcion={handleToggleSuscripcion}
                onVerRutaFavorita={(r) => {
                    setIsProfileOpen(false);
                    setActiveTab('map');
                    seleccionarRuta(r);
                }}
                onVerRuta={(ruta) => {
                    setIsProfileOpen(false);
                    setActiveTab('map');
                    seleccionarRuta(ruta);
                }}
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
                onClose={() => { setIsReportModalOpen(false); setUnidadIdParaReportar(null); }}
                unidadId={unidadIdParaReportar}
                rutaId={selectedRoute?._id || selectedVehicle?.rutaId}
                token={token}
            />
        </main>
    );
};

export default Pasajero;
