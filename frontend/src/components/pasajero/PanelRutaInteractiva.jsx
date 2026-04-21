import React, { useState } from 'react';
import { Bus, Clock, MapPin, User, Star, ChevronUp, ChevronDown, Flag } from 'lucide-react';
import MapaAsientos from './MapaAsientos';

/**
 * PanelRutaInteractiva (Versión Real-Time Premium)
 */
const PanelRutaInteractiva = ({ vehicle, ruta, onExpand, onReport }) => {
    const [viewState, setViewState] = useState('collapsed');

    if (!vehicle || !ruta) {
        return (
            <div className="fixed inset-x-0 bottom-0 h-28 bg-white rounded-t-[40px] flex items-center justify-center shadow-2xl z-[2000]">
                <p className="text-slate-400 text-xs font-bold animate-pulse uppercase tracking-widest">Sincronizando telemetría...</p>
            </div>
        );
    }

    const paradas = ruta.paradas || [];
    const indexActual = vehicle.indexParadaActual || 0;

    // Función para calcular distancia entre coordenadas (Haversine)
    const calcularDistancia = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
                        <div className={`w-12 h-12 ${vehicle.isSimulated ? 'bg-indigo-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100`}>
                            <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{ruta.nombre}</span>
                            <h2 className="text-base font-black text-slate-800 leading-tight">{vehicle.nombreUnidad}</h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-700">
                                {estimarMinutos(calcularDistancia(vehicle.pos?.[0], vehicle.pos?.[1], paradas[indexActual]?.latitud, paradas[indexActual]?.longitud))} MIN
                            </span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">ETA Real-Time</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-10 no-scrollbar">
                
                {/* MAPA DE ASIENTOS (Datos de Sensores) */}
                {(viewState === 'half' || viewState === 'full') && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <MapaAsientos 
                            ocupacionActual={vehicle.ocupacionActual} 
                            capacidadMaxima={vehicle.capacidadMaxima} 
                            vehicleId={vehicle.id}
                            ocupabilidad={vehicle.occ} 
                        />
                    </div>
                )}

                {/* PRÓXIMAS ESTACIONES (Estado Half) */}
                {viewState === 'half' && (
                    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avance de la Estación</h3>
                        <div className="space-y-3">
                            {paradasProximas.map((p, i) => {
                                const dist = calcularDistancia(vehicle.pos?.[0], vehicle.pos?.[1], p.latitud, p.longitud);
                                const min = estimarMinutos(dist);
                                return (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`}></div>
                                        <span className="text-sm font-bold text-slate-700">{p.nombre}</span>
                                        <span className="ml-auto text-[10px] font-black text-slate-400">{dist < 50 ? 'LLEGANDO' : `LLEGA EN ${min} MIN`}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ITINERARIO Y CONDUCTOR (Estado Full) */}
                {viewState === 'full' && (
                    <div className="mt-8 relative animate-in fade-in duration-500">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Información Real de Unidad</h3>
                        
                        <div className="absolute left-[11px] top-[40px] bottom-0 w-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-full bg-slate-300" style={{ height: `${(indexActual / paradas.length) * 100}%` }}></div>
                            <div className="w-full bg-indigo-500" style={{ height: '100%' }}></div>
                        </div>

                        <div className="space-y-10 relative">
                            {paradas.map((p, idx) => {
                                const esPasada = idx < indexActual;
                                const esActual = idx === indexActual;
                                const dist = calcularDistancia(vehicle.pos?.[0], vehicle.pos?.[1], p.latitud, p.longitud);
                                const min = estimarMinutos(dist);
                                return (
                                    <div key={idx} className={`flex items-start gap-6 ${esPasada ? 'opacity-40' : 'opacity-100'}`}>
                                        <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 shrink-0 ${esPasada ? 'bg-slate-400' : esActual ? 'bg-indigo-600 ring-4 ring-indigo-50' : 'bg-emerald-500'}`}></div>
                                        <div className="flex-1 -mt-0.5">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-black text-slate-800">{p.nombre}</p>
                                                {!esPasada && <span className="text-[9px] font-black text-indigo-500">{min} MIN</span>}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400">Punto de Control {idx + 1}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-12 p-6 bg-slate-900 rounded-[32px] text-white space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                        <User className="w-6 h-6 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Conductor Asignado</p>
                                        <p className="text-sm font-bold">{vehicle.conductorNombre}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400" />)}
                                    </div>
                                    <p className="text-[9px] font-black text-indigo-300 mt-1 uppercase tracking-tighter">4.9 Verificado</p>
                                </div>
                            </div>
                            <button onClick={onReport} className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <Flag className="w-4 h-4" /> Reportar Incidencia
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
