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
      return "/";
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
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Validación para habilitar el botón de login
  const puedeEnviarLogin = useMemo(() => {
    return usuarioOEmail.trim().length > 0 && contrasena.length > 0;
  }, [usuarioOEmail, contrasena]);

  // Validación para habilitar el botón de registro
  const puedeEnviarRegistro = useMemo(() => {
    return (
      emailRegistro.trim().length > 0 &&
      usuarioRegistro.trim().length > 0 &&
      contrasenaRegistro.length > 0 &&
      confirmarContrasenaRegistro.length > 0
    );
  }, [emailRegistro, usuarioRegistro, contrasenaRegistro, confirmarContrasenaRegistro]);

  /**
   * Maneja el envío del formulario de inicio de sesión.
   */
  const alEnviarLogin = async () => {
    try {
      setEstaEnviando(true);
      setMensajeError(null);
      await iniciarSesion({ usernameOrEmail: usuarioOEmail.trim(), password: contrasena });
      navegar("/", { replace: true });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al iniciar sesión.';
      setMensajeError(mensaje);
    } finally {
      setEstaEnviando(false);
    }
  };

  /**
   * Maneja el envío del formulario de registro.
   */
  const alEnviarRegistro = async () => {
    try {
      setEstaEnviando(true);
      setMensajeError(null);

      if (contrasenaRegistro !== confirmarContrasenaRegistro) {
        setMensajeError('Las contraseñas no coinciden.');
        return;
      }

      await registrarUsuario({
        email: emailRegistro.trim(),
        username: usuarioRegistro.trim(),
        password: contrasenaRegistro
      });

      navegar("/", { replace: true });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al registrarse.';
      setMensajeError(mensaje);
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* FONDO (MAPA) */}
      <div id="map-bg"></div>
      <div id="map-overlay"></div>

      {/* TARJETA DE AUTENTICACION */}
      <div className="auth-card">
        <div className="logo-circle">
          <img src="/LOGO.png" alt="XANANI" className="logo-inner" />
        </div>
        <h1 className="auth-title">XANANI</h1>
        <p className="auth-subtitle">Movilidad Inteligente</p>

        <div className="form-wrapper">
          {mensajeError && (
            <div style={{ color: '#ef4444', marginBottom: 12, textAlign: 'center' }}>
              {mensajeError}
            </div>
          )}

          {/* LOGIN */}
          {formularioActivo === "login" && (
            <div className="auth-form">
              <input
                className="input-style"
                placeholder="Usuario o Email"
                type="text"
                value={usuarioOEmail}
                onChange={(e) => setUsuarioOEmail(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Contraseña"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              <button
                className="btn-auth"
                onClick={alEnviarLogin}
                disabled={!puedeEnviarLogin || estaEnviando}
              >
                Iniciar sesión
              </button>
              <div className="footer-links">
                <button onClick={() => setFormularioActivo("register")} className="link-style">Registro</button>
                <button onClick={() => setFormularioActivo("recover")} className="link-style">Recuperar</button>
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
                placeholder="Contraseña"
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
              />
              <button
                className="btn-auth btn-primary-auth"
                onClick={alEnviarRegistro}
                disabled={!puedeEnviarRegistro || estaEnviando}
              >
                Continuar
              </button>
              <button onClick={() => setFormularioActivo("login")} className="link-style" style={{ textAlign: 'center' }}>Volver</button>
            </div>
          )}

          {/* RECOVER */}
          {formularioActivo === "recover" && (
            <div className="auth-form">
              <input className="input-style" placeholder="Email" type="email" />
              <button className="btn-auth">Enviar enlace</button>
              <button onClick={() => setFormularioActivo("login")} className="link-style" style={{ textAlign: 'center' }}>Volver</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaginaLogin;