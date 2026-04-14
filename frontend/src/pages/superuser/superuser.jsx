import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { LogOut, LayoutDashboard, Cpu, Users, Activity, Map } from "lucide-react";
import HardwareTest from "./HardwareTest";
import GlobalAnalyticsView from './GlobalAnalyticsView';
import ManageAdminsView from './ManageAdminsView';
import SystemHealthView from './SystemHealthView';
import GlobalHeatmapView from './GlobalHeatmapView';

const Superususario = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  const [activeTab, setActiveTab] = useState('analytics');

  const onLogout = () => {
    cerrarSesion();
    navigate("/", { replace: true });
  };

  const renderTab = (id, icon, label) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
          isActive
            ? 'border-blue-500 text-blue-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        }`}
      >
        {icon} {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navegación Superior */}
      <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wide">Panel Superusuario</h1>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Sistema de Control Global</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          <LogOut size={16} /> Salir
        </button>
      </nav>

      {/* Menú de Pestañas */}
      <div className="bg-slate-800 px-6 shrink-0 border-b border-slate-700 overflow-x-auto">
        <div className="flex gap-4">
          {renderTab('analytics', <LayoutDashboard size={18} />, 'Analítica Global')}
          {renderTab('admins',    <Users size={18} />,           'Gestión de Administradores')}
          {renderTab('hardware',  <Cpu size={18} />,             'Pruebas de Hardware')}
          {renderTab('health',    <Activity size={18} />,        'Estado del Sistema')}
          {renderTab('heatmap',   <Map size={18} />,             'Mapa de Calor')}
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <main className="flex-1 overflow-hidden p-6 relative bg-slate-100">
        <div className="h-full overflow-y-auto">

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Analítica Global del Sistema</h2>
              <p className="text-slate-500 mb-8">Métricas agregadas de uso, volúmenes de flotillas y demanda general.</p>
              <GlobalAnalyticsView />
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Gestión de Administradores</h2>
              <p className="text-slate-500 mb-8">Control de cuentas de dueños de flotillas y accesos.</p>
              <ManageAdminsView />
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="h-full">
              <HardwareTest />
            </div>
          )}

          {activeTab === 'health' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Estado de Servidores e IoT</h2>
              <p className="text-slate-500 mb-8">Monitoreo de red, backend y conexiones de base de datos.</p>
              <SystemHealthView />
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Mapa de Calor Global</h2>
              <p className="text-slate-500 mb-6">Concentración de unidades operando en tiempo real mediante la plataforma.</p>
              <div className="flex-1">
                <GlobalHeatmapView />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Superususario;
