import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Siren, X } from 'lucide-react';

export interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  const miniMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
      return;
    }

    const timer = window.setTimeout(() => {
      const el = document.getElementById('sos-mini-map');
      if (!el || miniMapRef.current) return;

      miniMapRef.current = L.map('sos-mini-map', {
        zoomControl: false,
        dragging: false,
        attributionControl: false
      }).setView([19.4526, -99.1532], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(miniMapRef.current);

      const sosIcon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg animate-bounce"></div>`
      });

      L.marker([19.4526, -99.1532], { icon: sosIcon }).addTo(miniMapRef.current);
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div id="sos-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-[admin-pulse-red-shadow_1.5s_infinite] border-4 border-red-500">
        <div className="bg-red-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Siren className="w-6 h-6 animate-bounce" /> ALERTA SOS EN CURSO
          </h3>
          <button type="button" onClick={onClose} className="hover:bg-red-700 p-1 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-20 h-20 bg-slate-200 rounded-lg bg-cover bg-center border-2 border-slate-300"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&q=80')"
              }}
            />
            <div>
              <h4 className="text-2xl font-bold text-slate-900">Juan Pérez</h4>
              <p className="text-slate-500 font-mono">Unidad: MX7-814</p>
              <p className="text-red-600 font-bold mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Av. Central #450
              </p>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-xl mb-6 h-40 relative overflow-hidden border border-slate-200">
            <div id="sos-mini-map" className="w-full h-full absolute inset-0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="bg-slate-200 text-slate-800 py-3 rounded-xl font-bold hover:bg-slate-300">
              Contactar Radio
            </button>
            <button
              type="button"
              className="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30"
            >
              Despachar Ayuda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSModal;
