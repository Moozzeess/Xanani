import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import api from "../../services/api";
import { io } from "socket.io-client";

import '../../styles/conductor.css';

import Navbar from '../../components/common/Navbar';
import Mapa from '../../components/common/Mapa';
import CapaGeometria from '../../components/common/mapa/CapaGeometria';
import CapaParadas from '../../components/common/mapa/CapaParadas';
import CapaVehiculos from '../../components/common/mapa/CapaVehiculos';
import ModoConduccion from '../../components/conductor/ModoConduccion';
import Reportes from '../../components/conductor/Reportes';
import ResumenViaje from '../../components/conductor/ResumenViaje';
import HistorialGeneral from '../../components/common/HistorialGeneral';
import PanelPerfil from '../../components/common/PanelPerfil';
import { NoRouteOverlay } from '../../components/conductor/IniciarFinalizar';
import { useConductorSimulation } from '../../simulations/conductorSimulation';
import { Bell, CheckCircle, MessageSquare, Trash2 } from 'lucide-react';
import ModalAlerta from '../../components/common/ModalAlerta';


/**
 * Pagina principal del conductor.
 *
 * Arquitectura de modos de conduccion:
 *
 * MODO SIMULACION (modoConduccion === 'simulacion'):
 *   - El hardware no esta disponible o el conductor eligio simular.
 *   - Posicion: viene de useConductorSimulation (interpolacion de la geometria de ruta).
 *   - Velocidad: aleatoria (35-44 km/h para que se vea dinamico).
 *   - Pasajeros / Capacidad / Asientos: valores del perfil, no se actualizan.
 *
 * MODO HARDWARE REAL (modoConduccion === 'hardware'):
 *   - El ESP32 envia telemetria via MQTT -> backend -> socket -> aqui.
 *   - TODA la informacion (pos, velocidad, pasajeros, cap, asientos) viene
 *     EXCLUSIVAMENTE del objeto telemetriaHardware.
 *   - Ningun otro estado puede sobreescribir los datos del hardware.
 *   - Si el hardware pierde conexion (30s sin datos), regresa a 'simulacion'.
 *
 * MODO ESPERA (viewMode === 'espera'):
 *   - El mapa muestra la geometria de la ruta asignada.
 *   - Se muestra NoRouteOverlay con boton para iniciar.
 */
const Conductor = () => {
  const navigate = useNavigate();
  const { cerrarSesion, token, usuario } = useAuth();

  // ─── Datos de ruta y asignacion ────────────────────────────────────────────
  const [routeLine, setRouteLine] = useState([]);
  const [paradas, setParadas] = useState([]);
  const [rawIds, setRawIds] = useState({ unidadId: null, rutaId: null, conductorProfileId: null });
  const [unidadActual, setUnidadActual] = useState('Sin Asignar');
  const [rutaActual, setRutaActual] = useState('Sin Ruta');
  const [profileData, setProfileData] = useState(null);

  // Capacidad y asientos del PERFIL (usados en simulacion como fallback)
  const [capacidadPerfil, setCapacidadPerfil] = useState(15);

  // ─── Control de vista ──────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('espera');

  // ─── Modo de conduccion activo ─────────────────────────────────────────────
  // Intención: fuente de verdad única que determina qué datos usar en la UI.
  // Valores: 'inactivo' | 'simulacion' | 'hardware'
  const [modoConduccion, setModoConduccion] = useState('inactivo');

  // ─── Telemetría del hardware (UNICA fuente de verdad en modo 'hardware') ───
  // Solo se actualiza desde el listener de datos_esp32.
  // Ningun otro efecto debe modificar estos valores.
  const [telemetriaHardware, setTelemetriaHardware] = useState({
    pos: null,         // [lat, lon] del GPS del ESP32
    velocidad: 0,      // km/h desde gps.spd
    pasajeros: 0,      // desde pasajeros.act (ocupados)
    capacidad: null,   // desde pasajeros.max (cap del hardware). null = aun no recibido
    asientos: []       // desde celdas (array de 0/1 por sensor)
  });

  // ─── Estado del hardware ───────────────────────────────────────────────────
  const [hardwareId, setHardwareId] = useState(null);
  const [isHardwareActive, setIsHardwareActive] = useState(false);
  const hardwareTimeoutRef = useRef(null);

  // ─── Socket ────────────────────────────────────────────────────────────────
  const [socket, setSocket] = useState(null);

  // Refs para retener datos en caso de pérdida de señal
  const socketRef = useRef(null);
  const rawIdsRef = useRef(rawIds);
  const telemetriaRef = useRef(telemetriaHardware);
  const recorridoIdRef = useRef(null);

  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { rawIdsRef.current = rawIds; }, [rawIds]);
  useEffect(() => { telemetriaRef.current = telemetriaHardware; }, [telemetriaHardware]);
  useEffect(() => { recorridoIdRef.current = recorridoId; }, [recorridoId]);

  // ─── Hook de simulacion ────────────────────────────────────────────────────
  // Solo activo cuando modoConduccion === 'simulacion'
  const {
    isTesting,
    setIsTesting,
    simulatedPosition,
    heading: simulatedHeading,
    siguienteParada: paradaSiguienteSimulada,
    resetSimulation
  } = useConductorSimulation(routeLine, paradas, viewMode === 'conduccion');

  // ─── Estados de UI ─────────────────────────────────────────────────────────
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [isSOS, setIsSOS] = useState(false);
  const wakeLockRef = useRef(null);

  // Velocimetro suavizado (solo simulacion — en hardware se usa telemetriaHardware.velocidad)
  const [targetSpeed, setTargetSpeed] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(0);

  // Estadisticas del viaje
  const [tripStats, setTripStats] = useState({
    timeStarted: null,
    pasajerosTotales: 0,
    ganancias: 0,
    kmRecorridos: 0,
    calificacion: 5.0
  });

  const [recorridoId, setRecorridoId] = useState(null);

  // ─── Valores derivados para la UI ──────────────────────────────────────────
  // Intencion: punto de acceso único para los datos que se muestran al conductor.
  // En modo hardware: datos del ESP32. En simulacion: datos del perfil/simulacion.
  const esHardwareActivo = modoConduccion === 'hardware';

  // Si hay hardware detectado y tiene coordenadas, usarlas siempre, incluso en pantalla de espera
  const posActual = (isHardwareActive && telemetriaHardware.pos)
    ? telemetriaHardware.pos
    : (isTesting ? simulatedPosition : null);

  // Si iniciamos un viaje real (recorridoId existe), retenemos la información del hardware 
  // aunque se pierda la señal (esHardwareActivo pase a false).
  const retenerInfoHardware = esHardwareActivo || (recorridoId !== null);

  const pasajerosMostrados = retenerInfoHardware
    ? telemetriaHardware.pasajeros
    : 0;

  // Capacidad: si el hardware ya envio su cap, usarlo. Si no, usar el del perfil.
  const capacidadMostrada = (retenerInfoHardware && telemetriaHardware.capacidad !== null)
    ? telemetriaHardware.capacidad
    : capacidadPerfil;

  const asientosMostrados = retenerInfoHardware
    ? telemetriaHardware.asientos
    : [];

  const velocidadMostrada = esHardwareActivo
    ? telemetriaHardware.velocidad
    : displaySpeed;

  // ─── Screen Wake Lock ──────────────────────────────────────────────────────
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && viewMode === 'conduccion') {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Screen Wake Lock liberado');
          });
        } catch (err) {
          console.error(`Error al activar Wake Lock: ${err.name}, ${err.message}`);
        }
      }
    };
    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
    if (viewMode === 'conduccion') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && viewMode === 'conduccion') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewMode]);

  // ─── Velocimetro suavizado (SOLO simulacion) ───────────────────────────────
  // Intencion: efecto visual de aguja de velocimetro para el modo simulacion.
  // En hardware real, velocidadMostrada = telemetriaHardware.velocidad (directa).
  useEffect(() => {
    if (viewMode !== 'conduccion' || esHardwareActivo) return;
    const interval = setInterval(() => {
      setDisplaySpeed(prev => {
        if (prev === targetSpeed) return prev;
        const diff = targetSpeed - prev;
        const step = Math.sign(diff) * Math.max(1, Math.floor(Math.abs(diff) * 0.15));
        const next = prev + step;
        return (diff > 0 && next > targetSpeed) || (diff < 0 && next < targetSpeed) ? targetSpeed : next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [targetSpeed, viewMode, esHardwareActivo]);

  // Velocidad aleatoria solo en modo simulacion (no en hardware)
  useEffect(() => {
    if (isTesting && !esHardwareActivo && viewMode === 'conduccion') {
      const interval = setInterval(() => {
        setTargetSpeed(Math.floor(Math.random() * 10) + 35);
      }, 3000);
      return () => clearInterval(interval);
    } else if (!isTesting || viewMode !== 'conduccion') {
      setTargetSpeed(0);
      setDisplaySpeed(0);
    }
  }, [isTesting, esHardwareActivo, viewMode]);

  // ─── Inicializar Socket ────────────────────────────────────────────────────
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:4000`);
    setSocket(newSocket);

    // Unirse al canal personal del usuario como respaldo ante reconexiones
    newSocket.on('connect', () => {
      if (usuario?._id) {
        newSocket.emit('suscribir_usuario', String(usuario._id));
      }
    });

    return () => newSocket.disconnect();
  }, []);

  // ─── Cargar asignacion de ruta y unidad ───────────────────────────────────
  useEffect(() => {
    const cargarAsignacion = async () => {
      try {
        const res = await api.get('/conductores/perfil', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { conductor } = res.data.data;
        if (conductor && conductor.rutaAsignadaId) {
          setProfileData(conductor);

          const unidadInfo = conductor.unidadAsignada;
          setUnidadActual(unidadInfo?.placa || conductor.unidad || 'Sin Unidad');

          // Capacidad del perfil: solo se usa en simulacion como valor inicial
          const capPerfil = unidadInfo?.capacidadMaxima || unidadInfo?.capacidad || 15;
          setCapacidadPerfil(capPerfil);

          setRutaActual(conductor.rutaAsignadaId?.nombre || 'Sin Ruta');
          setRawIds({
            unidadId: unidadInfo?._id || null,
            rutaId: conductor.rutaAsignadaId?._id || null,
            conductorProfileId: conductor._id
          });

          // Extraer ID de hardware para monitoreo en tiempo real.
          // Evaluamos la ultimaConexion reportada por el broker MQTT (se actualiza
          // en la BD con cada paquete recibido). Si fue hace menos de 30s, el
          // hardware se considera activo instantáneamente al cargar la página.
          const hw = unidadInfo?.dispositivoHardware;
          const hwId = hw?.Id_Dispositivo_Hardware;
          if (hwId) {
            setHardwareId(hwId);
            const esReciente = hw.ultimaConexion &&
              (Date.now() - new Date(hw.ultimaConexion).getTime()) < 30000;
            setIsHardwareActive(esReciente);
          }

          // Mapear paradas
          let paradasMapeadas = [];
          if (conductor.rutaAsignadaId.paradas && Array.isArray(conductor.rutaAsignadaId.paradas)) {
            paradasMapeadas = conductor.rutaAsignadaId.paradas.map(p => ({
              ...p,
              latitud: parseFloat(p.latitud !== undefined ? p.latitud : p.lat),
              longitud: parseFloat(p.longitud !== undefined ? p.longitud : (p.long || p.lng || p.lon))
            })).filter(p => !isNaN(p.latitud) && !isNaN(p.longitud));
            setParadas(paradasMapeadas);
          }

          // Mapear geometria con fallback a paradas
          const geometriaOriginal = conductor.rutaAsignadaId.geometria || [];
          let geometriaValidada = geometriaOriginal.map(p => {
            const lat = parseFloat(p.latitud !== undefined ? p.latitud : p.lat);
            const lng = parseFloat(p.longitud !== undefined ? p.longitud : (p.long || p.lng || p.lon));
            return [lat, lng];
          }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

          if (geometriaValidada.length === 0 && paradasMapeadas.length > 0) {
            console.warn('Geometría vacía detectada, usando paradas como respaldo.');
            geometriaValidada = paradasMapeadas.map(p => [p.latitud, p.longitud]);
          }

          if (geometriaValidada.length > 0) {
            setRouteLine(prev => {
              if (JSON.stringify(prev) === JSON.stringify(geometriaValidada)) return prev;
              return geometriaValidada;
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar asignación:', error);
      }
    };

    if (token) cargarAsignacion();
  }, [token, usuario]);

  // ─── Listener de Telemetría del Hardware (FUENTE PRINCIPAL DE DATOS REALES) ─
  // Intencion: detectar en tiempo real si el broker esta enviando datos del
  // dispositivo asignado. La activacion de isHardwareActive ocurre con CUALQUIER
  // paquete recibido del hardware (no solo cuando hay GPS valido).
  //
  // Reglas:
  //   - ACTIVO: cuando se recibe un paquete del hardware en el broker (cualquier dato).
  //   - INACTIVO: cuando pasan 30 segundos sin recibir ningun paquete del hardware.
  //   - El temporizador de inactividad se reinicia con cada paquete recibido.
  //   - La actualizacion de telemetriaHardware solo ocurre con GPS valido (con=true).
  useEffect(() => {
    if (!socket || !hardwareId) return;

    // Funcion para suscribirse a las salas correctas
    const suscribirCanales = () => {
      socket.emit('suscribir_dispositivo', hardwareId);
      if (usuario?._id) {
        socket.emit('suscribir_usuario', String(usuario._id));
      }
    };

    // Suscribir inmediatamente si ya esta conectado, y re-suscribir si hay reconexion
    if (socket.connected) {
      suscribirCanales();
    }
    socket.on('connect', suscribirCanales);

    const manejarDatosHardware = (data) => {
      const payload = data.payload;

      // Filtro: ignorar eventos de otros dispositivos
      if (!payload || String(payload.id) !== String(hardwareId)) return;

      // ACTIVAR inmediatamente al recibir cualquier paquete del hardware.
      // Esto actualiza el indicador visual en NoRouteOverlay en tiempo real.
      setIsHardwareActive(true);

      // Reiniciar temporizador de inactividad.
      // INACTIVO se activa si pasan 30s sin recibir ningun paquete.
      if (hardwareTimeoutRef.current) {
        clearTimeout(hardwareTimeoutRef.current);
      }
      hardwareTimeoutRef.current = setTimeout(() => {
        // Sin paquetes por 30s = dispositivo apagado o sin conexion al broker
        setIsHardwareActive(false);
        // Si la ruta estaba en modo hardware, regresar a simulacion manteniendo info
        setModoConduccion(prev => {
          if (prev === 'hardware') {
            setIsTesting(true);
            
            // Si estábamos en un viaje real, avisamos al admin de la pérdida de señal
            if (recorridoIdRef.current && socketRef.current) {
              const lastPos = telemetriaRef.current.pos;
              socketRef.current.emit('reporte_incidencia', {
                conductorId: rawIdsRef.current.conductorProfileId,
                unidadId: rawIdsRef.current.unidadId,
                tipo: 'PÉRDIDA_SEÑAL',
                descripcion: 'La unidad perdió conexión. El conductor mantendrá la información de pasajeros localmente hasta finalizar.',
                ubicacion: lastPos ? { latitud: lastPos[0], longitud: lastPos[1] } : null
              });
              
              setTimeout(() => {
                addToastNotification('Señal Perdida', 'Se guardó tu último estado y se avisó al administrador.', 'alert');
              }, 0);
            }
            
            return 'simulacion';
          }
          return prev;
        });
        console.log(`Hardware ${hardwareId}: sin datos por 30s → inactivo.`);
      }, 30000);

      // Actualizar telemetria de forma atomica con los datos del paquete
      setTelemetriaHardware(prev => {
        const nueva = { ...prev };

        // GPS: solo actualizar posicion si el fix es valido (gps.con === true)
        // Un fix invalido (con=false) no sobreescribe la ultima posicion conocida
        if (payload.gps && payload.gps.con === true && payload.gps.lat !== 0 && payload.gps.lon !== 0) {
          nueva.pos = [payload.gps.lat, payload.gps.lon];
          nueva.velocidad = Math.round(payload.gps.spd ?? 0);

          // Cambiar al modo hardware real cuando hay GPS valido
          setModoConduccion(prev => {
            if (prev !== 'hardware') {
              setIsTesting(false);
              return 'hardware';
            }
            return prev;
          });
        }

        // Pasajeros y capacidad desde el hardware
        if (payload.pasajeros) {
          if (payload.pasajeros.act !== undefined) {
            nueva.pasajeros = payload.pasajeros.act;
          }
          if (payload.pasajeros.max !== undefined && payload.pasajeros.max > 0) {
            nueva.capacidad = payload.pasajeros.max;
          }
        }

        // Asientos: array de sensores (1=ocupado, 0=libre)
        if (payload.celdas && payload.celdas.length > 0) {
          nueva.asientos = payload.celdas;
        }

        return nueva;
      });
    };

    socket.on('datos_esp32', manejarDatosHardware);

    return () => {
      socket.off('connect', suscribirCanales);
      socket.off('datos_esp32', manejarDatosHardware);
      socket.emit('desuscribir_dispositivo', hardwareId);
      if (hardwareTimeoutRef.current) {
        clearTimeout(hardwareTimeoutRef.current);
      }
    };
  }, [socket, hardwareId]);

  // ─── Listener de ubicacion_conductor (respaldo del backend) ───────────────
  // Intencion: recibir la ubicacion procesada por el backend cuando este emite
  // ubicacion_conductor directamente desde la telemetria MQTT (isBackground=true).
  // REGLA: NUNCA actualiza capacidad (evita el echo que restablecia el valor del perfil).
  useEffect(() => {
    if (!socket || !rawIds.unidadId) return;

    const manejarUbicacion = (datos) => {
      const esEstaConductora = String(datos.id) === String(rawIds.unidadId)
        || String(datos.conductorId) === String(rawIds.conductorProfileId);

      // Solo procesar si viene del backend (isBackground=true) y es este conductor
      if (!esEstaConductora || datos.isBackground !== true) return;

      setIsHardwareActive(true);

      if (datos.pos && datos.pos[0] !== 0 && datos.pos[1] !== 0) {
        setTelemetriaHardware(prev => ({
          ...prev,
          pos: datos.pos,
          velocidad: datos.velocidad !== undefined ? Math.round(datos.velocidad) : prev.velocidad,
          pasajeros: datos.ocupacionActual !== undefined ? datos.ocupacionActual : prev.pasajeros
        }));
        setModoConduccion(prev => {
          if (prev !== 'hardware') {
            setIsTesting(false);
            return 'hardware';
          }
          return prev;
        });
      }
    };

    socket.on('ubicacion_conductor', manejarUbicacion);
    return () => socket.off('ubicacion_conductor', manejarUbicacion);
  }, [socket, rawIds.unidadId, rawIds.conductorProfileId]);

  // ─── Emision de ubicacion en tiempo real ──────────────────────────────────
  // Intencion: el conductor emite su posicion al servidor para que el administrador
  // y los pasajeros puedan verla en el mapa.
  // En modo hardware: usa las coordenadas reales del ESP32.
  // En modo simulacion: usa la posicion interpolada de la simulacion.
  useEffect(() => {
    if (!socket || viewMode !== 'conduccion') return;
    if (!posActual) return;

    socket.emit('ubicacion_conductor', {
      id: rawIds.unidadId || 'test-bus',
      placa: unidadActual,
      pos: posActual,
      rutaId: rawIds.rutaId,
      conductorId: rawIds.conductorProfileId,
      isSimulated: modoConduccion === 'simulacion',
      isBackground: false,
      ocupacionActual: pasajerosMostrados,
      capacidadMaxima: capacidadMostrada,
      flotilla: usuario?.flotilla || profileData?.flotilla || 'ESCOM',
      estado: isSOS ? 'sos' : (modoConduccion === 'simulacion' ? 'simulado' : 'en_ruta')
    });
  }, [posActual, modoConduccion, socket, viewMode, rawIds, unidadActual, pasajerosMostrados, capacidadMostrada]);

  // ─── Listeners de avisos del administrador ────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('aviso_conductor', (datos) => {
      addToastNotification('Aviso de Administración', datos.mensaje, 'info');
      setNotifUnreadCount(prev => prev + 1);
      if (viewMode === 'avisos') cargarNotificaciones();
    });

    socket.on('notificacion_sistema', (datos) => {
      addToastNotification('Xanani', datos.mensaje, 'info');
      setNotifUnreadCount(prev => prev + 1);
      if (viewMode === 'avisos') cargarNotificaciones();
    });

    return () => {
      socket.off('aviso_conductor');
      socket.off('notificacion_sistema');
    };
  }, [socket, viewMode]);

  // ─── Cargar Notificaciones ─────────────────────────────────────────────────
  const cargarNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.data;
      const mapped = data.map(n => ({
        id: n._id,
        title: n.titulo,
        message: n.mensaje,
        type: n.tipo === 'ADVERTENCIA' ? 'alert' : 'info',
        leida: n.leida,
        fecha: n.createdAt
      }));
      setNotificaciones(mapped);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'avisos') {
      cargarNotificaciones();
      setNotifUnreadCount(0);
    }
  }, [viewMode]);

  // ─── Manejadores de acciones ───────────────────────────────────────────────
  const onLogout = () => {
    cerrarSesion();
    navigate('/LandingPage', { replace: true });
  };

  const addToastNotification = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotificaciones(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  const handleCloseResumen = () => {
    setViewMode('espera');
    setNotificaciones([]);
    resetSimulation();
    setModoConduccion('inactivo');
    setTelemetriaHardware({ pos: null, velocidad: 0, pasajeros: 0, capacidad: null, asientos: [] });
  };

  const handleTriggerSOS = () => {
    addToastNotification('SOS Registrado', 'Autoridades alertadas discretamente.', 'alert');
    setIsSOS(true);
    if (socket) {
      socket.emit('reporte_incidencia', {
        conductorId: rawIds.conductorProfileId || usuario?._id,
        unidadId: rawIds.unidadId,
        tipo: 'SOS',
        descripcion: 'Botón de pánico activado por el conductor.',
        ubicacion: posActual ? { latitud: posActual[0], longitud: posActual[1] } : null
      });
    }
  };

  const handleFastReport = () => setIsReportModalOpen(true);

  const handleSubmitReport = (tipo) => {
    addToastNotification('Reporte Enviado', `Se ha marcado un evento de "${tipo}" en tu ubicación.`, 'info');
    if (socket) {
      socket.emit('reporte_incidencia', {
        conductorId: rawIds.conductorProfileId || usuario?._id,
        unidadId: rawIds.unidadId,
        tipo: tipo,
        descripcion: `Incidencia de ${tipo} reportada por el conductor.`,
        ubicacion: posActual ? { latitud: posActual[0], longitud: posActual[1] } : null
      });
    }
    setIsReportModalOpen(false);
  };

  const removeNotification = async (id) => {
    if (typeof id === 'number') {
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
      return;
    }
    try {
      await api.patch(`/notificaciones/${id}/leida`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    }
  };

  /**
   * Inicia el recorrido en el modo detectado automaticamente.
   * VERDE (isHardwareActive) -> 'hardware'
   * AZUL  (!isHardwareActive) -> 'simulacion'
   */
  const handleStartRoute = () => {
    ejecutarInicioRuta(isHardwareActive ? 'hardware' : 'simulacion');
  };

  /**
   * Inicia el recorrido en el modo indicado.
   * @param {'hardware'|'simulacion'} modo - Modo a activar.
   */
  const ejecutarInicioRuta = async (modo) => {
    setIsSOS(false);
    setViewMode('conduccion');
    setModoConduccion(modo);
    setIsTesting(modo === 'simulacion');
    setTripStats({
      timeStarted: Date.now(),
      pasajerosTotales: 0,
      ganancias: 0,
      kmRecorridos: 0,
      calificacion: parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1))
    });

    if (modo === 'hardware') {
      try {
        const res = await api.post('/recorridos/iniciar', {
          conductorId: rawIds.conductorProfileId,
          unidadId: rawIds.unidadId,
          rutaId: rawIds.rutaId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecorridoId(res.data.recorrido._id);
        addToastNotification('¡Buen viaje!', 'Tu recorrido ha comenzado y se registrará al finalizar.', 'info');
      } catch (error) {
        console.error('Error al iniciar recorrido real:', error);
        addToastNotification('Aviso', 'Hubo un problema al iniciar tu recorrido, intenta de nuevo.', 'alert');
      }
    }
  };

  const handleStopRoute = async () => {
    resetSimulation();
    setIsSOS(false);
    const timeEnded = Date.now();
    const durationMs = timeEnded - (tripStats.timeStarted || timeEnded);
    const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));
    
    // Generar datos aproximados para el resumen (permitir 0 para probar descartes)
    const kmCalculados = parseFloat((Math.random() * 20 + 5).toFixed(1));
    const califCalculada = parseFloat((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1));
    const pasajerosCalculados = Math.floor(Math.random() * 30); // Puede ser 0
    const gananciasCalculadas = parseFloat((pasajerosCalculados * 8.5).toFixed(2));

    const nuevasEstadisticas = {
      ...tripStats,
      kmRecorridos: kmCalculados,
      calificacion: califCalculada,
      pasajerosTotales: pasajerosCalculados,
      ganancias: gananciasCalculadas,
      tiempoMinutos: durationMinutes
    };

    if (modoConduccion === 'hardware' && recorridoId) {
      try {
        if (nuevasEstadisticas.pasajerosTotales < 1) {
          // Descartar el viaje si no hubo pasajeros
          await api.delete(`/recorridos/cancelar/${recorridoId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          addToastNotification('Recorrido descartado', 'Como no hubo pasajeros, este viaje no se guardará en tu historial.', 'info');
        } else {
          // Guardar el viaje si hubo al menos un pasajero
          await api.put(`/recorridos/finalizar/${recorridoId}`, {
            pasajerosTotales: nuevasEstadisticas.pasajerosTotales,
            ganancias: nuevasEstadisticas.ganancias,
            kmRecorridos: nuevasEstadisticas.kmRecorridos,
            calificacion: nuevasEstadisticas.calificacion,
            observaciones: 'Ruta finalizada con éxito'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          addToastNotification('¡Viaje terminado!', 'Buen trabajo, tu viaje ya está en tu historial.', 'info');
        }
        setRecorridoId(null);
      } catch (error) {
        console.error('Error al manejar el recorrido real:', error);
        addToastNotification('Aviso', 'Hubo un problema al procesar el cierre de tu viaje.', 'alert');
      }
    }

    setViewMode('resumen');
    setModoConduccion('inactivo');
    setTripStats(nuevasEstadisticas);
  };

  // ─── Centro del mapa y posicion del marcador ──────────────────────────────
  // Prioridad: hardware activo > simulacion > primer punto de ruta > CDMX
  const centroMapa = posActual
    || (routeLine && routeLine.length > 0 ? routeLine[0] : [19.4326, -99.1332]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0f172a] font-sans">

      {/* MAPA BASE (Omnipresente) */}
      <div className="absolute inset-0 z-0">
        <Mapa
          center={centroMapa}
          tileTheme="standard"
          zoom={viewMode === 'conduccion' ? 18 : 16}
          followDuration={viewMode === 'conduccion' ? 0.3 : 1.5}
        >
          <CapaGeometria routeLine={routeLine} isDashed={false} />
          <CapaParadas stops={paradas} />
          <CapaVehiculos
            vehicles={[{
              id: 'self',
              pos: centroMapa,
              color: 'bg-emerald-500',
              text: 'text-white',
              eta: 'Tú',
              // Rotacion solo en simulacion (en hardware el GPS no da heading directamente)
              rotation: modoConduccion === 'simulacion' ? simulatedHeading : 0
            }]}
            selectedVehicleId="self"
          />
        </Mapa>
      </div>

      {/* CAPAS DE UI (Sobre el mapa) */}
      <div className="relative z-10 h-full w-full pointer-events-none">

        {/* VISTA DE ESPERA */}
        {viewMode === 'espera' && (
          <div className="pointer-events-auto h-full w-full bg-slate-900/40 backdrop-blur-[2px]">
            <NoRouteOverlay
              onStart={handleStartRoute}
              onLogout={onLogout}
              unidadAsignada={unidadActual}
              rutaDefecto={rutaActual}
              isHardwareActive={isHardwareActive}
            />
          </div>
        )}

        {/* VISTA DE CONDUCCION (HUD Inmersivo) */}
        {viewMode === 'conduccion' && (
          <ModoConduccion
            pasajeros={pasajerosMostrados}
            capacidad={capacidadMostrada}
            seats={asientosMostrados}
            notificaciones={notificaciones}
            onRemoveNotificacion={removeNotification}
            onOpenReportes={handleFastReport}
            onTriggerSOS={handleTriggerSOS}
            onStopRoute={handleStopRoute}
            siguienteParada={paradaSiguienteSimulada}
            velocidad={String(velocidadMostrada)}
            tiempoRestante="12"
            esSimulacion={modoConduccion === 'simulacion'}
          />
        )}

        {/* VISTA DE RESUMEN */}
        {viewMode === 'resumen' && (
          <div className="pointer-events-auto h-full w-full flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
            <ResumenViaje
              estadisticas={tripStats}
              onClose={handleCloseResumen}
            />
          </div>
        )}

        {/* VISTA DE AVISOS */}
        {viewMode === 'avisos' && (
          <div className="pointer-events-auto h-full w-full bg-[#0f172a] p-6 overflow-y-auto">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-6 h-6 text-blue-400" />
                  Avisos y Reportes
                </h1>
                <p className="text-slate-400 text-sm">Mensajes del administrador y estado de incidencias.</p>
              </div>
            </header>

            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-100 text-sm">Sistema Operativo</h4>
                  <p className="text-blue-200/70 text-xs">No hay incidencias críticas reportadas en tu ruta actual.</p>
                  <span className="text-[10px] text-blue-400 mt-1 block">Ahora</span>
                </div>
              </div>

              <div className="border-b border-white/10 my-6"></div>

              <h3 className="font-bold text-white/80 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Historial de Avisos
              </h3>

              {notificaciones.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Bell className="w-12 h-12 text-white/10 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No tienes avisos o notificaciones pendientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificaciones.map((n) => (
                    <div key={n.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-start pointer-events-auto">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{n.title}</span>
                        </div>
                        <p className="text-sm text-slate-200 mt-1">{n.message}</p>
                      </div>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Marcar como leído"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => notificaciones.forEach(n => removeNotification(n.id))}
                    className="w-full py-4 text-xs font-bold text-slate-400 hover:text-white transition-colors border-t border-white/5 pointer-events-auto"
                  >
                    Limpiar todos los avisos
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewMode('espera')}
              className="fixed bottom-24 right-6 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-[100] font-bold active:scale-95 transition-transform"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {/* VISTA DE HISTORIAL */}
        {viewMode === 'historial' && (
          <div className="pointer-events-auto h-full w-full bg-[#0f172a]">
            <HistorialGeneral rol="CONDUCTOR" />
            <button
              onClick={() => setViewMode('espera')}
              className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-[100]"
            >
              Volver al Mapa
            </button>
          </div>
        )}

        {/* MODAL DE REPORTES */}
        <Reportes
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleSubmitReport}
        />
      </div>

      {/* NAVBAR (Solo en modo espera o historial) */}
      {(viewMode === 'espera' || viewMode === 'historial') && (
        <div className="pointer-events-auto">
          <Navbar
            rol="CONDUCTOR"
            onCenterLocation={handleStartRoute}
            isHardwareActive={isHardwareActive}
            onAfluenciaClick={() => setViewMode('historial')}
            onNotificationsClick={() => setViewMode('avisos')}
            onMapClick={() => setViewMode('espera')}
            onProfileClick={() => setIsProfileOpen(true)}
            activeTab={
              viewMode === 'espera' ? 'map' :
                viewMode === 'historial' ? 'afluencia' :
                  viewMode === 'avisos' ? 'notifications' :
                    isProfileOpen ? 'profile' : ''
            }
            hasNewNotifications={notifUnreadCount}
          />
        </div>
      )}

      {/* PANEL DE PERFIL */}
      <PanelPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        usuario={usuario}
        conductorData={profileData}
        onLogout={onLogout}
      />

      {/* MODAL DE SIMULACION AUTOMATICA */}
      <ModalAlerta
        mostrar={showSimModal}
        tipo="advertencia"
        titulo="Hardware no detectado"
        mensaje={`La unidad ${unidadActual} se encuentra offline. Se iniciará el recorrido en modo de simulación para mantener el servicio activo.`}
        alCerrar={() => ejecutarInicioRuta('simulacion')}
      />
    </div>
  );
};

export default Conductor;
