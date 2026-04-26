import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, MoreVertical, ShieldCheck, ShieldOff,
  KeyRound, Pencil, Trash2, X, Eye, EyeOff, AlertTriangle, RefreshCw, AlertCircle,
} from 'lucide-react';
import { superadminApi } from './useSuperadminApi';

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
      <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" {...props} />
    </div>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────
function ActionsMenu({ admin, onEdit, onToggle, onReset, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
        <MoreVertical size={15} className="text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52">
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Pencil size={14} className="text-slate-400" /> Editar información
            </button>
            <button onClick={() => { onReset(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <KeyRound size={14} className="text-slate-400" /> Restablecer contraseña
            </button>
            <button onClick={() => { onToggle(); setOpen(false); }} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 ${admin.isActive ? 'text-amber-600' : 'text-emerald-600'}`}>
              {admin.isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
              {admin.isActive ? 'Suspender acceso' : 'Reactivar acceso'}
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50">
              <Trash2 size={14} /> Eliminar administrador
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, notify };
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function ManageAdminsView() {
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm]       = useState({ username: '', email: '', flotilla: '', password: '' });
  const [resetPwd, setResetPwd] = useState('');
  const { toast, notify }     = useToast();

  const cargar = useCallback(async () => {
    try {
      setError(null);
      const data = await superadminApi.getAdmins();
      setAdmins(data.admins ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtered = admins.filter(a =>
    a.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.nacionalidad?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Acciones ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.username || !form.email || !form.password) return;
    try {
      setSaving(true);
      const data = await superadminApi.crearAdmin({
        username: form.username,
        email: form.email,
        password: form.password,
        flotilla: form.flotilla,
      });
      setAdmins(prev => [data.admin, ...prev]);
      setModal(null);
      notify('Administrador creado exitosamente.');
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    try {
      setSaving(true);
      const data = await superadminApi.editarAdmin(selected._id, {
        username: form.username,
        email: form.email,
        flotilla: form.flotilla,
      });
      setAdmins(prev => prev.map(a => a._id === selected._id ? { ...a, ...data.admin } : a));
      setModal(null);
      notify('Información actualizada.');
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!resetPwd || resetPwd.length < 8) return;
    try {
      setSaving(true);
      await superadminApi.resetPassword(selected._id, { nuevaPassword: resetPwd });
      setModal(null);
      notify(`Contraseña restablecida para ${selected.username}.`);
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    try {
      setSaving(true);
      const nuevoEstado = !selected.isActive;
      await superadminApi.cambiarEstado(selected._id, { isActive: nuevoEstado });
      setAdmins(prev => prev.map(a => a._id === selected._id ? { ...a, isActive: nuevoEstado } : a));
      setModal(null);
      notify(nuevoEstado ? `Acceso reactivado para ${selected.username}.` : `Acceso suspendido para ${selected.username}.`);
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await superadminApi.eliminarAdmin(selected._id);
      setAdmins(prev => prev.filter(a => a._id !== selected._id));
      setModal(null);
      notify('Administrador eliminado.', 'warning');
    } catch (e) { notify(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const openCreate = () => {
    setForm({ username: '', email: '', flotilla: '', password: '' });
    setSelected(null); setShowPwd(false); setModal('create');
  };
  const openEdit = (a) => {
    setForm({ username: a.username, email: a.email, flotilla: a.nacionalidad ?? '', password: '' });
    setSelected(a); setModal('edit');
  };
  const openReset  = (a) => { setSelected(a); setResetPwd(''); setShowPwd(false); setModal('reset'); };
  const openDelete = (a) => { setSelected(a); setModal('delete'); };
  const openToggle = (a) => { setSelected(a); setModal('confirm-toggle'); };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
      <AlertCircle size={32} />
      <p className="font-bold">{error}</p>
      <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
        <RefreshCw size={14} /> Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white transition-all
          ${toast.type === 'warning' ? 'bg-amber-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={15} /> : <ShieldCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuario, correo o flotilla…"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
          <Plus size={15} /> Nuevo Administrador
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',        value: admins.length,                               color: 'text-slate-700' },
          { label: 'Activos',      value: admins.filter(a => a.isActive).length,        color: 'text-emerald-600' },
          { label: 'Suspendidos',  value: admins.filter(a => !a.isActive).length,       color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
            {loading
              ? <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse mx-auto" />
              : <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            }
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading
          ? <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3">Administrador</th>
                    <th className="px-5 py-3">Flotilla</th>
                    <th className="px-5 py-3">Alta</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(admin => (
                    <tr key={admin._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-700">{admin.username}</div>
                        <div className="text-xs text-slate-400">{admin.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{admin.nacionalidad || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full
                          ${admin.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          {admin.isActive ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ActionsMenu admin={admin}
                          onEdit={() => openEdit(admin)} onToggle={() => openToggle(admin)}
                          onReset={() => openReset(admin)} onDelete={() => openDelete(admin)} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Sin resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Nuevo Administrador' : 'Editar Administrador'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Nombre de usuario" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Ej. carlos_ramirez" />
            <Field label="Correo electrónico" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@flotilla.mx" />
            <Field label="Nombre de la flotilla" value={form.flotilla} onChange={e => setForm(f => ({ ...f, flotilla: e.target.value }))} placeholder="Ej. Transportes del Norte" />
            {modal === 'create' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Contraseña inicial</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                  <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={modal === 'create' ? handleCreate : handleEdit} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
                {saving ? 'Guardando…' : modal === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'reset' && (
        <Modal title="Restablecer Contraseña" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-500 mb-4">Nueva contraseña para <strong className="text-slate-700">{selected?.username}</strong>.</p>
          <div className="relative mb-5">
            <input type={showPwd ? 'text' : 'password'} value={resetPwd} onChange={e => setResetPwd(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
            <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleReset} disabled={saving || resetPwd.length < 8}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
              {saving ? 'Guardando…' : 'Restablecer'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'confirm-toggle' && (
        <Modal title={selected?.isActive ? 'Suspender Acceso' : 'Reactivar Acceso'} onClose={() => setModal(null)}>
          <div className={`flex items-start gap-3 p-4 rounded-xl mb-5 ${selected?.isActive ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <AlertTriangle size={16} className={`${selected?.isActive ? 'text-amber-500' : 'text-emerald-500'} mt-0.5 shrink-0`} />
            <p className="text-sm text-slate-600">
              {selected?.isActive
                ? `${selected?.username} perderá acceso inmediatamente a la plataforma.`
                : `${selected?.username} recuperará acceso completo a la plataforma.`}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleToggle} disabled={saving}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-colors ${selected?.isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {saving ? 'Procesando…' : selected?.isActive ? 'Suspender' : 'Reactivar'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Eliminar Administrador" onClose={() => setModal(null)}>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-5">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600">Esta acción es <strong>irreversible</strong>. Se eliminará la cuenta de <strong className="text-slate-700">{selected?.username}</strong>.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
              {saving ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
