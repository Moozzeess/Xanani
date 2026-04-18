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
    sim800l: {
      connected: false,
      signalStrength: 0,
      dataPlanActive: false
    },
   /* gps: {
      latitud: 0,
      longitud: 0,
      conectado: false
    }*/
  });

  // Memoria de Sensores Físicos
  const [sensorData, setSensorData] = useState({
    hardwareId: initialDevice?.Id_Dispositivo_Hardware || null as string | null,
    celdasCarga: Array(16).fill(false),
    pasajeros: {
      entradas: 0,
      salidas: 0,
      actuales: 0
    }
  });

  // Estado Operativo y Restricciones de Hardware
  const [hardwareSettings, setHardwareSettings] = useState({
    capacidadMaxima: initialDevice?.capacidadMaxima || 15,
    umbralPeso: initialDevice?.umbralPeso || 10,
    powerOn: initialDevice?.estado ? initialDevice.estado === 'activo' : true
  });

  // Alertas Globales del Frontend
  const { disparar, dispararError } = useAlertaGlobal();

  // Referencia para el timeout del latido del ESP32
  const timeoutRef = useRef<number | null>(null);

  // Función interna para manejar Desconexión General
  const manejarDesconexionGeneral = (mensajeError?: string) => {
    setIsConnected(false);
    setDeviceStatus({
      esp32: false,
      macAddress: '',
      statusCode: -1,
      sim800l: { connected: false, signalStrength: 0, dataPlanActive: false }
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
      console.log("Nuevos datos desde ESP32:", data);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // Armar Latido para marcar Offline si no hay datos en 30s
      timeoutRef.current = window.setTimeout(() => {
        setDeviceStatus(prev => {
          if (prev.esp32) {
            disparar({
              tipo: 'advertencia',
              titulo: 'Pérdida de Señal',
              mensaje: 'No se han recibido datos del ESP32 en los últimos 30 segundos.'
            });
          }
          return {
            ...prev,
            esp32: false,
            sim800l: { ...prev.sim800l, connected: false }
          };
        });
      }, 30000);

      if (!deviceStatus.esp32) {
        disparar({
          tipo: 'info',
          titulo: 'ESP32 Detectado',
          mensaje: `Se reestableció el flujo de telemetría desde el microcontrolador ${data.payload?.id ? `(${data.payload.id})` : ''}.`
        });
      }

      setDeviceStatus(prev => ({
        ...prev,
        esp32: true,
        macAddress: data.payload?.id || prev.macAddress,
        statusCode: data.payload?.st !== undefined ? data.payload.st : prev.statusCode,
        sim800l: {
          connected: true,
          signalStrength: data.payload?.sim_signal || 85,
          dataPlanActive: true
        }
      }));

      if (data.payload) {
        // Se leen "in", "out", "act" para alinear con el payload estructurado stringificado de Arduino `mosqitto.ino`,
        // Haciendo fallback a "entradas" por compatibilidad vieja
        const vEntradas = data.payload.in !== undefined ? data.payload.in : data.payload.entradas;
        const vSalidas = data.payload.out !== undefined ? data.payload.out : data.payload.salidas;
        const vActuales = data.payload.act !== undefined ? data.payload.act : data.payload.actuales;

        const paramEntradas = vEntradas !== undefined ? vEntradas : sensorData.pasajeros.entradas;
        const paramSalidas = vSalidas !== undefined ? vSalidas : sensorData.pasajeros.salidas;
        const paramActuales = vActuales !== undefined ? vActuales : sensorData.pasajeros.actuales;

        if (paramActuales > hardwareSettings.capacidadMaxima) {
          disparar({
            tipo: 'advertencia',
            titulo: 'Límite de Ocupación Superado',
            mensaje: `El sensor indica ${paramActuales} personas, ¡superando la capacidad máxima de ${hardwareSettings.capacidadMaxima}!`
          });
        }

        if (paramSalidas > paramEntradas) {
          dispararError(
            'Inconsistencia en los Sensores IR',
            `El contador físico marca un desajuste gravísimo: hay ${paramSalidas} salidas y solo ${paramEntradas} entradas registradas históricamente.`
          );
        }

        setSensorData(prev => ({
          hardwareId: data.payload?.id || prev.hardwareId,
          celdasCarga: data.payload.celdasCarga || prev.celdasCarga,
          pasajeros: { entradas: paramEntradas, salidas: paramSalidas, actuales: paramActuales }
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
  }, [hardwareSettings.capacidadMaxima]);

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
        umbral_peso: hardwareSettings.umbralPeso
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

      {/* Contenido scrolleable */}
      <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
        <HardwareInstructions />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COLUMNA IZQUIERDA: Configuración y Estado */}
          <div className="space-y-6 lg:col-span-1">
            <MqttSettingsPanel
              mqttConfig={mqttConfig}
              onChange={handleConfigChange}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onPing={handlePing}
              isConnected={isConnected}
              isConnecting={isConnecting}
            />

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

          {/* COLUMNA DERECHA: Sensores y Sumario */}
          <div className="space-y-6 lg:col-span-2">

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