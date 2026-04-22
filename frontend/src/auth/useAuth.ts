
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest, Role } from '../types/auth';
import * as authApi from '../services/auth';

/**
 * Define la estructura del valor que el contexto de autenticación proporcionará.
 */
type ValorContextoAuth = {
  token: string | null;
  usuario: AuthUser | null;
  estaAutenticado: boolean;
  estaCargando: boolean;
  iniciarSesion: (datos: LoginRequest) => Promise<void>;
  registrarUsuario: (datos: RegisterRequest) => Promise<void>;
  cerrarSesion: () => void;
  tieneRol: (rol: Role) => boolean;
};

/**
 * Contexto de React para la autenticación.
 */
const ContextoAuth = createContext<ValorContextoAuth | null>(null);

// Claves para el almacenamiento local (localStorage)
const CLAVE_TOKEN_ALMACENAMIENTO = 'xanani_token';
const CLAVE_USUARIO_ALMACENAMIENTO = 'xanani_usuario';

/**
 * Lee la información de autenticación almacenada en el localStorage.
 * 
 * @returns {Object} Un objeto con el token y el usuario almacenados, o null si no existen.
 */
function obtenerAuthAlmacenado(): { token: string | null; usuario: AuthUser | null } {
  const token = localStorage.getItem(CLAVE_TOKEN_ALMACENAMIENTO);
  const usuarioCrudo = localStorage.getItem(CLAVE_USUARIO_ALMACENAMIENTO);

  if (!token || !usuarioCrudo) {
    return { token: null, usuario: null };
  }

  try {
    const usuario = JSON.parse(usuarioCrudo) as AuthUser;
    return { token, usuario };
  } catch (error) {
    console.error("Error al parsear el usuario almacenado:", error);
    return { token: null, usuario: null };
  }
}

/**
 * Persiste la información de autenticación en el localStorage.
 * 
 * @param {AuthResponse} auth - La respuesta de autenticación del servidor.
 */
function guardarAuth(auth: AuthResponse) {
  localStorage.setItem(CLAVE_TOKEN_ALMACENAMIENTO, auth.token);
  localStorage.setItem(CLAVE_USUARIO_ALMACENAMIENTO, JSON.stringify(auth.user));
}

/**
 * Elimina la información de autenticación del localStorage.
 */
function limpiarAuthAlmacenado() {
  localStorage.removeItem(CLAVE_TOKEN_ALMACENAMIENTO);
  localStorage.removeItem(CLAVE_USUARIO_ALMACENAMIENTO);
}

/**
 * Proveedor de contexto que envuelve la aplicación para manejar el estado global de autenticación.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [estaCargando, setEstaCargando] = useState(true);

   // Efecto para cargar la sesión al iniciar la aplicación
  useEffect(() => {
      const almacenado = obtenerAuthAlmacenado();
    setToken(almacenado.token);
    setUsuario(almacenado.usuario);
  setEstaCargando(false);
}, []);

  const estaAutenticado = Boolean(token && usuario);

  // Memorización del valor del contexto para evitar re-renderizados innecesarios
  const valor = useMemo<ValorContextoAuth>(
    () => ({
      token,
      usuario,
      estaAutenticado,
      estaCargando,
      iniciarSesion: async (datos) => {
        const auth = await authApi.login(datos);
        guardarAuth(auth);
        setToken(auth.token);
        setUsuario(auth.user);
      },
      registrarUsuario: async (datos) => {
        const auth = await authApi.register(datos);
        guardarAuth(auth);
        setToken(auth.token);
        setUsuario(auth.user);
      },
      cerrarSesion: () => {
        limpiarAuthAlmacenado();
        setToken(null);
        setUsuario(null);
      },
      tieneRol: (rol) => {
        return Boolean(usuario?.role && String(usuario.role).toUpperCase() === String(rol).toUpperCase());
      }
    }),
    [token, usuario, estaAutenticado, estaCargando]
  );

  return React.createElement(ContextoAuth.Provider, { value: valor }, children);
}

/**
 * Hook personalizado para acceder de forma sencilla al contexto de autenticación.
 * 
 * @returns {ValorContextoAuth} El estado y las funciones de autenticación.
 * @throws {Error} Si se usa fuera de un AuthProvider.
 */
export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return contexto;
}
