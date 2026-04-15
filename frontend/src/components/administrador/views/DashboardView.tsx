import React, { useState, useEffect } from 'react';
import { Activity, AlertOctagon, Bus, Users, Zap, Wrench, Cone, Send } from 'lucide-react';
import { useSocket } from '../../../hooks/useSocket';

export interface DashboardViewProps {
  onGoToIncidents: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onGoToIncidents }) => {
  const { socket } = useSocket();
  const [avisoTexto, setAvisoTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [alertasRecientes, setAlertasRecientes] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;
    const handleIncidencia = (incidencia: any) => {
      setAlertasRecientes(prev => [incidencia, ...prev].slice(0, 5)); // Mostrar sólo últimas 5
    };
    socket.on('reporte_incidencia', handleIncidencia);
    return () => {
      socket.off('reporte_incidencia', handleIncidencia);
    };
  }, [socket]);

  const enviarAvisoGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTexto.trim() || !socket) return;
    setEnviando(true);
    socket.emit('aviso_conductor', {
      mensaje: avisoTexto,
      severidad: 'warning' // o info dependiendo
    });
    setTimeout(() => {
      setAvisoTexto('');
      setEnviando(false);
    }, 500);
  };

  return (
    <div id="view-dashboard" className="space-y-6 fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Bus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+2.5%</span>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wide">Unidades Activas</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            142 <span className="text-sm text-slate-400 font-medium">/ 150</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wide">Pasajeros Hoy</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">8,540</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Atención</span>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wide">Incidentes Activos</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wide">Eficiencia Rutas</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">94.2%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Demanda de Pasajeros (24h)</h3>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1 text-slate-500 font-medium focus:ring-0 cursor-pointer">
              <option>Hoy</option>
              <option>Ayer</option>
              <option>Semana</option>
            </select>
          </div>
          <div className="h-64 flex items-end gap-2 sm:gap-4 justify-between px-2 border-b border-slate-100 pb-2">
            <div className="w-full bg-blue-100 rounded-t-md relative group hover:bg-blue-200 transition-colors" style={{ height: '30%' }}>
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                06:00
              </div>
            </div>
            <div className="w-full bg-blue-500 rounded-t-md relative group hover:bg-blue-600 transition-colors" style={{ height: '85%' }}>
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                09:00
              </div>
            </div>
            <div className="w-full bg-blue-300 rounded-t-md relative group hover:bg-blue-400 transition-colors" style={{ height: '50%' }}>
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                12:00
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-t-md relative group hover:bg-blue-300 transition-colors" style={{ height: '40%' }}>
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                15:00
              </div>
            </div>
            <div className="w-full bg-blue-600 rounded-t-md relative group hover:bg-blue-700 transition-colors" style={{ height: '95%' }}>
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                18:00
              </div>
            </div>
            <div className="w-full bg-blue-400 rounded-t-md relative group hover:bg-blue-500 transition-colors" style={{ height: '60%' }}>
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                21:00
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2 px-2 font-mono">
            <span>06:00</span>
            <span>09:00</span>
            <span>12:00</span>
            <span>15:00</span>
            <span>18:00</span>
            <span>21:00</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Últimas Alertas</h3>
            <button type="button" className="text-blue-600 text-xs font-bold hover:underline" onClick={onGoToIncidents}>
              Ver Todo
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px]">
            {alertasRecientes.length > 0 ? (
              alertasRecientes.map((alerta, idx) => {
                const isSOS = alerta.tipo === 'SOS';
                const isMech = alerta.tipo === 'FALLA_MECANICA';
                return (
                  <div key={idx} className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group fade-in">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSOS ? 'bg-red-100 text-red-600' : isMech ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {isSOS ? <Zap className="w-5 h-5" /> : isMech ? <Wrench className="w-5 h-5" /> : <Cone className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">{alerta.tipo}: Unidad {alerta.unidadId || 'Desconocida'}</p>
                      <p className="text-xs text-slate-500">Recién Recibido • Pendiente</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider block mb-2">Sin Alertas Críticas</span>
                <span className="text-sm">El sistema está operando con normalidad</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- NUEVA CAPA: ENVIAR AVISO --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            Emisión de Aviso a Flotilla
          </h3>
          <p className="text-xs text-slate-500 mt-1">Envía una notificación que aparecerá en las pantallas de todos los conductores activos.</p>
        </div>
        <form onSubmit={enviarAvisoGlobal} className="w-full md:w-1/2 flex gap-3">
          <input
            type="text"
            placeholder="Ej. Tráfico pesado en Av. Central. Tomar precauciones..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-slate-700 font-medium"
            value={avisoTexto}
            onChange={(e) => setAvisoTexto(e.target.value)}
          />
          <button
            type="submit"
            disabled={enviando || !avisoTexto.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {enviando ? 'Enviando...' : 'Enviar Aviso'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DashboardView;
