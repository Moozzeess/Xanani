import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2 } from 'lucide-react';
import { useAlertaGlobal } from '../../../context/AlertaContext';

interface StopItem {
  id: number;
  name: string;
  marker: L.Marker;
}

const RoutesView: React.FC = () => {
  const { disparar } = useAlertaGlobal();
  const routeMapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const stopsRef = useRef<StopItem[]>([]);

  const [stops, setStops] = useState<StopItem[]>([]);

  const redrawPolyline = useCallback((currentStops: StopItem[]) => {
    const routeMap = routeMapRef.current;
    if (!routeMap) return;

    if (polylineRef.current) {
      routeMap.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (currentStops.length < 2) return;

    polylineRef.current = L.polyline(
      currentStops.map((s) => s.marker.getLatLng()),
      { color: '#3b82f6', weight: 4, dashArray: '10, 10' }
    ).addTo(routeMap);
  }, []);

  useEffect(() => {
    stopsRef.current = stops;
    redrawPolyline(stops);
  }, [stops, redrawPolyline]);

  const addStop = useCallback(
    (latlng: L.LatLng, name = 'Nueva Parada') => {
      const routeMap = routeMapRef.current;
      if (!routeMap) return;

      const marker = L.marker(latlng, { draggable: true }).addTo(routeMap);
      marker.on('dragend', () => {
        redrawPolyline(stopsRef.current);
      });

      setStops((prev) => {
        const nextId = prev.length + 1;
        return [...prev, { id: nextId, marker, name }];
      });
    },
    [redrawPolyline]
  );

  useEffect(() => {
    const el = document.getElementById('route-map');
    if (!el || routeMapRef.current) return;

    routeMapRef.current = L.map('route-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([19.4326, -99.1332], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(routeMapRef.current);

    routeMapRef.current.on('click', (e: L.LeafletMouseEvent) => addStop(e.latlng));

    addStop(L.latLng(19.4326, -99.1332), 'Base Central');
    addStop(L.latLng(19.436, -99.137), 'Plaza Universidad');

    const resizeTimer = window.setTimeout(() => {
      routeMapRef.current?.invalidateSize();
    }, 100);

    return () => {
      window.clearTimeout(resizeTimer);
      if (polylineRef.current && routeMapRef.current) {
        routeMapRef.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      if (routeMapRef.current) {
        routeMapRef.current.remove();
        routeMapRef.current = null;
      }
    };
  }, [addStop]);

  const handleStopNameChange = useCallback((id: number, value: string) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, name: value } : s)));
  }, []);

  const removeStop = useCallback((id: number) => {
    setStops((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const removed = prev.find((s) => s.id === id);
      if (removed && routeMapRef.current) {
        routeMapRef.current.removeLayer(removed.marker);
      }
      return next.map((s, idx) => ({ ...s, id: idx + 1 }));
    });
  }, []);

  const saveRoute = useCallback(() => {
    disparar({
      tipo: 'exito',
      titulo: 'Ruta Guardada',
      mensaje: `La ruta se ha guardado exitosamente con ${stops.length} estaciones.`
    });
  }, [stops.length, disparar]);

  return (
    <div id="view-routes" className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Editor de Ruta</h3>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Variación de Ruta</label>
          <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            <option>Ruta Principal (Línea 1)</option>
            <option>Desvío por Obras (Var. A)</option>
            <option>Horario Nocturno (Var. B)</option>
            <option value="new">+ Crear Nueva Variación</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mb-4">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estaciones / Paradas</label>
          <p className="text-xs text-slate-400 mb-3 italic">Haz clic en el mapa para agregar una parada.</p>

          <div id="stops-list" className="space-y-2">
            {stops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100 fade-in">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {stop.id}
                </span>
                <input
                  type="text"
                  value={stop.name}
                  onChange={(e) => handleStopNameChange(stop.id, e.target.value)}
                  className="bg-transparent text-sm font-medium w-full outline-none focus:border-b border-blue-500"
                />
                <button type="button" onClick={() => removeStop(stop.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={saveRoute}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div id="route-map" className="admin-map-container" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs font-bold text-slate-600 shadow-sm z-[1000]">
          Modo Edición Activo
        </div>
      </div>
    </div>
  );
};

export default RoutesView;
