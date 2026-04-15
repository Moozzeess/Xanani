import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/inicio-sesion.css';
import { usarAutenticacion } from './usarAutenticacion';
import type { Rol } from '../types/autenticacion';

type TipoFormulario = 'inicio-sesion' | 'registro' | 'recuperacion';

function obtenerRutaPorRol(role: Rol): string {
  switch (role) {
    case 'SUPERUSUARIO':
      return '/superusuario';
    case 'ADMINISTRADOR':
      return '/administrador';
    case 'CONDUCTOR':
      return '/conductor';
    case 'PASAJERO':
      return '/pasajero';
    default:
      return '/';
  }
}

const PaginaInicioSesion = () => {
  const [formularioActivo, setFormularioActivo] = useState<TipoFormulario>('inicio-sesion');
  const navigate = useNavigate();
  const { iniciarSesion, registrar, estaAutenticado, user, estaCargando } = usarAutenticacion();

  useEffect(() => {
    if (estaCargando) return;
    if (estaAutenticado && user) {
      navigate(obtenerRutaPorRol(user.role), { replace: true });
    }
  }, [estaAutenticado, user, estaCargando, navigate]);

  const [usernameOCorreo, setNombreUsuarioOCorreo] = useState('');
  const [password, setContrasena] = useState('');

  const [correoRegistro, setCorreoRegistro] = useState('');
  const [usernameRegistro, setNombreUsuarioRegistro] = useState('');
  const [passwordRegistro, setContrasenaRegistro] = useState('');
  const [confirmacionContrasenaRegistro, setConfirmacionContrasenaRegistro] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const puedeEnviarInicioSesion = useMemo(() => {
    return usernameOCorreo.trim().length > 0 && password.length > 0;
  }, [usernameOCorreo, password]);

  const puedeEnviarRegistro = useMemo(() => {
    return (
      correoRegistro.trim().length > 0 &&
      usernameRegistro.trim().length > 0 &&
      passwordRegistro.length > 0 &&
      confirmacionContrasenaRegistro.length > 0
    );
  }, [correoRegistro, usernameRegistro, passwordRegistro, confirmacionContrasenaRegistro]);

  const alEnviarInicioSesion = async () => {
    try {
      setEnviando(true);
      setMensajeError(null);
      await iniciarSesion({
        usernameOCorreo: usernameOCorreo.trim(),
        password
      });
      navigate('/', { replace: true });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al iniciar sesión.';
      setMensajeError(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  const alEnviarRegistro = async () => {
    try {
      setEnviando(true);
      setMensajeError(null);

      if (passwordRegistro !== confirmacionContrasenaRegistro) {
        setMensajeError('Las contraseñas no coinciden.');
        return;
      }

      await registrar({
        email: correoRegistro.trim(),
        username: usernameRegistro.trim(),
        password: passwordRegistro
      });

      navigate('/', { replace: true });
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'Error al registrarse.';
      setMensajeError(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-page-container">
      <div id="map-bg"></div>
      <div id="map-overlay"></div>

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

          {formularioActivo === 'inicio-sesion' && (
            <div className="auth-form">
              <input
                className="input-style"
                placeholder="Usuario o correo electrónico"
                type="text"
                value={usernameOCorreo}
                onChange={(e) => setNombreUsuarioOCorreo(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setContrasena(e.target.value)}
              />
              <button
                className="btn-auth"
                onClick={alEnviarInicioSesion}
                disabled={!puedeEnviarInicioSesion || enviando}
              >
                Iniciar sesión
              </button>
              <div className="footer-links">
                <button onClick={() => setFormularioActivo('registro')} className="link-style">
                  Registro
                </button>
                <button onClick={() => setFormularioActivo('recuperacion')} className="link-style">
                  Recuperar
                </button>
              </div>
            </div>
          )}

          {formularioActivo === 'registro' && (
            <div className="auth-form">
              <input
                className="input-style"
                placeholder="Correo electrónico"
                type="email"
                value={correoRegistro}
                onChange={(e) => setCorreoRegistro(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Nombre de user"
                type="text"
                value={usernameRegistro}
                onChange={(e) => setNombreUsuarioRegistro(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Contraseña"
                type="password"
                value={passwordRegistro}
                onChange={(e) => setContrasenaRegistro(e.target.value)}
              />
              <input
                className="input-style"
                placeholder="Confirmar contraseña"
                type="password"
                value={confirmacionContrasenaRegistro}
                onChange={(e) => setConfirmacionContrasenaRegistro(e.target.value)}
              />
              <button
                className="btn-auth btn-primary-auth"
                onClick={alEnviarRegistro}
                disabled={!puedeEnviarRegistro || enviando}
              >
                Continuar
              </button>
              <button
                onClick={() => setFormularioActivo('inicio-sesion')}
                className="link-style"
                style={{ textAlign: 'center' }}
              >
                Volver
              </button>
            </div>
          )}

          {formularioActivo === 'recuperacion' && (
            <div className="auth-form">
              <input className="input-style" placeholder="Correo electrónico" type="email" />
              <button className="btn-auth">Enviar enlace</button>
              <button
                onClick={() => setFormularioActivo('inicio-sesion')}
                className="link-style"
                style={{ textAlign: 'center' }}
              >
                Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaginaInicioSesion;
