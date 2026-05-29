const mqtt = require('mqtt');
const crypto = require('crypto');
const { MQTT_BROKER_URL, MQTT_TOPIC, MQTT_SECRET_KEY, MQTT_AUTH_USER, MQTT_AUTH_PASS } = require('../config/env');
const { emitirEvento } = require('./socketService');
const DispositivoHardware = require('../models/DispositivoHardware');

/**
 * Función para desencriptar el payload de hardware.
 */
function desencriptarPayload(payload) {
  if (!MQTT_SECRET_KEY) return payload; // Fallback
  try {
    const parts = payload.split(':');
    if (parts.length !== 2) return payload; // Posible mensaje en texto plano (Legacy mode)

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(MQTT_SECRET_KEY.padEnd(32, '0').slice(0, 32)), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Fallo al desencriptar paquete MQTT. Posible ataque o llave incorrecta:", e.message);
    throw new Error("Encrypted payload rejected");
  }
}


// Mantener la instancia del cliente para poder desconectarlo al reconfigurar
let clienteActual = null;
let currentBroker = MQTT_BROKER_URL;
let currentTopic = MQTT_TOPIC || 'xanani/#'; // Escucha global para telemetría y debug

/**
 * Intención: Genera interconexión hacia un Broker MQTT (Mosquitto) con escucha en vivo.
 */
const conectarMQTT = (brokerUrl = currentBroker, topic = currentTopic, options = {}) => {
  try {
    // Desconectar cliente previo si existe
    if (clienteActual) {
      console.log('Cerrando conexión MQTT anterior...');
      clienteActual.end(true);
    }

    currentBroker = brokerUrl;
    currentTopic = topic;

    // Validación básica de URL de Broker
    if (!currentBroker) {
      console.warn('MQTT: No se ha definido una URL de Broker válida.');
      return null;
    }

    console.log(`Intentando conectar a MQTT: ${currentBroker}`);
    const cliente = mqtt.connect(currentBroker, {
      reconnectPeriod: 5000, // Reintentar cada 5 segundos si falla
      connectTimeout: 30 * 1000,
      username: MQTT_AUTH_USER,
      password: MQTT_AUTH_PASS,
      ...options
    });

    clienteActual = cliente;

    let reconnectCount = 0;

    cliente.on('reconnect', () => {
      reconnectCount++;
      console.warn(`MQTT: Intento de reconexión #${reconnectCount}`);
      if (reconnectCount >= 10) {
        console.error('MQTT: Máximo de reconexiones alcanzado. Deteniendo intentos.');
        cliente.end(true);
        clienteActual = null;
        emitirEvento('estado_mqtt', { conectado: false, broker: currentBroker, error: 'Máximo de reconexiones alcanzado' });
      }
    });

    cliente.on('connect', () => {
      reconnectCount = 0; // Reset al conectar exitosamente
      console.log('>>> Conexión MQTT establecida exitosamente.');
      emitirEvento('estado_mqtt', { conectado: true, broker: currentBroker, error: null });

      if (currentTopic) {
        cliente.subscribe(currentTopic, (err) => {
          if (err) {
            console.error(`Error al suscribirse al tema ${currentTopic}:`, err);
          } else {
            console.log(`Suscrito a: ${currentTopic}`);
          }
        });
      }
    });

    cliente.on('message', async (topic, message) => {
      const mensajeCrudo = message.toString();
      let mensajeTexto = mensajeCrudo;
      try {
        // Fase 1: Intentar Desencriptar (si falla pero es obligatorio, rechazará el paquete)
        // Por compatibilidad temporal (Legacy), si empieza con '{', asumimos texto plano.
        if (!mensajeCrudo.trim().startsWith('{')) {
          mensajeTexto = desencriptarPayload(mensajeCrudo);
        }

        const datos = JSON.parse(mensajeTexto);


        const idHardwareRaw = datos.id || datos.id_hardware || datos.Id_Dispositivo_Hardware;

        // Buscar el dispositivo en la base de datos por ID amigable O por Direccion MAC
        let hwAmigable = idHardwareRaw;
        let dispositivoBD = null;
        if (idHardwareRaw) {
          dispositivoBD = await DispositivoHardware.findOneAndUpdate(
            {
              $or: [
                { Id_Dispositivo_Hardware: idHardwareRaw },
                { Direccion_Mac: idHardwareRaw }
              ]
            },
            { ultimaConexion: new Date() },
            { new: true } // Devuelve el documento actualizado
          );

          if (dispositivoBD) {
            // Unificar todos los eventos y payloads usando el ID amigable
            hwAmigable = dispositivoBD.Id_Dispositivo_Hardware;
          }
        }

        if (datos.xanani_ping_request) {
          const tiempoMs = Date.now() - datos.xanani_ping_request;
          return emitirEvento('ping_recibido', { exito: true, tiempo_ms: tiempoMs }, hwAmigable);
        }

        // Normalización de datos
        const payloadNormalizado = {
          id: hwAmigable,
          gps: {
            con: datos.gps?.con ?? false,
            // Uso de ?? (coalescencia nula) en lugar de || para no suprimir
            // coordenadas validas como 0.0 (aunque improbable, es el patron correcto).
            lat: datos.gps?.lat ?? 0,
            lon: datos.gps?.lon ?? 0,
            sat: datos.gps?.sat ?? 0,
            spd: datos.gps?.spd ?? 0
          },
          // Ahora sim viene directo del ESP32
          sim: {
            con:    datos.sim?.con    ?? false,
            signal: datos.sim?.signal ?? 0
          },
          pasajeros: {
            in:  datos.pasajeros?.in  ?? (datos.in  || 0),
            out: datos.pasajeros?.out ?? (datos.out || 0),
            act: datos.pasajeros?.act ?? (datos.act || datos.ocupados || 0),
            // max: Capacidad máxima en tiempo real recuperada del hardware (cap/capacidadMaxima)
            max: datos.pasajeros?.max ?? (datos.cap || 15)
          },
          // seats viene directo - tu ESP32 ya lo serializa bien
          celdas: datos.seats || datos.celdas || [],
          config: {
            capacidad_maxima: datos.cap ?? null,
            modo: datos.modo || null
          },
          // st y err ya los mandas correctamente
          st:  datos.st  ?? -1,
          err: datos.err || null,
          fecha: new Date().toISOString()
        };

        // Caso: Tópico de Validación/Debug (xanani/debug/...)
        if (topic.includes('/debug')) {
          emitirEvento('datos_debug_esp32', payloadNormalizado, hwAmigable);
        }

        // Emitir a la sala privada del dispositivo (Aislamiento)
        emitirEvento('datos_esp32', {
          tema: topic,
          payload: payloadNormalizado,
          fecha: payloadNormalizado.fecha
        }, hwAmigable);

        // Emitir a la sala de la flotilla (Administradores)
        if (dispositivoBD && dispositivoBD.flotilla) {
          emitirEvento('datos_esp32', {
            tema: topic,
            payload: payloadNormalizado,
            fecha: payloadNormalizado.fecha,
            flotilla: dispositivoBD.flotilla
          }, null, null, `fleet_${dispositivoBD.flotilla}`);
        }

        // Emitir también de forma global (Legacy/Debug/Pasajeros)
        emitirEvento('datos_esp32', {
          tema: topic,
          payload: payloadNormalizado,
          fecha: payloadNormalizado.fecha
        }, null);

        // Emitir al canal personal del conductor asignado a este hardware,
        // como canal de respaldo en caso de reconexion del socket.
        if (dispositivoBD) {
          const Unidad = require('../models/Unidad');
          const unidadConductor = await Unidad.findOne({ dispositivoHardware: dispositivoBD._id })
            .populate('conductor', '_id usuario');
          if (unidadConductor?.conductor?._id) {
            emitirEvento('datos_esp32', {
              tema: topic,
              payload: payloadNormalizado,
              fecha: payloadNormalizado.fecha
            }, null, String(unidadConductor.conductor._id));
          }
        }

        // Procesamiento y emisión automática de ubicación a partir de telemetría física (ESP32)
        if (dispositivoBD && payloadNormalizado.gps && payloadNormalizado.gps.lat !== 0 && payloadNormalizado.gps.lon !== 0) {
          const Unidad = require('../models/Unidad');
          const unidad = await Unidad.findOne({ dispositivoHardware: dispositivoBD._id }).populate('conductor');
            if (unidad) {
              const datosUbicacion = {
                id: unidad._id,
                placa: unidad.placa,
                pos: [payloadNormalizado.gps.lat, payloadNormalizado.gps.lon],
                rutaId: unidad.ruta || null,
                conductorId: unidad.conductor?._id || null,
                isSimulated: false,
                isBackground: true,
                velocidad: payloadNormalizado.gps.spd || 0,
                ocupacionActual: payloadNormalizado.pasajeros.act,
                capacidadMaxima: payloadNormalizado.pasajeros.max,
                flotilla: unidad.flotilla || dispositivoBD.flotilla || 'ESCOM',
                estado: payloadNormalizado.err === 'FULL' ? 'llena' : 'en_ruta'
              };

              // Emitir a la sala de flotilla (Administradores) y de forma global (Pasajeros)
              emitirEvento('ubicacion_conductor', datosUbicacion, null, null, `fleet_${datosUbicacion.flotilla}`);
              emitirEvento('ubicacion_conductor', datosUbicacion, null);

              // Actualizar ocupación en la base de datos en tiempo real
              unidad.ocupacionActual = payloadNormalizado.pasajeros.act;
              await unidad.save();
            }
        }

      } catch (e) {
        emitirEvento('datos_esp32', {
          tema: topic,
          payload: mensajeTexto,
          fecha: new Date().toISOString()
        });
      }
    });

    cliente.on('error', (error) => {
      console.error('!!! Error en la conexión MQTT:', error.message);
      emitirEvento('estado_mqtt', { conectado: false, broker: currentBroker, error: error.message });
    });

    cliente.on('close', () => {
      console.log('Conexión MQTT cerrada por el broker.');
      emitirEvento('estado_mqtt', { conectado: false, broker: currentBroker, error: 'Conexión cerrada' });
    });

    return cliente;
  } catch (error) {
    console.error('Error catastrófico al iniciar MQTT:', error);
    return null;
  }
};

/**
 * Reconfigura los parámetros desde el frontend.
 */
const reconfigurarMQTT = (nuevaConfig) => {
  const { broker, port, topic, username, password } = nuevaConfig;

  let urlFormateada = broker;
  if (!urlFormateada.startsWith('mqtt://') && !urlFormateada.startsWith('mqtts://')) {
    urlFormateada = `mqtt://${broker}`;
  }
  if (port && !urlFormateada.includes(':', 6)) {
    urlFormateada = `${urlFormateada}:${port}`;
  }

  const opciones = {};
  if (username) opciones.username = username;
  if (password) opciones.password = password;

  conectarMQTT(urlFormateada, topic || currentTopic, opciones);
};

const enviarComando = (payloadJSON, topicComandos = null) => {
  return new Promise((resolve, reject) => {
    if (!clienteActual || !clienteActual.connected) {
      return reject(new Error('Cliente MQTT no conectado.'));
    }

    const topicFinal = topicComandos || (currentTopic.replace('#', 'config') || `${currentTopic}/config`);
    const mensajeString = typeof payloadJSON === 'string' ? payloadJSON : JSON.stringify(payloadJSON);

    // TODO: Encriptar comandos de salida si el ESP32 lo requiere. Por ahora se manda en plano.

    clienteActual.publish(topicFinal, mensajeString, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Error al publicar en ${topicFinal}:`, err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

const enviarPingTest = () => {
  if (!clienteActual || !clienteActual.connected) {
    emitirEvento('ping_recibido', { exito: false, error: 'Broker no conectado.' });
    return;
  }
  const topicPing = currentTopic.replace('#', 'ping') || `${currentTopic}/ping`;
  const payload = JSON.stringify({ xanani_ping_request: Date.now() });

  clienteActual.publish(topicPing, payload, { qos: 0 });
};

const desconectarMQTT = () => {
  if (clienteActual) {
    clienteActual.end(true);
    clienteActual = null;
    emitirEvento('estado_mqtt', { conectado: false, broker: currentBroker, error: null });
  }
};

const getEstadoMQTT = () => ({
  conectado: !!(clienteActual && clienteActual.connected),
  broker: currentBroker,
  error: null
});

module.exports = {
  conectarMQTT,
  reconfigurarMQTT,
  desconectarMQTT,
  enviarComando,
  enviarPingTest,
  getEstadoMQTT
};