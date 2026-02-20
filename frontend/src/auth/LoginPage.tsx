import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { useAuth } from "./useAuth";
import type { Role } from "../types/auth";

type FormType = "login" | "register" | "recover";

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

const LoginPage = () => {
  const [activeForm, setActiveForm] = useState<FormType>("login");
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      navigate(getDefaultRouteByRole(user.role), { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate]);

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmitLogin = useMemo(() => {
    return usernameOrEmail.trim().length > 0 && password.length > 0;
  }, [usernameOrEmail, password]);

  const canSubmitRegister = useMemo(() => {
    return (
      registerEmail.trim().length > 0 &&
      registerUsername.trim().length > 0 &&
      registerPassword.length > 0 &&
      registerPasswordConfirm.length > 0
    );
  }, [registerEmail, registerUsername, registerPassword, registerPasswordConfirm]);

  const onSubmitLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await login({ usernameOrEmail: usernameOrEmail.trim(), password });
      navigate("/", { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al iniciar sesión.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitRegister = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (registerPassword !== registerPasswordConfirm) {
        setErrorMessage('Las contraseñas no coinciden.');
        return;
      }

      await register({
        email: registerEmail.trim(),
        username: registerUsername.trim(),
        password: registerPassword
      });

      navigate("/", { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al registrarse.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* BACKGROUND */}
      <div id="map-bg"></div>
      <div id="map-overlay"></div>

      {/* CARD */}
      <div className="auth-card">
        <div className="logo-circle">
          <img src="/LOGO.png" alt="XANANI" className="logo-inner" />
        </div>
        <h1 className="auth-title">XANANI</h1>
        <p className="auth-subtitle">Movilidad Inteligente</p>

        <div className="form-wrapper">
          {errorMessage && (
            <div style={{ color: '#ef4444', marginBottom: 12, textAlign: 'center' }}>
              {errorMessage}
            </div>
          )}
          
          {/* LOGIN */}
          {activeForm === "login" && (
            <div className="auth-form">
              <input
                className="input-style"
                placeholder="Usuario o Email"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="btn-auth"
                onClick={onSubmitLogin}
                disabled={!canSubmitLogin || isSubmitting}
              >
                Iniciar sesión
              </button>
              <div className="footer-links">
                <button onClick={() => setActiveForm("register")} className="link-style">Registro</button>
                <button onClick={() => setActiveForm("recover")} className="link-style">Recuperar</button>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {activeForm === "register" && (
            <div className="auth-form">
              <input
                className="input-style"
                placeholder="Email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Usuario"
                type="text"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Contraseña"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Confirmar contraseña"
                type="password"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
              />
              <button
                className="btn-auth btn-primary-auth"
                onClick={onSubmitRegister}
                disabled={!canSubmitRegister || isSubmitting}
              >
                Continuar
              </button>
              <button onClick={() => setActiveForm("login")} className="link-style" style={{textAlign: 'center'}}>Volver</button>
            </div>
          )}

          {/* RECOVER */}
          {activeForm === "recover" && (
            <div className="auth-form">
              <input className="input-style" placeholder="Email" type="email" />
              <button className="btn-auth">Enviar enlace</button>
              <button onClick={() => setActiveForm("login")} className="link-style" style={{textAlign: 'center'}}>Volver</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;