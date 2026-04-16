import { useState, useRef, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ItemParada {
  id: number;
  nombre: string;
  marcador: L.Marker;
}

const crearIconoMarcador = (indice: number, total: number) => {
  const esPrimera = indice === 0;
  const esUltima = indice === total - 1 && total > 1;
  const color = esPrimera ? '#10b981' : esUltima ? '#ef4444' : '#3b82f6';
  
  return L.divIcon({
    className: 'marcador-parada-custom',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
         <img src="/parada_bus.svg" style="width: 32px; height: 32px; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));" />
         <div style="position: absolute; top: -8px; right: -8px; background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: sans-serif;">
           ${indice + 1}
         </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 32]
  });
};

export const useMapaRutas = (idContenedorMapa: string, activo: boolean) => {
  const mapaRef = useRef<L.Map | null>(null);
  const lineaRutaRef = useRef<L.Polyline | null>(null);
  
  const [paradas, setParadas] = useState<ItemParada[]>([]);
  const [geometria, setGeometria] = useState<[number, number][]>([]);
  const paradasRef = useRef<ItemParada[]>([]);

  // Inicialización del mapa
  useEffect(() => {
    if (!activo) return;

    const el = document.getElementById(idContenedorMapa);
    if (!el || mapaRef.current) return;

    mapaRef.current = L.map(idContenedorMapa, {
      zoomControl: false,
      attributionControl: false
    }).setView([19.4326, -99.1332], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapaRef.current);

    mapaRef.current.on('click', (e: L.LeafletMouseEvent) => agregarParada(e.latlng));

    return () => {
      if (mapaRef.current) {
        mapaRef.current.remove();
        mapaRef.current = null;
      }
    };
  }, [activo, idContenedorMapa]);

  // Actualizar iconos y trazar línea OSRM
  useEffect(() => {
    let montado = true;
    paradasRef.current = paradas;
    const mapa = mapaRef.current;
    
    paradas.forEach((p, idx) => {
      p.marcador.setIcon(crearIconoMarcador(idx, paradas.length));
    });

    if (!mapa || paradas.length < 2) {
      if (lineaRutaRef.current && mapa) {
        mapa.removeLayer(lineaRutaRef.current);
        lineaRutaRef.current = null;
      }
      setGeometria([]);
      return;
    }

    const actualizarTrazo = async () => {
      const coordenadas = paradas.map((p) => `${p.marcador.getLatLng().lng},${p.marcador.getLatLng().lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordenadas}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!montado) return;

        let latlngs: [number, number][] = [];

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          latlngs = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        } else {
          latlngs = paradas.map((p) => [p.marcador.getLatLng().lat, p.marcador.getLatLng().lng] as [number, number]);
        }

        setGeometria(latlngs);

        if (lineaRutaRef.current) {
          mapa.removeLayer(lineaRutaRef.current);
        }

        lineaRutaRef.current = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 5,
        }).addTo(mapa);

      } catch (err) {
        if (!montado) return;
        const coordsRespaldo = paradas.map((p) => [p.marcador.getLatLng().lat, p.marcador.getLatLng().lng] as [number, number]);
        setGeometria(coordsRespaldo);
        
        if (lineaRutaRef.current) {
          mapa.removeLayer(lineaRutaRef.current);
        }
        lineaRutaRef.current = L.polyline(coordsRespaldo, {
          color: '#3b82f6',
          weight: 4,
          dashArray: '10, 10'
        }).addTo(mapa);
      }
    };

    actualizarTrazo();

    return () => {
      montado = false;
    };
  }, [paradas]);

  const agregarParada = useCallback((latlng: L.LatLng, nombreDefecto?: string) => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    setParadas((prev) => {
      const siguienteId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1;
      let nombreAsignado = nombreDefecto || `Parada ${prev.length + 1}`;
      
      const marcador = L.marker(latlng, { 
          draggable: true,
          icon: crearIconoMarcador(prev.length, prev.length + 1)
      }).addTo(mapa);

      marcador.on('dragend', () => {
        setParadas((actual) => [...actual]);
      });

      return [...prev, { id: siguienteId, marcador, nombre: nombreAsignado }];
    });
  }, []);

  const cargarParadasManuales = useCallback((paradasBackend: any[]) => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    // Limpiar paradas actuales
    setParadas((prev) => {
        prev.forEach(p => mapa.removeLayer(p.marcador));
        return [];
    });

    const nuevasParadas: ItemParada[] = paradasBackend.map((p, index) => {
      const pos = L.latLng(p.latitud, p.longitud);
      const marcador = L.marker(pos, {
        draggable: true,
        icon: crearIconoMarcador(index, paradasBackend.length)
      }).addTo(mapa);

      marcador.on('dragend', () => {
        setParadas((actual) => [...actual]);
      });

      return {
        id: index + 1,
        nombre: p.nombre,
        marcador
      };
    });

    setParadas(nuevasParadas);

    if (nuevasParadas.length > 0) {
        const bounds = L.latLngBounds(nuevasParadas.map(p => p.marcador.getLatLng()));
        mapa.fitBounds(bounds, { padding: [50, 50] });
    }
  }, []);

  const centrarMapaEn = useCallback((lat: number, lng: number) => {
    if (mapaRef.current) {
       mapaRef.current.setView([lat, lng], 16);
    }
  }, []);

  const cambiarNombreParada = useCallback((id: number, nuevoNombre: string) => {
    setParadas((prev) => prev.map((p) => (p.id === id ? { ...p, nombre: nuevoNombre } : p)));
  }, []);

  const eliminarParada = useCallback((id: number) => {
    setParadas((prev) => {
      const eliminada = prev.find((p) => p.id === id);
      const resto = prev.filter((p) => p.id !== id);
      if (eliminada && mapaRef.current) {
        mapaRef.current.removeLayer(eliminada.marcador);
      }
      return resto;
    });
  }, []);

  const limpiarMapa = useCallback(() => {
    if (mapaRef.current) {
      paradas.forEach(p => mapaRef.current?.removeLayer(p.marcador));
      if (lineaRutaRef.current) mapaRef.current.removeLayer(lineaRutaRef.current);
    }
    setParadas([]);
    setGeometria([]);
  }, [paradas]);

  return {
    paradas,
    geometria,
    agregarParada,
    cargarParadasManuales,
    cambiarNombreParada,
    eliminarParada,
    centrarMapaEn,
    limpiarMapa
  };
};
