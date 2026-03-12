import React from 'react';
import { Edit2, History, Search, Star, Trash, UserPlus, ArrowRight } from 'lucide-react';

const DriversView: React.FC = () => {
  return (
    <div id="view-drivers" className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <h3 className="font-bold text-slate-700">Directorio de Conductores</h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar conductor..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Conductor</th>
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    JP
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Juan Pérez</div>
                    <div className="text-xs text-slate-400">ID: 8821</div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono">MX7-814</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Activo</span>
                </td>
                <td className="px-6 py-4 flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.8
                </td>
                <td className="px-6 py-4 text-right">
                  <button type="button" className="text-slate-400 hover:text-blue-600 px-2">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button" className="text-slate-400 hover:text-red-600 px-2">
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    AR
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Ana Ruiz</div>
                    <div className="text-xs text-slate-400">ID: 9912</div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono">MX7-992</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Activo</span>
                </td>
                <td className="px-6 py-4 flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.9
                </td>
                <td className="px-6 py-4 text-right">
                  <button type="button" className="text-slate-400 hover:text-blue-600 px-2">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="bg-slate-700 text-white py-3 px-6 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <History className="w-5 h-5" /> Historial de Viajes Recientes
          </h2>
          <button type="button" className="text-slate-300 hover:text-white text-sm">
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-bold text-slate-700">Unidad</th>
                <th className="px-6 py-3 font-bold text-slate-700">Estado Final</th>
                <th className="px-6 py-3 font-bold text-slate-700">Hora Inicio</th>
                <th className="px-6 py-3 font-bold text-slate-700">Duración</th>
                <th className="px-6 py-3 font-bold text-slate-700">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">MX7-814</td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-bold">Completado</span>
                </td>
                <td className="px-6 py-4">07:00 AM</td>
                <td className="px-6 py-4">3h 51m</td>
                <td className="px-6 py-4">
                  <button type="button" className="bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-200 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">MX7-992</td>
                <td className="px-6 py-4">
                  <span className="text-orange-500 font-bold">Interrumpido</span>
                </td>
                <td className="px-6 py-4">07:08 AM</td>
                <td className="px-6 py-4">3h 43m</td>
                <td className="px-6 py-4">
                  <button type="button" className="bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-200 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">MX7-001</td>
                <td className="px-6 py-4">
                  <span className="text-slate-400 font-bold">Cancelado</span>
                </td>
                <td className="px-6 py-4">06:45 AM</td>
                <td className="px-6 py-4">--</td>
                <td className="px-6 py-4">
                  <button type="button" className="bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-200 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriversView;
