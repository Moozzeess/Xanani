import React from 'react';
import { Plus, Navigation, MapPin, ArrowLeft, Map as MapIcon } from 'lucide-react';

interface PropsListaRutas {
  rutas: any[];
  alHacerClicCrear: () => void;
  alHacerClicEditar: (ruta: any) => void;
}

export const ListaRutas: React.FC<PropsListaRutas> = ({ rutas, alHacerClicCrear, alHacerClicEditar }) => {
  return (
    <div className="flex flex-col gap-6 fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Rutas</h2>
          <p className="text-slate-500 text-sm mt-1">Administra las rutas, variaciones y paradas del sistema.</p>
        </div>
        {rutas.length > 0 && (
          <button 
            onClick={alHacerClicCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Nueva Ruta
          </button>
        )}
      </div>

      {rutas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center mt-4 fade-in">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
            <MapIcon className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No hay rutas registradas</h3>
          <p className="text-slate-500 max-w-md mb-8 leading-relaxed">Aún no has creado ninguna ruta para el sistema. Empieza por crear tu primera ruta, estableciendo un nombre y marcando sus paradas de inicio y final.</p>
          <button 
            onClick={alHacerClicCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Ruta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rutas.map((ruta) => (
            <div key={ruta.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                  <Navigation className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${ruta.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {ruta.estado}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">{ruta.nombre}</h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-3 bg-slate-50 px-3 py-2 rounded-lg w-fit border border-slate-100">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-slate-600">{ruta.paradas} paradas trazadas</span>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => alHacerClicEditar(ruta)}
                  className="bg-slate-50 hover:bg-slate-100 text-blue-600 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors border border-slate-200 hover:border-blue-200"
                >
                  Editar Detalles <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
