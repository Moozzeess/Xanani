import React, { useState, useEffect } from 'react';
import { UserPlus, Users, IdCard, Briefcase, Trash2, Edit2, Loader2, Search, UserCheck } from 'lucide-react';
import { crearUsuario, obtenerConductores, SolicitudCrearUsuario, buscarUsuarios, promoverUsuario } from '../../services/conductor';
import { useAlertaGlobal } from '../../context/AlertaContext';

const GestionConductores: React.FC = () => {
  const { disparar, dispararError } = useAlertaGlobal();
  
  // Estados para la lista de conductores
  const [conductores, setConductores] = useState<any[]>([]);
  const [estaCargandoLista, setEstaCargandoLista] = useState(true);

  // Estados para búsqueda de usuarios
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [estaBuscando, setEstaBuscando] = useState(false);
  const [usuarioParaPromover, setUsuarioParaPromover] = useState<any | null>(null);

  // Estados para el formulario de alta
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [formData, setFormData] = useState<SolicitudCrearUsuario>({
    username: '',
    email: '',
    password: '',
    role: 'CONDUCTOR',
    telefono: '',
    licencia: '',
    unidad: '',
    edad: undefined
  });

  useEffect(() => {
    cargarConductores();
  }, []);

  const cargarConductores = async () => {
    try {
      setEstaCargandoLista(true);
      const data = await obtenerConductores();
      setConductores(data);
    } catch (err: any) {
      dispararError('Error al cargar la lista de conductores', err.message);
    } finally {
      setEstaCargandoLista(false);
    }
  };

  const manejarBusqueda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminoBusqueda.trim()) return;
    
    try {
      setEstaBuscando(true);
      const data = await buscarUsuarios(terminoBusqueda);
      setResultadosBusqueda(data);
    } catch (err: any) {
      dispararError('Error en la búsqueda', err.message);
    } finally {
      setEstaBuscando(false);
    }
  };

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'edad' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      dispararError('Campos incompletos', 'Usuario y correo electrónico son obligatorios.');
      return;
    }

    try {
      setEstaEnviando(true);
      await crearUsuario(formData);
      disparar({ tipo: 'exito', titulo: '¡Éxito!', mensaje: 'Proceso completado correctamente.' });
      
      limpiarFormulario();
      cargarConductores();
    } catch (err: any) {
      dispararError('Error al procesar', err.message);
    } finally {
      setEstaEnviando(false);
    }
  };

  const ejecutarPromocion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaPromover) return;

    try {
      setEstaEnviando(true);
      await promoverUsuario(usuarioParaPromover._id, {
        telefono: formData.telefono,
        licencia: formData.licencia,
        unidad: formData.unidad,
        edad: formData.edad
      });
      disparar({ tipo: 'exito', titulo: '¡Promovido!', mensaje: `${usuarioParaPromover.username} ahora es conductor.` });
      
      setUsuarioParaPromover(null);
      setResultadosBusqueda([]);
      setTerminoBusqueda('');
      limpiarFormulario();
      cargarConductores();
    } catch (err: any) {
      dispararError('Error al promover', err.message);
    } finally {
      setEstaEnviando(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'CONDUCTOR',
      telefono: '',
      licencia: '',
      unidad: '',
      edad: undefined
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* SECCIÓN SUPERIOR: BUSCADOR GLOBAL */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl -mr-20 -mt-20 rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-white font-black text-xl mb-4 flex items-center gap-2">
            <Search className="text-blue-400" size={24} /> Búsqueda Global de Usuarios
          </h2>
          <form onSubmit={manejarBusqueda} className="flex gap-3">
            <input 
              type="text" 
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo (ej: pasajero123)..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
            />
            <button 
              type="submit"
              disabled={estaBuscando}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {estaBuscando ? <Loader2 className="animate-spin" size={20} /> : 'Buscar'}
            </button>
          </form>

          {resultadosBusqueda.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top duration-300">
              {resultadosBusqueda.map(u => (
                <div key={u._id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                  <div className="flex flex-col">
                    <span className="text-white font-bold">{u.username}</span>
                    <span className="text-slate-400 text-xs">{u.email}</span>
                    <span className="text-blue-400 text-[10px] uppercase font-black tracking-tighter mt-1">{u.role}</span>
                  </div>
                  {u.role !== 'CONDUCTOR' && (
                    <button 
                      onClick={() => {
                        setUsuarioParaPromover(u);
                        setFormData({ ...formData, username: u.username, email: u.email });
                      }}
                      className="bg-slate-700 group-hover:bg-blue-600 text-white p-2 rounded-lg transition-all"
                    >
                      <UserCheck size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO DE ALTA / PROMOCIÓN */}
        <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              {usuarioParaPromover ? <UserCheck size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {usuarioParaPromover ? 'Promoción a Conductor' : 'Alta de Nuevo Conductor'}
              </h2>
              {usuarioParaPromover && (
                <p className="text-xs text-slate-500">Completando datos técnicos para <b>{usuarioParaPromover.username}</b></p>
              )}
            </div>
          </div>

          <form onSubmit={usuarioParaPromover ? ejecutarPromocion : manejarEnvio} className="flex flex-col gap-4">
            {!usuarioParaPromover && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Usuario</label>
                  <input 
                    name="username"
                    value={formData.username}
                    onChange={manejarCambio}
                    placeholder="Ej: juan_perez"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Correo Electrónico</label>
                  <input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={manejarCambio}
                    placeholder="conductor@xanani.com"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña (Opcional)</label>
                  <input 
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={manejarCambio}
                    placeholder="Dejar vacío si ya existe"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Licencia</label>
                <input 
                  name="licencia"
                  value={formData.licencia}
                  onChange={manejarCambio}
                  placeholder="L-12345"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Teléfono</label>
                <input 
                  name="telefono"
                  value={formData.telefono}
                  onChange={manejarCambio}
                  placeholder="5512345678"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Unidad</label>
              <input 
                name="unidad"
                value={formData.unidad}
                onChange={manejarCambio}
                placeholder="Unidad 101"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button 
                type="submit"
                disabled={estaEnviando}
                className={`flex-1 py-3 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                  usuarioParaPromover ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {estaEnviando ? <Loader2 className="animate-spin" size={18} /> : (usuarioParaPromover ? 'Culminar Promoción' : 'Registrar')}
              </button>
              
              {usuarioParaPromover && (
                <button 
                  type="button"
                  onClick={() => {
                    setUsuarioParaPromover(null);
                    limpiarFormulario();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* COLUMNA DERECHA: LISTADO DE CONDUCTORES */}
        <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Plantilla de Conductores</h2>
            </div>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              {conductores.length} Activos
            </span>
          </div>

          <div className="flex-1 overflow-auto max-h-[600px]">
            {estaCargandoLista ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="animate-spin" size={32} />
                <p className="font-medium">Sincronizando con el servidor...</p>
              </div>
            ) : conductores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Users size={48} className="opacity-10" />
                <p className="font-medium">Aún no hay conductores en la plantilla</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/50 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0 border-b border-slate-200 backdrop-blur-sm z-20">
                  <tr>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Información Técnica</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conductores.map((c) => (
                    <tr key={c.user._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 tracking-tight">{c.user.username}</span>
                          <span className="text-xs text-slate-400">{c.user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <div className="flex items-center gap-2 text-slate-600">
                            <IdCard size={13} className="text-blue-500" />
                            <span className="font-medium">Licencia:</span> {c.licencia || '---'}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Briefcase size={13} className="text-emerald-500" />
                            <span className="font-medium">Unidad:</span> {c.unidad || 'Pendiente'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          c.user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {c.user.isActive ? 'Activo' : 'Baja'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-100 rounded-xl transition-all shadow-sm">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-100 rounded-xl transition-all shadow-sm">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionConductores;
