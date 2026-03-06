import { useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../../autenticacion/usarAutenticacion';

const PanelConductor = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = usarAutenticacion();

  const alCerrarSesion = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <div>
      <h1>Hola Mundo</h1>
      <p>Vista Conductor.</p>
      <button onClick={alCerrarSesion}>Cerrar sesión</button>
    </div>
  );
};

export default PanelConductor;
