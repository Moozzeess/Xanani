import React, { useEffect } from 'react';
import L from 'leaflet';
import { X, Navigation } from 'lucide-react';
import { obtenerRutaPorCalles } from '../../../services/osrmService';

interface ModalVerRutaProps {
  ruta: any;
  alCerrar: () => void;
}

/**
 * Modal para visualizar el trazo de una ruta y sus paradas en un mapa estático (No editable).
 */
export const ModalVerRuta: React.FC<ModalVerRutaProps> = ({ ruta, alCerrar }) => {
  useEffect(() => {
    if (!ruta) return;

    // Inicializar mapa
    const map = L.map('mapa-ver-ruta', {
      zoomControl: true,
      attributionControl: false
    }).setView([19.4326, -99.1332], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

    // Añadir paradas
    const paradas = ruta.paradas || [];
    const marcadores: L.Marker[] = [];

    paradas.forEach((p: any, idx: number) => {
      const esPrimera = idx === 0;
      const esUltima = idx === paradas.length - 1 && paradas.length > 1;
      const color = esPrimera ? '#10b981' : esUltima ? '#ef4444' : '#3b82f6';

      const icon = L.divIcon({
        className: 'marcador-parada-ver',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">
               ${idx + 1}
             </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const m = L.marker([p.latitud, p.longitud], { icon }).addTo(map);
      m.bindPopup(`<b>${p.nombre}</b>`);
      marcadores.push(m);
    });

    // Trazar línea de la ruta
    if (ruta.geometria && ruta.geometria.length > 0) {
      const latlngs = ruta.geometria.map((g: any) => [g.latitud, g.longitud]);
      L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        lineJoin: 'round'
      }).addTo(map);
    } else if (paradas.length >= 2) {
      // Si no hay geometría guardada, intentar obtenerla de OSRM
      const coords = paradas.map((p: any) => [p.latitud, p.longitud]);
      obtenerRutaPorCalles(coords, 'driving').then(latlngs => {
        L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.7,
          lineJoin: 'round'
        }).addTo(map);
      });
    }

    // Ajustar vista para mostrar todos los marcadores
    if (marcadores.length > 0) {
      const group = L.featureGroup(marcadores);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      map.remove();
    };
  }, [ruta]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in-95 duration-300">

        {/* Panel Lateral Informativo */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{ruta.nombre}</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Detalles de la Ruta</p>
            </div>
            <button
              onClick={alCerrar}
              className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-blue-600">
                <Navigation className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Itinerario</span>
              </div>
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {ruta.paradas?.map((p: any, i: number) => (
                  <div key={i} className="flex gap-3 relative z-10">
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ${i === 0 ? 'bg-emerald-500 text-white' : i === ruta.paradas.length - 1 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{p.nombre}</p>
                      <p className="text-[10px] text-slate-400 truncate">{p.latitud.toFixed(5)}, {p.longitud.toFixed(5)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <button
            onClick={alCerrar}
            className="mt-6 w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors shadow-lg"
          >
            Cerrar Vista
          </button>
        </div>

        {/* Contenedor del Mapa */}
        <div className="flex-1 relative bg-slate-200">
          <div id="mapa-ver-ruta" className="w-full h-full" />
          <button
            onClick={alCerrar}
            className="absolute top-4 right-4 z-[500] bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg text-slate-600 hover:text-red-500 transition-all hover:scale-110 active:scale-95 hidden md:flex"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
