
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest, Role } from '../types/auth';
import * as authApi from '../services/auth';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_TOKEN_KEY = 'xanani_token';
const STORAGE_USER_KEY = 'xanani_user';

function readStoredAuth(): { token: string | null; user: AuthUser | null } {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  const rawUser = localStorage.getItem(STORAGE_USER_KEY);

  if (!token || !rawUser) {
    return { token: null, user: null };
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function persistAuth(auth: AuthResponse) {
  localStorage.setItem(STORAGE_TOKEN_KEY, auth.token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(auth.user));
}

function clearPersistedAuth() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = readStoredAuth();
    setToken(stored.token);
    setUser(stored.user);
    setIsLoading(false);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading,
      login: async (payload) => {
        const auth = await authApi.login(payload);
        persistAuth(auth);
        setToken(auth.token);
        setUser(auth.user);
      },
      register: async (payload) => {
        const auth = await authApi.register(payload);
        persistAuth(auth);
        setToken(auth.token);
        setUser(auth.user);
      },
      logout: () => {
        clearPersistedAuth();
        setToken(null);
        setUser(null);
      },
      hasRole: (role) => {
        return user?.role === role;
      }
    }),
    [token, user, isAuthenticated, isLoading]
  );

  return React.createElement(AuthContext.Provider, { value: value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return ctx;
}

