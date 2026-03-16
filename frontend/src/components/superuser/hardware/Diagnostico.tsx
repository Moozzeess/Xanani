import { Signal, Cpu, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';

interface DeviceStatusPanelProps {
  deviceStatus: {
    esp32: boolean;
    sim800l: {
      connected: boolean;
      signalStrength: number;
      dataPlanActive: boolean;
    };
  };
}

export const DeviceStatusPanel = ({ deviceStatus }: DeviceStatusPanelProps) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Signal size={16} className="text-blue-500" />
        Estado de Diagnóstico
      </h3>
      
      <div className="space-y-4">
        {/* ESP32 */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deviceStatus.esp32 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
              <Cpu size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Microcontrolador ESP32</p>
              <p className="text-xs text-slate-500">Transmisión principal</p>
            </div>
          </div>
          <div>
            {deviceStatus.esp32 ? 
              <CheckCircle2 size={20} className="text-green-500" /> : 
              <XCircle size={20} className="text-slate-300" />
            }
          </div>
        </div>

        {/* SIM800L */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deviceStatus.sim800l.connected ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                <Signal size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Módulo SIM800L</p>
              </div>
            </div>
            <div>
              {deviceStatus.sim800l.connected ? 
                <CheckCircle2 size={20} className="text-green-500" /> : 
                <XCircle size={20} className="text-slate-300" />
              }
            </div>
          </div>
          
          {/* Detalles del SIM */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Señal</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${deviceStatus.sim800l.signalStrength > 60 ? 'bg-green-500' : deviceStatus.sim800l.signalStrength > 30 ? 'bg-amber-500' : 'bg-red-500'}`} 
                    style={{ width: `${deviceStatus.sim800l.signalStrength}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-slate-600">{deviceStatus.sim800l.signalStrength}%</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Plan de Datos (GPRS)</p>
              <div className="mt-1">
                {deviceStatus.sim800l.dataPlanActive ? (
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded flex items-center w-max gap-1">
                    <Wifi size={10} /> Activo / Disponible
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center w-max gap-1">
                    <WifiOff size={10} /> Inactivo / Sin saldo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
