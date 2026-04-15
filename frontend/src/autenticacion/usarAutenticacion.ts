import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  RespuestaAutenticacion,
  Rol,
  SolicitudInicioSesion,
  SolicitudRegistro,
  UsuarioAutenticado
} from '../types/autenticacion';
import * as apiAutenticacion from '../services/autenticacion';

type ValorContextoAutenticacion = {
  token: string | null;
  user: UsuarioAutenticado | null;
  estaAutenticado: boolean;
  estaCargando: boolean;
  iniciarSesion: (payload: SolicitudInicioSesion) => Promise<void>;
  registrar: (payload: SolicitudRegistro) => Promise<void>;
  cerrarSesion: () => void;
  tieneRol: (role: Rol) => boolean;
};

const ContextoAutenticacion = createContext<ValorContextoAutenticacion | null>(null);

const CLAVE_TOKEN = 'xanani_token';
const CLAVE_USUARIO = 'xanani_usuario';

function leerAutenticacionGuardada(): { token: string | null; user: UsuarioAutenticado | null } {
  const token = localStorage.getItem(CLAVE_TOKEN);
  const usuarioCrudo = localStorage.getItem(CLAVE_USUARIO);

  if (!token || !usuarioCrudo) {
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(usuarioCrudo) as UsuarioAutenticado;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function guardarAutenticacion(respuesta: RespuestaAutenticacion) {
  localStorage.setItem(CLAVE_TOKEN, respuesta.token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.user));
}

function limpiarAutenticacionGuardada() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [estaCargando, setEstaCargando] = useState(true);

  useEffect(() => {
    const almacenada = leerAutenticacionGuardada();
    setToken(almacenada.token);
    setUsuario(almacenada.user);
    setEstaCargando(false);
  }, []);

  const estaAutenticado = Boolean(token && user);

  const valor = useMemo<ValorContextoAutenticacion>(
    () => ({
      token,
      user,
      estaAutenticado,
      estaCargando,
      iniciarSesion: async (payload) => {
        const respuesta = await apiAutenticacion.iniciarSesion(payload);
        guardarAutenticacion(respuesta);
        setToken(respuesta.token);
        setUsuario(respuesta.user);
      },
      registrar: async (payload) => {
        const respuesta = await apiAutenticacion.registrar(payload);
        guardarAutenticacion(respuesta);
        setToken(respuesta.token);
        setUsuario(respuesta.user);
      },
      cerrarSesion: () => {
        limpiarAutenticacionGuardada();
        setToken(null);
        setUsuario(null);
      },
      tieneRol: (role) => user?.role === role
    }),
    [token, user, estaAutenticado, estaCargando]
  );

  return React.createElement(ContextoAutenticacion.Provider, { value: valor }, children);
}

export function usarAutenticacion() {
  const contexto = useContext(ContextoAutenticacion);
  if (!contexto) {
    throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion.');
  }
  return contexto;
}
