import React, { useEffect, useState } from 'react';
import Mapa from '../../common/Mapa';
import CapaGeometria from '../../common/mapa/CapaGeometria';
import CapaVehiculos from '../../common/mapa/CapaVehiculos';
import CapaParadas from '../../common/mapa/CapaParadas';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';
import { useAuth } from '../../../auth/useAuth';

const LiveMapView: React.FC = () => {
  const { socket } = useSocket();
  const { token } = useAuth();

  // Estados reactivos para el mapa modular
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [paradas, setParadas] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.4326, -99.1332]);

  // 1. Escuchar actualizaciones de Socket.io y actualizar estado de vehículos
  useEffect(() => {
    if (!socket) return;

    const handleUbicacion = (datos: any) => {
      const { unidadId, ubicacion, detalles, isSimulation, estado, rutaId } = datos;
      if (!ubicacion?.latitud || !ubicacion?.longitud) return;

      const pos: [number, number] = [ubicacion.latitud, ubicacion.longitud];
      const statusColor = estado === 'sos' ? 'bg-red-600' : 'bg-blue-600';

      setVehicles(prev => {
        const index = prev.findIndex(v => v.id === unidadId);
        const updatedVehicle = {
          id: unidadId,
          pos,
          color: statusColor,
          placa: detalles || `Unidad ${unidadId}`,
          isSimulated: isSimulation,
          rutaId: rutaId,
          estado
        };

        if (index === -1) return [...prev, updatedVehicle];
        const newArr = [...prev];
        newArr[index] = updatedVehicle;
        return newArr;
      });
    };

    socket.on('ubicacion_conductor', handleUbicacion);
    return () => { socket.off('ubicacion_conductor', handleUbicacion); };
  }, [socket]);

  // 2. Cargar geometría cuando se selecciona una unidad
  useEffect(() => {
    const fetchRoute = async () => {
      if (!selectedUnit?.rutaId) {
        setRouteLine([]);
        setParadas([]);
        return;
      }

      try {
        const response = await api.get(`/rutas/${selectedUnit.rutaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data;
        if (data) {
          if (data.geometria) {
            setRouteLine(data.geometria.map((p: any) => [p.latitud, p.longitud]));
          }
          if (data.paradas) {
            setParadas(data.paradas);
          }
        }
      } catch (e) {
        console.error("Error al cargar ruta para el administrador:", e);
      }
    };

    if (selectedUnit) {
        fetchRoute();
        // Centrar mapa en la unidad seleccionada (Reactividad solicitada)
        if (selectedUnit.pos) {
            setMapCenter(selectedUnit.pos);
        }
    }
  }, [selectedUnit, token]);

  return (
    <div
      id="view-map"
      className="h-[calc(100vh-8rem)] w-full bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"
    >
      <Mapa 
        center={mapCenter} 
        tileTheme="light" 
        zoom={14}
      >
        {/* Capas modulares con estilos específicos de Administrador */}
        <CapaGeometria routeLine={routeLine as any} isDashed={true} color="#3b82f6" />
        <CapaParadas stops={paradas as any} />
        <CapaVehiculos 
            vehicles={vehicles as any} 
            selectedVehicleId={selectedUnit?.id}
            onVehicleClick={(v: any) => setSelectedUnit(v)}
        />
      </Mapa>

      {/* Leyenda Flotante */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-200 z-[1000] hidden md:block">
        <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Leyenda de Control</h4>
        <div className="space-y-2 text-sm font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Operación Normal
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> SOS / Alerta
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 text-[10px] text-slate-400">
            * Trayado segmentado indica vista de supervisión.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMapView;
