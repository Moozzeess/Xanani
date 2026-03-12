import React from 'react';
import { Activity, AlertOctagon, Bus, Users, Zap, Wrench, Cone } from 'lucide-react';

export interface DashboardViewProps {
  onGoToIncidents: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onGoToIncidents }) => {
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
            <div className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">SOS Activo: Unidad 814</p>
                <p className="text-xs text-slate-500">Hace 2 min • Ruta Centro</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">Falla Mecánica: Unidad 992</p>
                <p className="text-xs text-slate-500">Hace 15 min • Taller Central</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                <Cone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">Tráfico Pesado: Av. Sur</p>
                <p className="text-xs text-slate-500">Hace 40 min • Reporte Automático</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
