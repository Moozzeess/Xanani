import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronUp, X, MapPin, Bus, Star, Flag, Route, User, Bell, Eye, Navigation } from 'lucide-react';
import ModalExperiencia from './ModalExperiencia';

/**
 * Tutorial Interactivo basado en Tooltips (Real-time).
 * Busca elementos en el DOM y se posiciona relativo a ellos.
 * Permite interacciones reales en cada botón (la "magia").
 */
const TutorialPasajero = ({ onClose }) => {
    const [paso, setPaso] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const overlayRef = useRef(null);

    // Definición de la máquina de estados del tutorial
    const pasos = [
        {
            titulo: 'Seleccionar Combi',
            descripcion: '¡Hola! Para comenzar, localiza la combi morada de prueba en el mapa y tócala para ver sus detalles en tiempo real.',
            targetId: 'tour-combi-mapa',
            icono: <Navigation size={20} className="text-blue-500 rotate-90" />,
            accion: 'Toca la combi',
            esperarClic: true,
            ocultarAlInteractuar: false
        },
        {
            titulo: 'Panel Interactivo',
            descripcion: 'Aquí verás los detalles de la unidad en curso. Puedes seguir su recorrido y tiempo estimado.',
            targetId: null, 
            icono: <Bus size={20} className="text-blue-500" />,
            accion: 'Siguiente',
            esperarClic: false
        },
        {
            titulo: 'Guardar Ruta',
            descripcion: 'Toca el icono para guardar esta ruta de prueba.',
            targetId: 'tour-suscribir',
            icono: <Star size={20} className="text-blue-500" />,
            accion: 'Toca la estrella',
            esperarClic: true, // Avanza al hacer clic en el elemento real
            ocultarAlInteractuar: false
        },
        {
            titulo: 'Expandir Panel',
            descripcion: '¡Excelente! Toca el borde superior o la flecha de la barra gris para expandir el panel y ver el mapa de asientos.',
            targetId: 'tour-expandir-panel',
            icono: <ChevronUp size={20} className="text-blue-500" />,
            accion: 'Toca para expandir',
            esperarClic: true,
            ocultarAlInteractuar: false
        },
        {
            titulo: 'Asientos',
            descripcion: 'Aquí verás la ocupación en tiempo real y la distribución de los asientos de la unidad.',
            targetId: 'tour-asientos',
            icono: <User size={20} className="text-blue-500" />,
            accion: 'Siguiente',
            esperarClic: false,
            fallbackTarget: 'tour-suscribir'
        },
        {
            titulo: 'Próximas Paradas',
            descripcion: 'Toca cualquiera de las paradas próximas para centrar el mapa sobre ella y ver su ubicación exacta.',
            targetId: 'tour-parada-itinerario',
            icono: <MapPin size={20} className="text-blue-500" />,
            accion: 'Toca la parada',
            esperarClic: true,
            ocultarAlInteractuar: false,
            fallbackTarget: 'tour-asientos'
        },
        {
            titulo: 'Reportar',
            descripcion: 'Presiona la barra gris y desliza hacia abajo para encontrar la bandera de reporte. Envía uno de prueba.',
            targetId: 'tour-reportar',
            icono: <Flag size={20} className="text-blue-500" />,
            accion: 'Toca la bandera',
            esperarClic: true, 
            ocultarAlInteractuar: true, // Oculta el tooltip mientras el usuario llena el reporte
            eventoEspera: 'tutorial_reporte_enviado', // Avanza cuando el componente hijo dispara este evento
            fallbackTarget: 'tour-suscribir'
        },
        {
            titulo: 'Calificar Viaje',
            descripcion: 'Evalúa tu experiencia al finalizar tu viaje.',
            targetId: null,
            icono: <Star size={20} className="text-blue-500" />,
            accion: '',
            esperarClic: false,
            showRateModal: true, // flag custom para mostrar ModalExperiencia
            hideCard: true // No mostramos el tooltip, solo el modal
        },
        {
            titulo: 'Cerrar Panel',
            descripcion: 'Cerraremos este panel de ruta para pasar a explorar otras operaciones. Presiona la "X" arriba a la derecha.',
            targetId: 'tour-cerrar-panel',
            icono: <X size={20} className="text-blue-500" />,
            accion: 'Toca la X',
            esperarClic: true,
            ocultarAlInteractuar: false
        },
        {
            titulo: 'Estadísticas',
            descripcion: 'Revisa la afluencia de tus rutas favoritas.',
            targetId: 'tab-pasajero-rutas',
            icono: <Route size={20} className="text-blue-500" />,
            accion: 'Ver Rutas',
            esperarClic: true,
            isLast: false 
        },
        {
            titulo: 'Panel Afluencia',
            descripcion: 'Aquí verás los horarios con mayor demanda de tus rutas guardadas.',
            targetId: 'tour-graficas',
            icono: <Route size={20} className="text-blue-500" />,
            accion: 'Siguiente',
            esperarClic: false,
            isLast: false
        },
        {
            titulo: 'Notificaciones',
            descripcion: 'Recibe avisos sobre bloqueos, desvíos, entre otros eventos.',
            targetId: 'tab-pasajero-alertas',
            icono: <Bell size={20} className="text-blue-500" />,
            accion: 'Ver Alertas',
            esperarClic: true
        },
        {
            titulo: 'Opciones de Perfil',
            descripcion: 'Abre tu perfil para gestionar todo tu historial y preferencias.',
            targetId: 'tab-pasajero-perfil',
            icono: <User size={20} className="text-blue-500" />,
            accion: 'Abre tu perfil',
            esperarClic: true
        },
        {
            titulo: 'Descubrir Rutas',
            descripcion: 'Desde tu perfil puedes ver y suscribirte a nuevas rutas de tu preferencia.',
            targetId: 'tour-descubrir-rutas',
            icono: <Eye size={20} className="text-blue-500" />,
            accion: 'Siguiente',
            esperarClic: false,
            fallbackTarget: 'tab-pasajero-perfil'
        },
        {
            titulo: 'Radar Automático',
            descripcion: 'Este botón centra el mapa y busca paradas cercanas a tu ubicación.',
            targetId: 'btn-centrar-ubicacion',
            icono: <Navigation size={20} className="text-blue-500" />,
            accion: 'Activar Radar',
            esperarClic: true,
            isLast: false
        },
        {
            titulo: '¡Todo Listo!',
            descripcion: '¡Felicidades! Has completado el tutorial. Disfruta de la aplicación Xanani y viaja de forma inteligente.',
            targetId: null,
            icono: <Star size={20} className="text-yellow-500 fill-yellow-500" />,
            accion: '¡Comenzar!',
            esperarClic: false,
            isLast: true
        }
    ];

    const pasoActual = pasos[paso];

    // Helper para buscar elementos en el DOM por ID o clase
    const getEl = (id) => {
        if (!id) return null;
        if (id.startsWith('.') || id.startsWith('#')) return document.querySelector(id);
        return document.getElementById(id) || document.querySelector(`.${id}`);
    };

    // Tracker para ubicar el elemento en la pantalla
    useEffect(() => {
        const updateRect = () => {
            if (!pasoActual.targetId) {
                setTargetRect(prev => prev === null ? null : null);
                return;
            }

            let el = getEl(pasoActual.targetId);
            if (!el && pasoActual.fallbackTarget) {
                el = getEl(pasoActual.fallbackTarget);
            }

            if (el) {
                const newRect = el.getBoundingClientRect();
                setTargetRect(prev => {
                    if (prev && 
                        prev.top === newRect.top && 
                        prev.left === newRect.left && 
                        prev.width === newRect.width && 
                        prev.height === newRect.height) {
                        return prev; // Mantiene la misma referencia en memoria para evitar re-renderizados
                    }
                    return {
                        top: newRect.top,
                        bottom: newRect.bottom,
                        left: newRect.left,
                        right: newRect.right,
                        width: newRect.width,
                        height: newRect.height
                    };
                });
            } else {
                setTargetRect(prev => prev === null ? null : null);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        
        // Polling suave
        const interval = setInterval(updateRect, 300);
        
        return () => {
            window.removeEventListener('resize', updateRect);
            clearInterval(interval);
        };
    }, [paso, pasoActual]);

    // Listener para avanzar haciendo clic en los botones REALES (la magia)
    useEffect(() => {
        if (!pasoActual.esperarClic || !pasoActual.targetId) return;

        const el = getEl(pasoActual.targetId);
        if (!el) return;

        const handleInteraction = () => {
            if (pasoActual.ocultarAlInteractuar) {
                setIsInteracting(true);
            }
            
            // Si no esperamos un evento externo para avanzar, avanzamos de inmediato en el clic
            if (!pasoActual.eventoEspera) {
                // Pequeño delay para que se vea la animación del botón real
                setTimeout(() => {
                    if (pasoActual.isLast) {
                        onClose();
                    } else {
                        setPaso(p => p + 1);
                    }
                }, 400);
            }
        };

        el.addEventListener('click', handleInteraction);
        return () => el.removeEventListener('click', handleInteraction);
    }, [paso, pasoActual, onClose]);

    // Listener para eventos complejos (ej. Reporte enviado)
    useEffect(() => {
        if (!pasoActual.eventoEspera) return;

        const handleEvent = () => {
            setIsInteracting(false); // Volvemos a mostrar el tooltip si estaba oculto
            if (pasoActual.isLast) {
                onClose();
            } else {
                setPaso(p => p + 1);
            }
        };

        window.addEventListener(pasoActual.eventoEspera, handleEvent);
        return () => window.removeEventListener(pasoActual.eventoEspera, handleEvent);
    }, [paso, pasoActual, onClose]);


    const siguientePaso = () => {
        if (paso < pasos.length - 1) {
            setPaso(paso + 1);
        } else {
            onClose();
        }
    };

    // Calcular posición del tooltip asegurando que no se salga de la pantalla ni se encime al navbar
    let tooltipStyle = {};
    if (targetRect && pasoActual.targetId !== 'mapa-container') {
        const isTopHalf = targetRect.top < window.innerHeight / 2;
        const tooltipWidth = 260; // Max width aproximado
        
        // Clampeamos el valor left para que no se salga por la derecha ni por la izquierda
        let safeLeft = targetRect.left;
        if (safeLeft + tooltipWidth > window.innerWidth - 10) {
            safeLeft = window.innerWidth - tooltipWidth - 10;
        }
        if (safeLeft < 10) safeLeft = 10;

        // Márgenes seguros para el header/navbar
        const SAFE_TOP = 80;
        const SAFE_BOTTOM = 90;

        // Calculamos top/bottom con límites
        let safeTop = isTopHalf ? targetRect.bottom + 10 : 'auto';
        let safeBottom = !isTopHalf ? window.innerHeight - targetRect.top + 10 : 'auto';

        if (isTopHalf) {
            // Limitamos que el top no baje más allá de la zona segura del navbar inferior
            safeTop = `${Math.min(targetRect.bottom + 10, window.innerHeight - SAFE_BOTTOM - 150)}px`;
        } else {
            // Limitamos que el bottom no suba más allá de la zona segura superior
            safeBottom = `${Math.min(window.innerHeight - targetRect.top + 10, window.innerHeight - SAFE_TOP - 150)}px`;
        }

        tooltipStyle = {
            position: 'absolute',
            left: `${safeLeft}px`,
            top: safeTop,
            bottom: safeBottom,
            zIndex: 3010
        };
    } else {
        tooltipStyle = {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3010
        };
    }

    return (
        <div ref={overlayRef} className="fixed inset-0 z-[3000] pointer-events-none transition-opacity duration-300">
            {/* Fondo semi-transparente. pointer-events-none permite interacción real con la app. */}
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300 pointer-events-none ${isInteracting || pasoActual.hideCard || (pasoActual.targetId === 'tour-combi-mapa' && !targetRect) ? 'opacity-0' : 'opacity-100'}`}
                style={
                    targetRect && !isInteracting
                    ? {
                        clipPath: `polygon(
                            0% 0%, 0% 100%, ${targetRect.left - 4}px 100%, ${targetRect.left - 4}px ${targetRect.top - 4}px,
                            ${targetRect.right + 4}px ${targetRect.top - 4}px, ${targetRect.right + 4}px ${targetRect.bottom + 4}px,
                            ${targetRect.left - 4}px ${targetRect.bottom + 4}px, ${targetRect.left - 4}px 100%, 100% 100%, 100% 0%
                        )`
                    } : {}
                }
            />

            {/* Borde brillante sobre el elemento real */}
            {targetRect && !isInteracting && !pasoActual.hideCard && (
                <div 
                    className="absolute border-2 border-blue-400 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.6)] pointer-events-none transition-all duration-300 animate-pulse"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8
                    }}
                />
            )}

            {/* Tooltip Card */}
            {!isInteracting && !pasoActual.hideCard && (
                <div 
                    className="bg-white/95 backdrop-blur-xl border border-white shadow-xl rounded-2xl w-[90vw] max-w-[260px] max-h-[80vh] overflow-y-auto overflow-x-hidden pointer-events-auto transition-all duration-500"
                    style={tooltipStyle}
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-10"
                        title="Omitir tutorial"
                    >
                        <X size={14} />
                    </button>

                    <div className="p-4 flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shadow-inner border border-blue-100 shrink-0">
                                {pasoActual.icono}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 leading-tight">
                                {pasoActual.titulo}
                            </h3>
                        </div>
                        
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                            {pasoActual.descripcion}
                        </p>

                        <div className="w-full flex items-center justify-between mt-auto">
                            <div className="flex gap-1">
                                {pasos.map((_, i) => (
                                    <div 
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === paso ? 'w-4 bg-blue-600' : 'w-1.5 bg-blue-200'}`}
                                    />
                                ))}
                            </div>

                            {!pasoActual.esperarClic ? (
                                <button
                                    onClick={siguientePaso}
                                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                                >
                                    {pasoActual.accion}
                                    {paso < pasos.length - 1 && <ChevronRight size={14} />}
                                </button>
                            ) : (
                                <div className="py-1.5 px-2 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg flex items-center gap-1 animate-pulse">
                                    {pasoActual.accion}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Experiencia Simulado para el Tutorial */}
            {pasoActual.showRateModal && (
                <div className="pointer-events-auto">
                    <ModalExperiencia
                        isOpen={true}
                        isTutorialMode={true}
                        unidad={{ placa: 'TUTORIAL-01' }}
                        onClose={() => setPaso(p => p + 1)} // Avanza si omiten
                        onCalificar={() => {
                            setTimeout(() => setPaso(p => p + 1), 2500);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default TutorialPasajero;
