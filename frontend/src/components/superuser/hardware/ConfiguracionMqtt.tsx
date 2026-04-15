import { Settings, RefreshCw, Save } from 'lucide-react';

interface MqttSettingsPanelProps {
  mqttConfig: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onPing: () => void;
  isConnected: boolean;
  isConnecting: boolean;
}

export const MqttSettingsPanel = ({
  mqttConfig,
  onChange,
  onConnect,
  onDisconnect,
  onPing,
  isConnected,
  isConnecting
}: MqttSettingsPanelProps) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Settings size={16} className="text-slate-400" />
        Configuración del Bróker MQTT
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Broker URL</label>
          <input 
            type="text" 
            name="broker"
            value={mqttConfig.broker}
            onChange={onChange}
            disabled={isConnected || isConnecting}
            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Puerto</label>
            <input 
              type="text" 
              name="port"
              value={mqttConfig.port}
              onChange={onChange}
              disabled={isConnected || isConnecting}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Tópico Inicial</label>
            <input 
              type="text" 
              name="topic"
              value={mqttConfig.topic}
              onChange={onChange}
              disabled={isConnected || isConnecting}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Usuario (Opcional)</label>
            <input 
              type="text" 
              name="username"
              value={mqttConfig.username}
              onChange={onChange}
              disabled={isConnected || isConnecting}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
            <input 
              type="password" 
              name="password"
              value={mqttConfig.password}
              onChange={onChange}
              disabled={isConnected || isConnecting}
              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="pt-3 flex gap-2 w-full">
          {!isConnected ? (
            <button 
              onClick={onConnect}
              disabled={isConnecting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isConnecting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {isConnecting ? 'Conectando...' : 'Conectar y Guardar'}
            </button>
          ) : (
            <div className="flex w-full gap-2">
               <button 
                 onClick={onPing}
                 className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
               >
                 Ping (Test Mosquitto)
               </button>
               <button 
                 onClick={onDisconnect}
                 className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
               >
                 Desconectar
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
