import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/pasajero.css';
import UbicacionModal from '../components/common/UbicacionModal';
import { obtenerRutaPorCalles } from '../services/osrmService';
import { useAlertaGlobal } from '../context/AlertaContext';

const API_URL = `http://${window.location.hostname}:4000/api`;

/** Intervalo en ms para el avance de la unidad simulada sobre la ruta demo */
const INTERVALO_SIMULACION_MS = 3000;

/**
 * Calcula el nivel de ocupación textual a partir del porcentaje.
 */
function nivelOcupacion(actual: number, maxima: number): 'Alta' | 'Media' | 'Baja' {
  if (!maxima) return 'Baja';
  const pct = (actual / maxima) * 100;
  return pct >= 75 ? 'Alta' : pct >= 40 ? 'Media' : 'Baja';
}

/**
 * Genera el HTML del marcador del bus para el mapa invitado.
 * Solo muestra el icono — click redirige a login.
 */
function htmlMarcadorInvitado(ocupacion: string): string {
  const color = ocupacion === 'Alta' ? '#ef4444' : ocupacion === 'Media' ? '#f59e0b' : '#22c55e';
  return `
    <div style="position:relative;width:44px;height:44px;cursor:pointer" title="Iniciar sesión para más detalles">
      <div style="position:absolute;inset:0;border-radius:12px;background:${color};opacity:0.25;animation:ping 1.5s infinite"></div>
      <div style="position:relative;width:44px;height:44px;background:${color};border-radius:12px;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
    </div>`;
}

interface DatosUnidad {
  placa: string;
  estado: string;
  ocupacionActual: number;
  capacidadMaxima: number;
  posicion: { latitud: number; longitud: number };
  distanciaMetros: number;
  modoSimulacion?: boolean;
}

/**
 * Página de aterrizaje (Landing) para pasajeros en modo invitado.
 *
 * Flujo:
 * 1. Obtiene ubicación del usuario.
 * 2. Consulta la unidad más cercana con posición GPS real al backend.
 * 3. Si existe: traza ruta OSRM usuario → unidad y muestra datos limitados.
 * 4. Si no existe: activa modo simulación con la ruta demo del backend,
 *    animando una unidad a lo largo de su geometría histórica.
 * 5. Click en la unidad → redirige a login.
 */
const LandingPasajero: React.FC = () => {
  const { dispararError } = useAlertaGlobal();
  const navegar = useNavigate();

  const mapaRef = useRef<L.Map | null>(null);
  const marcadorBusRef = useRef<L.Marker | null>(null);
  const marcadorUsuarioRef = useRef<L.Marker | null>(null);
  const polilineaRef = useRef<L.Polyline | null>(null);
  const simulacionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indiceSimRef = useRef(0);

  const [modalUbicacion, setModalUbicacion] = useState(false);
  const [posUsuario, setPosUsuario] = useState<[number, number]>([19.4326, -99.1332]);
  const [datosUnidad, setDatosUnidad] = useState<DatosUnidad | null>(null);

  // ── Inicializar mapa ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapaRef.current) return;

    mapaRef.current = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 13,
      maxZoom: 18,
    }).setView(posUsuario, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapaRef.current);

    return () => {
      if (simulacionRef.current) clearInterval(simulacionRef.current);
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, []);

  // ── Dibujar marcador de usuario ───────────────────────────────────────────
  const actualizarMarcadorUsuario = useCallback((pos: [number, number]) => {
    if (!mapaRef.current) return;
    const icono = L.divIcon({
      className: '',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px"><div class="user-pulse"></div><div class="user-dot"></div></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    if (marcadorUsuarioRef.current) {
      marcadorUsuarioRef.current.setLatLng(pos);
    } else {
      marcadorUsuarioRef.current = L.marker(pos, { icon: icono }).addTo(mapaRef.current);
    }
  }, []);

  // ── Colocar o mover marcador del bus ─────────────────────────────────────
  const actualizarMarcadorBus = useCallback(
    (pos: [number, number], ocupacion: string, onClick: () => void) => {
      if (!mapaRef.current) return;

      const icono = L.divIcon({
        className: 'bg-transparent',
        html: htmlMarcadorInvitado(ocupacion),
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (marcadorBusRef.current) {
        marcadorBusRef.current.setLatLng(pos);
      } else {
        marcadorBusRef.current = L.marker(pos, { icon: icono })
          .on('click', onClick)
          .addTo(mapaRef.current);
      }
    },
    []
  );

  // ── Dibujar la polilínea OSRM entre usuario y bus ─────────────────────────
  const trazarRuta = useCallback(async (origen: [number, number], destino: [number, number]) => {
    const coords = await obtenerRutaPorCalles(origen, destino);
    if (!mapaRef.current) return;
    if (polilineaRef.current) {
      polilineaRef.current.setLatLngs(coords);
    } else {
      polilineaRef.current = L.polyline(coords, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.75,
        lineCap: 'round',
        dashArray: '8,10',
      }).addTo(mapaRef.current);
    }
  }, []);

  // ── Cargar unidad más cercana o activar simulación ────────────────────────
  const cargarUnidad = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(`${API_URL}/units/cercana?lat=${lat}&lng=${lng}`);
        const unidad: DatosUnidad | null = res.ok ? await res.json() : null;

        if (unidad?.posicion) {
          // Unidad real encontrada
          setDatosUnidad(unidad);
          const posBus: [number, number] = [unidad.posicion.latitud, unidad.posicion.longitud];
          actualizarMarcadorBus(posBus, nivelOcupacion(unidad.ocupacionActual, unidad.capacidadMaxima), () => navegar('/login'));
          await trazarRuta([lat, lng], posBus);
          mapaRef.current?.fitBounds([[lat, lng], posBus], { padding: [60, 60], maxZoom: 17 });
        } else {
          // Sin unidades → modo simulación
          activarSimulacion(lat, lng);
        }
      } catch {
        activarSimulacion(lat, lng);
      }
    },
    [actualizarMarcadorBus, trazarRuta, navegar]
  );

  // ── Modo simulación: pide la ruta demo y anima la unidad ──────────────────
  const activarSimulacion = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(`${API_URL}/units/ruta-demo`);
        if (!res.ok) throw new Error('Sin ruta demo');
        const { geometria } = await res.json();

        if (!geometria?.length) return;

        const setDatosDemo = () => {
          setDatosUnidad({
            placa: 'DEMO',
            estado: 'en_ruta',
            ocupacionActual: 8,
            capacidadMaxima: 15,
            posicion: { latitud: geometria[0].latitud, longitud: geometria[0].longitud },
            distanciaMetros: 0,
            modoSimulacion: true,
          });
        };

        setDatosDemo();

        // Trazar toda la geometría de la ruta demo
        const lineaCoords: [number, number][] = geometria.map(
          (p: { latitud: number; longitud: number }) => [p.latitud, p.longitud]
        );

        if (!mapaRef.current) return;
        if (polilineaRef.current) {
          polilineaRef.current.setLatLngs(lineaCoords);
        } else {
          polilineaRef.current = L.polyline(lineaCoords, {
            color: '#6366f1',
            weight: 5,
            opacity: 0.65,
            lineCap: 'round',
          }).addTo(mapaRef.current);
        }

        mapaRef.current.fitBounds(polilineaRef.current.getBounds(), { padding: [50, 50] });

        // Animar la unidad simulada punto a punto
        indiceSimRef.current = 0;
        if (simulacionRef.current) clearInterval(simulacionRef.current);
        simulacionRef.current = setInterval(() => {
          const idx = indiceSimRef.current % geometria.length;
          const p = geometria[idx];
          const pos: [number, number] = [p.latitud, p.longitud];

          actualizarMarcadorBus(pos, 'Media', () => navegar('/login'));
          setDatosUnidad((prev) =>
            prev ? { ...prev, posicion: { latitud: p.latitud, longitud: p.longitud } } : prev
          );

          indiceSimRef.current++;
        }, INTERVALO_SIMULACION_MS);
      } catch {
        // Sin ruta demo en el sistema, no mostrar nada
      }
    },
    [actualizarMarcadorBus, navegar]
  );

  // ── Flujo de geolocalización ──────────────────────────────────────────────
  const iniciarConUbicacion = useCallback(
    (lat: number, lng: number) => {
      const pos: [number, number] = [lat, lng];
      setPosUsuario(pos);
      actualizarMarcadorUsuario(pos);
      mapaRef.current?.setView(pos, 16, { animate: true });
      cargarUnidad(lat, lng);
    },
    [actualizarMarcadorUsuario, cargarUnidad]
  );

  const solicitarUbicacion = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => iniciarConUbicacion(coords.latitude, coords.longitude),
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Concede permisos de ubicación para ver unidades cercanas.'
            : 'No se pudo obtener tu ubicación.';
        dispararError(msg, err.message, 'Ubicación no disponible');
        // Aun sin ubicación, mostrar simulación centrada en CDMX
        iniciarConUbicacion(19.4326, -99.1332);
      }
    );
  }, [iniciarConUbicacion, dispararError]);

  // Verificar permiso previo al montar
  useEffect(() => {
    const concedido = localStorage.getItem('locationPermissionGranted') === 'true';
    if (concedido) {
      solicitarUbicacion();
    } else {
      setModalUbicacion(true);
      // Iniciar simulación en CDMX mientras no hay permiso
      iniciarConUbicacion(19.4326, -99.1332);
    }
  }, []);

  const manejarAceptarUbicacion = () => {
    localStorage.setItem('locationPermissionGranted', 'true');
    setModalUbicacion(false);
    solicitarUbicacion();
  };

  // ── Nivel de ocupación para la tarjeta ────────────────────────────────────
  const ocupacionTexto = datosUnidad
    ? nivelOcupacion(datosUnidad.ocupacionActual, datosUnidad.capacidadMaxima)
    : null;

  const distanciaTexto = datosUnidad?.distanciaMetros != null
    ? datosUnidad.distanciaMetros < 1000
      ? `${datosUnidad.distanciaMetros} metros`
      : `${(datosUnidad.distanciaMetros / 1000).toFixed(1)} km`
    : null;

  return (
    <div className="passenger-body">

      {/* CABECERA */}
      <header className="fixed-header">
        <div>
          <h1 className="header-title">Xanani</h1>
          <p className="header-subtitle">Modo Invitado</p>
        </div>
        <button className="btn-login" onClick={() => navegar('/login')}>
          Iniciar Sesión
        </button>
      </header>

      {/* MAPA */}
      <div id="map" />

      {/* TARJETA INFORMATIVA — solo si hay datos */}
      {datosUnidad && ocupacionTexto && (
        <div className="bottom-container" onClick={() => navegar('/login')} style={{ cursor: 'pointer' }}>

          {datosUnidad.modoSimulacion && (
            <div style={{
              background: '#6366f1',
              color: 'white',
              fontSize: '9px',
              fontWeight: 700,
              padding: '3px 12px',
              borderRadius: '999px',
              marginBottom: '6px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Modo demostración
            </div>
          )}

          <div className="floating-label">
            <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Unidad más cercana
          </div>

          <div className="info-card">
            <div className="card-main-row">
              <div>
                <h2 className="unit-title">
                  {datosUnidad.modoSimulacion ? 'Ruta de demostración' : `Unidad ${datosUnidad.placa}`}
                </h2>
                <p className="unit-desc">
                  Ocupación: <strong>{ocupacionTexto}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                {/* Badge de ocupación — único dato visible sin sesión */}
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: ocupacionTexto === 'Alta' ? '#fee2e2' : ocupacionTexto === 'Media' ? '#fef3c7' : '#dcfce7',
                  color: ocupacionTexto === 'Alta' ? '#dc2626' : ocupacionTexto === 'Media' ? '#d97706' : '#16a34a',
                }}>
                  {ocupacionTexto === 'Alta' ? '🔴 Lleno' : ocupacionTexto === 'Media' ? '🟡 Disponible' : '🟢 Libre'}
                </span>

                {/* CTA login — info bloqueada */}
                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>
                  Inicia sesión para más detalles
                </span>
              </div>
            </div>

            <div className="card-footer-row">
              {distanciaTexto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  A {distanciaTexto} de tu ubicación
                </div>
              )}
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Toca para iniciar sesión</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PERMISOS DE UBICACIÓN */}
      <UbicacionModal
        isOpen={modalUbicacion}
        onClose={() => setModalUbicacion(false)}
        onAccept={manejarAceptarUbicacion}
      />
    </div>
  );
};

export default LandingPasajero;
