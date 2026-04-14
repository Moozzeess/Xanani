import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../../autenticacion/usarAutenticacion';
import { crearConductor } from '../../services/conductor';
import '../../styles/inicio-sesion.css';

const PaginaSuperusuario = () => {
  const navigate = useNavigate();
  const { cerrarSesion, token, usuario } = usarAutenticacion();

  const [formulario, setFormulario] = useState({
    nombreUsuario: '',
    correoElectronico: '',
    contrasena: '',
    numeroLicencia: ''
  });
  
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const alCerrarSesion = () => {
    cerrarSesion();
    navigate('/', { replace: true });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);
    
    if (!token) {
      setError('No tienes autorización o la sesión expiró.');
      setCargando(false);
      return;
    }

    try {
      await crearConductor(formulario, token);
      setMensaje('¡Conductor registrado correctamente!');
      setFormulario({ nombreUsuario: '', correoElectronico: '', contrasena: '', numeroLicencia: '' });
    } catch (err) {
       setError(err.message);
    } finally {
       setCargando(false);
    }
  };

  return (
    <div className="login-page-container">
      <div id="map-bg"></div>
      <div id="map-overlay"></div>

      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="logo-circle">
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#3b82f6', textShadow: '0 0 10px rgba(59,130,246,0.5)' }}>X</div>
        </div>
        <h1 className="auth-title">Panel de Superusuario</h1>
        <p className="auth-subtitle">
          Sesión de <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{usuario?.nombreUsuario}</span>
        </p>

        <div className="form-wrapper">
          {mensaje && (
            <div style={{ color: '#4ade80', marginBottom: '1rem', textAlign: 'center', background: 'rgba(74, 222, 128, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
              {mensaje}
            </div>
          )}

          {error && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={manejarEnvio} className="auth-form">
            <h3 style={{ textAlign: 'center', margin: 0, paddingBottom: '10px', fontWeight: '600', color: '#e2e8f0' }}>Alta de Conductores</h3>
            
            <input 
              className="input-style"
              placeholder="Nombre de usuario del chofer"
              type="text"
              required
              value={formulario.nombreUsuario} 
              onChange={(e) => setFormulario({...formulario, nombreUsuario: e.target.value})} 
            />

            <input 
              className="input-style"
              placeholder="Correo electrónico"
              type="email"
              required
              value={formulario.correoElectronico} 
              onChange={(e) => setFormulario({...formulario, correoElectronico: e.target.value})} 
            />

            <input 
              className="input-style"
              placeholder="Contraseña inicial"
              type="password"
              required
              value={formulario.contrasena} 
              onChange={(e) => setFormulario({...formulario, contrasena: e.target.value})} 
            />

            <input 
              className="input-style"
              placeholder="Número de Licencia Oficial"
              type="text"
              required
              value={formulario.numeroLicencia} 
              onChange={(e) => setFormulario({...formulario, numeroLicencia: e.target.value})} 
            />

            <button 
              type="submit" 
              className="btn-auth btn-primary-auth"
              disabled={cargando}
              style={{ marginTop: '0.5rem', opacity: cargando ? 0.7 : 1 }}
            >
              {cargando ? 'Registrando espere...' : 'Dar de Alta Conductor'}
            </button>
            
            <button 
              type="button"
              onClick={alCerrarSesion}
              className="link-style"
              style={{ textAlign: 'center', marginTop: '1rem', color: '#f87171' }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaginaSuperusuario;
