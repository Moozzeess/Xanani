import React, { useState } from 'react';
import { useAlertaGlobal } from '../../../context/AlertaContext';
import { ListaRutas } from './ListaRutas';
import { EditorRutas } from './EditorRutas';
import { ModalVerRuta } from './ModalVerRuta';
import api from '../../../services/api';
import { useAuth } from '../../../auth/useAuth';
import '../../../Styles/VistaRutas.css';

const VistaRutas: React.FC = () => {
  const { disparar, dispararError } = useAlertaGlobal();
  const { token } = useAuth();

  // Estado para controlar la vista activa ('lista' o 'editor')
  const [estadoVista, setEstadoVista] = useState<'lista' | 'editor'>('lista');
  const [rutaSeleccionada, setRutaSeleccionada] = useState<any>(null);
  
  // Estado para el modal de visualización
  const [rutaParaVer, setRutaParaVer] = useState<any>(null);

  // Estado para almacenar todas las rutas de la base de datos o simuladas
  const [rutas, setRutas] = useState<any[]>([]);

  const fetchRutas = async () => {
    try {
      if (!token) return;
      const res = await api.get('/rutas', { headers: { Authorization: `Bearer ${token}` } });
      setRutas(res.data || []);
    } catch (e) {
      dispararError('Error', 'No se pudieron cargar las rutas registradas.');
    }
  };

  React.useEffect(() => {
    fetchRutas();
  }, [token]);

  const manejarGuardarRuta = async (nuevaRuta: any) => {
    try {
      if (!token) return;

      if (rutaSeleccionada && rutaSeleccionada._id) {
        await api.put(`/rutas/${rutaSeleccionada._id}`, nuevaRuta, { headers: { Authorization: `Bearer ${token}` } });
        disparar({ tipo: 'exito', titulo: 'Actualizada', mensaje: 'Ruta actualizada exitosamente en sistema.' });
      } else {
        await api.post('/rutas', nuevaRuta, { headers: { Authorization: `Bearer ${token}` } });
        disparar({ tipo: 'exito', titulo: 'Guardada', mensaje: 'Ruta registrada exitosamente en sistema.' });
      }

      fetchRutas();
      setEstadoVista('lista');
    } catch (err: any) {
      dispararError('Error al guardar', 'Ocurrió un error guardando la ruta en la base de datos.');
    }
  };

  const manejarEliminarRuta = async (rutaId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta ruta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      if (!token) return;
      await api.delete(`/rutas/${rutaId}`, { headers: { Authorization: `Bearer ${token}` } });
      disparar({ tipo: 'exito', titulo: 'Eliminada', mensaje: 'La ruta ha sido eliminada del sistema.' });
      fetchRutas();
    } catch (err) {
      dispararError('Error al eliminar', 'No se pudo eliminar la ruta seleccionada.');
    }
  };

  const manejarVerRuta = (ruta: any) => {
    setRutaParaVer(ruta);
  };

  if (estadoVista === 'lista') {
    return (
      <>
        <ListaRutas
          rutas={rutas}
          alHacerClicCrear={() => { setRutaSeleccionada(null); setEstadoVista('editor'); }}
          alHacerClicEditar={(ruta) => { setRutaSeleccionada(ruta); setEstadoVista('editor'); }}
          alHacerClicVer={manejarVerRuta}
          alHacerClicEliminar={manejarEliminarRuta}
        />
        {rutaParaVer && (
          <ModalVerRuta 
            ruta={rutaParaVer} 
            alCerrar={() => setRutaParaVer(null)} 
          />
        )}
      </>
    );
  }

  return (
    <EditorRutas
      disparar={disparar}
      rutaInicial={rutaSeleccionada}
      alVolver={() => setEstadoVista('lista')}
      alGuardarExitoso={manejarGuardarRuta}
    />
  );
};

export default VistaRutas;