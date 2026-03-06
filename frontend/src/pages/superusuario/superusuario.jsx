import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../../autenticacion/usarAutenticacion';

const PaginaSuperusuario = () => {
  const navigate = useNavigate();
  const { cerrarSesion } = usarAutenticacion();

  const alCerrarSesion = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  return (
    <div>
      <h1>Hola Mundo</h1>
      <p>Vista Superusuario.</p>
      <button onClick={alCerrarSesion}>Cerrar sesión</button>
    </div>
  );
};

export default PaginaSuperusuario;
