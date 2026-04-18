import { Map, Clock, Navigation, User, Bell } from 'lucide-react';
/**
 * Componente de navegación inferior (Bottom Navigation Bar).
 * Proporciona acceso rápido a las secciones principales de la app.
 */
const Navbar = ({ 
    onCenterLocation, 
    onNotificationsClick, 
    onMapClick, 
    onProfileClick, 
    onAfluenciaClick, 
    activeTab,
    rol = 'PASAJERO' // Valor por defecto
}) => {
    const esConductor = rol === 'CONDUCTOR';

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[1000] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center h-16 px-4 max-w-md mx-auto">
                {/* Botón Mapa / Inicio */}
                <button 
                  onClick={onMapClick}
                  className={`${activeTab === 'map' ? 'text-blue-600' : 'text-slate-400'} flex flex-col items-center gap-1 w-12 transition-colors`}
                >
                    <Map className="w-6 h-6 stroke-[2.5]" />
                    <span className="text-[10px] font-bold">
                        {esConductor ? 'Inicio' : 'Mapa'}
                    </span>
                </button>

                {/* Botón Afluencia / Historial */}
                <button 
                  onClick={onAfluenciaClick}
                  className={`${activeTab === 'afluencia' ? 'text-blue-600' : 'text-slate-400'} flex flex-col items-center gap-1 w-12 transition-colors`}
                >
                    <Clock className="w-6 h-6" />
                    <span className="text-[10px] font-medium">
                        {esConductor ? 'Historial' : 'Afluencia'}
                    </span>
                </button>

                {/* Botón Central: Centrar / Iniciar Ruta */}
                <div className="relative -top-5">
                    <button
                        onClick={onCenterLocation}
                        className={`w-14 h-14 ${esConductor ? 'bg-emerald-600 shadow-emerald-600/40' : 'bg-blue-600 shadow-blue-600/40'} rounded-2xl rotate-45 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all border-4 border-white`}
                        title={esConductor ? "Iniciar Ruta" : "Centrar Ubicación"}
                    >
                        <Navigation className="w-6 h-6 -rotate-45" />
                    </button>
                </div>

                {/* Botón Alertas / Avisos */}
                <button 
                  onClick={onNotificationsClick}
                  className={`${activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400'} flex flex-col items-center gap-1 w-12 transition-colors`}
                >
                    <div className="relative">
                        <Bell className="w-6 h-6" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </div>
                    <span className="text-[10px] font-medium">
                        {esConductor ? 'Avisos' : 'Alertas'}
                    </span>
                </button>

                {/* Botón Perfil */}
                <button 
                    onClick={onProfileClick}
                    className={`${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'} flex flex-col items-center gap-1 w-12 transition-colors`}
                >
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Perfil</span>
                </button>
            </div>

            {/* Indicador de barra de inicio (estilo iOS) */}
            <div className="w-full flex justify-center pb-2">
                <div className="w-20 h-1 bg-gray-200 rounded-full"></div>
            </div>
        </div>
    );
};

export default Navbar;
