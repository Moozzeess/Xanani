// ─── Dependencias requeridas ──────────────────────────────────────────────────
// npm install leaflet leaflet.heat leaflet.markercluster leaflet-defaulticon-compatibility socket.io-client
// npm install -D @types/leaflet @types/leaflet.markercluster

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { io } from 'socket.io-client';
import { Layers, RefreshCw, Info, Move, Wifi, WifiOff } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';

// ─── Cuánto tiempo (ms) mantener un punto "vivo" en el mapa ──────────────────
const PUNTO_TTL_MS = 30_000; // 30 segundos sin actualización → se elimina

export default function GlobalHeatmapView() {
  const mapDivRef    = useRef(null);
  const mapRef       = useRef(null);   // instancia L.map
  const layerRef     = useRef(null);   // capa activa (heat | cluster)
  const puntosRef    = useRef({});     // { [id]: { lat, lng, intensity, ts } }
  const socketRef    = useRef(null);
  const pruneRef     = useRef(null);   // intervalo de limpieza de puntos viejos

  const [mode, setMode]           = useState('heat');
  const [conectado, setConectado] = useState(false);
  const [totalPuntos, setTotalPuntos] = useState(0);
  const [ready, setReady]         = useState(false);

  // ── Inicializar mapa (una sola vez) ─────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = L.map(mapDivRef.current, {
      center: [19.43, -99.13],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &amp; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    setReady(true);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // ── Redibujar capa cuando cambia el modo o los puntos ─────────────────────
  const redibujar = useCallback(() => {
    if (!ready || !mapRef.current) return;

    if (layerRef.current) {
      mapRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const puntos = Object.values(puntosRef.current);
    setTotalPuntos(puntos.length);

    if (puntos.length === 0) return;

    if (mode === 'heat') {
      // Generar puntos con jitter para suavizar el mapa de calor
      const heatPts = [];
      puntos.forEach(({ lat, lng, intensity }) => {
        heatPts.push([lat, lng, intensity]);
        for (let i = 0; i < 4; i++) {
          heatPts.push([
            lat + (Math.random() - 0.5) * 0.008,
            lng + (Math.random() - 0.5) * 0.008,
            intensity * (0.3 + Math.random() * 0.5),
          ]);
        }
      });
      layerRef.current = L.heatLayer(heatPts, {
        radius: 28,
        blur: 22,
        maxZoom: 14,
        gradient: { 0.2: '#4ade80', 0.5: '#facc15', 0.75: '#f97316', 1.0: '#ef4444' },
      }).addTo(mapRef.current);

    } else {
      const group = L.markerClusterGroup({ chunkedLoading: true });
      puntos.forEach(({ lat, lng, id }) => {
        L.marker([lat, lng]).bindPopup(`<b>Dispositivo:</b> ${id ?? 'N/A'}`).addTo(group);
      });
      layerRef.current = group;
      mapRef.current.addLayer(group);
    }
  }, [ready, mode]);

  // ── Socket.IO ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect',    () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    // Telemetría de dispositivos IoT (MQTT → Socket)
    socket.on('datos_esp32', (data) => {
      const { payload } = data;
      if (!payload || typeof payload !== 'object') return;

      const { id, gps } = payload;
      // Solo procesar si hay GPS válido con coordenadas
      if (!gps?.con || !gps.lat || !gps.lon) return;

      const lat = parseFloat(gps.lat);
      const lng = parseFloat(gps.lon);
      if (isNaN(lat) || isNaN(lng)) return;

      // Intensidad basada en velocidad (normalizada a 0-1, máx 80 km/h)
      const intensity = Math.min((gps.spd ?? 0) / 80, 1) || 0.5;

      puntosRef.current[id ?? `${lat}-${lng}`] = { id, lat, lng, intensity, ts: Date.now() };
      redibujar();
    });

    // Ubicación emitida directamente por conductores (panel de conductor)
    socket.on('ubicacion_conductor', (datos) => {
      const { id, pos } = datos;
      if (!pos?.lat || !pos?.lng) return;

      puntosRef.current[id ?? `${pos.lat}-${pos.lng}`] = {
        id,
        lat: parseFloat(pos.lat),
        lng: parseFloat(pos.lng),
        intensity: 0.6,
        ts: Date.now(),
      };
      redibujar();
    });

    return () => { socket.disconnect(); };
  }, [redibujar]);

  // ── Limpiar puntos viejos cada 10 s ──────────────────────────────────────────
  useEffect(() => {
    pruneRef.current = setInterval(() => {
      const limite = Date.now() - PUNTO_TTL_MS;
      let modificado = false;
      Object.keys(puntosRef.current).forEach(k => {
        if (puntosRef.current[k].ts < limite) {
          delete puntosRef.current[k];
          modificado = true;
        }
      });
      if (modificado) redibujar();
    }, 10_000);

    return () => clearInterval(pruneRef.current);
  }, [redibujar]);

  // ── Redibujar cuando cambia el modo ─────────────────────────────────────────
  useEffect(() => { redibujar(); }, [mode, redibujar]);

  const handleReset  = () => mapRef.current?.setView([19.43, -99.13], 11);
  const handleLimpiar = () => { puntosRef.current = {}; redibujar(); };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[{ key: 'heat', label: 'Mapa de Calor' }, { key: 'cluster', label: 'Agrupaciones' }].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors
                ${mode === m.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <Layers size={14} /> {m.label}
            </button>
          ))}
        </div>

        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw size={14} /> Centrar
        </button>

        <button onClick={handleLimpiar}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          Limpiar puntos
        </button>

        {/* Indicador de conexión */}
        <div className={`ml-auto flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border
          ${conectado ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
          {conectado ? <Wifi size={13} /> : <WifiOff size={13} />}
          {conectado ? 'Socket conectado' : 'Socket desconectado'}
        </div>
      </div>

      {/* Mapa */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        {/*
          IMPORTANTE: Leaflet requiere altura explícita en el DOM.
          No uses h-full — define siempre un valor fijo con style.
        */}
        <div ref={mapDivRef} style={{ height: '520px', width: '100%' }} />

        {/* Leyenda */}
        {mode === 'heat' && (
          <div className="absolute bottom-8 left-4 z-[400] bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 pointer-events-none">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Concentración de Unidades</p>
            <div className="h-2.5 w-36 rounded-full mb-1"
              style={{ background: 'linear-gradient(90deg,#4ade80,#facc15,#f97316,#ef4444)' }} />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Baja velocidad</span><span>Alta velocidad</span>
            </div>
          </div>
        )}

        {/* Info badge */}
        <div className="absolute bottom-8 right-4 z-[400] flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg pointer-events-none">
          <Info size={12} />
          {totalPuntos} unidades activas · TTL {PUNTO_TTL_MS / 1000} s
        </div>

        {/* Sin datos */}
        {ready && totalPuntos === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[400] pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl px-6 py-4 text-center">
              <Move size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300 text-sm font-bold">Sin unidades activas</p>
              <p className="text-slate-500 text-xs mt-1">Los puntos aparecerán cuando los dispositivos IoT envíen datos GPS</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
