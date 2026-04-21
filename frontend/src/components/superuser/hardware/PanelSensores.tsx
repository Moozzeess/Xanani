import { Activity, Users } from 'lucide-react';

interface MapaProps {
  celdasCarga: (boolean | number)[];
  totalAsientos: number;
}

const MapaAsientosHardware = ({ celdasCarga, totalAsientos }: MapaProps) => {
  // Las celdas pueden venir como booleanos (ya procesados) o como valores de peso (números)
  // Si son números, consideramos ocupado si el peso es > 5kg (valor arbitrario, ajustable por hardware)
  const seats = Array.from({ length: totalAsientos }, (_, i) => {
    const val = celdasCarga ? celdasCarga[i] : false;
    // Ahora usamos el factor de calibración para determinar la ocupación
    const isOccupied = typeof val === 'number' ? val > 5 : val === true;
    return {
      id: i + 1,
      ocupado: isOccupied,
      peso: typeof val === 'number' ? val : null
    };
  });

  const numOcupados = seats.filter((a: any) => a.ocupado).length;

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-blue-500" />
          Monitoreo Real de Celdas (HX711)
        </h3>
        <div className="flex gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">
            {numOcupados} Ocupados
          </span>
          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
            {totalAsientos - numOcupados} Libres
          </span>
        </div>
      </div>

      <div className="relative border-2 border-slate-300 bg-white rounded-[2rem] p-4 max-w-[240px] mx-auto shadow-inner">
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-16 bg-slate-200 border-r-2 border-y-2 border-slate-300 rounded-r-xl"></div>
        <div className="grid grid-cols-4 gap-3 justify-items-center">
          {seats.map((asiento: any) => (
            <div
              key={asiento.id}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-300 relative group ${asiento.ocupado
                ? 'bg-red-100 border-2 border-red-500 text-red-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'bg-green-50 border-2 border-green-500 text-green-600'
                }`}
            >
              {asiento.id}
              {asiento.peso !== null && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-1.5 py-0.5 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                  {asiento.peso.toFixed(1)} kg
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SensorDataPanelProps {
  sensorData: {
    celdasCarga: (boolean | number)[];
    pasajeros: {
      entradas: number;
      salidas: number;
      actuales: number;
    };
  };
  capacidadMaxima: number;
}

export const SensorDataPanel = ({ sensorData, capacidadMaxima }: SensorDataPanelProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Mapa de Asientos (Celdas de carga hx711) dinámica referenciado por settings */}
      <div className="md:col-span-1">
        <MapaAsientosHardware
          celdasCarga={sensorData.celdasCarga}
          totalAsientos={capacidadMaxima}
        />
      </div>

      {/* Contadores Infrarrojos */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users size={16} className="text-amber-500" />
            Sensores Infrarrojos (Puertas)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Entradas</p>
              <p className="text-4xl font-black text-green-500">{sensorData.pasajeros.entradas}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Salidas</p>
              <p className="text-4xl font-black text-rose-500">{sensorData.pasajeros.salidas}</p>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center relative overflow-hidden">
            <div className={`absolute inset-0 opacity-10 ${sensorData.pasajeros.actuales > capacidadMaxima ? 'bg-red-500' : 'bg-transparent'}`}></div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 relative z-10">
              Pasajeros a Bordo
               </p>
            <p className={`text-3xl font-black relative z-10 ${sensorData.pasajeros.actuales > capacidadMaxima ? 'text-red-600' : 'text-blue-700'}`}>
              {sensorData.pasajeros.actuales}
               </p>
            </div>
          </div>
        </div>
      </div>
  );
};
