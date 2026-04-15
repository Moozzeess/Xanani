import React from 'react';
import { Bell, Menu, Megaphone } from 'lucide-react';

export interface AdminHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onTriggerSOS: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onToggleSidebar, onTriggerSOS }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onToggleSidebar} className="lg:hidden text-slate-500 hover:text-slate-800">
          <Menu className="w-6 h-6" />
        </button>
        <h2 id="page-title" className="text-xl font-bold text-slate-800">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button
          type="button"
          onClick={onTriggerSOS}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
          title="Simular Emergencia"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <button
          type="button"
          className="hidden md:flex bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 items-center gap-2 shadow-lg shadow-slate-900/10"
        >
          <Megaphone className="w-4 h-4" /> Nuevo Anuncio
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
