import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/inicio-sesion.css';
import { usarAutenticacion } from './usarAutenticacion';
import type { Rol } from '../types/autenticacion';

type TipoFormulario = 'inicio-sesion' | 'registro' | 'recuperacion';

function obtenerRutaPorRol(rol: Rol): string {
  switch (rol) {
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
  const { iniciarSesion, registrar, estaAutenticado, usuario, estaCargando } = usarAutenticacion();

  useEffect(() => {
    if (estaCargando) return;
    if (estaAutenticado && usuario) {
      navigate(obtenerRutaPorRol(usuario.rol), { replace: true });
    }
  }, [estaAutenticado, usuario, estaCargando, navigate]);

  const [nombreUsuarioOCorreo, setNombreUsuarioOCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');

  const [correoRegistro, setCorreoRegistro] = useState('');
  const [nombreUsuarioRegistro, setNombreUsuarioRegistro] = useState('');
  const [contrasenaRegistro, setContrasenaRegistro] = useState('');
  const [confirmacionContrasenaRegistro, setConfirmacionContrasenaRegistro] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const puedeEnviarInicioSesion = useMemo(() => {
    return nombreUsuarioOCorreo.trim().length > 0 && contrasena.length > 0;
  }, [nombreUsuarioOCorreo, contrasena]);

  const puedeEnviarRegistro = useMemo(() => {
    return (
      correoRegistro.trim().length > 0 &&
      nombreUsuarioRegistro.trim().length > 0 &&
      contrasenaRegistro.length > 0 &&
      confirmacionContrasenaRegistro.length > 0
    );
  }, [correoRegistro, nombreUsuarioRegistro, contrasenaRegistro, confirmacionContrasenaRegistro]);

  const alEnviarInicioSesion = async () => {
    try {
      setEnviando(true);
      setMensajeError(null);
      await iniciarSesion({
        nombreUsuarioOCorreo: nombreUsuarioOCorreo.trim(),
        contrasena
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

      if (contrasenaRegistro !== confirmacionContrasenaRegistro) {
        setMensajeError('Las contraseñas no coinciden.');
        return;
      }

      await registrar({
        correoElectronico: correoRegistro.trim(),
        nombreUsuario: nombreUsuarioRegistro.trim(),
        contrasena: contrasenaRegistro
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
                value={nombreUsuarioOCorreo}
                onChange={(e) => setNombreUsuarioOCorreo(e.target.value)}
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
                placeholder="Nombre de usuario"
                type="text"
                value={nombreUsuarioRegistro}
                onChange={(e) => setNombreUsuarioRegistro(e.target.value)}
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
