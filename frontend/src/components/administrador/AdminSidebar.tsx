import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bus,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Route as RouteIcon,
  Users,
  X
} from 'lucide-react';

export type AdminViewId =
  | 'dashboard'
  | 'map'
  | 'drivers'
  | 'routes'
  | 'units'
  | 'incidents'
  | 'reports';

export interface AdminSidebarProps {
  activeView: AdminViewId;
  isOpen: boolean;
  onClose: () => void;
  onSwitchView: (view: AdminViewId) => void;
  onLogout: () => void;
  incidentCount?: number;
}

function navItemClass(isActive: boolean): string {
  const base =
    'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';

  if (isActive) {
    return `${base} bg-blue-600 text-white shadow-md`;
  }

  return `${base} text-slate-400 hover:bg-slate-800 hover:text-white`;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  isOpen,
  onClose,
  onSwitchView,
  onLogout,
  incidentCount = 0
}) => {
  return (
    <aside
      id="sidebar"
      className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform sidebar-transition flex flex-col shadow-2xl lg:shadow-none h-full ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-600/20">
          <span className="font-bold text-lg">U</span>
        </div>
        <span className="text-lg font-bold tracking-wide">
          Xanani <span className="text-blue-500 text-xs uppercase ml-1">Admin</span>
        </span>
        <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white" type="button">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Principal</div>

        <button
          type="button"
          className={navItemClass(activeView === 'dashboard')}
          onClick={() => onSwitchView('dashboard')}
        >
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </button>

        <button type="button" className={navItemClass(activeView === 'map')} onClick={() => onSwitchView('map')}>
          <MapIcon className="w-5 h-5" /> Mapa en Vivo
        </button>

        <div className="px-3 mt-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Gestión</div>

        <button
          type="button"
          className={navItemClass(activeView === 'drivers')}
          onClick={() => onSwitchView('drivers')}
        >
          <Users className="w-5 h-5" /> Conductores e Historial
        </button>

        <button type="button" className={navItemClass(activeView === 'units')} onClick={() => onSwitchView('units')}>
          <Bus className="w-5 h-5" /> Unidades
        </button>

        <button
          type="button"
          className={navItemClass(activeView === 'routes')}
          onClick={() => onSwitchView('routes')}
        >
          <RouteIcon className="w-5 h-5" /> Rutas
        </button>

        <div className="px-3 mt-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Operaciones</div>

        <button
          type="button"
          className={`${navItemClass(activeView === 'incidents')} justify-between group`}
          onClick={() => onSwitchView('incidents')}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 group-hover:text-orange-400" /> Incidentes
          </div>
          {incidentCount > 0 && (
            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-500/20">
              {incidentCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={navItemClass(activeView === 'reports')}
          onClick={() => onSwitchView('reports')}
        >
          <BarChart3 className="w-5 h-5" /> Reportes
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
            <span className="font-bold">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Admin General</p>
            <p className="text-xs text-slate-500 truncate">admin@Xanani.com</p>
          </div>
          <button type="button" className="text-slate-400 hover:text-red-400" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
