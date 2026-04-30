import { Signal, Cpu, CheckCircle2, XCircle, Wifi, WifiOff, MapPin } from 'lucide-react';

interface DeviceStatusPanelProps {
  deviceStatus: {
    esp32: boolean;
    macAddress?: string;
    statusCode: number;
    errorMsg?: string;
    sim800l: {
      connected: boolean;
      signalStrength: number;
      dataPlanActive: boolean;
    };
    gps: {
      latitud: number;
      longitud: number;
      conectado: boolean;
      satelites: number;
      velocidad: number;
    };
    pasajeros: {
      entradas: number;
      salidas: number;
      actuales: number;
    };
    celdas: number[];
    is_debug?: boolean;
  };
}

export const DeviceStatusPanel = ({ deviceStatus }: DeviceStatusPanelProps) => {
  const parseEstatusCodigo = (code?: number) => {
    switch (code) {
      case 0: return { t: 'Sistema Operativo', c: 'text-emerald-600', bg: 'bg-emerald-100/50' };
      case 1: return { t: 'Error en Sensores IR', c: 'text-red-600', bg: 'bg-red-100/50' };
      case 2: return { t: 'Falla Módulo GPS', c: 'text-amber-600', bg: 'bg-amber-100/50' };
      case 3: return { t: 'Sin Señal GPRS', c: 'text-rose-600', bg: 'bg-rose-100/50' };
      case 4: return { t: 'Peso Excedido', c: 'text-orange-600', bg: 'bg-orange-100/50' };
      default: return { t: 'Esperando telemetría...', c: 'text-slate-400', bg: 'bg-slate-100' };
    }
  };

  const statusText = parseEstatusCodigo(deviceStatus.statusCode);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Signal size={16} className="text-blue-500" />
        Estado de Diagnóstico Real
      </h3>

      <div className="space-y-4">
        {/* ESP32 */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deviceStatus.esp32 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                <Cpu size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Microcontrolador ESP32</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  Transmisión Principal
                  {deviceStatus.macAddress && (
                    <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[9px] text-slate-600">
                      ID: {deviceStatus.macAddress}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              {deviceStatus.esp32 ?
                <CheckCircle2 size={20} className="text-green-500" /> :
                <XCircle size={20} className="text-slate-300" />
              }
            </div>
          </div>

          <div className={`mt-3 pt-2 text-center rounded-md ${statusText.bg}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Estado del Hardware</p>
            <p className={`text-xs font-bold ${statusText.c}`}>{statusText.t}</p>
            {deviceStatus.errorMsg && (
              <p className="text-[9px] text-red-500 font-mono mt-1 pb-1">{deviceStatus.errorMsg}</p>
            )}
          </div>
        </div>

        {/* GPS Module (NEO-6M) */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deviceStatus.gps.conectado ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Módulo GPS NEO-6M</p>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deviceStatus.gps.satelites > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                    Sats: {deviceStatus.gps.satelites}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                    {deviceStatus.gps.velocidad.toFixed(1)} km/h
                  </span>
                </div>
              </div>
            </div>
            <div>
              {deviceStatus.gps.conectado ?
                <CheckCircle2 size={20} className="text-green-500" /> :
                <XCircle size={20} className="text-slate-300" />
              }
            </div>
          </div>

          {deviceStatus.gps.conectado && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Latitud</p>
                  <p className="text-[11px] font-mono font-bold text-slate-700">{deviceStatus.gps.latitud.toFixed(6)}</p>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Longitud</p>
                  <p className="text-[11px] font-mono font-bold text-slate-700">{deviceStatus.gps.longitud.toFixed(6)}</p>
                </div>
              </div>
            </div>
          )}
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
                    <Wifi size={10} /> Activo
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center w-max gap-1">
                    <WifiOff size={10} /> Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Sensores de Pasajeros e IR */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deviceStatus.statusCode !== 1 ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                  <Signal size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Sensores Infrarrojos (IR)</p>
                  <p className="text-[10px] text-slate-500">Conteo: {deviceStatus.pasajeros.entradas}↑ {deviceStatus.pasajeros.salidas}↓</p>
                </div>
              </div>
              <div>
                {deviceStatus.statusCode !== 1 ?
                  <CheckCircle2 size={20} className="text-green-500" /> :
                  <XCircle size={20} className="text-red-500" />
                }
              </div>
            </div>
          </div>

          {/* Celdas de Carga */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deviceStatus.statusCode !== 4 ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                  <Signal size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Celdas de Carga (HX711)</p>
                  <div className="flex gap-1 mt-0.5">
                    {deviceStatus.celdas.map((c, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${c > 0 ? 'bg-purple-500' : 'bg-slate-300'}`} title={`Celda ${i + 1}: ${c}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                {deviceStatus.statusCode !== 4 ?
                  <CheckCircle2 size={20} className="text-green-500" /> :
                  <XCircle size={20} className="text-red-500" />
                }
              </div>
            </div>
          </div>
        </div>

        {deviceStatus.is_debug && (
          <div className="mt-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Modo Diagnóstico Activo</span>
          </div>
        )}
      </div>
    </div>
  );
};
