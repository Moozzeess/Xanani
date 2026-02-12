import { useState } from "react";
import "../styles/login.css";

type FormType = "login" | "register" | "recover";

const LoginPage = () => {
  const [activeForm, setActiveForm] = useState<FormType>("login");

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
          
          {/* LOGIN */}
          {activeForm === "login" && (
            <div className="auth-form">
              <input className="input-style" placeholder="Usuario" type="text" />
              <input className="input-style" placeholder="Contraseña" type="password" />
              <button className="btn-auth">Iniciar sesión</button>
              <div className="footer-links">
                <button onClick={() => setActiveForm("register")} className="link-style">Registro</button>
                <button onClick={() => setActiveForm("recover")} className="link-style">Recuperar</button>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {activeForm === "register" && (
            <div className="auth-form">
              <input className="input-style" placeholder="Email" type="email" />
              <input className="input-style" placeholder="Usuario" type="text" />
              <input className="input-style" placeholder="Contraseña" type="password" />
              <input className="input-style" placeholder="Confirmar contraseña" type="password" />
              <button className="btn-auth btn-primary-auth">Continuar</button>
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