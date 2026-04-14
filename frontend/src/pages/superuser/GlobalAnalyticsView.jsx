import React, { useState, useEffect, useRef } from 'react';
import { Users, Truck, UserCheck, TrendingUp, ArrowUp, ArrowDown, Activity } from 'lucide-react';

// ─── Mock data ───────────────────────────────────────────────────────────────
const HOURLY_DEMAND = [
  { hour: '00', value: 12 }, { hour: '01', value: 8 },  { hour: '02', value: 5 },
  { hour: '03', value: 4 },  { hour: '04', value: 7 },  { hour: '05', value: 18 },
  { hour: '06', value: 45 }, { hour: '07', value: 82 }, { hour: '08', value: 95 },
  { hour: '09', value: 73 }, { hour: '10', value: 61 }, { hour: '11', value: 58 },
  { hour: '12', value: 70 }, { hour: '13', value: 88 }, { hour: '14', value: 91 },
  { hour: '15', value: 76 }, { hour: '16', value: 68 }, { hour: '17', value: 85 },
  { hour: '18', value: 99 }, { hour: '19', value: 87 }, { hour: '20', value: 64 },
  { hour: '21', value: 42 }, { hour: '22', value: 28 }, { hour: '23', value: 17 },
];

const WEEKLY = [
  { day: 'Lun', value: 78 }, { day: 'Mar', value: 85 }, { day: 'Mié', value: 72 },
  { day: 'Jue', value: 90 }, { day: 'Vie', value: 96 }, { day: 'Sáb', value: 65 },
  { day: 'Dom', value: 43 },
];

const TOP_FLEETS = [
  { name: 'Transportes del Norte', units: 48, passengers: 12400, growth: 12 },
  { name: 'Rutas Metropolitanas', units: 36, passengers: 9870, growth: 7 },
  { name: 'Combi Express', units: 29, passengers: 8100, growth: -2 },
  { name: 'Flota Central CDMX', units: 22, passengers: 6300, growth: 18 },
  { name: 'Transporte Colectivo Sur', units: 18, passengers: 4900, growth: 5 },
];

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1400, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(t); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Sparkline bar chart ───────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = '#3b82f6', height = 160 }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const isHigh = d[valueKey] >= 80;
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative">
            <div
              className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
              style={{
                height: `${pct}%`,
                background: isHigh
                  ? 'linear-gradient(180deg, #f59e0b, #f97316)'
                  : `linear-gradient(180deg, ${color}cc, ${color}66)`,
                minHeight: 4,
              }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap pointer-events-none">
              {d[labelKey]}: <strong className="ml-1">{d[valueKey]}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, delta, color }) {
  const isUp = delta >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {Math.abs(delta)}%
        </span>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-800 tabular-nums">
          <AnimatedNumber target={value} />
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
      </div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function GlobalAnalyticsView() {
  const [period, setPeriod] = useState('hourly');
  const chartData = period === 'hourly' ? HOURLY_DEMAND : WEEKLY;
  const chartKey = period === 'hourly' ? 'value' : 'value';
  const labelKey = period === 'hourly' ? 'hour' : 'day';

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Admins Activos" value={38} sub="3 nuevos este mes" delta={8} color="bg-blue-500" />
        <StatCard icon={Users} label="Conductores Registrados" value={1247} sub="En toda la plataforma" delta={14} color="bg-violet-500" />
        <StatCard icon={Truck} label="Unidades Operando" value={863} sub="Promedio diario" delta={5} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Pasajeros Transportados" value={94200} sub="Últimos 30 días" delta={-3} color="bg-emerald-500" />
      </div>

      {/* Demand chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-800 text-base">Demanda del Sistema</h3>
            <p className="text-xs text-slate-400 mt-0.5">Picos de tráfico · Plataforma global</p>
          </div>
          <div className="flex gap-2">
            {['hourly', 'weekly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${period === p ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {p === 'hourly' ? 'Por Hora' : 'Semanal'}
              </button>
            ))}
          </div>
        </div>

        <BarChart data={chartData} valueKey={chartKey} labelKey={labelKey} height={180} />

        <div className="flex mt-3 gap-[3px]">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-slate-400 font-bold">
              {d[labelKey]}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg, #3b82f6cc, #3b82f666)' }} /> Normal
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-amber-400" /> Pico Alto (&ge;80%)
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Activity size={12} /> Actualización en tiempo real
          </div>
        </div>
      </div>

      {/* Top fleets table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-black text-slate-800 text-base mb-1">Top Flotillas por Actividad</h3>
        <p className="text-xs text-slate-400 mb-5">Últimos 30 días</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Flotilla</th>
                <th className="pb-3 pr-4 text-right">Unidades</th>
                <th className="pb-3 pr-4 text-right">Pasajeros</th>
                <th className="pb-3 text-right">Crecimiento</th>
              </tr>
            </thead>
            <tbody>
              {TOP_FLEETS.map((f, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-4 text-slate-300 font-black text-xs">{String(i + 1).padStart(2, '0')}</td>
                  <td className="py-3 pr-4 font-bold text-slate-700">{f.name}</td>
                  <td className="py-3 pr-4 text-right text-slate-600 tabular-nums">{f.units}</td>
                  <td className="py-3 pr-4 text-right text-slate-600 tabular-nums">{f.passengers.toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${f.growth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {f.growth >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />} {Math.abs(f.growth)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
