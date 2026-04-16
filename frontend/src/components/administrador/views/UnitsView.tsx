import React, { useState, useEffect } from 'react';
import { Truck, Plus, HardDrive, User, Edit2, Trash, X, Save, Search } from 'lucide-react';
import { useAlertaGlobal } from '../../../context/AlertaContext';
import { useAuth } from '../../../auth/useAuth';
import api from '../../../services/api';

export default function unidadesView() {
  const { token } = useAuth();
  const { disparar, dispararError } = useAlertaGlobal();

  const [unidades, setUnidades] = useState<any[]>([]);
  const [hardwareLibre, setHardwareLibre] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    placa: '',
    capacidad: 15,
    conductor: '',
    dispositivoHardware: ''
  });

  const fetchData = async () => {
    try {
      setCargando(true);
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [resUnidades, resHardware, resConductores] = await Promise.all([
        api.get('/unidades', { headers }),
        api.get('/hardware', { headers }),
        api.get('/conductores', { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      setUnidades(Array.isArray(resUnidades.data) ? resUnidades.data : resUnidades.data?.data || []);
      setHardwareLibre(Array.isArray(resHardware.data?.data) ? resHardware.data.data : []);

      const conductorsResp = resConductores.data?.data || resConductores.data || [];
      const conductorsData = Array.isArray(conductorsResp) ? conductorsResp : [];
      
      const conductoresMapeados = conductorsData.map((cData: any) => ({
        id: cData.user?._id || cData._id,
        nombre: cData.user?.username || cData.username || 'Sin Nombre'
      }));
      setConductores(conductoresMapeados);

    } catch (error: any) {
      console.error(error);
      dispararError('Error de carga', 'No se pudieron obtener los datos de unidades.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentUnitId(null);
    setFormData({ placa: '', capacidad: 15, conductor: '', dispositivoHardware: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (unidad: any) => {
    setIsEditing(true);
    setCurrentUnitId(unidad._id);
    setFormData({
      placa: unidad.placa || '',
      capacidad: unidad.capacidad || 15,
      conductor: unidad.conductor?._id || unidad.conductor || '',
      dispositivoHardware: unidad.dispositivoHardware?._id || unidad.dispositivoHardware || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta unidad permanentemente?")) return;

    try {
      await api.delete(`/unidades/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      disparar({ tipo: 'exito', titulo: 'Eliminado', mensaje: 'Se borró la unidad del sistema.' });
      fetchData();
    } catch (error: any) {
      const msg = error.response?.data?.mensaje || error.message;
      dispararError('Fallo al borrar', msg);
    }
  };

  const handleSubmitUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.placa) return dispararError('Atención', 'La placa es obligatoria.');

    try {
      const endpoint = isEditing ? `/unidades/${currentUnitId}` : '/unidades';
      const method = isEditing ? 'put' : 'post';

      const bodyData = {
        placa: formData.placa,
        capacidad: Number(formData.capacidad),
        conductor: formData.conductor || null,
        dispositivoHardware: formData.dispositivoHardware || null
      };

      await api[method](endpoint, bodyData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      disparar({ tipo: 'exito', titulo: 'Éxito', mensaje: isEditing ? 'Unidad actualizada correctamente.' : 'Unidad registrada en la flotilla.' });
      setShowModal(false);
      fetchData();

    } catch (error: any) {
      const msg = error.response?.data?.mensaje || error.message;
      dispararError('Error al guardar', msg);
    }
  };

  const unidadesFiltradas = unidades.filter(u =>
    u.placa?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.conductor && u.conductor.username?.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div id="view-unidades" className="space-y-6 relative animate-in fade-in duration-500">

      {/* Header Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Directorio de Unidades
          </h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar placa o conductor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Registrar
            </button>
          </div>
        </div>

        {/* Tabla Estilizada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Capacidad</th>
                <th className="px-6 py-4">Conductor Asignado</th>
                <th className="px-6 py-4">Hardware ESP32</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                      <p>Sincronizando flota...</p>
                    </div>
                  </td>
                </tr>
              ) : unidadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Truck className="w-10 h-10 mb-3 opacity-30" />
                      <p className="font-medium text-slate-500">No se encontraron unidades.</p>
                      <p className="text-xs mt-1">Intenta ajustando el buscador o registra una nueva unidad.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                unidadesFiltradas.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 text-xs font-black rounded-md tracking-widest uppercase shadow-sm">
                          {u.placa}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{u.capacidad} asientos</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className={`w-4 h-4 ${u.conductor ? "text-purple-500" : "text-slate-300"}`} />
                        <span className={!u.conductor ? "italic text-slate-400 text-xs" : "font-semibold text-slate-800"}>
                          {u.conductor ? u.conductor.username : 'Por asignar'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <HardDrive className={`w-4 h-4 ${u.dispositivoHardware ? "text-emerald-500" : "text-slate-300"}`} />
                        <span className={!u.dispositivoHardware ? "italic text-slate-400 text-xs" : "font-mono text-emerald-700 bg-emerald-50 px-2 flex py-0.5 rounded text-xs"}>
                          {u.dispositivoHardware ? u.dispositivoHardware.Id_Dispositivo_Hardware || u.dispositivoHardware.Direccion_Mac : 'Sin dispositivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        className="text-slate-400 hover:text-blue-600 px-2 transition-colors"
                        title="Modificar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u._id)}
                        className="text-slate-400 hover:text-red-500 px-2 transition-colors"
                        title="Eliminar"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs text-slate-500">
            Total Flotilla: {unidades.length} vehículos registrados
          </div>
        </div>
      </div>

      {/* MODAL / FORMULARIO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {isEditing ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Truck className="w-5 h-5 text-blue-600" />}
                {isEditing ? 'Configurar Unidad' : 'Registrar Vehículo'}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUnidad} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Placa de Identificación *</label>
                <input required type="text" name="placa" value={formData.placa} onChange={handleChange} placeholder="ABC-1234" className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono uppercase" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Capacidad de Pasajeros *</label>
                <input required type="number" name="capacidad" value={formData.capacidad} onChange={handleChange} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4">
                <label className="text-xs font-bold text-slate-500 uppercase">Hardware Asociado (Opcional)</label>
                <select name="dispositivoHardware" value={formData.dispositivoHardware} onChange={handleChange} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="">-- Hardware en Stock --</option>
                  {hardwareLibre.map((hw, i) => (
                    <option key={i} value={hw._id}>{hw.Id_Dispositivo_Hardware} (MAC: {hw.Direccion_Mac})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Solo muestra dispositivos previamente vinculados a ti por el superusuario.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Conductor (Opcional)</label>
                <select name="conductor" value={formData.conductor} onChange={handleChange} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="">-- Sin asignar --</option>
                  {conductores.map((c: any, i) => (
                    <option key={i} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 flex-1 rounded-lg text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="bg-blue-600 flex-[2] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
