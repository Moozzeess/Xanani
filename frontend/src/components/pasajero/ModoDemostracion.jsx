import React, { useEffect, useRef } from 'react';
import { Bus, MapPin, Bell } from 'lucide-react';

/**
 * Coordenadas de los puntos icónicos de CDMX para la demostración.
 * Las unidades recorren este circuito cuando no hay datos reales.
 */
const CIRCUITO_DEMO = [
  [19.4326, -99.1332],  // Zócalo
  [19.4380, -99.1413],  // Eje Central
  [19.4278, -99.1640],  // Paseo de la Reforma
  [19.4327, -99.1900],  // Polanco
  [19.4510, -99.1411],  // Tlatelolco
];

const UNIDADES_DEMO = [
  { id: 'demo-1', placa: 'MX-DEMO-1', nombre: 'Ruta Centro-Reforma', color: '#3b82f6', offset: 0 },
  { id: 'demo-2', placa: 'MX-DEMO-2', nombre: 'Ruta Polanco-Centro', color: '#10b981', offset: 2 },
  { id: 'demo-3', placa: 'MX-DEMO-3', nombre: 'Ruta Tlatelolco', color: '#f59e0b', offset: 4 },
];

const VELOCIDAD_DEMO = 5000; // ms por punto

/**
 * Overlay de modo demostración.
 * Se activa cuando useVehiculos detecta lista vacía de unidades reales.
 * Muestra unidades estáticas animadas sobre el mapa con rutas CDMX predefinidas.
 * Las unidades demo están visualmente marcadas como [DEMO] para no confundir.
 */
const ModoDemostracion = ({
  activo = false,
  onActivarAlerta,
  onSalir,
  onUnidadesDemoChange,
}) => {
  const intervalRef = useRef(null);
  const indicesRef = useRef(UNIDADES_DEMO.map((u) => u.offset % CIRCUITO_DEMO.length));

  useEffect(() => {
    if (!activo) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      onUnidadesDemoChange?.([]);
      return;
    }

    // Emitir posiciones iniciales
    const emitir = () => {
      const posiciones = UNIDADES_DEMO.map((u, i) => ({
        ...u,
        posicion: CIRCUITO_DEMO[indicesRef.current[i]],
        esDemo: true,
        pctOcupacion: Math.floor(Math.random() * 80) + 10,
        nivelOcupacion: 'Media',
        tendencia: 'estable',
        eta: Math.floor(Math.random() * 8) + 1,
        estado: 'en_ruta',
      }));

      onUnidadesDemoChange?.(posiciones);

      // Avanzar cada unidad al siguiente punto del circuito
      indicesRef.current = indicesRef.current.map(
        (idx) => (idx + 1) % CIRCUITO_DEMO.length
      );
    };

    emitir();
    intervalRef.current = setInterval(emitir, VELOCIDAD_DEMO);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activo, onUnidadesDemoChange]);

  if (!activo) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 px-4 z-[900] pointer-events-none">
      {/* Banner de modo demo */}
      <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border-b border-amber-500/30">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
            Modo demostración — Sin unidades reales activas
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Así funciona Xanani
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mostrando 3 unidades de ejemplo recorriendo CDMX
              </p>
            </div>
          </div>

          {/* Unidades demo visibles */}
          <div className="flex gap-2 mb-4">
            {UNIDADES_DEMO.map((u) => (
              <div
                key={u.id}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl"
                style={{ backgroundColor: u.color + '22', border: `1px solid ${u.color}44` }}
              >
                <MapPin className="w-3 h-3" style={{ color: u.color }} />
                <span className="text-[9px] font-bold text-white">{u.placa}</span>
                <span className="text-[8px] text-slate-500 font-medium">DEMO</span>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={onActivarAlerta}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 rounded-xl text-xs font-bold text-white active:scale-95 transition-all"
            >
              <Bell className="w-3.5 h-3.5" /> Activar alerta
            </button>
            <button
              onClick={onSalir}
              className="px-4 py-2.5 bg-white/10 rounded-xl text-xs font-bold text-white active:scale-95 transition-all hover:bg-white/20"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModoDemostracion;
