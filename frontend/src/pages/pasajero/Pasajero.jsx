import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../services/api";

// Componentes Comunes
import Mapa from "../../components/common/Mapa";
import Navbar from "../../components/common/Navbar";

// Componentes de Pasajero
import { useAlertaGlobal } from "../../context/AlertaContext";
import { useSocket } from "../../hooks/useSocket";
import ModalAlerta from "../../components/common/ModalAlerta";
import { obtenerRutaPorCalles } from "../../services/osrmService";
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

            // Actualizar vehículo seleccionado si es el que cambió
            if (selectedVehicle?.id === id) {
                setSelectedVehicle(finalData);
            }

            // LÓGICA DE ACTUALIZACIÓN DE ETA EN RADAR:
            // Si hay un radar activo para esta ruta, actualizamos su ETA
            setParadaDetectada(prevParada => {
                if (prevParada && (prevParada.ruta._id || prevParada.ruta.id).toString() === (finalData.rutaId || finalData.id_ruta)?.toString()) {
                    const d = calcularDistancia(finalData.pos[0], finalData.pos[1], prevParada.parada.latitud, prevParada.parada.longitud);
                    const nuevoEta = Math.max(1, Math.round(d / 300));
                    // Solo actualizar si el nuevo ETA es menor que el actual o si no había ETA
                    if (!prevParada.eta || nuevoEta < prevParada.eta) {
                        return { ...prevParada, eta: nuevoEta };
                    }
                }
                return prevParada;
            });

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

            // LÓGICA DE DESCUBRIMIENTO: Buscar paradas cercanas en todas las rutas
            const paradasCercanas = [];
            rutasDisponibles.forEach(ruta => {
                ruta.paradas?.forEach(parada => {
                    const d = calcularDistancia(userPos[0], userPos[1], parada.latitud, parada.longitud);
                    if (d <= 1000) { // Umbral de 1km
                        paradasCercanas.push({ parada, ruta, distancia: d });
                    }
                });
            });

            if (paradasCercanas.length > 0) {
                // Ordenar por distancia
                paradasCercanas.sort((a, b) => a.distancia - b.distancia);

                const idsSuscritos = rutasFavoritas.map(f => (f._id || f.id).toString());

                // Ya no filtramos por rutas no suscritas para permitir el ETA en rutas habituales
                const seleccionada = paradasCercanas[0];
                const { parada: paradaCercana, ruta: rutaAsociada } = seleccionada;

                // Contar rutas únicas cercanas (todas, incluso suscritas) para información
                const rutasUnicas = new Set(paradasCercanas.map(p => (p.ruta._id || p.ruta.id).toString()));
                const numRutas = rutasUnicas.size;

                const rid = (rutaAsociada._id || rutaAsociada.id).toString();
                const estaSuscrito = idsSuscritos.includes(rid);

                setParadaDetectada({
                    parada: paradaCercana,
                    ruta: rutaAsociada,
                    multiplesRutas: numRutas > 1 ? numRutas : null,
                    estaSuscrito
                });

                // Centrar para ver ambos: usuario y parada
                setMapBounds([[userPos[0], userPos[1]], [paradaCercana.latitud, paradaCercana.longitud]]);

                // Lógica de ETA mejorada (funciona para todas las rutas si hay unidades)
                let etaMinutos = null;
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

                setParadaDetectada(prev => ({ ...prev, eta: etaMinutos }));

                // Obtener trazado vial real (OSRM) de forma segura a través del servicio
                obtenerRutaPorCalles(
                    [[userPos[0], userPos[1]], [paradaCercana.latitud, paradaCercana.longitud]],
                    'walking'
                ).then(coords => {
                    setTrazoInvitacion(coords);
                });

                disparar({
                    tipo: 'info',
                    titulo: estaSuscrito ? 'Ruta Habitual' : (numRutas > 1 ? `${numRutas} Rutas Detectadas` : `Radar: Parada Detectada`),
                    mensaje: estaSuscrito ? `${paradaCercana.nombre} (En tu ruta)` : (numRutas > 1 ? `La más cercana es ${paradaCercana.nombre}` : `${paradaCercana.nombre}`)
                });
            } else {
                setParadaDetectada(null);
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
                            <CapaParadas
                                stops={paradas}
                                onStopClick={(p) => {
                                    // Si la parada tiene una ruta asociada (ej. del radar)
                                    if (p.ruta) {
                                        seleccionarRuta(p.ruta);
                                    } else if (selectedRoute) {
                                        // Si ya hay una ruta seleccionada, mantenemos esa
                                        seleccionarRuta(selectedRoute);
                                    }
                                }}
                            />
                            <CapaInvitacion
                                trazo={trazoInvitacion}
                                parada={paradaDetectada?.parada}
                                eta={paradaDetectada?.eta}
                                estaSuscrito={paradaDetectada?.estaSuscrito}
                                onParadaClick={() => {
                                    if (paradaDetectada?.ruta) {
                                        seleccionarRuta(paradaDetectada.ruta);
                                        setParadaDetectada(null);
                                    }
                                }}
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
                            onActivarAlerta={() => disparar({ tipo: 'info', titulo: 'Reportar Incidencia', mensaje: 'Para reportar, selecciona una unidad activa en el mapa.' })}
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
                                rutasFavoritas={rutasFavoritas}
                                onToggleSuscripcion={handleToggleSuscripcion}
                                onReport={() => {
                                    // El reporte ahora se gestiona internamente en PanelRutaInteractiva
                                }}
                                onClose={() => seleccionarRuta(null)}
                                onExpand={(state) => {
                                    if (state === 'full' && paradas.length > 0) {
                                        setMapBounds([(selectedVehicle?.pos || userPos), [paradas[paradas.length - 1].latitud, paradas[paradas.length - 1].longitud]]);
                                    }
                                }}
                            />
                        )}


                        {/* Banner de Invitación del Radar */}
                        {paradaDetectada && (
                            <div className="fixed top-30  z-[50] animate-in slide-in-from-top-1 duration-50">
                                <div
                                    onClick={() => {
                                        seleccionarRuta(paradaDetectada.ruta);
                                        setParadaDetectada(null);
                                    }}
                                    className={`bg-white/90 backdrop-blur-xl border ${paradaDetectada.estaSuscrito ? 'border-emerald-200 shadow-emerald-50' : 'border-blue-100 shadow-blue-50'} shadow-2xl rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white transition-all active:scale-[0.98]`}
                                >
                                    <div className={`w-12 h-12 ${paradaDetectada.estaSuscrito ? 'bg-emerald-600 shadow-emerald-100' : 'bg-blue-600 shadow-blue-100'} rounded-xl flex items-center justify-center text-white shadow-lg p-2.5`}>
                                        <img src="/parada_bus.svg" className="w-full h-full brightness-0 invert" alt="Ubicación" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`text-[10px] font-black ${paradaDetectada.estaSuscrito ? 'text-emerald-600' : 'text-blue-600'} uppercase tracking-widest leading-none`}>
                                                {paradaDetectada.estaSuscrito ? 'Ruta Habitual' : (paradaDetectada.multiplesRutas ? `${paradaDetectada.multiplesRutas} Rutas Cercanas` : 'Cerca de ti')}
                                            </p>
                                            {paradaDetectada.eta && (
                                                <span className={`${paradaDetectada.estaSuscrito ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'} text-[9px] font-black px-2 py-0.5 rounded-full border`}>
                                                    {paradaDetectada.eta} MIN
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-black text-slate-800 truncate">{paradaDetectada.parada.nombre}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">Ruta: {paradaDetectada.ruta.nombre}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setParadaDetectada(null);
                                            }}
                                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
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

        </main>
    );
};

export default Pasajero;
