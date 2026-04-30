import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Plus, Edit, Trash2, X, Activity } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAlertaGlobal } from '../../context/AlertaContext';

export default function ListaDispositivos({ onAddNew, onTestDevice }: { onAddNew: () => void, onTestDevice?: (device: any) => void }) {
   const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineDevices, setOnlineDevices] = useState<Record<string, number>>({});
  const socketRef = useRef<Socket | null>(null);

  // States para el modal de asignación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [formData, setFormData] = useState({ 
    adminId: '', 
    topico: '', 
    capacidadMaxima: 15, 
    umbralPeso: 10 
  });

  const { disparar, dispararError } = useAlertaGlobal();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const getHeaders = () => {
    // Xanani usa 'xanani_token' según useAuth.ts
    const token = localStorage.getItem('xanani_token') ||
      localStorage.getItem('token') ||
      '';

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchDispositivos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/hardware`, { headers: getHeaders() });
      const data = await response.json();
      if (data.status === 'success') {
        setDispositivos(data.data);
      } else {
        dispararError('Error al obtener hardware', 'No se pudo cargar la lista.');
      }
    } catch (error: any) {
      dispararError('Error de red', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/usuarios/admins`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setAdmins(d.data || []);
      }
    } catch (e) {
      console.warn("No se pudieron cargar administradores", e);
    }
  };

  useEffect(() => {
    fetchDispositivos();
    fetchAdmins();

    // Inicializar conexión de socket para monitoreo en vivo
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on('datos_esp32', (data) => {
      if (data.payload && data.payload.id) {
        setOnlineDevices(prev => ({
          ...prev,
          [data.payload.id]: Date.now()
        }));
      }
    });

    // Intervalo para limpiar dispositivos inactivos de la vista (cada 10s)
    const interval = setInterval(() => {
      setOnlineDevices(prev => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach(id => {
          if (now - updated[id] > 40000) { // 40 segundos de tolerancia
            delete updated[id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar el dispositivo?")) return;

    try {
      const res = await fetch(`${backendUrl}/api/hardware/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        disparar({ tipo: 'exito', titulo: 'Eliminado', mensaje: 'Dispositivo eliminado.' });
        fetchDispositivos();
      } else {
        dispararError('Error', 'No se pudo eliminar.');
      }
    } catch (error: any) {
      dispararError('Error de red', error.message);
    }
  };

  const openAssignModal = (disp: any) => {
    setCurrentDevice(disp);
    setFormData({
      adminId: disp.administrador?._id || disp.administrador || '',
      topico: disp.topico || 'xanani/hardware/test',
      capacidadMaxima: disp.capacidadMaxima || 15,
      umbralPeso: disp.umbralPeso || 10
    });
    setIsModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backendUrl}/api/hardware/${currentDevice._id}/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ 
          adminId: formData.adminId || null, 
          topico: formData.topico,
          capacidadMaxima: Number(formData.capacidadMaxima),
          umbralPeso: Number(formData.umbralPeso)
        })
      });
      if (res.ok) {
        disparar({ tipo: 'exito', titulo: 'Actualizado', mensaje: 'Se actualizaron los datos del dispositivo.' });
        setIsModalOpen(false);
        fetchDispositivos();
      } else {
        dispararError('Error', 'No se logró asignar la información.');
      }
    } catch (error: any) {
      dispararError('Red', error.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col p-6 animate-in fade-in transition-all">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu size={24} className="text-blue-500" />
            Inventario de Dispositivos Hardware
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestión integral de dispositivos, tópicos MQTT y asignaciones.</p>
        </div>
        <button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Configurar Nuevo
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Cpu size={48} className="mb-4 text-slate-300" />
            <p className="text-lg">No hay dispositivos registrados aún.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Dirección MAC</th>
                <th className="p-4 font-semibold">ID & Tópico MQTT</th>
                <th className="p-4 font-semibold">Configuración</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold">Asignado a</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dispositivos.map((disp, idx) => (
                <tr key={idx} onClick={() => onTestDevice && onTestDevice(disp)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-700">{disp.Direccion_Mac}</td>
                  <td className="p-4">
                    <p className="text-slate-800 font-bold text-sm">{disp.Id_Dispositivo_Hardware}</p>
                    <p className="text-slate-500 text-xs font-mono">{disp.topico || 'xanani/hardware/test'}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-max">
                        Capacidad: {disp.capacidadMaxima || '--'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-max">
                        Umbral: {disp.umbralPeso || '--'} kg
                      </span>
                    </div>
                  </td>
                   <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium w-max ${disp.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {disp.estado.toUpperCase()}
                      </span>
                      {onlineDevices[disp.Id_Dispositivo_Hardware] && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 animate-pulse">
                          <Activity size={10} />
                          VIVO / ONLINE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {disp.administrador ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{disp.administrador.username}</span>
                        <span className="text-xs">{disp.administrador.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-sm">No asignado</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openAssignModal(disp); }} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors" title="Editar / Asignar">
                      <Edit size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(disp._id); }} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors ml-2" title="Eliminar/Desactivar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && currentDevice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-800 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Actualizar Dispositivo</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Hardware ID</p>
                <p className="text-sm font-mono p-2 bg-slate-100 rounded-lg mt-1">{currentDevice.Id_Dispositivo_Hardware}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Administrador Asignado</label>
                <select required={false} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" value={formData.adminId} onChange={e => setFormData({ ...formData, adminId: e.target.value })}>
                  <option value="">-- Sin Asignar --</option>
                  {admins.map(a => <option key={a._id} value={a._id}>{a.username} ({a.email})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Tópico MQTT ESP32</label>
                <input type="text" required className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-mono" value={formData.topico} onChange={e => setFormData({ ...formData, topico: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-1">El tópico principal por el cual se enviarán/recibirán los comandos de este dispositivo específico.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Capacidad Máxima</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" 
                    value={formData.capacidadMaxima} 
                    onChange={e => setFormData({ ...formData, capacidadMaxima: Number(e.target.value) })} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Umbral Peso (kg)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" 
                    value={formData.umbralPeso} 
                    onChange={e => setFormData({ ...formData, umbralPeso: Number(e.target.value) })} 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
