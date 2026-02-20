import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const ConductorDashboard =() => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div>
      <h1>Hola Mundo</h1>
      <p>Vista Conductor.</p>
      <button onClick={onLogout}>Cerrar sesión</button>
    </div>
  );
};

export default ConductorDashboard;