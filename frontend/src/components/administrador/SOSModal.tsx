import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Siren, X } from 'lucide-react';

export interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidencia?: {
    conductor?: { nombre: string; apellido: string; username: string; foto?: string };
    unidadId?: string;
    ubicacion?: { latitud: number; longitud: number };
    descripcion?: string;
    timestamp?: string;
  };
}

const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, incidencia }) => {
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

      const lat = incidencia?.ubicacion?.latitud || 19.4526;
      const lng = incidencia?.ubicacion?.longitud || -99.1532;

      miniMapRef.current = L.map('sos-mini-map', {
        zoomControl: false,
        dragging: false,
        attributionControl: false
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(miniMapRef.current);

      const sosIcon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg animate-bounce"></div>`
      });

      L.marker([lat, lng], { icon: sosIcon }).addTo(miniMapRef.current);
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, incidencia]);

  if (!isOpen) return null;

  return (
    <div id="sos-modal" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[admin-pulse-red-shadow_1.5s_infinite] border-4 border-red-500 mx-4">
        <div className="bg-red-600 p-5 flex justify-between items-center text-white">
          <h3 className="font-black text-xl flex items-center gap-3">
            <Siren className="w-8 h-8 animate-bounce" /> ¡ALERTA SOS ACTIVA!
          </h3>
          <button type="button" onClick={onClose} className="hover:bg-red-700 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-5 mb-8">
            {incidencia?.conductor?.foto ? (
              <img
                src={incidencia.conductor.foto}
                alt={incidencia.conductor.nombre}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 shadow-inner"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center border-2 border-slate-300 shadow-inner">
                <span className="text-slate-400 font-bold text-2xl">
                  {incidencia?.conductor?.nombre?.[0] || '?'}
                </span>
              </div>
            )}
            <div>
              <h4 className="text-2xl font-black text-slate-900 leading-tight">
                {incidencia?.conductor ? `${incidencia.conductor.nombre} ${incidencia.conductor.apellido}` : incidencia?.conductor?.username || 'Conductor Desconocido'}
              </h4>
              <p className="text-slate-500 font-black text-lg">Unidad: {incidencia?.unidadId || 'N/A'}</p>
              <p className="text-red-600 font-bold mt-1 flex items-center gap-2 text-sm">
                <img src="/parada_bus.svg" className="w-5 h-5" style={{ filter: 'invert(27%) sepia(91%) saturate(2352%) hue-rotate(346deg) brightness(104%) contrast(97%)' }} alt="Ubicación" /> {incidencia?.descripcion || 'Solicitud de ayuda inmediata'}
              </p>
              {incidencia?.timestamp && (
                <p className="text-slate-400 text-xs mt-1">
                  Reportado: {new Date(incidencia.timestamp).toLocaleString()}
                </p>
              )}
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
