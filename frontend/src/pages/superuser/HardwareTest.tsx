import { useState, useEffect, useRef } from 'react';
import { Cpu, Wifi, WifiOff } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { useAlertaGlobal } from '../../context/AlertaContext';

// Importando micro-componentes de hardware
import { HardwareInstructions } from '../../components/superuser/hardware/HardwareInstructions';
import { MqttSettingsPanel } from '../../components/superuser/hardware/ConfiguracionMqtt';
import { DeviceStatusPanel } from '../../components/superuser/hardware/Diagnostico';
import { InteractiveSettingsPanel } from '../../components/superuser/hardware/ConfiguracionAsientos';
import { SensorDataPanel } from '../../components/superuser/hardware/PanelSensores';
import { ConfigSummaryPanel } from '../../components/superuser/hardware/ConfiguracionIot';
import { DeviceIdentificationPanel } from '../../components/superuser/hardware/IdHardware';

const HardwareTest = ({ onSaved, initialDevice }: { onSaved?: () => void, initialDevice?: any }) => {
  // Estado para la configuración MQTT
  const [mqttConfig, setMqttConfig] = useState({
    broker: initialDevice?.broker || 'mqtt://[IP_ADDRESS]',
    port: initialDevice?.puerto || '1883',
    username: initialDevice?.usuario_mqtt || '',
    password: initialDevice?.password_mqtt || '',
    topic: initialDevice?.topico || 'xanani/hardware/test'
  });

  // Estado de conexión del WebSocket
  const [socket, setSocket] = useState<Socket | null>(null);

  // Estado de conexión MQTT (Bróker)
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Estado Físico de los dispositivos
  const [deviceStatus, setDeviceStatus] = useState({
    esp32: false,
    macAddress: '',
    statusCode: -1,
    errorMsg: '',
    sim800l: {
      connected: false,
      signalStrength: 0,
      dataPlanActive: false
    },
    gps: {
      latitud: 0,
      longitud: 0,
      conectado: false,
      satelites: 0,
      velocidad: 0
    },
    pasajeros: { entradas: 0, salidas: 0, actuales: 0 },
    celdas: [] as number[],
    is_debug: false
  });

  // Memoria de Sensores Físicos
  const [sensorData, setSensorData] = useState({
    hardwareId: initialDevice?.Id_Dispositivo_Hardware || null as string | null,
    celdasCarga: Array(16).fill(0),
    pasajeros: {
      entradas: 0,
      salidas: 0,
      actuales: 0
    }
  });

  // Estado Operativo y Restricciones de Hardware
  const [hardwareSettings, setHardwareSettings] = useState({
    capacidadMaxima: initialDevice?.capacidadMaxima || 15,
    factorCalibracion: initialDevice?.factorCalibracion || 10,
    powerOn: initialDevice?.estado ? initialDevice.estado === 'activo' : true
  });

  // Alertas Globales del Frontend
  const { disparar, dispararError } = useAlertaGlobal();

  // Referencia para el timeout del latido del ESP32
  const timeoutRef = useRef<number | null>(null);
  const esp32OnlineRef = useRef(false);

  // Función interna para manejar Desconexión General
  const manejarDesconexionGeneral = (mensajeError?: string) => {
    setIsConnected(false);
    esp32OnlineRef.current = false;
    setDeviceStatus({
      esp32: false,
      macAddress: '',
      statusCode: -1,
      errorMsg: '',
      sim800l: { connected: false, signalStrength: 0, dataPlanActive: false },
      gps: { latitud: 0, longitud: 0, conectado: false, satelites: 0, velocidad: 0 },
      pasajeros: { entradas: 0, salidas: 0, actuales: 0 },
      celdas: [],
      is_debug: false
    });
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mensajeError) console.error("Error MQTT Backend:", mensajeError);
  };

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const newSocket = io(backendUrl);

    newSocket.on('connect', () => {
      console.log('Cliente WS conectado al backend');
    });

    // Escuchar el estado de la conexión MQTT desde el backend
    newSocket.on('estado_mqtt', (estado) => {
      setIsConnecting(false);
      if (estado.conectado) {
        if (!isConnected) {
          disparar({
            tipo: 'exito',
            titulo: 'Conexión Establecida',
            mensaje: `El servidor está escuchando la telemetría en ${estado.broker}`
          });
        }
        setIsConnected(true);
      } else {
        if (estado.error) {
          dispararError('Fallo de conexión MQTT', estado.error);
        } else {
          disparar({
            tipo: 'advertencia',
            titulo: 'MQTT Desconectado',
            mensaje: 'Se ha cerrado la sesión con el bróker localmente.'
          });
        }
        manejarDesconexionGeneral(estado.error);
      }
    });

    // Validar telemetría y reglas de negocio
    newSocket.on('datos_esp32', (data) => {
      const payload = data.payload;
      if (!payload || typeof payload === 'string') return;

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // Latido para marcar Offline si no hay datos en 30s
      timeoutRef.current = window.setTimeout(() => {
        esp32OnlineRef.current = false;
        setDeviceStatus(prev => ({
          ...prev,
          esp32: false,
          sim800l: { ...prev.sim800l, connected: false }
        }));
        disparar({
          tipo: 'advertencia',
          titulo: 'Pérdida de Señal',
          mensaje: 'No se han recibido datos del ESP32 en los últimos 30 segundos.'
        });
      }, 30000);

      if (!esp32OnlineRef.current) {
        esp32OnlineRef.current = true;
        disparar({
          tipo: 'info',
          titulo: 'Hardware Activo',
          mensaje: `Se reestableció el flujo de datos desde el ID: ${payload.id || 'Desconocido'}.`
        });
      }

      // Actualizar Estado del Dispositivo (Diagnóstico)
      setDeviceStatus(prev => ({
        ...prev,
        esp32: true,
        macAddress: payload.id || prev.macAddress,
        statusCode: payload.st !== undefined ? payload.st : prev.statusCode,
        errorMsg: payload.err || '',
        sim800l: {
          connected: payload.sim?.con || false,
          signalStrength: payload.sim?.signal || 0,
          dataPlanActive: payload.sim?.con || false
        },
        gps: {
          conectado: payload.gps?.con || false,
          latitud: payload.gps?.lat || 0,
          longitud: payload.gps?.lon || 0,
          satelites: payload.gps?.sat || 0,
          velocidad: payload.gps?.spd || 0
        },
        pasajeros: {
          entradas: payload.pasajeros?.in || 0,
          salidas: payload.pasajeros?.out || 0,
          actuales: payload.pasajeros?.act || 0
        },
        celdas: payload.celdas || [],
        is_debug: data.tema?.includes('/debug') || false
      }));

      // Actualizar Datos de Sensores
      const { pasajeros, celdas } = payload;
      if (pasajeros) {
        setSensorData(prev => ({
          hardwareId: payload.id || prev.hardwareId,
          celdasCarga: celdas || prev.celdasCarga,
          pasajeros: {
            entradas: pasajeros.in,
            salidas: pasajeros.out,
            actuales: pasajeros.act
          }
        }));
      }
    });

    newSocket.on('comando_enviado', (respuesta: any) => {
      if (respuesta.exito) {
        disparar({
          tipo: 'exito',
          titulo: 'Comando Enviado',
          mensaje: 'El comando de configuración se ha publicado correctamente.'
        });
      } else {
        dispararError('Hubo un problema al enviar el comando MQTT al dispositivo.', respuesta.error);
      }
    });

    newSocket.on('ping_recibido', (respuesta: any) => {
      if (respuesta.exito) {
        disparar({
          tipo: 'exito',
          titulo: 'Prueba MQTT Exitosa',
          mensaje: `El servidor Mosquitto recibió y devolvió el mensaje en ${respuesta.tiempo_ms} ms.`
        });
      } else {
        dispararError('Fallo en Prueba Ping', respuesta.error);
      }
    });

    setSocket(newSocket);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, []);

  // Efecto separado para manejar la suscripción reactiva al cambiar el hardwareId
  useEffect(() => {
    if (socket && isConnected && sensorData.hardwareId) {
      console.log(`Suscribiendo socket a dispositivo: ${sensorData.hardwareId}`);
      socket.emit('suscribir_dispositivo', sensorData.hardwareId);
    }
  }, [socket, isConnected, sensorData.hardwareId]);

  // Manejadores
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMqttConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleConnect = () => {
    if (!socket) return;
    setIsConnecting(true);
    socket.emit('configurar_mqtt', mqttConfig);
  };

  const handleDisconnect = () => {
    manejarDesconexionGeneral();
    socket?.emit('desconectar_mqtt');
    setSensorData({
      hardwareId: null,
      celdasCarga: Array(16).fill(false),
      pasajeros: { entradas: 0, salidas: 0, actuales: 0 }
    });
  };

  const handlePing = () => {
    if (!socket || !isConnected) return;
    socket.emit('ping_mqtt');
  };

  const handleHardwareSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHardwareSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  const sendHardwareCommand = (tipo: 'config' | 'reset' | 'power_toggle') => {
    if (!socket || !isConnected) {
      return dispararError(
        'Sin conexión',
        'Debes estar conectado al Bróker MQTT para poder enviar comandos a los dispositivos.'
      );
    }

    let payload = {};
    if (tipo === 'config') {
      payload = {
        action: 'configure',
        capacidad_maxima: hardwareSettings.capacidadMaxima,
        factor_calibracion: hardwareSettings.factorCalibracion
      };
    } else if (tipo === 'reset') {
      payload = { action: 'reset_counters' };
    } else if (tipo === 'power_toggle') {
      payload = { action: 'power_toggle', status: hardwareSettings.powerOn ? 'ON' : 'OFF' };
    }

    socket.emit('enviar_comando_hardware', payload);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 p-4 text-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Cpu size={20} className="text-blue-400" />
            Panel de Pruebas de Hardware
          </h2>
          <p className="text-slate-400 text-xs mt-1">Diagnóstico y configuración de ESP32, SIM800L y Sensores</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? 'MQTT Conectado' : 'MQTT Desconectado'}
        </div>
      </div>

      {/* Contenido scrolleable con nuevo layout de 3 columnas */}
      <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
        <HardwareInstructions />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* COLUMNA 1: CONFIGURACIÓN (Izquierda - 3 cols) */}
          <div className="xl:col-span-3 space-y-6">
            <MqttSettingsPanel
              mqttConfig={mqttConfig}
              onChange={handleConfigChange}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onPing={handlePing}
              isConnected={isConnected}
              isConnecting={isConnecting}
            />

            <DeviceIdentificationPanel
              isConnected={isConnected}
              esp32Online={deviceStatus.esp32}
              hardwareId={sensorData.hardwareId}
              onSaved={onSaved}
              mqttConfig={mqttConfig}
              hardwareSettings={hardwareSettings}
              initialDevice={initialDevice}
            />
          </div>

          {/* COLUMNA 2: DIAGNÓSTICO EN VIVO (Centro - 4 cols) */}
          <div className="xl:col-span-4 space-y-6">
            <DeviceStatusPanel
              deviceStatus={deviceStatus}
            />

            <InteractiveSettingsPanel
              hardwareSettings={hardwareSettings}
              onChange={handleHardwareSettingsChange}
              onSendConfig={() => sendHardwareCommand('config')}
              onResetCounters={() => sendHardwareCommand('reset')}
              onTogglePower={() => {
                setHardwareSettings(prev => ({ ...prev, powerOn: !prev.powerOn }));
                setTimeout(() => sendHardwareCommand('power_toggle'), 50);
              }}
              isConnected={isConnected}
            />
          </div>

          {/* COLUMNA 3: DATOS DE SENSORES Y SUMARIO (Derecha - 5 cols) */}
          <div className="xl:col-span-5 space-y-6">
            <SensorDataPanel
              sensorData={sensorData}
              capacidadMaxima={hardwareSettings.capacidadMaxima}
            />

            <ConfigSummaryPanel
              isConnected={isConnected}
              esp32Online={deviceStatus.esp32}
              mqttConfig={mqttConfig}
              simSignalStrength={deviceStatus.sim800l.signalStrength}
              hardwareSettings={hardwareSettings}
              entradas={sensorData.pasajeros.entradas}
              salidas={sensorData.pasajeros.salidas}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default HardwareTest;