import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    <div className="login-page">
      <div className="login-visual-section">
        <div className="visual-overlay"></div>
      </div>
      
      <div className="login-form-section">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-header text-center">
              <h2>Cambiar Contraseña</h2>
              <p className="recover-info">Escribe tu nueva contraseña segura.</p>
            </div>
            
            <div className="auth-form mt-4">
              {mensajeExito ? (
                <>
                  <p className="text-green-600 font-medium text-center mb-4">{mensajeExito}</p>
                  <p className="text-gray-500 text-center text-sm">Serás redirigido al inicio web...</p>
                </>
              ) : (
                <>
                  {mensajeError && <p className="text-red-500 text-sm mb-4">{mensajeError}</p>}
                  
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
                  
                  <button onClick={() => navigate('/login')} className="option-link-back border-none focus:outline-none">
                    Cancelar
                  </button>
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
