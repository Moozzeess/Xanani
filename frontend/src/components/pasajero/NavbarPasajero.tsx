import React from 'react';
import { Map, Route, Navigation, Bell, User } from 'lucide-react';

export type TabPasajero = 'mapa' | 'rutas' | 'alertas' | 'perfil';

interface NavbarPasajeroProps {
  tabActivo: TabPasajero;
  onCambiarTab: (tab: TabPasajero) => void;
  onCentrarUbicacion: () => void;
  badgeAlertas?: number;
}

interface ItemTab {
  id: TabPasajero;
  icono: React.ReactNode;
  etiqueta: string;
}

const TABS: ItemTab[] = [
  { id: 'mapa', icono: <Map className="w-6 h-6" />, etiqueta: 'Mapa' },
  { id: 'rutas', icono: <Route className="w-6 h-6" />, etiqueta: 'Rutas' },
];

const TABS_DERECHA: ItemTab[] = [
  { id: 'alertas', icono: <Bell className="w-6 h-6" />, etiqueta: 'Alertas' },
  { id: 'perfil', icono: <User className="w-6 h-6" />, etiqueta: 'Perfil' },
];

/**
 * Barra de navegación inferior exclusiva del pasajero.
 * Desacoplada del Navbar del conductor; incluye tabs propios
 * del flujo de pasajero: Mapa, Rutas, [Centrar], Alertas y Perfil.
 */
const NavbarPasajero: React.FC<NavbarPasajeroProps> = ({
  tabActivo,
  onCambiarTab,
  onCentrarUbicacion,
  badgeAlertas = 0,
}) => {
  const claseTab = (id: TabPasajero) =>
    tabActivo === id
      ? 'text-slate-900 flex flex-col items-center gap-0.5 w-14 transition-colors'
      : 'text-slate-400 hover:text-slate-600 flex flex-col items-center gap-0.5 w-14 transition-colors';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[1000] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center h-16 px-4 max-w-md mx-auto">

        {/* Tabs izquierdos */}
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-pasajero-${tab.id}`}
            onClick={() => onCambiarTab(tab.id)}
            className={claseTab(tab.id)}
          >
            {tab.icono}
            <span className="text-[10px] font-bold">{tab.etiqueta}</span>
          </button>
        ))}

        {/* Botón central elevado — centrar en ubicación */}
        <div className="relative -top-5">
          <button
            id="btn-centrar-ubicacion"
            onClick={onCentrarUbicacion}
            className="w-14 h-14 bg-blue-600 rounded-2xl rotate-45 flex items-center justify-center text-white shadow-lg shadow-blue-600/40 active:scale-95 transition-all border-4 border-white"
          >
            <Navigation className="w-6 h-6 -rotate-45" />
          </button>
        </div>

        {/* Tabs derechos */}
        {TABS_DERECHA.map((tab) => (
          <button
            key={tab.id}
            id={`tab-pasajero-${tab.id}`}
            onClick={() => onCambiarTab(tab.id)}
            className={`${claseTab(tab.id)} relative`}
          >
            {tab.id === 'alertas' && badgeAlertas > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {badgeAlertas > 9 ? '9+' : badgeAlertas}
              </span>
            )}
            {tab.icono}
            <span className="text-[10px] font-medium">{tab.etiqueta}</span>
          </button>
        ))}
      </div>

      {/* Barra de inicio estilo iOS */}
      <div className="w-full flex justify-center pb-2">
        <div className="w-20 h-1 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
};

export default NavbarPasajero;
