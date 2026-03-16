import { CheckCircle2 } from 'lucide-react';

interface ConfigSummaryPanelProps {
  isConnected: boolean;
  esp32Online: boolean;
  mqttConfig: {
    broker: string;
    port: string;
  };
  simSignalStrength: number;
  hardwareSettings: {
    capacidadMaxima: number;
    umbralPeso: number;
  };
  entradas: number;
  salidas: number;
}

export const ConfigSummaryPanel = ({
  isConnected,
  esp32Online,
  mqttConfig,
  simSignalStrength,
  hardwareSettings,
  entradas,
  salidas
}: ConfigSummaryPanelProps) => {
  if (!isConnected || !esp32Online) return null;

  return (
    <div className="bg-indigo-900 border border-indigo-800 p-5 rounded-xl mt-6 relative overflow-hidden text-white shadow-xl">
       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
       <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

       <h3 className="text-sm font-bold text-indigo-200 mb-4 flex items-center gap-2 relative z-10">
          <CheckCircle2 size={16} />
          Resumen del Subsistema de Transporte
       </h3>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 text-xs">
          <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-800/50">
             <p className="text-indigo-300 font-bold mb-1">Conexión y Red</p>
             <p><span className="text-slate-400">Bróker Activo:</span> {mqttConfig.broker}:{mqttConfig.port}</p>
             <p><span className="text-slate-400">Topología GPRS:</span> Sim800L ({simSignalStrength}%)</p>
          </div>
          <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-800/50">
             <p className="text-indigo-300 font-bold mb-1">Parametrización</p>
             <p><span className="text-slate-400">Capacidad Oficial:</span> {hardwareSettings.capacidadMaxima} pasjx.</p>
             <p><span className="text-slate-400">Tara Sensores Peso:</span> {hardwareSettings.umbralPeso} Kg</p>
          </div>
          <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-800/50">
             <p className="text-indigo-300 font-bold mb-1">Diagnóstico en Vivo</p>
             <p><span className="text-slate-400">Estado ESP32:</span> <span className="text-green-400">Despachando En Vivo</span></p>
             <p><span className="text-slate-400">Total Tickets:</span> {entradas} Subidas / {salidas} Bajadas</p>
          </div>
       </div>
    </div>
  );
};
