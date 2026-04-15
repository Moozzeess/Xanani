import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { LogOut, LayoutDashboard, Cpu, Server } from "lucide-react";
import HardwareTest from "./HardwareTest"; // Componente con la página de pruebas
import ListaDispositivos from "./ListaDispositivos"; // Lista de dispositivos

const Superususario = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  // Estado para manejar qué vista (tab) se está mostrando
  const [activeTab, setActiveTab] = useState('dashboard');
  const [testDevice, setTestDevice] = useState(null);

  const onLogout = () => {
    cerrarSesion();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navegación Superior (Top Navbar) */}
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

      {/* Menú de Pestañas (Tabs) */}
      <div className="bg-slate-800 px-6 shrink-0 border-b border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dashboard'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <LayoutDashboard size={18} /> Dashboard Principal
          </button>
          <button
            onClick={() => setActiveTab('hardware_list')}
            className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'hardware_list' || activeTab === 'hardware_new'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Server size={18} /> Inventario Hardware
          </button>
        </div>
      </div>

      {/* Área de Contenido Principal (Scrollable) */}
      <main className="flex-1 overflow-hidden p-6 relative">
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-full">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Resumen General</h2>
            <p className="text-slate-500 mb-8">Hola mundo esta esla vista de superusuruario.</p>
            {/* Aquí iría el contenido original del dashboard del superusuario */}
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Módulos del Sistema</span>
            </div>
          </div>
        )}

        {activeTab === 'hardware_list' && (
          <div className="h-full">
            <ListaDispositivos
              onAddNew={() => {
                setTestDevice(null);
                setActiveTab('hardware_new');
              }}
              onTestDevice={(disp) => {
                setTestDevice(disp);
                setActiveTab('hardware_new');
              }}
            />
          </div>
        )}

        {activeTab === 'hardware_new' && (
          <div className="h-full flex flex-col">
            <button
              onClick={() => setActiveTab('hardware_list')}
              className="mb-4 text-blue-600 font-bold hover:underline self-start"
            >
              &larr; Volver al Invetario
            </button>
            <HardwareTest onSaved={() => setActiveTab('hardware_list')} initialDevice={testDevice} />
          </div>
        )}
      </main>
    </div>
  );

};

export default Superususario;