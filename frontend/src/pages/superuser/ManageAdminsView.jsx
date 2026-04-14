import React, { useState } from 'react';
import {
  Plus, Search, MoreVertical, ShieldCheck, ShieldOff,
  KeyRound, Pencil, Trash2, X, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_ADMINS = [
  { id: 1, name: 'Carlos Ramírez', email: 'c.ramirez@flotanorte.mx', fleet: 'Transportes del Norte', units: 48, status: 'active', joined: '2024-01-15' },
  { id: 2, name: 'Luisa Mendoza',  email: 'l.mendoza@rutasmet.mx',   fleet: 'Rutas Metropolitanas', units: 36, status: 'active', joined: '2024-03-02' },
  { id: 3, name: 'Jorge Herrera',  email: 'j.herrera@combiexp.mx',   fleet: 'Combi Express',        units: 29, status: 'suspended', joined: '2023-11-10' },
  { id: 4, name: 'Ana Villanueva', email: 'a.villa@flotacdmx.mx',    fleet: 'Flota Central CDMX',   units: 22, status: 'active', joined: '2024-05-20' },
  { id: 5, name: 'Roberto Salas',  email: 'r.salas@tcsur.mx',        fleet: 'Transporte Colectivo Sur', units: 18, status: 'active', joined: '2024-07-08' },
];

// ─── Modal wrapper ────────────────────────────────────────────────────────────
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

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
      <input
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        {...props}
      />
    </div>
  );
}

// ─── Row actions menu ─────────────────────────────────────────────────────────
function ActionsMenu({ admin, onEdit, onToggle, onReset, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
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
            <button onClick={() => { onToggle(); setOpen(false); }} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 ${admin.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}`}>
              {admin.status === 'active' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
              {admin.status === 'active' ? 'Suspender acceso' : 'Reactivar acceso'}
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

// ─── Main view ────────────────────────────────────────────────────────────────
export default function ManageAdminsView() {
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'reset' | 'delete' | 'confirm-toggle'
  const [selected, setSelected] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', fleet: '', password: '' });
  const [resetPwd, setResetPwd] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.fleet.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: '', email: '', fleet: '', password: '' });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (admin) => {
    setForm({ name: admin.name, email: admin.email, fleet: admin.fleet, password: '' });
    setSelected(admin);
    setModal('edit');
  };

  const openReset = (admin) => { setSelected(admin); setResetPwd(''); setModal('reset'); };
  const openDelete = (admin) => { setSelected(admin); setModal('delete'); };
  const openToggle = (admin) => { setSelected(admin); setModal('confirm-toggle'); };

  const handleCreate = () => {
    if (!form.name || !form.email || !form.fleet || !form.password) return;
    const newAdmin = {
      id: Date.now(), name: form.name, email: form.email,
      fleet: form.fleet, units: 0, status: 'active',
      joined: new Date().toISOString().split('T')[0],
    };
    setAdmins(prev => [newAdmin, ...prev]);
    setModal(null);
    notify('Administrador creado exitosamente.');
  };

  const handleEdit = () => {
    setAdmins(prev => prev.map(a => a.id === selected.id ? { ...a, name: form.name, email: form.email, fleet: form.fleet } : a));
    setModal(null);
    notify('Información actualizada.');
  };

  const handleReset = () => {
    setModal(null);
    notify(`Contraseña restablecida para ${selected.name}.`);
  };

  const handleDelete = () => {
    setAdmins(prev => prev.filter(a => a.id !== selected.id));
    setModal(null);
    notify('Administrador eliminado.', 'warning');
  };

  const handleToggle = () => {
    setAdmins(prev => prev.map(a =>
      a.id === selected.id ? { ...a, status: a.status === 'active' ? 'suspended' : 'active' } : a
    ));
    setModal(null);
    notify(selected.status === 'active' ? `Acceso suspendido para ${selected.name}.` : `Acceso reactivado para ${selected.name}.`);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-white transition-all ${toast.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
          {toast.type === 'warning' ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o flotilla…"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={15} /> Nuevo Administrador
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: admins.length, color: 'text-slate-700' },
          { label: 'Activos', value: admins.filter(a => a.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Suspendidos', value: admins.filter(a => a.status === 'suspended').length, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3">Administrador</th>
                <th className="px-5 py-3">Flotilla</th>
                <th className="px-5 py-3 text-center">Unidades</th>
                <th className="px-5 py-3">Alta</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(admin => (
                <tr key={admin.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-700">{admin.name}</div>
                    <div className="text-xs text-slate-400">{admin.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{admin.fleet}</td>
                  <td className="px-5 py-3.5 text-center tabular-nums text-slate-600">{admin.units}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{admin.joined}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${admin.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      {admin.status === 'active' ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ActionsMenu
                      admin={admin}
                      onEdit={() => openEdit(admin)}
                      onToggle={() => openToggle(admin)}
                      onReset={() => openReset(admin)}
                      onDelete={() => openDelete(admin)}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'Nuevo Administrador' : 'Editar Administrador'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Nombre completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Carlos Ramírez" />
            <Field label="Correo electrónico" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@flotilla.mx" />
            <Field label="Nombre de la flotilla" value={form.fleet} onChange={e => setForm(f => ({ ...f, fleet: e.target.value }))} placeholder="Ej. Transportes del Norte" />
            {modal === 'create' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Contraseña inicial</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={modal === 'create' ? handleCreate : handleEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">
                {modal === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'reset' && (
        <Modal title="Restablecer Contraseña" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-500 mb-4">Establece una nueva contraseña temporal para <strong className="text-slate-700">{selected?.name}</strong>.</p>
          <div className="relative mb-5">
            <input
              type={showPwd ? 'text' : 'password'}
              value={resetPwd}
              onChange={e => setResetPwd(e.target.value)}
              placeholder="Nueva contraseña"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
            <button onClick={handleReset} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">Restablecer</button>
          </div>
        </Modal>
      )}

      {modal === 'confirm-toggle' && (
        <Modal title={selected?.status === 'active' ? 'Suspender Acceso' : 'Reactivar Acceso'} onClose={() => setModal(null)}>
          <div className={`flex items-start gap-3 p-4 rounded-xl mb-5 ${selected?.status === 'active' ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <AlertTriangle size={16} className={selected?.status === 'active' ? 'text-amber-500 mt-0.5 shrink-0' : 'text-emerald-500 mt-0.5 shrink-0'} />
            <p className="text-sm text-slate-600">
              {selected?.status === 'active'
                ? `El administrador ${selected?.name} perderá acceso inmediatamente a la plataforma.`
                : `El administrador ${selected?.name} recuperará acceso completo a la plataforma.`}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
            <button onClick={handleToggle} className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors ${selected?.status === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {selected?.status === 'active' ? 'Suspender' : 'Reactivar'}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Eliminar Administrador" onClose={() => setModal(null)}>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-5">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600">Esta acción es <strong>irreversible</strong>. Se eliminará la cuenta de <strong className="text-slate-700">{selected?.name}</strong> y toda su configuración.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
