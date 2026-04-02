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
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; font-family: sans-serif;">${indice + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

export const useMapaRutas = (idContenedorMapa: string, activo: boolean) => {
  const mapaRef = useRef<L.Map | null>(null);
  const lineaRutaRef = useRef<L.Polyline | null>(null);
  
  const [paradas, setParadas] = useState<ItemParada[]>([]);
  const paradasRef = useRef<ItemParada[]>([]);
  const [geometria, setGeometria] = useState<L.LatLngTuple[]>([]);

  // Efecto para inicializar el mapa
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

    if (paradas.length > 0) {
        paradas.forEach(p => {
           p.marcador.addTo(mapaRef.current!);
        });
        setParadas([...paradas]);
    }

    const temporizadorRedimension = window.setTimeout(() => {
      mapaRef.current?.invalidateSize();
    }, 100);

    return () => {
      window.clearTimeout(temporizadorRedimension);
      if (lineaRutaRef.current && mapaRef.current) {
        mapaRef.current.removeLayer(lineaRutaRef.current);
        lineaRutaRef.current = null;
      }
      if (mapaRef.current) {
        mapaRef.current.remove();
        mapaRef.current = null;
      }
    };
  }, [activo, idContenedorMapa]); // agregarParada no está en dependencias para evitar ciclos, o lo definimos con refs

  // Efecto para actualizar iconos de marcadores y trazar línea OSRM
  useEffect(() => {
    let montado = true;
    paradasRef.current = paradas;
    const mapa = mapaRef.current;
    
    // Actualizar dinámicamente iconos
    paradas.forEach((p, idx) => {
      p.marcador.setIcon(crearIconoMarcador(idx, paradas.length));
    });

    if (!mapa || paradas.length < 2) {
      if (lineaRutaRef.current && mapa) {
        mapa.removeLayer(lineaRutaRef.current);
        lineaRutaRef.current = null;
      }
      return;
    }

    const actualizarTrazo = async () => {
      const coordenadas = paradas.map((p) => `${p.marcador.getLatLng().lng},${p.marcador.getLatLng().lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordenadas}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!montado) return;

        let latlngs: L.LatLngTuple[] = [];

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          latlngs = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        } else {
          latlngs = paradas.map((p) => [p.marcador.getLatLng().lat, p.marcador.getLatLng().lng] as L.LatLngTuple);
        }

        if (lineaRutaRef.current) {
          mapa.removeLayer(lineaRutaRef.current);
        }

        lineaRutaRef.current = L.polyline(latlngs, {
          color: '#3b82f6',
          weight: 5,
        }).addTo(mapa);
        
        setGeometria(latlngs);

      } catch (err) {
        if (!montado) return;
        if (lineaRutaRef.current) {
          mapa.removeLayer(lineaRutaRef.current);
        }
        const coordsRespaldo = paradas.map((p) => [p.marcador.getLatLng().lat, p.marcador.getLatLng().lng] as L.LatLngTuple);
        lineaRutaRef.current = L.polyline(coordsRespaldo, {
          color: '#3b82f6',
          weight: 4,
          dashArray: '10, 10'
        }).addTo(mapa);

        setGeometria(coordsRespaldo);
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
      if (!nombreDefecto) {
          if (prev.length === 0) nombreAsignado = 'Parada de Salida (Inicio)';
          else if (prev.length === 1) nombreAsignado = 'Parada de Llegada (Destino)';
      }

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

  const cargarParadasManuales = useCallback((nuevasParadas: { nombre: string, latitud: number, longitud: number }[]) => {
    const mapa = mapaRef.current;
    if (!mapa) {
      setTimeout(() => cargarParadasManuales(nuevasParadas), 200);
      return;
    }
    
    // Limpiar previas
    setParadas((prev) => {
      prev.forEach(p => mapa.removeLayer(p.marcador));
      return [];
    });

    const nuevas = nuevasParadas.map((np, idx) => {
      const latlng = L.latLng(np.latitud, np.longitud);
      const marcador = L.marker(latlng, { 
          draggable: true,
          icon: crearIconoMarcador(idx, nuevasParadas.length)
      }).addTo(mapa);
      
      marcador.on('dragend', () => {
        setParadas((actual) => [...actual]);
      });
      return { id: idx + 1, marcador, nombre: np.nombre };
    });
    
    setParadas(nuevas);
    if (nuevas.length > 0) {
      mapa.setView([nuevas[0].marcador.getLatLng().lat, nuevas[0].marcador.getLatLng().lng], 14);
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
    }
    setParadas([]);
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
