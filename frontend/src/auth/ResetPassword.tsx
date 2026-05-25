import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const alGuardar = async () => {
    setMensajeError("");
    
    if (password !== confirmPassword) {
      setMensajeError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setMensajeError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setEstaEnviando(true);
      await api.post(`/autenticacion/reset-password/${token}`, { newPassword: password });
      setMensajeExito("¡Contraseña actualizada con éxito!");
      
      // Redirigir al usuario automáticamente después de un pequeño retraso
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setMensajeError(err.response?.data?.mensaje || "El enlace es inválido o ha expirado.");
    } finally {
      setEstaEnviando(false);
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
            <h2 className="form-status-title">Cambiar Contraseña</h2>
            
            <div className="auth-form text-center mt-6">
              {mensajeExito ? (
                <>
                  <p className="text-emerald-600 font-medium mb-4" style={{ marginBottom: '20px' }}>{mensajeExito}</p>
                  <p className="text-slate-600 font-medium mb-4">Serás redirigido al inicio web...</p>
                </>
              ) : (
                <>
                  <p className="text-slate-600 font-medium mb-4" style={{ marginBottom: '20px' }}>
                    Escribe tu nueva contraseña segura.
                  </p>
                  {mensajeError && <p className="text-red-500 font-medium mb-4" style={{ marginBottom: '20px' }}>{mensajeError}</p>}
                  
                  <input
                    className="input-style mb-4"
                    placeholder="Nueva contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  
                  <input
                    className="input-style mb-4"
                    placeholder="Confirmar nueva contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  
                  <button
                    className="btn-auth-submit mt-4"
                    onClick={alGuardar}
                    disabled={estaEnviando || !password || !confirmPassword}
                  >
                    {estaEnviando ? "Guardando..." : "Actualizar y Entrar"}
                  </button>
                  
                  <Link to="/login" className="option-link-back block mt-4 text-center">
                    Cancelar
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

export default ResetPassword;
