import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PaginaInicioSesion from './autenticacion/PaginaInicioSesion';
import PaginaInicioInvitado from './autenticacion/PaginaInicioInvitado';
import { usarAutenticacion } from './autenticacion/usarAutenticacion';
import type { Rol } from './types/autenticacion';
import RutaProtegida from './autenticacion/RutaProtegida';

import PaginaSuperusuario from './pages/superusuario/superusuario';
import PanelAdministrador from './pages/administrador/panelAdministrador';
import PanelConductor from './pages/conductor/panelConductor';
import PerfilPasajero from './pages/pasajero/perfilPasajero';

function obtenerRutaPorRol(rol: Rol): string {
  switch (rol) {
    case 'SUPERUSUARIO':
      return '/superusuario';
    case 'ADMINISTRADOR':
      return '/administrador';
    case 'CONDUCTOR':
      return '/conductor';
    case 'PASAJERO':
      return '/pasajero';
    default:
      return '/';
  }
}

function RutaInicio() {
  // IMPORTANTE: usarAutenticacion() devuelve 'user' (inglés), no 'usuario'
  const { estaAutenticado, estaCargando, user } = usarAutenticacion();

  if (estaCargando) return null;

  if (!estaAutenticado || !user) {
    return <PaginaInicioInvitado />;
  }

  return <Navigate to={obtenerRutaPorRol(user.role)} replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RutaInicio />} />
        <Route path="/iniciar-sesion" element={<PaginaInicioSesion />} />

        <Route
          path="/superusuario"
          element={
            <RutaProtegida rolesPermitidos={['SUPERUSUARIO']}>
              <PaginaSuperusuario />
            </RutaProtegida>
          }
        />
        <Route
          path="/administrador"
          element={
            <RutaProtegida rolesPermitidos={['ADMINISTRADOR']}>
              <PanelAdministrador />
            </RutaProtegida>
          }
        />
        <Route
          path="/conductor"
          element={
            <RutaProtegida rolesPermitidos={['CONDUCTOR']}>
              <PanelConductor />
            </RutaProtegida>
          }
        />
        <Route
          path="/pasajero"
          element={
            <RutaProtegida rolesPermitidos={['PASAJERO']}>
              <PerfilPasajero />
            </RutaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
