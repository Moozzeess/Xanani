
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PaginaLogin from "./auth/LoginPage";
import LandingPasajero from "./auth/LandingPage";
import VerifyEmail from "./auth/VerifyEmail";
import ResetPassword from "./auth/ResetPassword";
import { useAuth } from "./auth/useAuth";
import type { Role } from "./types/auth";
import RutaProtegida from "./auth/ProtectedRoute";

import SuperusuarioPage from "./pages/superuser/superuser";
import AdminDashboard from "./pages/administrador/adminDasboard";
import Conductor from "./pages/conductor/Conductor";
import Pasajero from "./pages/pasajero/Pasajero";

/**
 * Determina la ruta por defecto según el rol del usuario.
 * 
 * @param {Role} rol - El rol del usuario.
 * @returns {string} La ruta de destino.
 */
function obtenerRutaPorDefecto(rol: Role): string {
  switch (rol) {
    case "SUPERUSUARIO":
      return "/superuser";
    case "ADMINISTRADOR":
      return "/admin";
    case "CONDUCTOR":
      return "/conductor";
    case "PASAJERO":
      return "/pasajero";
    default:
      return "/LandingPage";
  }
}

/**
 * Componente que maneja la ruta raíz:
 * - Si es invitado: muestra LandingPasajero.
 * - Si está autenticado: redirige según el rol.
 */
function RutaHome() {
  const { estaAutenticado, estaCargando, usuario } = useAuth();

  if (estaCargando) return null;

  if (!estaAutenticado || !usuario) {
    return <LandingPasajero />;
  }

  return <Navigate to={obtenerRutaPorDefecto(usuario.role)} replace />;
}

/**
 * Componente principal de la aplicación.
 * Define la estructura de rutas y envuelve las páginas en proveedores y protecciones.
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/LandingPage" element={<RutaHome />} />
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/superuser"
          element={
            <RutaProtegida allowedRoles={["SUPERUSUARIO"]}>
              <SuperusuarioPage />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RutaProtegida allowedRoles={["ADMINISTRADOR"]}>
              <AdminDashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/conductor"
          element={
            <RutaProtegida allowedRoles={["CONDUCTOR"]}>
              <Conductor />
            </RutaProtegida>
          }
        />
        <Route
          path="/pasajero"
          element={
            <RutaProtegida allowedRoles={["PASAJERO"]}>
              <Pasajero />
            </RutaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/LandingPage" replace />} />
      </Routes>
    </Router>
  );
}

export default App;