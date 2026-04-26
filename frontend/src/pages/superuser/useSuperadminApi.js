/**
 * useSuperadminApi.js
 * Hook utilitario que adjunta automáticamente el JWT de localStorage
 * a cada petición hacia /api/superadmin/*
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('xanani_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}/superadmin${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const superadminApi = {
  // Analítica
  getStats:   ()           => request('GET',    '/stats'),
  getDemanda: ()           => request('GET',    '/demanda'),
  // Health
  getHealth:  ()           => request('GET',    '/health'),
  // Admins CRUD
  getAdmins:  ()           => request('GET',    '/admins'),
  crearAdmin: (body)       => request('POST',   '/admins', body),
  editarAdmin:(id, body)   => request('PUT',    `/admins/${id}`, body),
  cambiarEstado:(id, body) => request('PATCH',  `/admins/${id}/estado`, body),
  resetPassword:(id, body) => request('PATCH',  `/admins/${id}/password`, body),
  eliminarAdmin:(id)       => request('DELETE', `/admins/${id}`),
};
