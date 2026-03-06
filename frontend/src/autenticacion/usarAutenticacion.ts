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
  usuario: UsuarioAutenticado | null;
  estaAutenticado: boolean;
  estaCargando: boolean;
  iniciarSesion: (payload: SolicitudInicioSesion) => Promise<void>;
  registrar: (payload: SolicitudRegistro) => Promise<void>;
  cerrarSesion: () => void;
  tieneRol: (rol: Rol) => boolean;
};

const ContextoAutenticacion = createContext<ValorContextoAutenticacion | null>(null);

const CLAVE_TOKEN = 'xanani_token';
const CLAVE_USUARIO = 'xanani_usuario';

function leerAutenticacionGuardada(): { token: string | null; usuario: UsuarioAutenticado | null } {
  const token = localStorage.getItem(CLAVE_TOKEN);
  const usuarioCrudo = localStorage.getItem(CLAVE_USUARIO);

  if (!token || !usuarioCrudo) {
    return { token: null, usuario: null };
  }

  try {
    const usuario = JSON.parse(usuarioCrudo) as UsuarioAutenticado;
    return { token, usuario };
  } catch {
    return { token: null, usuario: null };
  }
}

function guardarAutenticacion(respuesta: RespuestaAutenticacion) {
  localStorage.setItem(CLAVE_TOKEN, respuesta.token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
}

function limpiarAutenticacionGuardada() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [estaCargando, setEstaCargando] = useState(true);

  useEffect(() => {
    const almacenada = leerAutenticacionGuardada();
    setToken(almacenada.token);
    setUsuario(almacenada.usuario);
    setEstaCargando(false);
  }, []);

  const estaAutenticado = Boolean(token && usuario);

  const valor = useMemo<ValorContextoAutenticacion>(
    () => ({
      token,
      usuario,
      estaAutenticado,
      estaCargando,
      iniciarSesion: async (payload) => {
        const respuesta = await apiAutenticacion.iniciarSesion(payload);
        guardarAutenticacion(respuesta);
        setToken(respuesta.token);
        setUsuario(respuesta.usuario);
      },
      registrar: async (payload) => {
        const respuesta = await apiAutenticacion.registrar(payload);
        guardarAutenticacion(respuesta);
        setToken(respuesta.token);
        setUsuario(respuesta.usuario);
      },
      cerrarSesion: () => {
        limpiarAutenticacionGuardada();
        setToken(null);
        setUsuario(null);
      },
      tieneRol: (rol) => usuario?.rol === rol
    }),
    [token, usuario, estaAutenticado, estaCargando]
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
