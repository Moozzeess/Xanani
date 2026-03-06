import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import { MarcadorBus, EstadoBus, crearMarcadorBus } from '../components/common/MarcadorBus';
import TarjetaInformativa from '../components/pasajero/TarjetaInformativa';

const PaginaInicioInvitado: React.FC = () => {
  const navigate = useNavigate();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [estadoBusActual] = useState<EstadoBus>(EstadoBus.ACTIVO);
  const marcadorBusRef = useRef<MarcadorBus | null>(null);

  useEffect(() => {
    if (containerRef.current && !mapRef.current) {
      const ubicacionUsuario: [number, number] = [19.4326, -99.1332];
      const ubicacionBus: [number, number] = [19.434, -99.135];

      mapRef.current = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView(ubicacionUsuario, 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(
        mapRef.current
      );

      const iconoUsuario = L.divIcon({
        className: '',
        html: `<div style="display:flex;align-items:center;justify-content:center;"><div class="user-pulse"></div><div class="user-dot"></div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      L.marker(ubicacionUsuario, { icon: iconoUsuario }).addTo(mapRef.current);

      const marcadorBus = crearMarcadorBus(ubicacionBus, estadoBusActual, mapRef.current);
      marcadorBusRef.current = marcadorBus;

      L.polyline([ubicacionUsuario, ubicacionBus], {
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
  }, [estadoBusActual]);

  useEffect(() => {
    if (marcadorBusRef.current) {
      marcadorBusRef.current.actualizarEstado(estadoBusActual);
    }
  }, [estadoBusActual]);

  return (
    <div className="passenger-body" ref={containerRef}>
      <header className="fixed-header">
        <div>
          <h1 className="header-title">Xanani</h1>
          <p className="header-subtitle">Modo Invitado</p>
        </div>
        <button className="btn-login" onClick={() => navigate('/iniciar-sesion')}>
          Iniciar Sesión
        </button>
      </header>

      <div id="map"></div>

      <TarjetaInformativa
        unidad="001"
        ocupabilidad="Alta"
        estado={estadoBusActual}
        distancia="250 metros"
        ultimaActualizacion="ahora"
      />
    </div>
  );
};

export default PaginaInicioInvitado;
