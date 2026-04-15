import React from 'react';
import { Wrench, Zap } from 'lucide-react';

const IncidentsView: React.FC = () => {
  return (
    <div id="view-incidents" className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0 animate-pulse">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">SOS: Conductor Juan Pérez (Unidad 814)</h3>
              <p className="text-red-700 text-sm mt-1">Botón de pánico activado. Ubicación: Av. Central esq. Norte 5.</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-white/50 text-red-800 text-xs px-2 py-1 rounded border border-red-200">Hace 2 min</span>
                <span className="bg-white/50 text-red-800 text-xs px-2 py-1 rounded border border-red-200">Alta Prioridad</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button type="button" className="flex-1 md:flex-none bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-50">
              Ver Mapa
            </button>
            <button
              type="button"
              className="flex-1 md:flex-none bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 shadow-lg shadow-red-600/20"
            >
              Atender
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Falla Mecánica Ligera</h3>
              <p className="text-slate-500 text-sm mt-1">Unidad 992 reporta calentamiento de motor.</p>
            </div>
          </div>
          <button type="button" className="text-slate-500 hover:text-blue-600 font-medium text-sm">
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentsView;
