import React, { useState } from 'react';
import { Edit2, History, Search, Star, Trash, UserPlus, X, Save, ChevronLeft, ChevronRight, ArrowUpDown, ArrowRight } from 'lucide-react';
import { useAlerta } from '../../../hooks/useAlerta';
import { ModalAlerta } from '../../common/ModalAlerta';
import api from '../../../services/api';
import { useAuth } from '../../../auth/useAuth';

interface Conductor {
  id: string;
  nombre: string;
  apPaterno: string;
  apMaterno: string;
  licencia: string;
  unidad: string;
  telefono: string;
  correo: string;
  rol: string;
  fechaNacimiento: string;
  edad: number | '';
  ruta: string;
  rutaAsignadaId: string;
  estado: string;
  rating: number;
  iniciales: string;
}

const DriversView: React.FC = () => {
  const alerta = useAlerta();
  const { token } = useAuth();
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [conductorEditando, setConductorEditando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estados de Paginación y Ordenamiento
  const [paginaActual, setPaginaActual] = useState(1);
  const conductoresPorPagina = 5;
  const [ordenCriterio, setOrdenCriterio] = useState<'nombre' | 'unidad' | 'rating'>('nombre');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');

  // Estados del formulario dinámico (Ventana flotante)
  const [form, setForm] = useState({
    nombre: '',
    apPaterno: '',
    apMaterno: '',
    licencia: '',
    unidad: '',
    telefono: '',
    correo: '',
    fechaNacimiento: '',
    rutaAsignadaId: ''
  });

  const [rutasDisponibles, setRutasDisponibles] = useState<any[]>([]);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<any[]>([]);

  // Mock de viajes recientes según requerimiento (hasta que se conecte API)
  const [viajesRecientes] = useState([
    { id: 'v1', unidad: 'MX7-814', estado: 'Completado', horaInicio: 'Hoy, 09:30 AM', duracion: '1h 45m', stamp: 1 },
    { id: 'v2', unidad: 'MX7-001', estado: 'Cancelado', horaInicio: 'Hoy, 08:15 AM', duracion: '--', stamp: 2 },
    { id: 'v3', unidad: 'MX7-992', estado: 'En ruta', horaInicio: 'Hoy, 10:45 AM', duracion: '45m', stamp: 0 }
  ]);

  // Ordenado por el más reciente (stamp 0 es el último)
  const viajesOrdenados = [...viajesRecientes].sort((a, b) => a.stamp - b.stamp);

  // Rating inicial calculado dinámicamente
  const calcularRating = () => {
    return Number((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1));
  };

  const obtenerIniciales = (nombre: string, apPaterno?: string) => {
    const p1 = nombre ? nombre.charAt(0).toUpperCase() : '';
    const p2 = apPaterno ? apPaterno.charAt(0).toUpperCase() : '';
    return (p1 + p2) || 'U';
  };

  React.useEffect(() => {
    const fetchDatos = async () => {
      try {
        if (!token) return;

        const [resCond, resRutas, resUnidades] = await Promise.all([
          api.get('/conductores', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/rutas', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/unidades', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        // Mapear los usuarios del backend a la interfaz Conductor del frontend
        const conductoresMapeados = resCond.data.data.conductores.map((cData: any) => ({
          id: cData._id,
          nombre: cData.user?.username || cData.username || 'Sin Nombre',
          apPaterno: '',
          apMaterno: '',
          licencia: cData.licencia || 'Pendiente',
          unidad: cData.unidad || 'Por asignar',
          telefono: cData.telefono || 'Pendiente',
          correo: cData.user?.email || cData.email || '',
          rol: cData.user?.role || cData.role || 'CONDUCTOR',
          fechaNacimiento: cData.fechaNacimiento ? cData.fechaNacimiento.split('T')[0] : '',
          edad: cData.edad || '',
          ruta: cData.rutaAsignadaId?.nombre || cData.ruta || 'Sin ruta',
          rutaAsignadaId: cData.rutaAsignadaId?._id || '',
          estado: (cData.user?.isActive ?? cData.isActive) ? 'Activo' : 'Inactivo',
          rating: calcularRating(),
          iniciales: obtenerIniciales(cData.user?.username || cData.username)
        }));

        setConductores(conductoresMapeados);
        setRutasDisponibles(resRutas.data || []);
        setUnidadesDisponibles(Array.isArray(resUnidades.data) ? resUnidades.data : resUnidades.data?.data || []);
      } catch (error) {
        console.error('Error al obtener datos', error);
        alerta.dispararError('Error de carga', 'No se pudo sincronizar la información del servidor.');
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.unidad.trim() || !form.licencia.trim() || !form.telefono.trim() || !form.correo.trim() || !form.fechaNacimiento) {
      alerta.dispararError('Campos incompletos', 'Asegúrese de llenar todos los campos obligatorios del formulario.', 'Validación fallida');
      return;
    }

    try {
      if (!token) throw new Error("No hay sesión activa");

      const nombreBase = `${form.nombre} ${form.apPaterno} ${form.apMaterno}`.trim();

      if (conductorEditando) {
        // Modo Edición
        const payload = {
          username: nombreBase,
          email: form.correo,
          telefono: form.telefono,
          licencia: form.licencia,
          unidad: form.unidad.toUpperCase(),
          fechaNacimiento: form.fechaNacimiento,
          rutaAsignadaId: form.rutaAsignadaId || null
        };

        const res = await api.put(`/conductores/${conductorEditando}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const actualizado = res.data.data.conductor;
        const index = conductores.findIndex(c => c.id === conductorEditando);
        if (index !== -1) {
          const nuevos = [...conductores];
          nuevos[index] = {
            ...nuevos[index],
            nombre: actualizado.user?.username || nombreBase,
            correo: actualizado.user?.email || form.correo,
            telefono: actualizado.telefono,
            licencia: actualizado.licencia,
            unidad: actualizado.unidad,
            fechaNacimiento: actualizado.fechaNacimiento ? actualizado.fechaNacimiento.split('T')[0] : '',
            edad: actualizado.edad,
            ruta: rutasDisponibles.find(r => r._id === actualizado.rutaAsignadaId)?.nombre || 'Sin ruta',
            rutaAsignadaId: actualizado.rutaAsignadaId,
            iniciales: obtenerIniciales(actualizado.user?.username || nombreBase)
          };
          setConductores(nuevos);
        }

        cerrarModal();
        alerta.disparar({
          tipo: 'exito',
          titulo: 'Actualización Exitosa',
          mensaje: `Los datos del conductor han sido actualizados.`
        });
      } else {
        // Modo Creación
        const pureName = form.nombre.replace(/\s+/g, '');
        const pureUnit = form.unidad.replace(/\s+/g, '');
        const defaultPassword = `${pureName}${pureUnit}*`;

        const payload = {
          username: nombreBase,
          email: form.correo,
          password: defaultPassword,
          telefono: form.telefono,
          licencia: form.licencia,
          unidad: form.unidad.toUpperCase(),
          fechaNacimiento: form.fechaNacimiento,
          rutaAsignadaId: form.rutaAsignadaId || null
        };

        const res = await api.post('/conductores', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const nuevoConductorBase = res.data.data.conductor;
        const userBase = res.data.data.user;

        const nuevoConductor: Conductor = {
          id: nuevoConductorBase._id,
          nombre: userBase.username,
          apPaterno: '',
          apMaterno: '',
          licencia: nuevoConductorBase.licencia,
          unidad: nuevoConductorBase.unidad,
          telefono: nuevoConductorBase.telefono,
          correo: userBase.email,
          rol: userBase.role,
          fechaNacimiento: nuevoConductorBase.fechaNacimiento ? nuevoConductorBase.fechaNacimiento.split('T')[0] : '',
          edad: res.data.data.edad || '', // Podría no venir calculado en el create directo
          ruta: rutasDisponibles.find(r => r._id === nuevoConductorBase.rutaAsignadaId)?.nombre || 'Sin ruta',
          rutaAsignadaId: nuevoConductorBase.rutaAsignadaId || '',
          estado: 'Activo',
          rating: calcularRating(),
          iniciales: obtenerIniciales(userBase.username)
        };

        setConductores([nuevoConductor, ...conductores]);
        cerrarModal();
        alerta.disparar({
          tipo: 'exito',
          titulo: 'Registro Exitoso',
          mensaje: `El conductor fue registrado. La contraseña por defecto es: ${defaultPassword}`
        });
      }
    } catch (error: any) {
      console.error('Error al guardar conductor', error);
      const mensaje = error.response?.data?.mensaje || 'No se pudo guardar el conductor, intente nuevamente.';
      alerta.dispararError('Error de Operación', mensaje);
    }
  };

  const manejarEditar = (conductor: Conductor) => {
    // Intentar separar el nombre completo
    const partes = conductor.nombre.split(' ');
    const nombre = partes[0] || '';
    const apPaterno = partes[1] || '';
    const apMaterno = partes.slice(2).join(' ') || '';

    setForm({
      nombre,
      apPaterno,
      apMaterno,
      licencia: conductor.licencia,
      unidad: conductor.unidad,
      telefono: conductor.telefono,
      correo: conductor.correo,
      fechaNacimiento: conductor.fechaNacimiento,
      rutaAsignadaId: conductor.rutaAsignadaId
    });
    setConductorEditando(conductor.id);
    setMostrarFormulario(true);
  };

  const cerrarModal = () => {
    setMostrarFormulario(false);
    setConductorEditando(null);
    setForm({
      nombre: '', apPaterno: '', apMaterno: '', licencia: '',
      unidad: '', telefono: '', correo: '', fechaNacimiento: '',
      rutaAsignadaId: ''
    });
  };

  const eliminarConductor = (id: string) => {
    setConductores(conductores.filter(c => c.id !== id));
    alerta.disparar({
      tipo: 'info',
      titulo: 'Conductor Removido',
      mensaje: 'El conductor fue eliminado del directorio.'
    });
  };

  const alternarOrden = (criterio: 'nombre' | 'unidad' | 'rating') => {
    if (ordenCriterio === criterio) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenCriterio(criterio);
      setOrdenDireccion('asc');
    }
  };

  const conductoresFiltradosYRondeados = conductores
    .filter(c =>
      (c.nombre && c.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (c.apPaterno && c.apPaterno.toLowerCase().includes(busqueda.toLowerCase())) ||
      (c.unidad && c.unidad.toLowerCase().includes(busqueda.toLowerCase())) ||
      (c.correo && c.correo.toLowerCase().includes(busqueda.toLowerCase()))
    )
    .sort((a, b) => {
      let valorA = a[ordenCriterio];
      let valorB = b[ordenCriterio];

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return ordenDireccion === 'asc'
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      }

      if (typeof valorA === 'number' && typeof valorB === 'number') {
        return ordenDireccion === 'asc' ? valorA - valorB : valorB - valorA;
      }

      return 0;
    });

  // Paginación
  const indiceUltimoConductor = paginaActual * conductoresPorPagina;
  const indicePrimerConductor = indiceUltimoConductor - conductoresPorPagina;
  const conductoresPaginados = conductoresFiltradosYRondeados.slice(indicePrimerConductor, indiceUltimoConductor);
  const totalPaginas = Math.ceil(conductoresFiltradosYRondeados.length / conductoresPorPagina);

  return (
    <div id="view-drivers" className="space-y-6 relative">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <h3 className="font-bold text-slate-700">Directorio de Conductores</h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar conductor o unidad..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1); // Resetear a pag 1 al buscar
                }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                cerrarModal();
                setMostrarFormulario(true);
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 border border-transparent px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => alternarOrden('nombre')}>
                  <div className="flex items-center gap-2">Conductor <ArrowUpDown className={`w-3 h-3 ${ordenCriterio === 'nombre' ? 'text-blue-600' : 'text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => alternarOrden('unidad')}>
                  <div className="flex items-center gap-2">Unidad <ArrowUpDown className={`w-3 h-3 ${ordenCriterio === 'unidad' ? 'text-blue-600' : 'text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-4">Ruta Asignada</th>
                <th className="px-6 py-4">Estado</th>

                <th className="px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={() => alternarOrden('rating')}>
                  <div className="flex items-center gap-2">Rating <ArrowUpDown className={`w-3 h-3 ${ordenCriterio === 'rating' ? 'text-blue-600' : 'text-slate-400'}`} /></div>
                </th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                      <p>Cargando directorio de conductores...</p>
                    </div>
                  </td>
                </tr>
              ) : conductoresFiltradosYRondeados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>No se encontraron conductores en el directorio.</p>
                      <p className="text-xs mt-1 opacity-75">Intenta con otro término de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                conductoresPaginados.map((conductor) => (
                  <tr key={conductor.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 ring-2 ring-white shadow-sm">
                        {conductor.iniciales}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {conductor.nombre} {conductor.apPaterno}
                        </div>
                        <div className="text-xs text-slate-400">Licencia: {conductor.licencia}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono select-all">{conductor.unidad}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                        {conductor.ruta}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                        {conductor.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-1 font-bold text-slate-900">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {conductor.rating.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => manejarEditar(conductor)}
                        className="text-slate-400 hover:text-blue-600 px-2 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarConductor(conductor.id)}
                        className="text-slate-400 hover:text-red-600 px-2 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Controles de Paginación */}
          {!cargando && conductoresFiltradosYRondeados.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-sm text-slate-500">
                Mostrando <span className="font-bold text-slate-700">{indicePrimerConductor + 1}</span> a <span className="font-bold text-slate-700">{Math.min(indiceUltimoConductor, conductoresFiltradosYRondeados.length)}</span> de <span className="font-bold text-slate-700">{conductoresFiltradosYRondeados.length}</span> conductores
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-bold text-slate-700 px-2 border-r border-l border-slate-200">
                  {paginaActual} / {totalPaginas}
                </div>
                <button
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="bg-slate-700 text-white py-3 px-6 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <History className="w-5 h-5" /> Historial de Viajes Recientes
          </h2>
          <button type="button" className="text-slate-300 hover:text-white text-sm transition-colors">
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-bold text-slate-700">Unidad</th>
                <th className="px-6 py-3 font-bold text-slate-700">Estado Final</th>
                <th className="px-6 py-3 font-bold text-slate-700">Hora Inicio</th>
                <th className="px-6 py-3 font-bold text-slate-700">Duración</th>
                <th className="px-6 py-3 font-bold text-slate-700">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viajesOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <History className="w-8 h-8 mb-2 text-slate-300" />
                      <p>No hay historial de viajes reciente.</p>
                      <p className="text-xs mt-1 text-slate-400">Los viajes aparecerán aquí a medida que se completen.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                viajesOrdenados.map((viaje) => (
                  <tr key={viaje.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{viaje.unidad}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${viaje.estado === 'Completado' ? 'text-green-600' :
                        viaje.estado === 'Cancelado' ? 'text-slate-400' :
                          'text-blue-500 animate-pulse'
                        }`}>
                        {viaje.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">{viaje.horaInicio}</td>
                    <td className="px-6 py-4">{viaje.duracion}</td>
                    <td className="px-6 py-4">
                      <button type="button" className="bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-200 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / VENTANA FLOTANTE PARA EL FORMULARIO */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {conductorEditando ? <Edit2 className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                {conductorEditando ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
              </h4>
              <button
                onClick={cerrarModal}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form id="conductor-form" onSubmit={manejarGuardar} className="space-y-6">

                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                    Datos Personales
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre(s) *</label>
                      <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ap. Paterno *</label>
                      <input type="text" name="apPaterno" value={form.apPaterno} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ap. Materno</label>
                      <input type="text" name="apMaterno" value={form.apMaterno} onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha Nacimiento *</label>
                      <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                </div>


                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                    Contacto y Asignación
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono *</label>
                      <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico *</label>
                      <input type="email" name="correo" value={form.correo} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número de Licencia *</label>
                      <input type="text" name="licencia" value={form.licencia} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unidad Asignada * (Placa)</label>
                      <select name="unitSelect" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono uppercase bg-white"
                      >
                        <option value="">-- Seleccionar Unidad --</option>
                        {unidadesDisponibles.map(u => (
                          <option key={u._id} value={u.placa}>{u.placa}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asignar Ruta *</label>
                      <select name="rutaAsignadaId" value={form.rutaAsignadaId} onChange={handleChange} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                      >
                        <option value="">-- Seleccionar Ruta --</option>
                        {rutasDisponibles.map(r => (
                          <option key={r._id} value={r._id}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>


              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="conductor-form"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" /> {conductorEditando ? 'Actualizar Cambios' : 'Guardar Conductor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalAlerta
        mostrar={alerta.mostrar}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        detalles={alerta.detalles}
        alCerrar={alerta.cerrar}
      />
    </div>
  );
};

export default DriversView;
