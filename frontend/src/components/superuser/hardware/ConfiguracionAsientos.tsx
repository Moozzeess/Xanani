import { SlidersHorizontal, Send, RefreshCw, Power } from 'lucide-react';

interface InteractiveSettingsPanelProps {
  hardwareSettings: {
    capacidadMaxima: number;
    factorCalibracion: number;
    powerOn: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendConfig: () => void;
  onResetCounters: () => void;
  onTogglePower: () => void;
  isConnected: boolean;
}

export const InteractiveSettingsPanel = ({
  hardwareSettings,
  onChange,
  onSendConfig,
  onResetCounters,
  onTogglePower,
  isConnected
}: InteractiveSettingsPanelProps) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-indigo-500" />
        Configuración Interactiva (ESP32)
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Capacidad Max. (Asientos)</label>
            <input 
              type="number" 
              name="capacidadMaxima"
              value={hardwareSettings.capacidadMaxima}
              onChange={onChange}
              min={1}
              disabled={!isConnected}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Factor Calibración HX711</label>
            <input 
              type="number" 
              name="factorCalibracion"
              value={hardwareSettings.factorCalibracion}
              onChange={onChange}
              min={0}
              step={0.5}
              disabled={!isConnected}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>
        
        <div className="flex gap-2 pt-2 flex-wrap">
          <button 
            onClick={onTogglePower}
            disabled={!isConnected}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50 ${hardwareSettings.powerOn ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          >
            <Power size={14} /> {hardwareSettings.powerOn ? 'Apagar Equipo' : 'Encender Equipo'}
          </button>
          <button 
            onClick={onSendConfig}
            disabled={!isConnected}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} /> Aplicar Variables
          </button>
          <button 
            onClick={onResetCounters}
            disabled={!isConnected}
            className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} /> Reset Contadores
          </button>
        </div>
      </div>
    </div>
  );
};
