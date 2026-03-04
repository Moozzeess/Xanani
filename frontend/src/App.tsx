// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import LandingPage from "./auth/LandingPage";
import { useAuth } from "./auth/useAuth";
import type { Role } from "./types/auth";
import ProtectedRoute from "./auth/ProtectedRoute";

import SuperusuarioPage from "./pages/superuser/superuser";
import AdminDashboard from "./pages/administrador/adminDasboard";
import Conductor from "./pages/conductor/Conductor";
import Pasajero from "./pages/pasajero/Pasajero";

function getDefaultRouteByRole(role: Role): string {
  switch (role) {
    case "SUPERUSUARIO":
      return "/superuser";
    case "ADMINISTRADOR":
      return "/admin";
    case "CONDUCTOR":
      return "/conductor";
    case "PASAJERO":
      return "/pasajero";
    default:
      return "/";
  }
}

/**
 * Página raíz:
 * - Invitado: muestra LandingPage.
 * - Autenticado: redirige según el rol.
 */
function HomeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated || !user) {
    return <LandingPage />;
  }

  return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/superuser"
          element={
            <ProtectedRoute allowedRoles={["SUPERUSUARIO"]}>
              <SuperusuarioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMINISTRADOR"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conductor"
          element={
            <ProtectedRoute allowedRoles={["CONDUCTOR"]}>
              <Conductor/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pasajero"
          element={
            <ProtectedRoute allowedRoles={["PASAJERO"]}>
              <Pasajero />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;