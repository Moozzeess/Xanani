import React, { useState, useEffect } from 'react';
import {
  Server, Database, Wifi, AlertTriangle, CheckCircle2,
  XCircle, RefreshCw, Radio, Clock, TrendingDown,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const now = () => new Date().toLocaleTimeString('es-MX', { hour12: false });

const genLog = (level, service, message) => ({
  id: Date.now() + Math.random(),
  ts: now(),
  level,  // 'info' | 'warn' | 'error'
  service,
  message,
});

const INITIAL_LOGS = [
  genLog('info',  'Node.js API',   'Servidor iniciado correctamente en el puerto 3000'),
  genLog('info',  'MongoDB',       'Conexión establecida con replica set principal'),
  genLog('warn',  'IoT Gateway',   'Unidad #247 sin actualización de GPS por 7 segundos'),
  genLog('info',  'Node.js API',   'Health check OK — 238 ms de latencia promedio'),
  genLog('error', 'IoT Gateway',   'Unidad #089 desconectada — pérdida de señal celular'),
  genLog('warn',  'MongoDB',       'Tiempo de respuesta elevado: 820 ms en colección de rutas'),
  genLog('info',  'Node.js API',   'Rate limiter activado para IP 187.x.x.x'),
  genLog('info',  'IoT Gateway',   'Reconexión exitosa unidad #089'),
  genLog('error', 'Node.js API',   'Error 500 en endpoint /api/routes — timeout DB'),
  genLog('info',  'MongoDB',       'Índice regenerado en colección conductores (3.2 s)'),
];

const LEVEL_STYLE = {
  info:  { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400',  label: 'INFO' },
  warn:  { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400', label: 'WARN' },
  error: { bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500',   label: 'ERR' },
};

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function Spark({ values, color }) {
  const max = Math.max(...values, 1);
  const W = 80, H = 32;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - (v / max) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Service card ─────────────────────────────────────────────────────────────
function ServiceCard({ icon: Icon, title, status, metric, metricLabel, history, color, detail }) {
  const ok = status === 'ok';
  const warn = status === 'warn';
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${ok ? 'border-slate-100' : warn ? 'border-amber-200' : 'border-red-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ok ? 'bg-slate-100' : warn ? 'bg-amber-50' : 'bg-red-50'}`}>
            <Icon size={17} className={ok ? 'text-slate-500' : warn ? 'text-amber-500' : 'text-red-500'} />
          </div>
          <div>
            <div className="font-black text-slate-800 text-sm">{title}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{detail}</div>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : warn ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
          {ok ? <CheckCircle2 size={11} /> : warn ? <AlertTriangle size={11} /> : <XCircle size={11} />}
          {ok ? 'Operativo' : warn ? 'Advertencia' : 'Error'}
        </span>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div>
          <div className="text-2xl font-black text-slate-800 tabular-nums" style={{ color }}>{metric}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{metricLabel}</div>
        </div>
        <Spark values={history} color={color} />
      </div>
    </div>
  );
}

// ─── Log badge ────────────────────────────────────────────────────────────────
function LogBadge({ level }) {
  const s = LEVEL_STYLE[level];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded ${s.bg} ${s.text} uppercase tracking-widest`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function SystemHealthView() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [iotHistory] = useState(() => Array.from({ length: 12 }, () => rand(2, 18)));
  const [apiHistory] = useState(() => Array.from({ length: 12 }, () => rand(120, 350)));
  const [dbHistory] = useState(() => Array.from({ length: 12 }, () => rand(30, 900)));

  // Simulate a log stream
  useEffect(() => {
    const POOL = [
      ['info', 'Node.js API', 'Health check OK — 212 ms latencia'],
      ['info', 'MongoDB', 'Consulta completada en 45 ms'],
      ['warn', 'IoT Gateway', `Unidad #${rand(100, 999)} sin GPS por 6 s`],
      ['info', 'IoT Gateway', `Unidad #${rand(100, 999)} reconectada`],
      ['error', 'Node.js API', 'Error 503 — servicio no disponible momentáneamente'],
      ['warn', 'MongoDB', `Escritura lenta: ${rand(600, 1200)} ms en colección viajes`],
    ];
    const t = setInterval(() => {
      const [level, service, message] = POOL[rand(0, POOL.length - 1)];
      setLogs(prev => [genLog(level, service, message), ...prev].slice(0, 60));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const displayed = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  // IoT units losing connection
  const offlineUnits = 7;
  const slowGps = 23;
  const totalUnits = 863;

  return (
    <div className="space-y-6">
      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ServiceCard
          icon={Server}
          title="Node.js API"
          detail="Backend principal"
          status="ok"
          metric="218 ms"
          metricLabel="Latencia promedio"
          history={apiHistory}
          color="#3b82f6"
        />
        <ServiceCard
          icon={Database}
          title="MongoDB"
          detail="Replica set"
          status="warn"
          metric="820 ms"
          metricLabel="Escritura más lenta"
          history={dbHistory}
          color="#f59e0b"
        />
        <ServiceCard
          icon={Radio}
          title="IoT Gateway"
          detail="Dispositivos GPS"
          status="warn"
          metric={`${offlineUnits}`}
          metricLabel="Unidades desconectadas"
          history={iotHistory}
          color="#f97316"
        />
      </div>

      {/* Network stability */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-black text-slate-800 text-base mb-1">Estabilidad de Red Global</h3>
        <p className="text-xs text-slate-400 mb-5">Monitoreo de conectividad celular y actualización de geolocalización (&lt; 5 s)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Unidades totales', value: totalUnits, color: 'text-slate-800', sub: 'En operación ahora' },
            { label: 'GPS al día', value: totalUnits - slowGps - offlineUnits, color: 'text-emerald-600', sub: '< 5 s de latencia' },
            { label: 'GPS lento', value: slowGps, color: 'text-amber-500', sub: '5–15 s de retraso' },
            { label: 'Sin señal', value: offlineUnits, color: 'text-red-500', sub: '> 15 s / desconectadas' },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className={`text-3xl font-black tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-400 font-bold mb-1.5">
            <span>Cobertura de red</span>
            <span>{(((totalUnits - offlineUnits) / totalUnits) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${((totalUnits - slowGps - offlineUnits) / totalUnits) * 100}%` }} />
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${(slowGps / totalUnits) * 100}%` }} />
            <div className="h-full bg-red-400 transition-all" style={{ width: `${(offlineUnits / totalUnits) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base">Registro de Eventos del Sistema</h3>
            <p className="text-xs text-slate-400 mt-0.5">Actualización en tiempo real</p>
          </div>
          <div className="flex items-center gap-2">
            {['all', 'info', 'warn', 'error'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] font-black px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {f === 'all' ? 'Todos' : f.toUpperCase()}
              </button>
            ))}
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ml-1"
            >
              <RefreshCw size={14} className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80 font-mono text-xs">
          {displayed.map((log, i) => (
            <div
              key={log.id}
              className={`flex items-start gap-3 px-6 py-2.5 border-b border-slate-50 ${i === 0 ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'} transition-colors`}
            >
              <span className="text-slate-300 tabular-nums shrink-0 pt-0.5 text-[10px]">{log.ts}</span>
              <LogBadge level={log.level} />
              <span className="text-slate-400 shrink-0 font-bold text-[10px] pt-0.5 min-w-[80px]">{log.service}</span>
              <span className={`text-[11px] ${log.level === 'error' ? 'text-red-600' : log.level === 'warn' ? 'text-amber-700' : 'text-slate-600'}`}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
