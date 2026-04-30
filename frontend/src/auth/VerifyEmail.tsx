import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [estado, setEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const decodificarToken = async () => {
      try {
        const respuesta = await api.get(`/autenticacion/verify-email/${token}`);
        setMensaje(respuesta.data.mensaje || "Cuenta verificada con éxito.");
        setEstado("exito");
      } catch (err: any) {
        setMensaje(err.response?.data?.mensaje || "El enlace es inválido o ha expirado.");
        setEstado("error");
      }
    };
    decodificarToken();
  }, [token]);

  return (
    <div className="login-page">
      <div className="login-visual-section">
        {/* Usamos el mismo diseño del login global para mantener consistencia visual */}
        <div className="visual-overlay"></div>
      </div>
      
      <div className="login-form-section">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-header text-center">
              <h2>Verificación de Cuenta</h2>
            </div>
            
            <div className="auth-form text-center mt-6">
              {estado === "cargando" && (
                <p className="text-gray-600">Verificando tu cuenta. Por favor espera...</p>
              )}
              {estado === "exito" && (
                <>
                  <p className="text-green-600 font-medium mb-4">{mensaje}</p>
                  <Link to="/login" className="btn-auth-submit mt-4 block text-center" style={{ textDecoration: 'none' }}>
                    Ir a Iniciar Sesión
                  </Link>
                </>
              )}
              {estado === "error" && (
                <>
                  <p className="text-red-500 font-medium mb-4">{mensaje}</p>
                  <Link to="/login" className="option-link-back block mt-4">
                    Volver al inicio
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
