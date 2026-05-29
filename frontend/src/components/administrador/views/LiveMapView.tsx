import React, { useEffect, useState } from 'react';
import Mapa from '../../common/Mapa';
import CapaGeometria from '../../common/mapa/CapaGeometria';
import CapaVehiculos from '../../common/mapa/CapaVehiculos';
import CapaParadas from '../../common/mapa/CapaParadas';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';
import { useAuth } from '../../../auth/useAuth';

interface LiveMapViewProps {
  targetUnitId?: string | null;
}

const LiveMapView: React.FC<LiveMapViewProps> = ({ targetUnitId }) => {
  const { socket } = useSocket();
  const { token, usuario } = useAuth();

  // Estados reactivos para el mapa modular
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);
  const [paradas, setParadas] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.4326, -99.1332]);
  const [zoom, setZoom] = useState(14);

  // 1. Escuchar actualizaciones de Socket.io y actualizar estado de vehículos
  useEffect(() => {
    if (!socket) return;

    // Suscribir al administrador a la sala de su flotilla para recibir la ubicación en tiempo real
    if ((usuario as any)?.flotilla) {
      socket.emit('suscribir_flotilla', (usuario as any).flotilla);
    }

    // Carga inicial del catálogo de vehículos de la flotilla
    const fetchUnidades = async () => {
        try {
            const response = await api.get('/unidades', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && Array.isArray(response.data)) {
                // Pre-poblar el estado con las unidades (estarán sin 'pos' hasta que el socket las actualice)
                setVehicles(prevVehicles => {
                    const newVehicles = [...prevVehicles];
                    response.data.forEach((u: any) => {
                        if (!newVehicles.find(v => v.id === u._id)) {
                            newVehicles.push({
                                id: u._id,
                                placa: u.placa,
                                estado: u.estado || 'inactivo',
                                isSimulated: false,
                                isBackground: false,
                                // Sin pos inicial hasta que el GPS reporte
                            });
                        }
                    });
                    return newVehicles;
                });
            }
        } catch (e) {
            console.error("Error al cargar el catálogo de unidades", e);
        }
    };
    fetchUnidades();

    const handleUbicacion = (datos: any) => {
      // Sincronizar con el formato emitido por Conductor.jsx (id, pos, placa, isSimulated, etc.)
      const { id, pos, placa, isSimulated, isBackground, estado, rutaId } = datos;
      if (!pos || pos.length < 2) return;

      const statusColor = estado === 'sos' ? 'bg-red-600' : 'bg-blue-600';

      setVehicles(prev => {
        const index = prev.findIndex(v => v.id === id);
        const updatedVehicle = {
          id,
          pos,
          color: statusColor,
          placa: placa || `Unidad ${id?.toString().slice(-4)}`,
          isSimulated,
          isBackground,
          rutaId,
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

  // 3. Enfoque automático en unidad objetivo (SOS / Despacho)
  useEffect(() => {
    if (targetUnitId && vehicles.length > 0) {
      const target = vehicles.find(v => v.id === targetUnitId);
      if (target && target.pos) {
        setMapCenter(target.pos);
        setSelectedUnit(target);
        setZoom(18); // Zoom máximo para ver la ubicación exacta del SOS
      }
    }
  }, [targetUnitId, vehicles]);

  return (
    <div
      id="view-map"
      className="h-[calc(100vh-8rem)] w-full bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"
    >
      <Mapa 
        center={mapCenter} 
        tileTheme="light" 
        zoom={zoom}
      >
        {/* Capas modulares con estilos específicos de Administrador */}
        <CapaGeometria 
          routeLine={routeLine as any} 
          unitPos={selectedUnit?.pos}
          color="#3b82f6" 
        />
        <CapaParadas 
          stops={paradas as any} 
          onStopClick={() => {}} 
        />
        <CapaVehiculos 
            vehicles={vehicles as any} 
            selectedVehicleId={selectedUnit?.id}
            mostrarDetallesHw={true}
            onVehicleClick={(v: any) => setSelectedUnit(v)}
        />
      </Mapa>

      {/* Panel de Unidades de la Flotilla (En vivo) */}
      <div className="absolute top-4 left-4 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 z-[1000] flex flex-col max-h-[80%] overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Unidades Activas ({vehicles.length})
            </h3>
            <p className="text-xs text-slate-500 mt-1">Flotilla transmitiendo en tiempo real</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {vehicles.length === 0 ? (
                <div className="text-center p-4 text-slate-400 text-sm font-medium">
                    No hay unidades transmitiendo en este momento.
                </div>
            ) : (
                vehicles.map(v => (
                    <button
                        key={v.id}
                        onClick={() => {
                            setSelectedUnit(v);
                            if (v.pos) setMapCenter(v.pos);
                            setZoom(17);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                            selectedUnit?.id === v.id 
                                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800">{v.placa}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                !v.pos ? 'bg-slate-100 text-slate-500' :
                                v.estado === 'sos' ? 'bg-red-100 text-red-600' : 
                                v.isSimulated && !v.isBackground ? 'bg-indigo-100 text-indigo-600' :
                                'bg-emerald-100 text-emerald-600'
                            }`}>
                                {!v.pos ? 'SIN SEÑAL' : v.estado === 'sos' ? 'EMERGENCIA' : v.isSimulated && !v.isBackground ? 'SIMULADO' : 'GPS REAL'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                            <span>Estado: {!v.pos ? 'Desconectado' : v.estado === 'en_ruta' ? 'En Ruta' : v.estado === 'llena' ? 'Unidad Llena' : 'Inactivo'}</span>
                            {selectedUnit?.id === v.id && (
                                <span className="text-blue-600 font-bold text-[10px] uppercase">Siguiendo</span>
                            )}
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>

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
