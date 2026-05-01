import React, { useState, useRef, useEffect } from 'react';
import { Bus, Clock, MapPin, User, Star, ChevronUp, ChevronDown, Flag, X, OctagonAlert, Trash2, Shield, CheckCircle, AlertCircle, TriangleAlert } from 'lucide-react';
import MapaAsientos from './MapaAsientos';
import { useAlertaGlobal } from '../../context/AlertaContext';
import api from '../../services/api';

const TIPOS_INCIDENCIA = [
    { tipo: 'CONDUCCION_PELIGROSA', icono: OctagonAlert, etiqueta: 'Conducción peligrosa', color: 'hover:bg-red-50 hover:border-red-200 text-red-500' },
    { tipo: 'RETRASO', icono: Clock, etiqueta: 'Retraso', color: 'hover:bg-orange-50 hover:border-orange-200 text-orange-500' },
    { tipo: 'OTRO', icono: Trash2, etiqueta: 'Limpieza / otro', color: 'hover:bg-blue-50 hover:border-blue-200 text-blue-500' },
    { tipo: 'NO_PASO', icono: Shield, etiqueta: 'No pasó', color: 'hover:bg-purple-50 hover:border-purple-200 text-purple-500' },
];

/**
 * PanelRutaInteractiva (Versión Real-Time Premium)
 */
const PanelRutaInteractiva = ({ vehicle, ruta, rutasFavoritas = [], onToggleSuscripcion, onExpand, onReport, onClose }) => {
    const [viewState, setViewState] = useState('collapsed');
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
    const [descripcion, setDescripcion] = useState('');
    const [estadoReporte, setEstadoReporte] = useState('idle'); // idle | enviando | exito | error
    const { disparar, dispararError } = useAlertaGlobal();
    const scrollRef = useRef(null);

    // Efecto para subir el scroll al activar el reporte
    useEffect(() => {
        if (mostrarReporte && scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [mostrarReporte]);

    if (!ruta) {
        return (
            <div className="fixed inset-x-0 bottom-0 h-28 bg-white rounded-t-[40px] flex items-center justify-center shadow-2xl z-[2000]">
                <p className="text-slate-400 text-xs font-bold animate-pulse uppercase tracking-widest">Selecciona una ruta o unidad...</p>
            </div>
        );
    }

    const isSuscrito = rutasFavoritas.some(f => (f._id || f.id).toString() === (ruta._id || ruta.id).toString());
    const isInfoOnly = !vehicle;
    const vehicleData = vehicle || {
        id: `PREV-${ruta._id || ruta.id}`,
        nombreUnidad: 'Vista Previa de Ruta',
        pos: [ruta.paradas[0].latitud, ruta.paradas[0].longitud],
        ocupacionActual: 0,
        capacidadMaxima: 15,
        occ: 'Inactiva',
        isSimulated: false,
        conductorNombre: 'Sin Asignar',
        indexParadaActual: 0
    };

    const paradas = ruta.paradas || [];
    const indexActual = vehicleData.indexParadaActual || 0;

    // Función para calcular distancia entre coordenadas (Haversine)
    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371e3;
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

    const estimarMinutos = (distanciaMetros) => {
        const velocidadMPS = 22 / 3.6;
        const min = Math.ceil(distanciaMetros / velocidadMPS / 60);
        return min > 0 ? min : 1;
    };

    const paradasProximas = paradas.slice(indexActual, indexActual + 3);

    const handleToggle = () => {
        let next = 'collapsed';
        if (viewState === 'collapsed') next = 'half';
        else if (viewState === 'half') next = 'full';
        setViewState(next);
        onExpand?.(next);
    };

    const handleEnviarReporte = async () => {
        if (!tipoSeleccionado) {
            dispararError('Selecciona un tipo de incidencia', '', 'Reporte incompleto');
            return;
        }

        setEstadoReporte('enviando');
        try {
            // Función para validar si un string es un ObjectId de MongoDB válido
            const esObjectIdValido = (id) => /^[0-9a-fA-F]{24}$/.test(id);

            const unidadIdFinal = vehicleData._id && esObjectIdValido(vehicleData._id) 
                ? vehicleData._id 
                : (vehicleData.id && esObjectIdValido(vehicleData.id) ? vehicleData.id : null);
            
            const rutaIdFinal = ruta?._id && esObjectIdValido(ruta._id)
                ? ruta._id
                : (ruta?.id && esObjectIdValido(ruta?.id) ? ruta.id : null);

            await api.post('/reportes', {
                tipo: tipoSeleccionado,
                unidadId: unidadIdFinal,
                rutaId: rutaIdFinal,
                descripcion: descripcion.trim() || null
            });

            setEstadoReporte('exito');
            disparar({ tipo: 'exito', titulo: 'Reporte Enviado', mensaje: 'Gracias por ayudarnos a mejorar.' });

            setTimeout(() => {
                setEstadoReporte('idle');
                setTipoSeleccionado(null);
                setDescripcion('');
                setMostrarReporte(false);
            }, 2000);
        } catch (error) {
            setEstadoReporte('error');
            // Ocultar info técnica: Solo mostramos un mensaje genérico al usuario
            dispararError('No se pudo enviar el reporte', 'Inténtalo de nuevo en unos momentos.', 'Error de red');
            setTimeout(() => setEstadoReporte('idle'), 2000);
        }
    };

    const getPanelHeight = () => {
        if (viewState === 'collapsed') return 'h-28';
        if (viewState === 'half') return 'h-[55vh]';
        return 'h-[94vh]';
    };

    return (
        <div className={`fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] z-[2000] transition-all duration-500 ease-in-out flex flex-col ${getPanelHeight()}`}>

            {/* ESTADO 1: COLLAPSED (Telemetría Real) */}
            <div onClick={handleToggle} className="w-full pt-4 pb-4 px-8 shrink-0 cursor-pointer bg-white">
                <div className="w-14 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${vehicleData.isSimulated ? 'bg-indigo-600' : (isInfoOnly ? 'bg-slate-400' : 'bg-emerald-600')} rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100`}>
                            <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{ruta.nombre}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSuscripcion?.(ruta._id || ruta.id);
                                    }}
                                    className={`p-1 rounded-full transition-all ${isSuscrito ? 'text-amber-400 scale-110' : 'text-slate-300 hover:text-amber-300'}`}
                                    title={isSuscrito ? "Quitar de favoritos" : "Añadir a favoritos"}
                                >
                                    <Star className={`w-3.5 h-3.5 ${isSuscrito ? 'fill-amber-400' : ''}`} />
                                </button>
                            </div>
                            <h2 className="text-base font-black text-slate-800 leading-tight">{vehicleData.nombreUnidad}</h2>
                        </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs font-black text-emerald-700">
                                    {estimarMinutos(calcularDistancia(vehicleData.pos?.[0], vehicleData.pos?.[1], paradas[indexActual]?.latitud, paradas[indexActual]?.longitud))} MIN
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ETA Real-Time</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                            className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors pointer-events-auto"
                            title="Cerrar vista"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 pb-10 no-scrollbar">

                {/* SECCIÓN INTERACTIVA: MAPA Y REPORTE */}
                {(viewState === 'half' || viewState === 'full') && !isInfoOnly && (
                    <div className={`mt-4 grid gap-6 transition-all duration-500 ${mostrarReporte ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} animate-in fade-in slide-in-from-top-4`}>
                        <div className="flex justify-center">
                            <MapaAsientos
                                ocupacionActual={vehicleData.ocupacionActual}
                                capacidadMaxima={vehicleData.capacidadMaxima}
                                vehicleId={vehicleData.id}
                                ocupabilidad={vehicleData.occ}
                            />
                        </div>

                        {mostrarReporte && (
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <TriangleAlert className="w-3.5 h-3.5" /> Detalle de Incidencia
                                    </h3>
                                    <button onClick={() => setMostrarReporte(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {estadoReporte === 'exito' ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <p className="text-sm font-black text-slate-800 text-center">¡Reporte enviado!<br /><span className="text-[10px] text-slate-400 uppercase">Procesando información</span></p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TIPOS_INCIDENCIA.map(({ tipo, icono: Icono, etiqueta, color }) => (
                                                <button
                                                    key={tipo}
                                                    onClick={() => setTipoSeleccionado(tipo)}
                                                    className={`p-3 border rounded-2xl flex flex-col items-center gap-2 transition-all bg-white
                                                        ${tipoSeleccionado === tipo ? 'ring-2 ring-indigo-500 border-transparent scale-[0.98]' : 'border-slate-100 hover:border-indigo-200'}`}
                                                >
                                                    <div className={`p-2 rounded-xl ${tipoSeleccionado === tipo ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                                        <Icono className="w-4 h-4" />
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase text-center ${tipoSeleccionado === tipo ? 'text-indigo-600' : 'text-slate-500'}`}>{etiqueta}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <textarea
                                            value={descripcion}
                                            onChange={(e) => setDescripcion(e.target.value)}
                                            placeholder="¿Qué sucedió? (opcional)"
                                            maxLength={200}
                                            className="w-full text-xs font-bold border border-slate-100 rounded-2xl p-4 bg-white resize-none outline-none focus:border-indigo-300 transition-all placeholder:text-slate-300"
                                            rows={2}
                                        />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setMostrarReporte(false)}
                                                className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleEnviarReporte}
                                                disabled={estadoReporte === 'enviando' || !tipoSeleccionado}
                                                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {estadoReporte === 'enviando' ? 'Enviando...' : 'Enviar Reporte'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ITINERARIO COMPLETO (Solo si no estamos reportando) */}
                {(viewState === 'half' || viewState === 'full') && isInfoOnly && !mostrarReporte && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itinerario Completo</h3>
                        <div className="space-y-4">
                            {paradas.map((p, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 p-1.5">
                                        <img src="/parada_bus.svg" className="w-full h-full" alt="Parada" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-800">{p.nombre}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Estación {idx + 1}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PRÓXIMAS ESTACIONES (Solo si no estamos reportando) */}
                {viewState === 'half' && !isInfoOnly && !mostrarReporte && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avance de la Estación</h3>
                        <div className="space-y-3">
                            {(() => {
                                let distAcumulada = 0;
                                return paradasProximas.map((p, i) => {
                                    if (i === 0) {
                                        distAcumulada = calcularDistancia(vehicleData.pos?.[0], vehicleData.pos?.[1], p.latitud, p.longitud);
                                    } else {
                                        distAcumulada += calcularDistancia(paradasProximas[i - 1].latitud, paradasProximas[i - 1].longitud, p.latitud, p.longitud);
                                    }
                                    const min = estimarMinutos(distAcumulada);
                                    return (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`}></div>
                                            <span className="text-sm font-bold text-slate-700">{p.nombre}</span>
                                            <span className="ml-auto text-[10px] font-black text-slate-400">{distAcumulada < 50 ? 'LLEGANDO' : `LLEGA EN ${min} MIN`}</span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}

                {/* ITINERARIO Y CONDUCTOR (Solo si no estamos reportando) */}
                {viewState === 'full' && !isInfoOnly && !mostrarReporte && (
                    <div className="mt-8 relative animate-in fade-in duration-500">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Información Real de Unidad</h3>

                        <div className="relative">
                            {/* Línea de Tiempo Centrada y Ajustada */}
                            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="w-full bg-indigo-500 transition-all duration-1000 ease-in-out"
                                    style={{ height: `${(indexActual / (paradas.length - 1)) * 100}%` }}
                                ></div>
                            </div>

                            <div className="space-y-10 relative">
                                {(() => {
                                    let distAcumuladaFull = 0;
                                    const hayPosicion = vehicleData.pos?.[0] && vehicleData.pos?.[1];

                                    return paradas.map((p, idx) => {
                                        const esPasada = idx < indexActual;
                                        const esActual = idx === indexActual;
                                        
                                        let min = 0;
                                        if (idx === indexActual && hayPosicion) {
                                            distAcumuladaFull = calcularDistancia(vehicleData.pos[0], vehicleData.pos[1], p.latitud, p.longitud);
                                            min = estimarMinutos(distAcumuladaFull);
                                        } else if (idx > indexActual && hayPosicion) {
                                            distAcumuladaFull += calcularDistancia(paradas[idx - 1].latitud, paradas[idx - 1].longitud, p.latitud, p.longitud);
                                            min = estimarMinutos(distAcumuladaFull);
                                        }

                                        return (
                                            <div key={idx} className={`flex items-start gap-6 ${esPasada ? 'opacity-40' : 'opacity-100'}`}>
                                                <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 shrink-0 ${esPasada ? 'bg-slate-400' : esActual ? 'bg-indigo-600 ring-4 ring-indigo-50' : 'bg-emerald-500'}`}></div>
                                                <div className="flex-1 -mt-0.5">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-black text-slate-800">{p.nombre}</p>
                                                        {!esPasada && <span className="text-[9px] font-black text-indigo-500">{min} MIN</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-900 rounded-[32px] text-white space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                        <User className="w-6 h-6 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Conductor Asignado</p>
                                        <p className="text-sm font-bold">{vehicleData.conductorNombre}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400" />)}
                                    </div>
                                    <p className="text-[9px] font-black text-indigo-300 mt-1 uppercase tracking-tighter">4.9 Verificado</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setMostrarReporte(!mostrarReporte);
                                    if (viewState === 'collapsed') handleToggle();
                                }}
                                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mostrarReporte ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white/10 border border-white/10 text-white hover:bg-white/20'}`}
                            >
                                {mostrarReporte ? <X className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                                {mostrarReporte ? 'Cancelar Reporte' : 'Reportar Incidencia'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {viewState !== 'collapsed' && (
                <div className="p-6 bg-white border-t border-slate-50 flex justify-center">
                    <button onClick={() => setViewState('collapsed')} className="bg-slate-100 text-slate-500 p-3 rounded-full hover:bg-slate-200 transition-colors">
                        <ChevronDown className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default PanelRutaInteractiva;
