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
import UbicacionModal from "../../components/common/UbicacionModal";

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
import TutorialPasajero from "../../components/pasajero/TutorialPasajero";
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
    const [notifKey, setNotifKey] = useState(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [rutasDisponibles, setRutasDisponibles] = useState([]);
    const [rutasFavoritas, setRutasFavoritas] = useState([]);
    const [historialViajes, setHistorialViajes] = useState([]);
    const [perfilCompleto, setPerfilCompleto] = useState(null);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [routeLine, setRouteLine] = useState([]);
    const [paradas, setParadas] = useState([]);
    const [mapCenter, setMapCenter] = useState([19.4326, -99.1332]);
    const [mapZoom, setMapZoom] = useState(15);
    const [mapBounds, setMapBounds] = useState(null);
    const [notificacionesLocales, setNotificacionesLocales] = useState([]);
    const [notifUnreadCount, setNotifUnreadCount] = useState(0);
    const [userPos, setUserPos] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [paradaDetectada, setParadaDetectada] = useState(null);
    const [trazoInvitacion, setTrazoInvitacion] = useState([]);
    const [mostrarRadar, setMostrarRadar] = useState(false);
    const [filtros, setFiltros] = useState({});
    const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
    const [radarNotificado, setRadarNotificado] = useState(false);
    const [mostrarTutorial, setMostrarTutorial] = useState(false);

    const username = usuario?.username || 'Pasajero';
    const userInitial = username.charAt(0).toUpperCase();

    // Revisar si es la primera vez (registro nuevo)
    useEffect(() => {
        const isNew = sessionStorage.getItem('isNewRegistration');
        if (isNew === 'true') {
            setMostrarTutorial(true);
        }
    }, []);

    const cerrarTutorial = () => {
        setMostrarTutorial(false);
        sessionStorage.removeItem('isNewRegistration');
        // Limpiar el mock si existiera
        if (selectedVehicle?.id === 'TUTORIAL-UNIT') {
            setSelectedVehicle(null);
            seleccionarRuta(null);
        }
    };

    // Inyectar unidad simulada para el tutorial en la lista general de vehículos para que aparezca en el mapa
    useEffect(() => {
        if (mostrarTutorial && rutasDisponibles.length > 0) {
            const existeTutorialUnit = vehicles.some(v => v.id === 'TUTORIAL-UNIT');
            if (!existeTutorialUnit) {
                const mockRoute = rutasDisponibles[Math.floor(Math.random() * rutasDisponibles.length)];
                const pos = mockRoute.paradas?.[0] ? [mockRoute.paradas[0].latitud, mockRoute.paradas[0].longitud] : [19.4326, -99.1332];
                
                const mockVehicle = {
                    id: 'TUTORIAL-UNIT',
                    rutaId: mockRoute._id || mockRoute.id,
                    nombreUnidad: 'Unidad de Prueba (Tutorial)',
                    pos: pos,
                    ocupacionActual: 5,
                    capacidadMaxima: 15,
                    occ: 'Baja',
                    isSimulated: true,
                    conductorNombre: 'Guía Xanani',
                    indexParadaActual: 0,
                    color: 'bg-indigo-400'
                };

                setVehicles(prev => {
                    if (prev.some(v => v.id === 'TUTORIAL-UNIT')) return prev;
                    return [...prev, mockVehicle];
                });

                // CENTRAR MAPA EN LA UBICACIÓN DE LA COMBI DE PRUEBA
                setMapBounds(null); // Quitar cualquier bound previo para forzar el centrado
                setMapCenter(pos);
                setMapZoom(18); // Zoom más cercano para que la unidad sea muy visible
            }
        }
    }, [mostrarTutorial, rutasDisponibles, vehicles.length]);

    // Sincronización de UI guiada por el tutorial (Botón atrás)
    useEffect(() => {
        if (!mostrarTutorial) return;

        const handleForcePerfil = () => { setIsProfileOpen(true); setActiveTab('perfil'); };
        const handleForceAfluencia = () => { setIsProfileOpen(false); setActiveTab('afluencia'); };
        const handleForceAlertas = () => { setIsProfileOpen(false); setActiveTab('notifications'); };
        const handleForceMapa = () => { setIsProfileOpen(false); setActiveTab('map'); };
        const handleForcePanel = () => { 
            setIsProfileOpen(false); 
            setActiveTab('map'); 
            const tutorialUnit = vehicles.find(v => v.id === 'TUTORIAL-UNIT');
            if (tutorialUnit && selectedVehicle?.id !== 'TUTORIAL-UNIT') {
                setSelectedVehicle(tutorialUnit);
                const rutaInfo = rutasDisponibles.find(r => r._id.toString() === (tutorialUnit.rutaId || tutorialUnit.id_ruta)?.toString());
                if (rutaInfo) {
                    if (rutaInfo.geometria) {
                        setRouteLine(rutaInfo.geometria.map(p => [p.latitud, p.longitud]));
                    }
                    setParadas(rutaInfo.paradas || []);
                    setSelectedRoute(rutaInfo);
                }
            }
        };

        window.addEventListener('tutorial_force_perfil', handleForcePerfil);
        window.addEventListener('tutorial_force_afluencia', handleForceAfluencia);
        window.addEventListener('tutorial_force_alertas', handleForceAlertas);
        window.addEventListener('tutorial_force_mapa', handleForceMapa);
        window.addEventListener('tutorial_force_panel', handleForcePanel);

        return () => {
            window.removeEventListener('tutorial_force_perfil', handleForcePerfil);
            window.removeEventListener('tutorial_force_afluencia', handleForceAfluencia);
            window.removeEventListener('tutorial_force_alertas', handleForceAlertas);
            window.removeEventListener('tutorial_force_mapa', handleForceMapa);
            window.removeEventListener('tutorial_force_panel', handleForcePanel);
        };
    }, [mostrarTutorial, vehicles, selectedVehicle, rutasDisponibles]);

    // Función Unificada para Actualizar Unidades (Real o Sim)
    const actualizarVehiculo = (datos) => {
        setVehicles(prev => {
            const id = datos.id || datos.placa;
            const index = prev.findIndex(v => v.id === id);

            // Si es una actualización de una unidad real (con conductor) o simulación de conductor
            let finalData = { ...datos };
            if (!datos.isBackground) {
                let colorClass = 'bg-blue-400';
                let occLabel = 'Baja';
                // 1. Determinar el número real de asientos y ocupados
                // Se utiliza el valor real configurado de la unidad
                const totalAsientos = datos.capacidadMaxima || 15;
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

            let finalVehicles = [];
            if (index === -1) {
                finalVehicles = [...prev, finalData];
            } else {
                const newVehicles = [...prev];
                newVehicles[index] = finalData;
                finalVehicles = newVehicles;
            }

            // LÓGICA DE LIMPIEZA: Si esta es una unidad REAL (con conductor), eliminar cualquier simulación de fondo previa de esta ruta
            if (!finalData.isBackground) {
                const rid = finalData.rutaId || finalData.id_ruta;
                finalVehicles = finalVehicles.filter(v => 
                    !v.isBackground || (v.rutaId || v.id_ruta)?.toString() !== rid?.toString()
                );
            }

            // SALVAGUARDA DE TUTORIAL: Asegurar que el vehículo TUTORIAL-UNIT no se pierda por actualizaciones
            if (mostrarTutorial && !finalVehicles.some(v => v.id === 'TUTORIAL-UNIT')) {
                const tutorialUnit = prev.find(v => v.id === 'TUTORIAL-UNIT');
                if (tutorialUnit) {
                    finalVehicles.push(tutorialUnit);
                }
            }

            // Actualizar vehículo seleccionado si es el que cambió
            if (selectedVehicle?.id === id) {
                setSelectedVehicle(finalData);
            }

            return finalVehicles;

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

    // Obtener la ubicación directamente
    const obtenerUbicacion = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = [pos.coords.latitude, pos.coords.longitude];
                    setUserPos(coords);
                    
                    // Evitar que el mapa se mueva al usuario si el tutorial está corriendo
                    const isTutorialActive = sessionStorage.getItem('isNewRegistration') === 'true';
                    if (!isTutorialActive) {
                        setMapCenter(coords);
                    }
                },
                (err) => {
                    console.warn("Geolocalización denegada", err);
                    dispararError("Geolocalización denegada", "Debes otorgar permisos desde el navegador para usar esta función.");
                }
            );
        }
    };

    // Geolocalización Inicial controlada por modal
    useEffect(() => {
        if ("geolocation" in navigator) {
            if (navigator.permissions) {
                navigator.permissions.query({ name: 'geolocation' }).then(result => {
                    if (result.state === 'granted') {
                        obtenerUbicacion(); // Si ya dio permiso, la obtenemos directo
                    } else if (result.state === 'prompt') {
                        setIsUbicacionModalOpen(true); // Mostrar nuestro modal custom
                    } else {
                        console.warn("Permiso de geolocalización denegado previamente");
                    }
                }).catch(() => {
                    // Fallback si la query falla
                    setIsUbicacionModalOpen(true);
                });
            } else {
                // Fallback para navegadores sin navigator.permissions
                setIsUbicacionModalOpen(true);
            }
        }
    }, []);

    // Listeners de Avisos del Administrador
    useEffect(() => {
        if (!socket) return;

        // Unirse a la sala privada del usuario para recibir alertas segmentadas
        if (usuario?._id) {
            socket.emit('suscribir_usuario', usuario._id);
        }

        // Listener para avisos específicos de pasajero
        socket.on('aviso_pasajero', (datos) => {
            if (datos.usuarioDestino && datos.usuarioDestino !== usuario?._id) return;

            const nuevaNotif = {
                _id: Date.now().toString(),
                ...datos,
                createdAt: new Date().toISOString(),
                leida: false
            };

            setNotificacionesLocales(prev => [nuevaNotif, ...prev]);
            setNotifUnreadCount(prev => prev + 1);
        });

        // Listener para notificaciones generales del sistema (NUEVO)
        socket.on('notificacion_sistema', (datos) => {
            // Filtrar por usuario si es específico
            if (datos.usuarioDestino && datos.usuarioDestino !== usuario?._id) return;

            const nuevaNotif = {
                _id: Date.now().toString(),
                ...datos,
                createdAt: new Date().toISOString(),
                leida: false
            };

            setNotificacionesLocales(prev => [nuevaNotif, ...prev]);
            setNotifUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.off('aviso_pasajero');
            socket.off('notificacion_sistema');
        };
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

    // Detección automática en segundo plano de paradas cercanas
    useEffect(() => {
        if (!userPos || rutasDisponibles.length === 0 || radarNotificado || mostrarTutorial) return;

        const paradasCercanas = [];
        rutasDisponibles.forEach(ruta => {
            ruta.paradas?.forEach(parada => {
                const d = calcularDistancia(userPos[0], userPos[1], parada.latitud, parada.longitud);
                if (d <= 1000) {
                    paradasCercanas.push({ parada, ruta, distancia: d });
                }
            });
        });

        if (paradasCercanas.length > 0) {
            paradasCercanas.sort((a, b) => a.distancia - b.distancia);
            
            const idsSuscritos = rutasFavoritas.map(f => (f._id || f.id).toString());
            const paradasSuscritas = paradasCercanas.filter(p => idsSuscritos.includes((p.ruta._id || p.ruta.id).toString()));
            
            // Priorizar suscrita más cercana, si no hay, la más cercana general
            const seleccionada = paradasSuscritas.length > 0 ? paradasSuscritas[0] : paradasCercanas[0];
            const { parada: paradaMasCercana, ruta: rutaAsociada } = seleccionada;

            const rutasUnicas = new Set(paradasCercanas.map(p => (p.ruta._id || p.ruta.id).toString()));
            const numRutas = rutasUnicas.size;
            const totalParadas = paradasCercanas.length;

            let mensaje = `Se detectó la parada ${paradaMasCercana.nombre} cerca de tu ubicación.`;
            if (totalParadas > 1) {
                if (numRutas === 1) {
                    mensaje = `Se han detectado ${totalParadas} paradas de la misma ruta. Destacando: ${paradaMasCercana.nombre}`;
                } else {
                    if (paradasSuscritas.length > 0) {
                        mensaje = `Se ha detectado más de una parada de distinta ruta, priorizando ruta suscrita: ${paradaMasCercana.nombre}`;
                    } else {
                        mensaje = `Se ha detectado más de una parada de distinta ruta. Destacando: ${paradaMasCercana.nombre}`;
                    }
                }
            }

            setRadarNotificado(true); // Evitar re-notificar
            
            disparar({
                tipo: 'info',
                titulo: 'Radar Automático',
                mensaje: mensaje,
                textoAccion: 'Abrir Radar',
                onAccion: () => {
                    handleCentrarUsuario();
                }
            });
        }
    }, [userPos, rutasDisponibles, radarNotificado, disparar, rutasFavoritas]);

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
        if (token) {
            fetchPerfil();
            fetchHistorial();
        }
    }, [token]);

    const fetchHistorial = async () => {
        try {
            const res = await api.get('/reportes/usuario');
            if (Array.isArray(res.data)) {
                const reportes = res.data
                    .filter(r => r.tipo === 'EXPERIENCIA')
                    .map(r => ({
                        id: r._id,
                        placa: r.unidad?.placa || 'Unidad',
                        ruta: r.ruta?.nombre || '',
                        fecha: new Date(r.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
                        calificacion: r.calificacion
                    }));
                setHistorialViajes(reportes);
            }
        } catch (e) {
            console.error("Error cargando historial de viajes", e);
        }
    };

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

        // Centrado automático inteligente al seleccionar una ruta explícitamente
        const unidadesEnRuta = vehicles.filter(v => (v.rutaId || v.id_ruta)?.toString() === (ruta._id || ruta.id).toString());
        let posObjetivo = null;

        if (unidadesEnRuta.length > 0) {
            posObjetivo = unidadesEnRuta[0].pos;
        } else if (ruta.paradas && ruta.paradas.length > 0) {
            posObjetivo = [ruta.paradas[0].latitud, ruta.paradas[0].longitud];
        }

        if (posObjetivo) {
            const dist = userPos ? calcularDistancia(userPos[0], userPos[1], posObjetivo[0], posObjetivo[1]) : 0;
            if (dist > 3000) { // Si está a más de 3km, usamos flyTo (saltar)
                setMapBounds([[posObjetivo[0] - 0.01, posObjetivo[1] - 0.01], [posObjetivo[0] + 0.01, posObjetivo[1] + 0.01]]);
            } else {
                setMapCenter(posObjetivo);
                setMapZoom(17);
            }
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

            // LÓGICA DE DESCUBRIMIENTO: Buscar paradas cercanas en todas las rutas
            const paradasCercanas = [];
            rutasDisponibles.forEach(ruta => {
                ruta.paradas?.forEach(parada => {
                    const d = calcularDistancia(userPos[0], userPos[1], parada.latitud, parada.longitud);
                    if (d <= 500) { // Umbral de 1km
                        paradasCercanas.push({ parada, ruta, distancia: d });
                    }
                });
            });

            if (paradasCercanas.length > 0) {
                // Ordenar por distancia
                paradasCercanas.sort((a, b) => a.distancia - b.distancia);

                const idsSuscritos = rutasFavoritas.map(f => (f._id || f.id).toString());
                const paradasSuscritas = paradasCercanas.filter(p => idsSuscritos.includes((p.ruta._id || p.ruta.id).toString()));

                // Priorizar suscrita más cercana, si no, la más cercana general
                const seleccionada = paradasSuscritas.length > 0 ? paradasSuscritas[0] : paradasCercanas[0];
                const { parada: paradaCercana, ruta: rutaAsociada } = seleccionada;

                const rutasUnicas = new Set(paradasCercanas.map(p => (p.ruta._id || p.ruta.id).toString()));
                const numRutas = rutasUnicas.size;
                const totalParadas = paradasCercanas.length;

                const rid = (rutaAsociada._id || rutaAsociada.id).toString();
                const estaSuscrito = idsSuscritos.includes(rid);

                let tituloMensaje = '';
                let textoMensaje = '';

                if (totalParadas > 1) {
                    if (numRutas === 1) {
                        tituloMensaje = `${totalParadas} Paradas Cercanas`;
                        textoMensaje = `Se han detectado ${totalParadas} paradas de la misma ruta. Se fijó la más cercana: ${paradaCercana.nombre}`;
                    } else {
                        if (paradasSuscritas.length > 0) {
                            tituloMensaje = 'Múltiples Rutas';
                            textoMensaje = `Se ha detectado más de una parada de distinta ruta, priorizando ruta suscrita: ${paradaCercana.nombre}`;
                        } else {
                            tituloMensaje = 'Múltiples Rutas';
                            textoMensaje = `Se ha detectado más de una parada de distinta ruta. Se fijó la más cercana: ${paradaCercana.nombre}`;
                        }
                    }
                } else {
                    tituloMensaje = estaSuscrito ? 'Ruta Habitual' : 'Radar: Parada Detectada';
                    textoMensaje = estaSuscrito ? `${paradaCercana.nombre} (En tu ruta)` : `${paradaCercana.nombre}`;
                }

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
                    titulo: tituloMensaje,
                    mensaje: textoMensaje
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
        setMapBounds(null);
        setMapCenter([parada.latitud, parada.longitud]);
        setMapZoom(17);
        // Activamos el radar informativo para esa parada
        setParadaDetectada({
            parada,
            ruta: selectedRoute,
            estaSuscrito: rutasFavoritas.some(f => (f._id || f.id).toString() === (selectedRoute?._id || selectedRoute?.id).toString())
        });
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
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-white">
                                    <img src="/LOGO.png" className="w-full h-full object-contain" alt="Perfil" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bienvenido</span>
                                    <span className="text-sm font-black text-slate-800">{username}</span>
                                </div>
                            </div>
                        </div>

                        <Mapa center={mapCenter} zoom={mapZoom} bounds={mapBounds} allowManualUnlock={true} onMapClick={() => {
                            if (!mostrarTutorial) seleccionarRuta(null);
                        }}>
                            <CapaGeometria routeLine={routeLine} unitPos={selectedVehicle?.pos} />
                            <CapaParadas 
                                stops={selectedRoute?.paradas || []} 
                                selectedStopId={paradaDetectada?.parada?._id || paradaDetectada?.parada?.id}
                                onStopClick={(p) => {
                                    setMapBounds(null);
                                    setMapCenter([p.latitud, p.longitud]);
                                    setMapZoom(17);
                                    
                                    // Cálculo de ETA Real para la parada seleccionada
                                    let etaMin = null;
                                    const rid = (selectedRoute?._id || selectedRoute?.id)?.toString();
                                    const unidadesEnRuta = vehicles.filter(v => (v.rutaId || v.id_ruta)?.toString() === rid);
                                    
                                    if (unidadesEnRuta.length > 0) {
                                        let minDist = Infinity;
                                        unidadesEnRuta.forEach(u => {
                                            const d = calcularDistancia(u.pos[0], u.pos[1], p.latitud, p.longitud);
                                            if (d < minDist) minDist = d;
                                        });
                                        etaMin = Math.max(1, Math.round(minDist / 300));
                                    }

                                    setParadaDetectada({
                                        parada: p,
                                        ruta: selectedRoute,
                                        eta: etaMin,
                                        estaSuscrito: rutasFavoritas.some(f => (f._id || f.id).toString() === rid)
                                    });
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
                            {userPos && <CapaUsuario posicion={userPos} radio={mostrarRadar ? 200 : 0} />}
                        </Mapa>

                        {/* Radar de Descubrimiento */}
                        {!paradaDetectada && !selectedRoute && !selectedVehicle && (
                            <PanelDescubrimiento
                                totalUnidades={vehicles.length}
                                sinUnidades={vehicles.length === 0}
                                filtros={filtros}
                                onCambiarFiltros={setFiltros}
                                onActivarAlerta={() => disparar({ tipo: 'info', titulo: 'Reportar Incidencia', mensaje: 'Para reportar, selecciona una unidad activa en el mapa.' })}
                            />
                        )}

                        {/* Botón para cerrar Radar/Parada detectada */}
                        {paradaDetectada && (
                            <div className="absolute top-20 right-6 z-[600] animate-in fade-in zoom-in">
                                <button
                                    id="btn-cerrar-parada"
                                    onClick={() => {
                                        setParadaDetectada(null);
                                        setMostrarRadar(false);
                                    }}
                                    className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-xl border border-slate-200 text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all"
                                    title="Cerrar radar"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        )}

                        {/* Motor de Simulación Modular */}
                        <SimPasajero
                            socket={socket}
                            rutas={rutasDisponibles}
                            rutasSuscritas={rutasFavoritas.map(r => (r._id || r.id).toString())}
                            rutaSeleccionadaId={selectedRoute?._id}
                            vehicles={vehicles}
                            onUpdate={actualizarVehiculo}
                        />

                        {/* PANEL EVOLUTIVO: Se activa al seleccionar unidad o ruta */}
                        {(selectedVehicle || selectedRoute) && (
                            <PanelRutaInteractiva
                                isHidden={!!paradaDetectada}
                                isTutorialMode={mostrarTutorial}
                                vehicle={selectedVehicle}
                                ruta={selectedRoute || rutasDisponibles.find(r => r._id.toString() === (selectedVehicle?.rutaId || selectedVehicle?.id_ruta)?.toString())}
                                rutasFavoritas={rutasFavoritas}
                                onToggleSuscripcion={handleToggleSuscripcion}
                                onCentrarParada={handleCentrarEnParada}
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


                        {/* El Banner de Invitación ha sido eliminado según los requerimientos */}
                    </>
                ) : activeTab === 'notifications' ? (
                    <ListaNotificaciones 
                        key={notifKey}
                        notificacionesExternas={notificacionesLocales}
                        onNotifUpdate={(count) => setNotifUnreadCount(count)} 
                        suscripcionesIds={rutasFavoritas.map(r => r._id)}
                        onSuscribir={handleToggleSuscripcion}
                        onVerRuta={(id) => {
                            const r = rutasDisponibles.find(rd => rd._id === id);
                            if (r) {
                                seleccionarRuta(r);
                                setActiveTab('map');
                            }
                        }}
                    />
                ) : (
                    <PanelAfluencia onDiscover={() => setActiveTab('map')} />
                )}
            </div>

            <NavbarPasajero
                tabActivo={activeTab === 'map' ? 'mapa' : activeTab === 'notifications' ? 'alertas' : (activeTab === 'afluencia' ? 'rutas' : 'perfil')}
                onCambiarTab={(tab) => {
                    if (tab === 'mapa') setActiveTab('map');
                    else if (tab === 'alertas') {
                        setActiveTab('notifications');
                        setNotifUnreadCount(0);
                    }
                    else if (tab === 'rutas') setActiveTab('afluencia');
                    else if (tab === 'perfil') setIsProfileOpen(true);
                }}
                onCentrarUbicacion={handleCentrarUsuario}
                badgeAlertas={notifUnreadCount}
            />

            <PanelPerfil
                isOpen={isProfileOpen}
                isTutorialMode={mostrarTutorial}
                onClose={() => {
                    setIsProfileOpen(false);
                    if (mostrarTutorial) {
                        setActiveTab('map');
                    }
                }}
                usuario={{ ...perfilCompleto, role: 'PASAJERO' }}
                rutasFavoritas={rutasFavoritas}
                rutasDisponibles={rutasDisponibles}
                historial={historialViajes}
                onToggleSuscripcion={handleToggleSuscripcion}
                onVerRutaFavorita={(r) => {
                    if (mostrarTutorial) return;
                    setIsProfileOpen(false);
                    setActiveTab('map');
                    seleccionarRuta(r);
                }}
                onVerRuta={(ruta) => {
                    if (mostrarTutorial) return;
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
                    viajes: historialViajes.length,
                    favoritos: rutasFavoritas.length,
                    puntos: '—'
                }}
                onActualizar={fetchPerfil}
            />

            <UbicacionModal 
                isOpen={isUbicacionModalOpen}
                onClose={() => setIsUbicacionModalOpen(false)}
                onAccept={() => {
                    setIsUbicacionModalOpen(false);
                    obtenerUbicacion();
                }}
            />

            {mostrarTutorial && <TutorialPasajero onClose={cerrarTutorial} />}

        </main>
    );
};

export default Pasajero;
