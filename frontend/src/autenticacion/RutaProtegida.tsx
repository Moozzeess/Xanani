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
  // IMPORTANTE: usarAutenticacion() devuelve 'user' (inglés), no 'usuario'
  const { estaAutenticado, estaCargando, user } = usarAutenticacion();

  if (estaCargando) return null;

  if (!estaAutenticado || !user) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: ubicacion.pathname }} />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
