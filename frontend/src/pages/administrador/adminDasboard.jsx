import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import '../../styles/admin.css';

import AdminSidebar from '../../components/administrador/AdminSidebar';
import AdminHeader from '../../components/administrador/AdminHeader';
import SOSModal from '../../components/administrador/SOSModal';

import DashboardView from '../../components/administrador/views/DashboardView';
import LiveMapView from '../../components/administrador/views/LiveMapView';
import DriversView from '../../components/administrador/views/DriversView';
import RoutesView from '../../components/administrador/views/RoutesView';
import UnitsView from '../../components/administrador/views/UnitsView';
import IncidentsView from '../../components/administrador/views/IncidentsView';
import ReportsView from '../../components/administrador/views/ReportsView';

/**
 * AdminDashboard (Page)
 * - Se deja como la fuente de verdad del panel de administración.
 * - Centraliza el estado de navegación interna (vistas), modal SOS y logout.
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  const TITULOS = useMemo(
    () => ({
      dashboard: 'Dashboard General',
      map: 'Mapa de Flotilla en Vivo',
      drivers: 'Gestión de Conductores e Historial',
      routes: 'Editor de Rutas',
      units: 'Unidades',
      incidents: 'Centro de Incidentes',
      reports: 'Reportes'
    }),
    []
  );

  const pageTitle = useMemo(() => TITULOS[activeView] ?? 'Xanani Admin', [TITULOS, activeView]);

  const onLogout = useCallback(() => {
    cerrarSesion();
    navigate("/", { replace: true });
  }, [cerrarSesion, navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((v) => !v);
  }, []);

  const switchView = useCallback((view) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  }, []);

  return (
    <div className="admin-root text-slate-800 h-screen flex overflow-hidden bg-slate-100">
      <div
        id="sidebar-overlay"
        onClick={toggleSidebar}
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity ${isSidebarOpen ? '' : 'hidden'
          }`}
      />

      <AdminSidebar
        activeView={activeView}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        onSwitchView={switchView}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <AdminHeader
          title={pageTitle}
          onToggleSidebar={toggleSidebar}
          onTriggerSOS={() => setIsSOSOpen(true)}
        />

        <main id="main-container" className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          {activeView === 'dashboard' && <DashboardView onGoToIncidents={() => switchView('incidents')} />}
          {activeView === 'map' && <LiveMapView />}
          {activeView === 'drivers' && <DriversView />}
          {activeView === 'routes' && <RoutesView />}
          {activeView === 'units' && <UnitsView />}
          {activeView === 'incidents' && <IncidentsView />}
          {activeView === 'reports' && <ReportsView />}
        </main>
      </div>

      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </div>
  );
};

export default AdminDashboard;