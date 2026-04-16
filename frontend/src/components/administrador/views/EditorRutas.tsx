import React, { useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Trash2, ArrowLeft, Map as MapIcon } from 'lucide-react';
import { useMapaRutas } from '../../../hooks/useMapaRutas';

interface ResultadoBusqueda {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface PropsEditorRutas {
  disparar: any;
  rutaInicial?: any;
  alGuardarExitoso: (nuevaRuta: any) => void;
  alVolver: () => void;
}

export const EditorRutas: React.FC<PropsEditorRutas> = ({ disparar, rutaInicial, alGuardarExitoso, alVolver }) => {
  const [nombreRuta, setNombreRuta] = useState('');
  const [consultaBusqueda, setConsultaBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Hook personalizado que maneja OSRM y Leaflet
  const {
    paradas,
    geometria,
    agregarParada,
    cargarParadasManuales,
    cambiarNombreParada,
    eliminarParada,
    centrarMapaEn,
    limpiarMapa
  } = useMapaRutas('mapa-rutas', true);

  React.useEffect(() => {
    if (rutaInicial) {
      setNombreRuta(rutaInicial.nombre || '');
      if (rutaInicial.paradas && Array.isArray(rutaInicial.paradas)) {
        cargarParadasManuales(rutaInicial.paradas);
      }
    }
  }, [rutaInicial, cargarParadasManuales]);

  const buscarDireccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaBusqueda.trim()) return;

    setBuscando(true);
    try {
      const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(consultaBusqueda)}`);
      const datos = await respuesta.json();
      setResultadosBusqueda(datos);
    } catch (error) {
      console.error('Error buscando dirección:', error);
      disparar({
        tipo: 'error',
        titulo: 'Error de Búsqueda',
        mensaje: 'No se pudo contactar al servicio de mapas. Intente de nuevo.'
      });
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarResultado = (resultado: ResultadoBusqueda) => {
    const lat = parseFloat(resultado.lat);
    const lon = parseFloat(resultado.lon);

    centrarMapaEn(lat, lon);
    agregarParada(L.latLng(lat, lon), resultado.display_name.split(',')[0]);

    setResultadosBusqueda([]);
    setConsultaBusqueda('');
  };

  const guardarYFinalizar = () => {
    if (!nombreRuta.trim()) {
      disparar({
        tipo: 'error',
        titulo: 'Falta un dato',
        mensaje: 'Por favor, ingresa un nombre para la nueva ruta antes de guardarla.'
      });
      return;
    }

    if (paradas.length < 2) {
      disparar({
        tipo: 'error',
        titulo: 'Paradas insuficientes',
        mensaje: 'La ruta debe tener al menos una Parada de Inicio y una Parada Final (Mínimo 2 paradas).'
      });
      return;
    }

    disparar({
      tipo: 'exito',
      titulo: 'Procesando Ruta',
      mensaje: `La ruta "${nombreRuta}" ha sido trazada y se enviará para guardarse.`
    });

    const paradasMapeadas = paradas.map(p => ({
      nombre: p.nombre,
      latitud: p.marcador.getLatLng().lat,
      longitud: p.marcador.getLatLng().lng
    }));

    const geometriaMapeada = geometria.map(g => ({
      latitud: g[0],
      longitud: g[1]
    }));

    const nuevaRuta = {
      nombre: nombreRuta,
      paradas: paradasMapeadas,
      geometria: geometriaMapeada,
      configuracionDespacho: {
        modo: 'intervalo',
        intervaloMinutos: 5,
        requiereVehiculoLleno: false,
        capacidadMaxima: 15
      }
    };

    alGuardarExitoso(nuevaRuta);
    limpiarMapa();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 fade-in">
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <button
            onClick={alVolver}
            className="p-2 hover:bg-slate-100 bg-slate-50 rounded-lg text-slate-500 transition-colors border border-slate-200"
            title="Volver a la lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-lg text-slate-800 leading-tight">Creador de Rutas</h3>
            <p className="text-xs text-slate-500">Configura el nombre y sus paradas</p>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre de la Ruta <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={nombreRuta}
            onChange={(e) => setNombreRuta(e.target.value)}
            placeholder="Ej. Línea 1, Ruta Centro..."
            className="w-full border border-slate-200 bg-slate-50 hover:bg-white rounded-lg px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>

        <div className="mb-6 relative z-50">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Añadir Paradas (Inicio, Intermedias, Final)</label>
          <form onSubmit={buscarDireccion} className="relative">
            <input
              type="text"
              value={consultaBusqueda}
              onChange={(e) => setConsultaBusqueda(e.target.value)}
              placeholder="Escribe una dirección..."
              className="w-full border border-slate-200 bg-white rounded-lg pl-10 pr-20 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <button
              type="submit"
              disabled={buscando}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700 shadow-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </form>

          {/* Resultados de búsqueda */}
          {resultadosBusqueda.length > 0 && (
            <div className="dropdown-resultados-busqueda">
              {resultadosBusqueda.map((res) => (
                <button
                  key={res.place_id}
                  type="button"
                  onClick={() => seleccionarResultado(res)}
                  className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-blue-50 focus:bg-blue-50 flex items-start gap-3 last:border-0 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-700 line-clamp-2">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mb-6 min-h-[200px]">
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-white z-10 py-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Estaciones de la Ruta</label>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold shadow-sm">{paradas.length} <span className="hidden sm:inline">paradas</span></span>
          </div>

          <div className="space-y-3">
            {paradas.map((parada, indice) => {
              const esPrimera = indice === 0;
              const esUltima = indice === paradas.length - 1 && paradas.length > 1;

              let etiquetaTipo = "INTERMEDIA";
              let colorBadge = "bg-blue-50 text-blue-600 border-blue-100";
              let bordeContenedor = "border-slate-200 hover:border-blue-300";

              if (esPrimera) {
                etiquetaTipo = "INICIO";
                colorBadge = "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-200/50";
                bordeContenedor = "border-emerald-200 hover:border-emerald-300";
              } else if (esUltima) {
                etiquetaTipo = "FINAL";
                colorBadge = "bg-red-50 text-red-600 border-red-100 shadow-red-200/50";
                bordeContenedor = "border-red-200 hover:border-red-300";
              }

              return (
                <div key={parada.id} className={`flex items-center gap-3 bg-white p-3 rounded-xl border shadow-sm transition-all group fade-in ${bordeContenedor}`}>
                  <div className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold shadow-sm shrink-0 border ${colorBadge}`}>
                    <span className="text-[9px] min-h-[12px] opacity-80 uppercase tracking-tighter">{etiquetaTipo}</span>
                    <span className="text-base leading-none">{indice + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={parada.nombre}
                    onChange={(e) => cambiarNombreParada(parada.id, e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 w-full outline-none focus:border-b-2 border-slate-300 focus:border-blue-500 px-1 py-1"
                    placeholder="Nombre de estación"
                  />
                  <button
                    type="button"
                    onClick={() => eliminarParada(parada.id)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 shrink-0"
                    title="Eliminar parada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {paradas.length === 0 && (
              <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <MapIcon className="w-8 h-8 text-slate-300" />
                <span className="text-sm font-medium">No hay paradas en la ruta.</span>
                <span className="text-xs">Usa la búsqueda para agregar la parada de Inicio.</span>
              </div>
            )}
            {paradas.length === 1 && (
              <div className="text-center py-4 text-emerald-500 flex items-center justify-center gap-2 border border-dashed border-emerald-200 rounded-xl bg-emerald-50/50">
                <span className="text-sm font-medium">Agrega otra parada para establecer el Final.</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={guardarYFinalizar}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2"
        >
          Guardar Ruta
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col h-full min-h-[400px]">
        {/* El contenedor mapa-rutas usará 100% gracias al CSS en VistaRutas.css */}
        <div id="mapa-rutas" className="contenedor-mapa-rutas" />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-lg text-xs font-bold text-slate-700 shadow-lg border border-slate-200 z-[400] flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          Editor de rutas activo.
        </div>
      </div>
    </div>
  );
};