import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { useAuth } from "./useAuth";
import type { Role } from "../types/auth";

type FormType = "login" | "register" | "recover";

/**
 * Determina la ruta por defecto según el rol del usuario.
 *
 * @param {Role} rol - El rol del usuario autenticado.
 * @returns {string} La ruta de redirección.
 */
function obtenerRutaPorDefecto(rol: Role): string {
  switch (rol) {
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

/**
 * Componente de la página de inicio de sesión y registro.
 * Maneja la autenticación de usuarios y la persistencia de sesión.
 */
const PaginaLogin = () => {
  const [formularioActivo, setFormularioActivo] = useState<FormType>("login");
  const navegar = useNavigate();
  const { iniciarSesion, registrarUsuario, estaAutenticado, usuario, estaCargando } = useAuth();

  // Efecto para redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (estaCargando) return;
    if (estaAutenticado && usuario) {
      navegar(obtenerRutaPorDefecto(usuario.role), { replace: true });
    }
  }, [estaAutenticado, usuario, estaCargando, navegar]);

  // Estados del formulario de login
  const [usuarioOEmail, setUsuarioOEmail] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Estados del formulario de registro
  const [emailRegistro, setEmailRegistro] = useState("");
  const [usuarioRegistro, setUsuarioRegistro] = useState("");
  const [contrasenaRegistro, setContrasenaRegistro] = useState("");
  const [confirmarContrasenaRegistro, setConfirmarContrasenaRegistro] = useState("");

  const [estaEnviando, setEstaEnviando] = useState(false);

  // Validación para habilitar el botón de login (Solo campos no vacíos)
  const puedeEnviarLogin = useMemo(() => {
    return usuarioOEmail.trim().length > 0 && contrasena.length > 0;
  }, [usuarioOEmail, contrasena]);

  // Validación para habilitar el botón de registro
  const puedeEnviarRegistro = useMemo(() => {
    const tieneCaracterEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(contrasenaRegistro);
    return (
      emailRegistro.trim().length > 0 &&
      usuarioRegistro.trim().length > 0 &&
      contrasenaRegistro.length >= 8 &&
      tieneCaracterEspecial &&
      contrasenaRegistro === confirmarContrasenaRegistro
    );
  }, [emailRegistro, usuarioRegistro, contrasenaRegistro, confirmarContrasenaRegistro]);

  /**
   * Maneja el evento de presionar una tecla (Enter)
   */
  const alPresionarTecla = (e: React.KeyboardEvent, accion: () => void, habilitado: boolean) => {
    if (e.key === "Enter" && habilitado && !estaEnviando) {
      accion();
    }
  };

  /**
   * Maneja el envío del formulario de inicio de sesión.
   */
  const alEnviarLogin = async () => {
    try {
      setEstaEnviando(true);
      await iniciarSesion({ usernameOrEmail: usuarioOEmail.trim(), password: contrasena });
    } catch (e) {
      console.error(e);
    } finally {
      setEstaEnviando(false);
    }
  };

  /**
   * Maneja el envío del formulario de registro.
   */
  const alEnviarRegistro = async () => {
    if (contrasenaRegistro !== confirmarContrasenaRegistro) {
      return;
    }

    try {
      setEstaEnviando(true);
      await registrarUsuario({
        email: emailRegistro.trim(),
        username: usuarioRegistro.trim(),
        password: contrasenaRegistro
      });
    } catch (e) {
      console.error(e);
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <>
      <div className="login-page-container">
        {/* FONDO (MAPA) */}
        <div id="map-bg"></div>
        <div id="map-overlay"></div>

        {/* CONTENEDOR DE TARJETA DIVIDIDA */}
        <div className="auth-card-divided">

          {/* PARTE IZQUIERDA: IDENTIDAD (LOGO Y LEGAL) */}
          <div className="card-identity-side">
            <div className="logo-wrapper">
              <img src="/LOGO.png" alt="XANANI" className="logo-main" />
              <h1 className="brand-name">XANANI</h1>
              <p className="brand-tagline">Movilidad Inteligente</p>
            </div>

            <div className="card-legal-footer">
              <a href="/privacidad" className="legal-link">Privacidad</a>
              <span className="legal-divider">•</span>
              <a href="/seguridad" className="legal-link">Seguridad</a>
            </div>
          </div>

          {/* PARTE DERECHA: FORMULARIO */}
          <div className="card-form-side">
            <div className="form-content">
              <h2 className="form-status-title">
                {formularioActivo === "login" ? "Bienvenido" :
                  formularioActivo === "register" ? "Regístrate" : "Recuperar"}
              </h2>

              <div className={`form-wrapper-animated phase-${formularioActivo}`}>
                {/* LOGIN */}
                {formularioActivo === "login" && (
                  <div className="auth-form">
                    <div className="input-group">
                      <input
                        className="input-style"
                        placeholder="Usuario o Email"
                        type="text"
                        value={usuarioOEmail}
                        onChange={(e) => setUsuarioOEmail(e.target.value)}
                        onKeyDown={(e) => alPresionarTecla(e, alEnviarLogin, puedeEnviarLogin)}
                      />
                    </div>
                    <div className="input-group">
                      <input
                        className="input-style"
                        placeholder="Contraseña"
                        type="password"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        onKeyDown={(e) => alPresionarTecla(e, alEnviarLogin, puedeEnviarLogin)}
                      />
                    </div>
                    <button
                      className="btn-auth-submit"
                      onClick={alEnviarLogin}
                      disabled={!puedeEnviarLogin || estaEnviando}
                    >
                      {estaEnviando ? "Cargando..." : "Iniciar Sesión"}
                    </button>
                    <div className="auth-footer-options">
                      <button onClick={() => setFormularioActivo("register")} className="option-link">Crear cuenta</button>
                      <button onClick={() => setFormularioActivo("recover")} className="option-link">Olvidé mi contraseña</button>
                    </div>
                  </div>
                )}

                {/* REGISTER */}
                {formularioActivo === "register" && (
                  <div className="auth-form">
                    <input
                      className="input-style"
                      placeholder="Email"
                      type="email"
                      value={emailRegistro}
                      onChange={(e) => setEmailRegistro(e.target.value)}
                    />
                    <input
                      className="input-style"
                      placeholder="Usuario"
                      type="text"
                      value={usuarioRegistro}
                      onChange={(e) => setUsuarioRegistro(e.target.value)}
                    />
                    <input
                      className="input-style"
                      placeholder="Contraseña (8+ caracteres y especial)"
                      type="password"
                      value={contrasenaRegistro}
                      onChange={(e) => setContrasenaRegistro(e.target.value)}
                    />
                    <input
                      className="input-style"
                      placeholder="Confirmar contraseña"
                      type="password"
                      value={confirmarContrasenaRegistro}
                      onChange={(e) => setConfirmarContrasenaRegistro(e.target.value)}
                      onKeyDown={(e) => alPresionarTecla(e, alEnviarRegistro, puedeEnviarRegistro)}
                    />
                    <button
                      className="btn-auth-submit"
                      onClick={alEnviarRegistro}
                      disabled={!puedeEnviarRegistro || estaEnviando}
                    >
                      Registrarme
                    </button>
                    <button onClick={() => setFormularioActivo("login")} className="option-link-back">Volver al inicio</button>
                  </div>
                )}

                {/* RECOVER */}
                {formularioActivo === "recover" && (
                  <div className="auth-form">
                    <p className="recover-info">Se enviará un enlace a tu correo.</p>
                    <input className="input-style" placeholder="Email" type="email" />
                    <button className="btn-auth-submit">Enviar</button>
                    <button onClick={() => setFormularioActivo("login")} className="option-link-back">Volver al inicio</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaginaLogin;