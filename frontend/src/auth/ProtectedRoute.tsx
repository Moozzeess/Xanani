import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { Role } from "../types/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: Role[];
};

/**
 * Componente que protege rutas según el estado de autenticación y los roles permitidos.
 * Si el usuario no está autenticado, lo redirige al login.
 * Si el usuario no tiene el rol necesario, lo redirige a la raíz.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {ReactNode} props.children - Componentes hijos a renderizar si el acceso está permitido.
 * @param {Role[]} [props.allowedRoles] - Lista opcional de roles permitidos para acceder a la ruta.
 */
export default function RutaProtegida({ children, allowedRoles }: ProtectedRouteProps) {
  const ubicacion = useLocation();
  const { estaAutenticado, estaCargando, usuario } = useAuth();

  // Mostrar nada mientras se verifica el estado de autenticación
  if (estaCargando) return null;

  // Redirigir al login si no está autenticado
  if (!estaAutenticado || !usuario) {
    return <Navigate to="/login" replace state={{ from: ubicacion.pathname }} />;
  }

  // Redirigir si el rol del usuario no está dentro de los permitidos
  if (allowedRoles && !allowedRoles.includes(usuario.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
