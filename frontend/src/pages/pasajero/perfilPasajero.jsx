import { useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../../autenticacion/usarAutenticacion';

const PerfilPasajero = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = usarAutenticacion();

  const alCerrarSesion = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <div>
      <h1>Hola Mundo</h1>
      <p>Vista Pasajero.</p>
      <button onClick={alCerrarSesion}>Cerrar sesión</button>
    </div>
  );
};

export default PerfilPasajero;
