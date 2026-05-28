import React, { useState, useEffect, useCallback } from 'react';
import { Activity, AlertOctagon, Bus, Users, Zap, Wrench, Cone, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Bar, Legend, ComposedChart, Line
} from 'recharts';
import { useSocket } from '../../../hooks/useSocket';
import { estadisticasService, DashboardAdminResponse } from '../../../services/estadisticasService';

/**
 * Propiedades para el componente DashboardView.
 */
export interface DashboardViewProps {
  /** Función para navegar a la vista de incidentes */
  onGoToIncidents: () => void;
}

/**
 * DashboardView: Panel principal de analíticas para el administrador.
 * Muestra métricas clave, gráficos de demanda y estado de la flota en tiempo real.
 * 
 * @param {DashboardViewProps} props - Propiedades del componente.
 * @returns {JSX.Element} Vista del dashboard.
 */
const DashboardView: React.FC<DashboardViewProps> = ({ onGoToIncidents }) => {
  const { socket } = useSocket();
  const [datos, setDatos] = useState<DashboardAdminResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [alertasRecientes, setAlertasRecientes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  /**
   * Obtiene los datos actualizados del backend.
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await estadisticasService.obtenerDashboardAdmin();
      setDatos(response);
      // Sincronizar alertas iniciales si el socket no ha enviado nuevas
      if (alertasRecientes.length === 0) {
        setAlertasRecientes(response.alertasRecientes);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setCargando(false);
    }
  }, [alertasRecientes.length]);

  // Efecto inicial y polling cada 30 segundos
  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Escuchar nuevas incidencias via Socket.io
  useEffect(() => {
    if (!socket) return;
    const handleIncidencia = (incidencia: any) => {
      setAlertasRecientes(prev => [incidencia, ...prev].slice(0, 5));
      // Forzar recarga de contadores cuando llega una alerta
      fetchDashboardData();
    };
    socket.on('reporte_incidencia', handleIncidencia);
    return () => {
      socket.off('reporte_incidencia', handleIncidencia);
    };
  }, [socket, fetchDashboardData]);

  if (!mounted || (cargando && !datos)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { resumen, graficos } = datos || {
    resumen: { totalUnidades: 0, unidadesActivas: 0, incidentesActivos: 0, pasajerosHoy: 0, eficiencia: 0, gananciasHoy: 0 },
    graficos: { afluencia: [], viajesPorRuta: [], gananciasProximas: [] }
  };

  return (
    <div id="view-dashboard" className="space-y-6 fade-in pb-10">
      {/* Fila de Tarjetas Informativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Unidades Activas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Bus className="w-6 h-6" />
            </div>
            <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Activo</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Unidades Activas</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {resumen.unidadesActivas} <span className="text-sm text-slate-400 font-medium">/ {resumen.totalUnidades}</span>
          </p>
        </div>

        {/* Pasajeros Hoy */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+12%</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pasajeros de Hoy</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{resumen.pasajerosHoy.toLocaleString()}</p>
        </div>

        {/* Ganancias de Hoy (NUEVO) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+8.4%</span>
            </div>
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ganancias de Hoy</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${(resumen.gananciasHoy || 0).toLocaleString()} <span className="text-xs text-slate-400 font-medium">MXN</span></p>
        </div>

        {/* Incidentes Activos */}
        <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${resumen.incidentesActivos > 0 ? 'border-l-4 border-l-orange-500 border-orange-100 shadow-sm' : 'border-slate-100'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-xl ${resumen.incidentesActivos > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-600'}`}>
              <AlertOctagon className="w-6 h-6" />
            </div>
            {resumen.incidentesActivos > 0 && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse">Revisar</span>
            )}
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Incidentes Activos</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">{resumen.incidentesActivos}</p>
        </div>
      </div>

      {/* Grid Principal de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Demanda de Pasajeros y Afluencia por Horarios */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Demanda de Pasajeros y Afluencia</h3>
              <p className="text-xs text-slate-500">Comparativa entre afluencia registrada y demanda óptima esperada por hora</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">Hora Operativa</span>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <AreaChart data={graficos.afluencia}>
                <defs>
                  <linearGradient id="colorAfluencia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDemanda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hora" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
                <Area 
                  type="monotone" 
                  name="Afluencia Registrada"
                  dataKey="pasajeros" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAfluencia)" 
                />
                <Area 
                  type="monotone" 
                  name="Demanda Esperada (Optimizado)"
                  dataKey="demandaEsperada" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorDemanda)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Viajes por Ruta (NUEVO) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-1">Viajes por Ruta</h3>
          <p className="text-xs text-slate-500 mb-6">Distribución total de viajes realizados por cada ruta real de la flota</p>
          
          <div className="flex-1 min-h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <PieChart>
                <Pie
                  data={graficos.viajesPorRuta}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="cantidad"
                  nameKey="ruta"
                >
                  {graficos.viajesPorRuta.map((_entry, index) => {
                    const coloresPie = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
                    return (
                      <Cell key={`cell-${index}`} fill={coloresPie[index % coloresPie.length]} />
                    );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value} viajes`, 'Cantidad']}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 2: Ganancias Próximas y Proyección (Semanal) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Ganancias Próximas y Recaudación</h3>
              <p className="text-xs text-slate-500">Recaudación acumulada por día y proyección de ingresos estimados de la semana</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 font-bold text-xs uppercase tracking-wider">
              Finanzas
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height={250} minWidth={0}>
              <ComposedChart data={graficos.gananciasProximas}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="dia" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
                <Bar 
                  name="Recaudado Real ($)" 
                  dataKey="real" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32}
                />
                <Line 
                  type="monotone" 
                  name="Ganancias Próximas ($)" 
                  dataKey="proyectado" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimas Alertas Críticas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800">Alertas Críticas</h3>
              <p className="text-xs text-slate-500">Últimos reportes de incidentes</p>
            </div>
            <button 
              type="button" 
              className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              onClick={onGoToIncidents}
            >
              Ver Historial
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[250px]">
            {alertasRecientes.length > 0 ? (
              alertasRecientes.map((alerta, idx) => {
                const isSOS = alerta.tipo === 'SOS';
                const isMech = alerta.tipo === 'FALLA_MECANICA';
                const time = alerta.createdAt ? new Date(alerta.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora';
                
                return (
                  <div key={idx} className="flex gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group fade-in border border-transparent hover:border-slate-100">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isSOS ? 'bg-red-100 text-red-600' : isMech ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'}`}>
                      {isSOS ? <Zap className="w-5 h-5" /> : isMech ? <Wrench className="w-5 h-5" /> : <Cone className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 truncate">
                          {alerta.tipo.replace('_', ' ')}: {alerta.unidad?.placa || 'Unidad ' + (alerta.unidadId || '---')}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{alerta.descripcion || 'Sin descripción adicional disponible'}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Activity className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest block mb-1">Todo Despejado</span>
                <span className="text-sm">No hay incidentes pendientes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
