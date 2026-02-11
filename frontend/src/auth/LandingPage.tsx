import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Eye, Footprints } from 'lucide-react';
import '../styles/pasajero.css';

const PassengerLanding: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      // Coordenadas iniciales
      const userLoc: [number, number] = [19.4326, -99.1332];
      const busLoc: [number, number] = [19.4340, -99.1350];

      // Inicializar Mapa
      mapRef.current = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView(userLoc, 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);

      // Marcador Usuario
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;"><div class="user-pulse"></div><div class="user-dot"></div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      L.marker(userLoc, { icon: userIcon }).addTo(mapRef.current);

      // Marcador Bus (SVG exacto del original)
      const busIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;background:#4ade80;opacity:0.4;border-radius:12px;"></div>
            <div style="position:relative;width:32px;height:32px;background:#4ade80;border-radius:12px;border:2px solid white;display:flex;align-items:center;justify-content:center;color:#064e3b;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
            </div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      L.marker(busLoc, { icon: busIcon }).addTo(mapRef.current);

      // Línea de conexión
      L.polyline([userLoc, busLoc], {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.6,
        dashArray: '5, 10'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="passenger-body" ref={containerRef}>
      {/* HEADER */}
      <header className="fixed-header">
        <div>
          <h1 className="header-title">Xanani</h1>
          <p className="header-subtitle">Modo Invitado</p>
        </div>
        <button className="btn-login" onClick={() => navigate('/login')}>
          Iniciar Sesión
        </button>
      </header>

      {/* MAPA */}
      <div id="map"></div>

      {/* TARJETA INFORMATIVA */}
      <div className="bottom-container">
        <div className="floating-label">
          <MapPin size={12} fill="white" /> Unidad más cercana
        </div>

        <div className="info-card">
          <div className="card-main-row">
            <div>
              <h2 className="unit-title">Unidad 001</h2>
              <p className="unit-desc">Ocupabilidad: Alta</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="status-badge">EN RUTA</span>
              <div className="eye-icon-bg">
                <Eye size={16} color="#0f172a" />
              </div>
            </div>
          </div>

          <div className="card-footer-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Footprints size={14} />
              <span>A 250 metros de tu ubicación</span>
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Actualizado ahora</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerLanding;