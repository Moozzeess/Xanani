import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";
import { useAlertaGlobal } from "../context/AlertaContext";

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const [estado, setEstado] = useState<"pendiente" | "cargando" | "exito" | "error">("pendiente");
  const [mensaje, setMensaje] = useState("");
  const { disparar, dispararError } = useAlertaGlobal();

  const verificarCuenta = async () => {
    try {
      setEstado("cargando");
      // Se pasa mostrarAlertaGlobal: false para que no salte el interceptor global y lo manejemos aquí
      const respuesta = await api.get(`/autenticacion/verify-email/${token}`, { mostrarAlertaGlobal: false } as any);
      setMensaje(respuesta.data.mensaje || "Cuenta verificada con éxito. Ya puedes iniciar sesión.");
      setEstado("exito");
      disparar({
        tipo: 'exito',
        titulo: '¡Verificado!',
        mensaje: respuesta.data.mensaje || "Cuenta verificada con éxito."
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.mensaje || "El enlace es inválido o ha expirado.";
      setMensaje(errorMsg);
      setEstado("error");
      dispararError(errorMsg, "", "Error de Verificación");
    }
  };

  return (
    <div className="login-page-container">
      <div id="map-bg"></div>
      <div id="map-overlay"></div>
      
      <div className="auth-card-divided">
        <div className="card-identity-side">
            <div className="logo-wrapper">
              <img src="/LOGO.png" alt="XANANI" className="logo-main" />
              <h1 className="brand-name">XANANI</h1>
              <p className="brand-tagline">Movilidad Inteligente</p>
            </div>
            <div className="card-legal-footer">
              <Link to="/privacidad" className="legal-link">Privacidad</Link>
              <span className="legal-divider">•</span>
              <Link to="/seguridad" className="legal-link">Seguridad</Link>
            </div>
        </div>

        <div className="card-form-side">
          <div className="form-content">
            <h2 className="form-status-title">Verificación de Cuenta</h2>
            
            <div className="auth-form text-center mt-6">
              {estado === "pendiente" && (
                <>
                  <p className="text-slate-600 font-medium mb-4" style={{ marginBottom: '20px' }}>
                    Haz clic en el botón de abajo para verificar tu correo electrónico de forma segura.
                  </p>
                  <button onClick={verificarCuenta} className="btn-auth-submit">
                    Verificar mi cuenta
                  </button>
                  <Link to="/login" className="option-link-back block mt-4 text-center" style={{ marginTop: '15px' }}>
                    Volver al inicio
                  </Link>
                </>
              )}

              {estado === "cargando" && (
                <p className="text-slate-600 font-medium">Verificando tu cuenta. Por favor espera...</p>
              )}

              {estado === "exito" && (
                <>
                  <p className="text-emerald-600 font-medium mb-4" style={{ marginBottom: '20px' }}>{mensaje}</p>
                  <Link to="/login" className="btn-auth-submit mt-4 block text-center" style={{ textDecoration: 'none' }}>
                    Ir a Iniciar Sesión
                  </Link>
                </>
              )}

              {estado === "error" && (
                <>
                  <p className="text-red-500 font-medium mb-4" style={{ marginBottom: '20px' }}>{mensaje}</p>
                  <Link to="/login" className="option-link-back block mt-4 text-center">
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
