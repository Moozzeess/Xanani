import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Server, Database, Wifi, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Radio, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { superadminApi } from './useSuperadminApi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const tsNow = () => new Date().toLocaleTimeString('es-MX', { hour12: false });

function mkLog(level, service, message) {
  return { id: `${Date.now()}-${Math.random()}`, ts: tsNow(), level, service, message };
}

const LEVEL = {
  info:  { bg: 'bg-blue-50',  text: 'text-blue-600',  dot: 'bg-blue-400',  label: 'INFO' },
  warn:  { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', label: 'WARN' },
  error: { bg: 'bg-red-50',   text: 'text-red-600',   dot: 'bg-red-500',   label: 'ERR'  },
};

function fmtUptime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ServiceCard({ icon: Icon, title, detail, status, metric, metricLabel }) {
  const ok = status === 'ok', warn = status === 'warn';
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
        <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full
          ${ok ? 'bg-emerald-50 text-emerald-600' : warn ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
          {ok ? <CheckCircle2 size={11} /> : warn ? <AlertTriangle size={11} /> : <XCircle size={11} />}
          {ok ? 'Operativo' : warn ? 'Advertencia' : 'Error'}
        </span>
      </div>
      <div className="mt-3">
        <div className="text-xl font-black text-slate-800 tabular-nums">{metric ?? '—'}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{metricLabel}</div>
      </div>
    </div>
  );
}

function LogBadge({ level }) {
  const s = LEVEL[level] ?? LEVEL.info;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded ${s.bg} ${s.text} uppercase tracking-widest shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────
export default function SystemHealthView() {
  const [health, setHealth]       = useState(null);
  const [loadingH, setLoadingH]   = useState(true);
  const [errorH, setErrorH]       = useState(null);
  const [mqttConectado, setMqttConectado] = useState(null); // null = desconocido
  const [logs, setLogs]           = useState([]);
  const [filter, setFilter]       = useState('all');
  const socketRef                 = useRef(null);
  const intervalRef               = useRef(null);

  // ── REST: health ─────────────────────────────────────────────────────────────
  const cargarHealth = useCallback(async () => {
    try {
      setErrorH(null);
      const data = await superadminApi.getHealth();
      setHealth(data);
    } catch (e) {
      setErrorH(e.message);
    } finally {
      setLoadingH(false);
    }
  }, []);

  useEffect(() => {
    cargarHealth();
    intervalRef.current = setInterval(cargarHealth, 15_000);
    return () => clearInterval(intervalRef.current);
  }, [cargarHealth]);

  // ── Socket.IO: escuchar estado_mqtt y datos_esp32 ─────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      addLog('info', 'Socket.IO', `Conectado al servidor — ID: ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
      addLog('warn', 'Socket.IO', `Desconectado: ${reason}`);
    });

    // Estado del broker MQTT
    socket.on('estado_mqtt', (data) => {
      setMqttConectado(data.conectado);
      if (data.conectado) {
        addLog('info', 'MQTT Broker', `Conexión establecida con ${data.broker}`);
      } else {
        addLog(data.error ? 'error' : 'warn', 'MQTT Broker',
          data.error ? `Error: ${data.error}` : 'Conexión cerrada por el broker');
      }
    });

    // Telemetría de dispositivos IoT
    socket.on('datos_esp32', (data) => {
      const { payload } = data;
      if (!payload || typeof payload !== 'object') return;

      // GPS
      if (payload.gps?.con === false) {
        addLog('warn', 'IoT Gateway', `Dispositivo ${payload.id ?? '?'} — GPS sin señal`);
      }
      // SIM
      if (payload.sim?.con === false) {
        addLog('warn', 'IoT Gateway', `Dispositivo ${payload.id ?? '?'} — SIM desconectada`);
      }
      // Código de error del Arduino
      if (payload.st !== undefined && payload.st > 0) {
        addLog('error', 'IoT Gateway', `Dispositivo ${payload.id ?? '?'} — Código de error: ${payload.st}${payload.err ? ` (${payload.err})` : ''}`);
      }
    });

    return () => { socket.disconnect(); };
  }, []);

  const addLog = useCallback((level, service, message) => {
    setLogs(prev => [mkLog(level, service, message), ...prev].slice(0, 80));
  }, []);

  const displayed = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  // ── Derivar estados de tarjetas ────────────────────────────────────────────
  const nodejsStatus = health
    ? (health.nodejs.memoria.porcentaje > 85 ? 'warn' : 'ok')
    : 'ok';

  const mongoStatus = health
    ? (health.mongodb.estado === 'connected' ? 'ok' : 'error')
    : 'ok';

  const iotStatus = health
    ? (health.iot.sinSenal > 10 ? 'error' : health.iot.gpsLento > 5 ? 'warn' : 'ok')
    : 'ok';

  const mqttStatus = mqttConectado === null ? 'ok' : mqttConectado ? 'ok' : 'error';

  if (errorH && !health) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-500">
      <AlertCircle size={32} />
      <p className="font-bold">{errorH}</p>
      <button onClick={cargarHealth} className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
        <RefreshCw size={14} /> Reintentar
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ServiceCard icon={Server}   title="Node.js API"   detail="Backend principal"
          status={nodejsStatus}
          metric={health ? fmtUptime(health.nodejs.uptime) : (loadingH ? '…' : '—')}
          metricLabel="Uptime del servidor" />
        <ServiceCard icon={Database} title="MongoDB"       detail="Base de datos"
          status={mongoStatus}
          metric={health ? health.mongodb.estado : (loadingH ? '…' : '—')}
          metricLabel={`Host: ${health?.mongodb.host ?? '—'}`} />
        <ServiceCard icon={Radio}    title="MQTT Broker"   detail="Mosquitto"
          status={mqttStatus}
          metric={mqttConectado === null ? 'Esperando…' : mqttConectado ? 'Conectado' : 'Desconectado'}
          metricLabel="Estado del broker" />
        <ServiceCard icon={Wifi}     title="IoT Gateway"   detail="Dispositivos GPS"
          status={iotStatus}
          metric={health ? `${health.iot.sinSenal} offline` : (loadingH ? '…' : '—')}
          metricLabel={`${health?.iot.totalDispositivos ?? '—'} dispositivos totales`} />
      </div>

      {/* RAM */}
      {health && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-800 text-base mb-1">Recursos del Servidor</h3>
          <p className="text-xs text-slate-400 mb-5">Node.js · PID {health.nodejs.pid} · {health.nodejs.version}</p>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Memoria total',  value: `${health.nodejs.memoria.totalMB} MB`, color: 'text-slate-700' },
              { label: 'Memoria usada',  value: `${health.nodejs.memoria.usadaMB} MB`, color: 'text-blue-600' },
              { label: 'Memoria libre',  value: `${health.nodejs.memoria.libreMB} MB`,  color: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-bold mb-1.5">
            <span>Uso de memoria RAM</span>
            <span>{health.nodejs.memoria.porcentaje}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${health.nodejs.memoria.porcentaje}%`,
                background: health.nodejs.memoria.porcentaje > 85 ? '#ef4444' : health.nodejs.memoria.porcentaje > 65 ? '#f59e0b' : '#3b82f6',
              }} />
          </div>
        </div>
      )}

      {/* Red IoT */}
      {health && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-800 text-base mb-1">Estabilidad de Red Global</h3>
          <p className="text-xs text-slate-400 mb-5">Conectividad celular y actualización de geolocalización (&lt; 5 s)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Dispositivos totales', value: health.iot.totalDispositivos, color: 'text-slate-800', sub: 'Registrados' },
              { label: 'GPS al día',           value: health.iot.gpsAlDia,          color: 'text-emerald-600', sub: '< 5 s de latencia' },
              { label: 'GPS lento',            value: health.iot.gpsLento,          color: 'text-amber-500', sub: '5 – 15 s de retraso' },
              { label: 'Sin señal',            value: health.iot.sinSenal,          color: 'text-red-500', sub: '> 15 s / desconectados' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`text-3xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
          {health.iot.totalDispositivos > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-400 font-bold mb-1.5">
                <span>Cobertura de red</span>
                <span>{(((health.iot.totalDispositivos - health.iot.sinSenal) / health.iot.totalDispositivos) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-400" style={{ width: `${(health.iot.gpsAlDia / health.iot.totalDispositivos) * 100}%` }} />
                <div className="h-full bg-amber-400"   style={{ width: `${(health.iot.gpsLento / health.iot.totalDispositivos) * 100}%` }} />
                <div className="h-full bg-red-400"     style={{ width: `${(health.iot.sinSenal / health.iot.totalDispositivos) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log stream */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base">Registro de Eventos</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tiempo real vía Socket.IO</p>
          </div>
          <div className="flex items-center gap-2">
            {['all', 'info', 'warn', 'error'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[11px] font-black px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {f === 'all' ? 'Todos' : f.toUpperCase()}
              </button>
            ))}
            <button onClick={cargarHealth} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ml-1">
              <RefreshCw size={14} className={`text-slate-500 ${loadingH ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80 font-mono text-xs">
          {displayed.length === 0
            ? <div className="text-center py-10 text-slate-400 text-sm">Esperando eventos…</div>
            : displayed.map((log, i) => (
              <div key={log.id}
                className={`flex items-start gap-3 px-6 py-2.5 border-b border-slate-50 ${i === 0 ? 'bg-slate-50/80' : 'hover:bg-slate-50/50'} transition-colors`}>
                <span className="text-slate-300 tabular-nums shrink-0 pt-0.5 text-[10px]">{log.ts}</span>
                <LogBadge level={log.level} />
                <span className="text-slate-400 shrink-0 font-bold text-[10px] pt-0.5 min-w-[80px]">{log.service}</span>
                <span className={`text-[11px] ${log.level === 'error' ? 'text-red-600' : log.level === 'warn' ? 'text-amber-700' : 'text-slate-600'}`}>
                  {log.message}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
