import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../styles/login.css";
import { useAuth } from "./useAuth";
import type { Role } from "../types/auth";
import api from "../services/api";
import { useAlertaGlobal } from "../context/AlertaContext";

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
  const { disparar, dispararError } = useAlertaGlobal();

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
  const [mostrarContrasenaLogin, setMostrarContrasenaLogin] = useState(false);

  // Estados del formulario de registro
  const [emailRegistro, setEmailRegistro] = useState("");
  const [usuarioRegistro, setUsuarioRegistro] = useState("");
  const [contrasenaRegistro, setContrasenaRegistro] = useState("");
  const [confirmarContrasenaRegistro, setConfirmarContrasenaRegistro] = useState("");
  const [mostrarContrasenaRegistro, setMostrarContrasenaRegistro] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false);
  const [erroresRegistro, setErroresRegistro] = useState<{email?: string, usuario?: string, contrasena?: string, confirmar?: string}>({});

  // Recuperar contraseña
  const [emailRecuperacion, setEmailRecuperacion] = useState("");
  const [estadoRecuperacion, setEstadoRecuperacion] = useState<string | null>(null);

  // Reenvío de confirmación
  const [necesitaVerificacion, setNecesitaVerificacion] = useState(false);

  const [estaEnviando, setEstaEnviando] = useState(false);

  // Validación del login
  const puedeEnviarLogin = useMemo(() => {
    return usuarioOEmail.trim().length > 0 && contrasena.length > 0;
  }, [usuarioOEmail, contrasena]);

  // Validación de Registro al intentar enviar
  const validarRegistro = () => {
    const errores: {email?: string, usuario?: string, contrasena?: string, confirmar?: string} = {};
    let esValido = true;

    if (!emailRegistro.trim() || !/^\S+@\S+\.\S+$/.test(emailRegistro)) {
      errores.email = "Ingresa un correo electrónico válido.";
      esValido = false;
    }
    if (!usuarioRegistro.trim() || usuarioRegistro.trim().length < 3) {
      errores.usuario = "El usuario debe tener al menos 3 caracteres.";
      esValido = false;
    }
    const tieneCaracterEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(contrasenaRegistro);
    const tieneMayuscula = /[A-Z]/.test(contrasenaRegistro);
    const tieneNumero = /[0-9]/.test(contrasenaRegistro);
    
    if (contrasenaRegistro.length < 8 || !tieneCaracterEspecial || !tieneMayuscula || !tieneNumero) {
      errores.contrasena = "Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo especial.";
      esValido = false;
    }
    if (contrasenaRegistro !== confirmarContrasenaRegistro) {
      errores.confirmar = "Las contraseñas no coinciden.";
      esValido = false;
    }

    setErroresRegistro(errores);
    return esValido;
  };

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
      setNecesitaVerificacion(false);
      const usuarioAuth = await iniciarSesion({ usernameOrEmail: usuarioOEmail.trim(), password: contrasena });
      
      // Mostrar modal de bienvenida dependiendo del rol
      let mensajeBienvenida = 'Nos alegra verte de nuevo. ¡Empecemos!';
      if (usuarioAuth?.role === 'PASAJERO') {
        mensajeBienvenida = 'Explora las rutas disponibles y suscríbete a tu favorita para recibir actualizaciones en tiempo real.';
      } else if (usuarioAuth?.role === 'CONDUCTOR') {
        mensajeBienvenida = 'Buen viaje';
      } else if (usuarioAuth?.role === 'ADMINISTRADOR' || usuarioAuth?.role === 'SUPERUSUARIO') {
        mensajeBienvenida = 'Te invitamos a explorar cada módulo para gestionar la flota de manera eficiente.';
      }

      disparar({
        tipo: 'info',
        titulo: `¡Bienvenido a Xanani, ${usuarioAuth?.username || ''}!`,
        mensaje: mensajeBienvenida
      });
      
    } catch (e: any) {
      console.error("Error Login:", e);
      // El interceptor global ya maneja la alerta si la API devuelve error estándar
      const errorMsg = e.response?.data?.mensaje || e.response?.data?.message || String(e);
      
      if (e.response?.status === 403 || errorMsg.toLowerCase().includes('verific')) {
        setNecesitaVerificacion(true);
      }
      
      // Si fue error de red u otro, dispararError
      if (!e.response) {
        dispararError(errorMsg);
      }
    } finally {
      setEstaEnviando(false);
    }
  };

  /**
   * Maneja el reenvío manual de correo de verificación.
   */
  const alReenviarVerificacion = async () => {
    try {
      setEstaEnviando(true);
      const authApi = await import("../services/auth");
      const result = await authApi.resendVerification(usuarioOEmail.trim());
      disparar({
        tipo: 'exito',
        titulo: 'Correo Enviado',
        mensaje: result.mensaje || "Se ha enviado un nuevo enlace a tu correo."
      });
      setNecesitaVerificacion(false);
    } catch (e: any) {
      console.error("Error reenvío:", e);
      // Interceptor maneja las de API
      if (!e.response) dispararError(String(e));
    } finally {
      setEstaEnviando(false);
    }
  };

  /**
   * Maneja el envío del formulario de registro.
   */
  const alEnviarRegistro = async () => {
    if (!validarRegistro()) return;

    try {
      setEstaEnviando(true);
      await registrarUsuario({
        username: usuarioRegistro.trim(),
        email: emailRegistro.trim(),
        password: contrasenaRegistro
      });
      disparar({
        tipo: 'exito',
        titulo: '¡Cuenta Creada!',
        mensaje: "Por favor revisa la bandeja de entrada de tu correo electrónico (o la bandeja de spam) para verificar tu cuenta."
      });
      sessionStorage.setItem('isNewRegistration', 'true');
      setFormularioActivo("login");
    } catch (e: any) {
      console.error(e);
      if (!e.response) dispararError(String(e));
    } finally {
      setEstaEnviando(false);
    }
  };

  const alEnviarRecuperacion = async () => {
    if (!emailRecuperacion) return;
    try {
      setEstaEnviando(true);
      await api.post("/autenticacion/forgot-password", { email: emailRecuperacion });
      setEstadoRecuperacion("Si el correo existe, hemos enviado un enlace de recuperación. Revisa tu bandeja.");
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
              <Link to="/privacidad" className="legal-link">Privacidad</Link>
              <span className="legal-divider">•</span>
              <Link to="/seguridad" className="legal-link">Seguridad</Link>
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
                  <form 
                    className="auth-form" 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (puedeEnviarLogin && !estaEnviando) alEnviarLogin(); 
                    }}
                  >
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
                      <div className="password-input-wrapper">
                        <input
                          className="input-style"
                          placeholder="Contraseña"
                          type={mostrarContrasenaLogin ? "text" : "password"}
                          value={contrasena}
                          onChange={(e) => setContrasena(e.target.value)}
                          onKeyDown={(e) => alPresionarTecla(e, alEnviarLogin, puedeEnviarLogin)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setMostrarContrasenaLogin(!mostrarContrasenaLogin)}
                          title={mostrarContrasenaLogin ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {mostrarContrasenaLogin ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <button
                      className="btn-auth-submit"
                      onClick={alEnviarLogin}
                      disabled={!puedeEnviarLogin || estaEnviando}
                    >
                      {estaEnviando ? "Cargando..." : "Iniciar Sesión"}
                    </button>
                    {necesitaVerificacion && (
                      <button
                        type="button"
                        className="btn-auth-submit"
                        style={{ marginTop: '10px' }}
                        onClick={alReenviarVerificacion}
                        disabled={estaEnviando}
                      >
                        ¿No recibiste el correo? Reenviar confirmación
                      </button>
                    )}
                    <div className="auth-footer-options">
                      <button type="button" onClick={() => setFormularioActivo("register")} className="option-link">Crear cuenta</button>
                      <button type="button" onClick={() => setFormularioActivo("recover")} className="option-link">Olvidé mi contraseña</button>
                    </div>
                  </form>
                )}

                {/* REGISTER */}
                {formularioActivo === "register" && (
                  <form 
                    className="auth-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!estaEnviando) alEnviarRegistro();
                    }}
                  >
                    <div className="input-group">
                      <input
                        className="input-style"
                        placeholder="Email"
                        type="email"
                        value={emailRegistro}
                        onChange={(e) => setEmailRegistro(e.target.value)}
                      />
                      {erroresRegistro.email && <span className="error-text text-red-500 text-xs pl-2">{erroresRegistro.email}</span>}
                    </div>

                    <div className="input-group">
                      <input
                        className="input-style"
                        placeholder="Usuario"
                        type="text"
                        value={usuarioRegistro}
                        onChange={(e) => setUsuarioRegistro(e.target.value)}
                      />
                      {erroresRegistro.usuario && <span className="error-text text-red-500 text-xs pl-2">{erroresRegistro.usuario}</span>}
                    </div>

                    <div className="input-group">
                      <div className="password-input-wrapper">
                        <input
                          className="input-style"
                          placeholder="Contraseña"
                          type={mostrarContrasenaRegistro ? "text" : "password"}
                          value={contrasenaRegistro}
                          onChange={(e) => setContrasenaRegistro(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setMostrarContrasenaRegistro(!mostrarContrasenaRegistro)}
                          title={mostrarContrasenaRegistro ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {mostrarContrasenaRegistro ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {erroresRegistro.contrasena && <span className="error-text text-red-500 text-xs pl-2 block mt-1">{erroresRegistro.contrasena}</span>}
                    </div>

                    <div className="input-group">
                      <div className="password-input-wrapper">
                        <input
                          className="input-style"
                          placeholder="Confirmar contraseña"
                          type={mostrarConfirmarContrasena ? "text" : "password"}
                          value={confirmarContrasenaRegistro}
                          onChange={(e) => setConfirmarContrasenaRegistro(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !estaEnviando) {
                              alEnviarRegistro();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setMostrarConfirmarContrasena(!mostrarConfirmarContrasena)}
                          title={mostrarConfirmarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {mostrarConfirmarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {erroresRegistro.confirmar && <span className="error-text text-red-500 text-xs pl-2 block mt-1">{erroresRegistro.confirmar}</span>}
                    </div>

                    <button
                      className="btn-auth-submit mt-4"
                      onClick={alEnviarRegistro}
                      disabled={estaEnviando}
                    >
                      Registrarme
                    </button>
                    <button type="button" onClick={() => setFormularioActivo("login")} className="option-link-back">Volver al inicio</button>
                  </form>
                )}

                {/* RECOVER */}
                {formularioActivo === "recover" && (
                  <form 
                    className="auth-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!estaEnviando && emailRecuperacion) alEnviarRecuperacion();
                    }}
                  >
                    <p className="recover-info">Se enviará un enlace a tu correo.</p>
                    <input 
                      className="input-style" 
                      placeholder="Email" 
                      type="email" 
                      value={emailRecuperacion}
                      onChange={(e) => setEmailRecuperacion(e.target.value)}
                    />
                    
                    {estadoRecuperacion && <p style={{color: 'green', fontSize: '12px'}}>{estadoRecuperacion}</p>}
                    
                    <button 
                      className="btn-auth-submit"
                      onClick={alEnviarRecuperacion}
                      disabled={estaEnviando || !emailRecuperacion}
                    >
                      {estaEnviando ? "Enviando..." : "Enviar Enlace"}
                    </button>
                    <button type="button" onClick={() => setFormularioActivo("login")} className="option-link-back">Volver al inicio</button>
                  </form>
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