import React, { useState, useEffect, useRef } from 'react';
import { Users, Truck, UserCheck, TrendingUp, ArrowUp, ArrowDown, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { superadminApi } from './useSuperadminApi';

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!target) return;
    let current = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      current += step;
      if (current >= target) { setDisplay(target); clearInterval(t); }
      else setDisplay(Math.floor(current));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <span>{display.toLocaleString()}</span>;
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, height = 180 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isHigh = pct >= 80;
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative">
            <div
              className="w-full rounded-t transition-all duration-300 group-hover:opacity-75"
              style={{
                height: `${Math.max(pct, 1)}%`,
                background: isHigh
                  ? 'linear-gradient(180deg,#f59e0b,#f97316)'
                  : 'linear-gradient(180deg,#3b82f6cc,#3b82f666)',
                minHeight: 3,
              }}
            />
            <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap pointer-events-none">
              {d.hour}h: <strong className="ml-1">{d.value}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        {loading
          ? <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
          : <div className="text-2xl font-black text-slate-800 tabular-nums">
              <AnimatedNumber target={value ?? 0} />
            </div>
        }
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
      </div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function GlobalAnalyticsView() {
  const [stats, setStats]     = useState(null);
  const [demanda, setDemanda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const intervalRef           = useRef(null);

  const cargar = async () => {
    try {
      setError(null);
      const [s, d] = await Promise.all([
        superadminApi.getStats(),
        superadminApi.getDemanda(),
      ]);
      setStats(s);
      setDemanda(d.porHora ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    intervalRef.current = setInterval(cargar, 60_000); // refresco cada minuto
    return () => clearInterval(intervalRef.current);
  }, []);

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
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Admins Activos"           value={stats?.adminsActivos}    sub={`${stats?.totalAdmins ?? '—'} registrados en total`}  color="bg-blue-500"    loading={loading} />
        <StatCard icon={Users}     label="Conductores Registrados"  value={stats?.totalConductores} sub="En toda la plataforma"                                 color="bg-violet-500"  loading={loading} />
        <StatCard icon={Truck}     label="Unidades Activas"         value={stats?.unidadesActivas}  sub={`de ${stats?.totalUnidades ?? '—'} unidades totales`}  color="bg-amber-500"   loading={loading} />
        <StatCard icon={TrendingUp} label="Pasajeros Registrados"   value={stats?.totalPasajeros}   sub="En toda la plataforma"                                 color="bg-emerald-500" loading={loading} />
      </div>

      {/* Gráfica de demanda */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-800 text-base">Actividad de Unidades — Últimas 24 h</h3>
            <p className="text-xs text-slate-400 mt-0.5">Actualizaciones de unidades agrupadas por hora (Hora CDMX)</p>
          </div>
          <button onClick={cargar} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
            <RefreshCw size={14} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading
          ? <div className="h-44 bg-slate-50 rounded-xl animate-pulse" />
          : demanda.length > 0
            ? <>
                <BarChart data={demanda} height={180} />
                <div className="flex mt-2 gap-[3px]">
                  {demanda.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[9px] text-slate-400 font-bold">{d.hour}</div>
                  ))}
                </div>
              </>
            : <div className="h-44 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                Sin actividad registrada en las últimas 24 h
              </div>
        }

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg,#3b82f6cc,#3b82f666)' }} /> Normal
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-amber-400" /> Pico alto (&ge;80%)
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Activity size={12} /> Refresco automático cada 60 s
          </div>
        </div>
      </div>
    </div>
  );
}
