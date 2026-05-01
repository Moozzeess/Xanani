// ─── Dependencias requeridas ──────────────────────────────────────────────────
// npm install leaflet leaflet.heat leaflet.markercluster leaflet-defaulticon-compatibility
// npm install -D @types/leaflet @types/leaflet.markercluster

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Layers, RefreshCw, Info, Move } from 'lucide-react';

// ─── Datos mock (lat, lng, intensidad 0-1) ────────────────────────────────────
// Reemplaza esto con datos reales de tu API / WebSocket IoT
const BASE_POINTS = [
  // Centro Histórico
  [19.4326, -99.1332, 0.95], [19.4310, -99.1350, 0.85], [19.4340, -99.1310, 0.80],
  [19.4280, -99.1380, 0.75], [19.4360, -99.1290, 0.70],
  // Tlatelolco
  [19.4510, -99.1400, 0.80], [19.4490, -99.1380, 0.70], [19.4530, -99.1420, 0.65],
  // Tepito / Lagunilla
  [19.4450, -99.1260, 0.85], [19.4430, -99.1240, 0.75], [19.4470, -99.1280, 0.70],
  // Doctores / Obrera
  [19.4210, -99.1420, 0.75], [19.4190, -99.1450, 0.65], [19.4230, -99.1400, 0.60],
  // Terminal TAPO
  [19.4210, -99.0840, 0.95], [19.4190, -99.0820, 0.85], [19.4230, -99.0860, 0.75],
  // Iztapalapa
  [19.3570, -99.0600, 0.90], [19.3550, -99.0550, 0.80], [19.3600, -99.0650, 0.75],
  [19.3530, -99.0580, 0.70], [19.3620, -99.0520, 0.65],
  // Ecatepec
  [19.6010, -99.0500, 0.85], [19.6050, -99.0480, 0.75], [19.5980, -99.0530, 0.70],
  [19.6080, -99.0460, 0.65],
  // Nezahualcóyotl
  [19.4000, -99.0100, 0.80], [19.4030, -99.0070, 0.70], [19.3970, -99.0130, 0.65],
  // Tlalnepantla
  [19.5400, -99.1950, 0.75], [19.5430, -99.1920, 0.65], [19.5370, -99.1980, 0.60],
  // Coyoacán
  [19.3500, -99.1620, 0.65], [19.3480, -99.1650, 0.55], [19.3530, -99.1580, 0.60],
  // Xochimilco
  [19.2560, -99.0980, 0.55], [19.2590, -99.1020, 0.50], [19.2530, -99.0950, 0.45],
  // Polanco / Chapultepec
  [19.4320, -99.1930, 0.50], [19.4350, -99.1970, 0.45], [19.4290, -99.1900, 0.40],
  // Santa Fe
  [19.3670, -99.2640, 0.40], [19.3700, -99.2680, 0.35],
  // Indios Verdes
  [19.4980, -99.1200, 0.80], [19.5010, -99.1180, 0.70],
  // Cuatro Caminos
  [19.4870, -99.2070, 0.75], [19.4900, -99.2040, 0.65],
  // Observatorio
  [19.4010, -99.1990, 0.65], [19.3980, -99.2020, 0.55],
];

// Genera puntos extra con jitter para enriquecer el heatmap visualmente
function buildHeatPoints(points) {
  const result = [];
  points.forEach(([lat, lng, intensity]) => {
    result.push([lat, lng, intensity]);
    for (let i = 0; i < 6; i++) {
      result.push([
        lat + (Math.random() - 0.5) * 0.010,
        lng + (Math.random() - 0.5) * 0.010,
        intensity * (0.35 + Math.random() * 0.55),
      ]);
    }
  });
  return result;
}

export default function GlobalHeatmapView() {
  const mapDivRef   = useRef(null);   // referencia al div del DOM
  const mapRef      = useRef(null);   // instancia de L.map
  const layerRef    = useRef(null);   // capa activa (heat o cluster)
  const [mode, setMode] = useState('heat');
  const [ready, setReady] = useState(false);

  // ── Inicializar el mapa UNA sola vez ────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return; // StrictMode guard

    mapRef.current = L.map(mapDivRef.current, {
      center: [19.43, -99.13],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
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

  // ── Intercambiar capa cuando cambia el modo ─────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    // Eliminar capa anterior
    if (layerRef.current) {
      mapRef.current.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (mode === 'heat') {
      const pts = buildHeatPoints(BASE_POINTS);
      layerRef.current = L.heatLayer(pts, {
        radius: 28,
        blur: 22,
        maxZoom: 14,
        gradient: { 0.2: '#4ade80', 0.5: '#facc15', 0.75: '#f97316', 1.0: '#ef4444' },
      }).addTo(mapRef.current);

    } else {
      // markercluster
      const group = L.markerClusterGroup({ chunkedLoading: true });
      const stopIcon = L.divIcon({
        html: `<img src="/parada_bus.svg" style="width: 24px; height: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />`,
        className: 'bg-transparent',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      BASE_POINTS.forEach(([lat, lng]) => {
        L.marker([lat, lng], { icon: stopIcon }).addTo(group);
      });
      layerRef.current = group;
      mapRef.current.addLayer(group);
    }
  }, [ready, mode]);

  const handleReset = () => {
    mapRef.current?.setView([19.43, -99.13], 11);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Controles ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[
            { key: 'heat',    label: 'Mapa de Calor' },
            { key: 'cluster', label: 'Agrupaciones'  },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors
                ${mode === m.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Layers size={14} /> {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} /> Centrar
        </button>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-100 rounded-xl px-3 py-2.5">
          <Move size={13} /> Arrastra · Scroll para zoom
        </div>
      </div>

      {/* ── Contenedor del mapa ────────────────────────────────────────────── */}
      {/*
        IMPORTANTE: Leaflet lee la altura directamente del DOM.
        No uses h-full ni clases dinámicas de Tailwind aquí —
        define siempre una altura fija con style o una clase estática.
      */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div
          ref={mapDivRef}
          style={{ height: '520px', width: '100%' }}
        />

        {/* Leyenda superpuesta (solo en modo heat) */}
        {mode === 'heat' && (
          <div className="absolute bottom-8 left-4 z-[400] bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 pointer-events-none">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">
              Concentración de Unidades
            </p>
            <div
              className="h-2.5 w-36 rounded-full mb-1"
              style={{ background: 'linear-gradient(90deg, #4ade80, #facc15, #f97316, #ef4444)' }}
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Baja</span>
              <span>Alta</span>
            </div>
          </div>
        )}

        {/* Info badge */}
        <div className="absolute bottom-8 right-4 z-[400] flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg pointer-events-none">
          <Info size={12} />
          {BASE_POINTS.length} zonas · CDMX y Zona Metropolitana
        </div>
      </div>
    </div>
  );
}
