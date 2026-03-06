import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usarAutenticacion } from './usarAutenticacion';
import type { Rol } from '../types/autenticacion';

type PropiedadesRutaProtegida = {
  children: ReactNode;
  rolesPermitidos?: Rol[];
};

export default function RutaProtegida({
  children,
  rolesPermitidos
}: PropiedadesRutaProtegida) {
  const ubicacion = useLocation();
  const { estaAutenticado, estaCargando, usuario } = usarAutenticacion();

  if (estaCargando) return null;

  if (!estaAutenticado || !usuario) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: ubicacion.pathname }} />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
