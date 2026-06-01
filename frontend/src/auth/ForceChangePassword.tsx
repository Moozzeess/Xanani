import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/login.css';

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const { cambiarContrasenaObligatoria, usuario, cerrarSesion } = useAuth();
  
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nuevaContrasena.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await cambiarContrasenaObligatoria(nuevaContrasena);
      
      // Redirigir según el rol o al inicio
      if (usuario?.role === 'ADMINISTRADOR') navigate('/admin');
      else if (usuario?.role === 'CONDUCTOR') navigate('/conductor');
      else navigate('/');
      
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Ocurrió un error al cambiar la contraseña. Inténtalo nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <div className="login-page-container">
      <div className="auth-box-wrapper" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="auth-form-container p-6 bg-white rounded shadow-md w-96">
          <h2 className="text-xl font-bold mb-4 text-center">Cambio Obligatorio de Contraseña</h2>
          <p className="text-gray-600 mb-6 text-sm text-center">
            Por seguridad, debes cambiar tu contraseña autogenerada antes de continuar hacia tu panel de control.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="input-group">
              <label className="text-sm font-semibold">Nueva contraseña</label>
              <div className="input-with-icon flex">
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  className="input-field flex-grow p-2 border rounded"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  disabled={cargando}
                  placeholder="Escribe tu nueva contraseña"
                  required
                />
                <button
                  type="button"
                  className="icon-btn p-2"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                >
                  {mostrarContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="text-sm font-semibold">Confirmar contraseña</label>
              <input
                type={mostrarContrasena ? "text" : "password"}
                className="input-field p-2 border rounded w-full"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                disabled={cargando}
                placeholder="Repite la contraseña"
                required
              />
            </div>

            {error && (
              <div className="error-message bg-red-100 text-red-700 p-2 rounded text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-auth-submit bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={cargando || nuevaContrasena === '' || confirmarContrasena === ''}
            >
              {cargando ? 'Guardando...' : 'Cambiar y Continuar'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleLogout}
            className="option-link-back block mt-6 text-center text-sm text-gray-500 hover:text-gray-800"
          >
            Cerrar sesión por ahora
          </button>
        </div>
      </div>
    </div>
  );
}
