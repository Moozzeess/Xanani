import React, { useState } from 'react';
import { useAlertaGlobal } from '../../../context/AlertaContext';
import { ListaRutas } from './ListaRutas';
import { EditorRutas } from './EditorRutas';
import '../../../Styles/VistaRutas.css';

const VistaRutas: React.FC = () => {
  const { disparar } = useAlertaGlobal();
  
  // Estado para controlar la vista activa ('lista' o 'editor')
  const [estadoVista, setEstadoVista] = useState<'lista' | 'editor'>('lista');
  
  // Estado para almacenar todas las rutas de la base de datos o simuladas
  const [rutas, setRutas] = useState<any[]>([]);

  const manejarGuardarRuta = (nuevaRuta: any) => {
    setRutas(prev => [...prev, nuevaRuta]);
    setEstadoVista('lista');
  };

  if (estadoVista === 'lista') {
    return (
      <ListaRutas 
        rutas={rutas} 
        alHacerClicCrear={() => setEstadoVista('editor')} 
        alHacerClicEditar={() => setEstadoVista('editor')} 
      />
    );
  }

  return (
    <EditorRutas 
      disparar={disparar} 
      alVolver={() => setEstadoVista('lista')} 
      alGuardarExitoso={manejarGuardarRuta} 
    />
  );
};

export default VistaRutas;
