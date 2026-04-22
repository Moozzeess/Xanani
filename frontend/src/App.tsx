
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PaginaLogin from "./auth/LoginPage";
import LandingPasajero from "./auth/LandingPage";
import { useAuth } from "./auth/useAuth";
import type { Role } from "./types/auth";
import RutaProtegida from "./auth/ProtectedRoute";

import SuperusuarioPage from "./pages/superuser/superuser";
import AdminDashboard from "./pages/administrador/adminDasboard";
import Conductor from "./pages/conductor/Conductor";
import Pasajero from "./pages/pasajero/Pasajero";

function obtenerRutaPorDefecto(rol: Role | string): string {
  if (!rol) return "/LandingPage";
  switch (String(rol).toUpperCase()) {
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

function RutaHome() {
  const { estaAutenticado, estaCargando, usuario } = useAuth();

  if (estaCargando) return null;

  if (!estaAutenticado || !usuario) {
    return <LandingPasajero />;
  }

  const rutaDestino = obtenerRutaPorDefecto(usuario.role);
  
  if (rutaDestino === "/LandingPage") {
    return <LandingPasajero />;
  }

  return <Navigate to={rutaDestino} replace />;
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