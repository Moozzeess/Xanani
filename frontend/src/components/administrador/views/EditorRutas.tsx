import React, { useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Trash2, ArrowLeft, Map as MapIcon, X, Loader2, GripVertical, RotateCcw } from 'lucide-react';
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
    reordenarParadas,
    centrarMapaEn,
    limpiarMapa
  } = useMapaRutas('mapa-rutas', true);

  const [indiceArrastrado, setIndiceArrastrado] = useState<number | null>(null);

  const manejarDragStart = (index: number) => {
    setIndiceArrastrado(index);
  };

  const manejarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const manejarDrop = (index: number) => {
    if (indiceArrastrado !== null && indiceArrastrado !== index) {
      reordenarParadas(indiceArrastrado, index);
    }
    setIndiceArrastrado(null);
  };

  React.useEffect(() => {
    if (rutaInicial) {
      setNombreRuta(rutaInicial.nombre || '');
      if (rutaInicial.paradas && Array.isArray(rutaInicial.paradas)) {
        cargarParadasManuales(rutaInicial.paradas);
      }
    }
  }, [rutaInicial, cargarParadasManuales]);

  // Efecto de búsqueda automática con debounce
  React.useEffect(() => {
    if (!consultaBusqueda.trim()) {
      setResultadosBusqueda([]);
      return;
    }

    const timer = setTimeout(() => {
      if (consultaBusqueda.length >= 3) {
        ejecutarBusqueda(consultaBusqueda);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [consultaBusqueda]);

  const ejecutarBusqueda = async (query: string) => {
    setBuscando(true);
    try {
      // Optimizamos la búsqueda para México y pedimos detalles de dirección
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=mx&addressdetails=1&limit=10&viewbox=-118.3,32.7,-86.7,14.5`;
      const respuesta = await fetch(url);
      const datos = await respuesta.json();
      setResultadosBusqueda(datos);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setBuscando(false);
    }
  };

  const buscarDireccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (consultaBusqueda.trim()) {
      ejecutarBusqueda(consultaBusqueda);
    }
  };

  const seleccionarResultado = async (resultado: ResultadoBusqueda) => {
    const lat = parseFloat(resultado.lat);
    const lon = parseFloat(resultado.lon);

    centrarMapaEn(lat, lon);
    await agregarParada(L.latLng(lat, lon), resultado.display_name.split(',')[0]);

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
          <form onSubmit={buscarDireccion} className="relative group">
            <input
              type="text"
              value={consultaBusqueda}
              onChange={(e) => setConsultaBusqueda(e.target.value)}
              placeholder="Ej. Av. Universidad 3000, Coyoacán..."
              className="w-full border border-slate-200 bg-white rounded-lg pl-10 pr-24 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            
            <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
              {consultaBusqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setConsultaBusqueda('');
                    setResultadosBusqueda([]);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={buscando}
                className="px-4 h-full bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700 shadow-sm transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {buscando ? <Loader2 className="w-3.3 h-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </form>

          {/* Resultados de búsqueda */}
          {resultadosBusqueda.length > 0 && (
            <div className="dropdown-resultados-busqueda shadow-2xl border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {resultadosBusqueda.map((res) => {
                // Limpiar un poco el nombre para que no sea excesivamente largo
                const nombreCorto = res.display_name.split(',').slice(0, 3).join(',');
                const detalleExtra = res.display_name.split(',').slice(3, 5).join(',').trim();
                
                return (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => seleccionarResultado(res)}
                    className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-blue-50 focus:bg-blue-50 flex items-start gap-3 last:border-0 transition-colors group/item"
                  >
                    <MapPin className="w-5 h-5 text-blue-400 group-hover/item:text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 line-clamp-1">{nombreCorto}</span>
                      {detalleExtra && <span className="text-[10px] text-slate-500 line-clamp-1 italic">{detalleExtra}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {buscando && resultadosBusqueda.length === 0 && (
            <div className="dropdown-resultados-busqueda p-4 text-center text-slate-400 text-xs italic">
              Buscando ubicaciones...
            </div>
          )}
          
          {!buscando && consultaBusqueda.length >= 3 && resultadosBusqueda.length === 0 && (
            <div className="dropdown-resultados-busqueda p-4 text-center text-slate-400 text-xs italic">
              No se encontraron resultados precisos. Intenta simplificar la dirección.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mb-6 min-h-[200px]">
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-white z-10 py-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">Estaciones de la Ruta</label>
            <div className="flex items-center gap-2">
              {paradas.length > 0 && (
                <button
                  type="button"
                  onClick={limpiarMapa}
                  className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                  title="Eliminar selección"
                >
                  <RotateCcw className="w-3 h-3" /> Limpiar Selección
                </button>
              )}
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold shadow-sm">{paradas.length} <span className="hidden sm:inline">paradas</span></span>
            </div>
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
                <div 
                  key={parada.id} 
                  draggable
                  onDragStart={() => manejarDragStart(indice)}
                  onDragOver={manejarDragOver}
                  onDrop={() => manejarDrop(indice)}
                  className={`flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm transition-all group fade-in cursor-move ${bordeContenedor} ${indiceArrastrado === indice ? 'opacity-40 border-blue-400 bg-blue-50 scale-95' : 'hover:scale-[1.01]'}`}
                >
                  <div className="p-1 text-slate-300 group-hover:text-slate-500">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className={`w-12 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold shadow-sm shrink-0 border ${colorBadge}`}>
                    <span className="text-[8px] min-h-[10px] opacity-80 uppercase tracking-tighter">{etiquetaTipo}</span>
                    <span className="text-sm leading-none">{indice + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={parada.nombre}
                      onChange={(e) => cambiarNombreParada(parada.id, e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 w-full outline-none focus:border-b border-blue-500 px-1 py-0.5 truncate"
                      placeholder="Nombre de estación"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarParada(parada.id)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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