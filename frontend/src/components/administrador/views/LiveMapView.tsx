import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function createBusIcon(colorClass: string, status: 'active' | 'warning' | 'inactive' | 'sos'): L.DivIcon {
  const html = `
    <div class="bus-marker-container relative w-10 h-10 flex items-center justify-center">
      <div class="absolute inset-0 rounded-xl ${colorClass} opacity-20 ${status === 'sos' ? 'animate-ping' : ''}"></div>
      <div class="relative w-8 h-8 ${colorClass} rounded-lg border-2 border-white shadow-md flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
      </div>
      ${status === 'sos' ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white animate-bounce"></div>' : ''}
    </div>
  `;

  return L.divIcon({ className: 'bg-transparent', html, iconSize: [40, 40], iconAnchor: [20, 20] });
}

const LiveMapView: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = document.getElementById('admin-map');
    if (!container || mapRef.current) return;

    mapRef.current = L.map('admin-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([19.4326, -99.1332], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

    const units: Array<{ pos: [number, number]; type: string; st: 'active' | 'warning' | 'inactive' | 'sos'; id: string }> = [
      { pos: [19.4326, -99.1332], type: 'bg-blue-600', st: 'active', id: '814' },
      { pos: [19.4426, -99.1432], type: 'bg-blue-600', st: 'active', id: '992' },
      { pos: [19.4226, -99.1232], type: 'bg-orange-400', st: 'warning', id: '001' },
      { pos: [19.4526, -99.1532], type: 'bg-red-600', st: 'sos', id: 'SOS' },
      { pos: [19.4126, -99.1132], type: 'bg-gray-500', st: 'inactive', id: 'Taller' }
    ];

    units.forEach((u) => {
      L.marker(u.pos, { icon: createBusIcon(u.type, u.st) })
        .addTo(mapRef.current!)
        .bindPopup(`<div class="text-center font-bold">Unidad ${u.id}</div>`);
    });

    const resizeTimer = window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    return () => {
      window.clearTimeout(resizeTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="view-map"
      className="h-[calc(100vh-8rem)] w-full bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"
    >
      <div id="admin-map" className="admin-map-container" />

      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-200 z-[1000] hidden md:block">
        <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Leyenda</h4>
        <div className="space-y-2 text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Activo
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400" /> Retraso
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400" /> Inactivo
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> SOS
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMapView;
