const mqtt = require('mqtt');
const crypto = require('crypto');
const { MQTT_BROKER_URL, MQTT_TOPIC, MQTT_SECRET_KEY, MQTT_AUTH_USER, MQTT_AUTH_PASS } = require('../config/env');
const { emitirEvento } = require('./socketService');
const DispositivoHardware = require('../models/DispositivoHardware');

/**
 * Función para desencriptar el payload de hardware.
 * Espera formato: "IV_HEX:CIPHERTEXT_HEX"
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
        ...options
    });
    
    clienteActual = cliente;

    cliente.on('connect', () => {
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
      try {
        // Fase 1: Intentar Desencriptar (si falla pero es obligatorio, rechazará el paquete)
        // Por compatibilidad temporal (Legacy), si empieza con '{', asumimos texto plano.
        let mensajeTexto = mensajeCrudo;
        if (!mensajeCrudo.trim().startsWith('{')) {
            mensajeTexto = desencriptarPayload(mensajeCrudo);
        }

        const datos = JSON.parse(mensajeTexto);
        const idHardware = datos.id || datos.id_hardware || datos.Id_Dispositivo_Hardware;


        // Si el mensaje incluye un ID de hardware, actualizar su última conexión
        if (idHardware) {
          await DispositivoHardware.findOneAndUpdate(
            { Id_Dispositivo_Hardware: idHardware },
            { ultimaConexion: new Date() }
          );
        }

        if (datos.xanani_ping_request) {
          const tiempoMs = Date.now() - datos.xanani_ping_request;
          return emitirEvento('ping_recibido', { exito: true, tiempo_ms: tiempoMs }, idHardware);
        }

        // Normalización de datos común (Soporte GPS NEO 6M, SIM800L y Celdas)
        const payloadNormalizado = {
          id: idHardware,
          // GPS NEO 6M
          gps: {
            con: datos.gps?.con !== undefined ? datos.gps.con : (datos.gps_status === 'OK'),
            lat: datos.gps?.lat || 0,
            lon: datos.gps?.lon || 0,
            sat: datos.gps?.sat || 0,
            spd: datos.gps?.spd || 0
          },
          // SIM800L
          sim: {
            con: datos.sim800l?.connected !== undefined ? datos.sim800l.connected : (datos.sim_con || false),
            signal: datos.sim800l?.signalStrength !== undefined ? datos.sim800l.signalStrength : (datos.sim_signal || 0)
          },
          // Sensores de Pasajeros (IR)
          pasajeros: {
            in: datos.entradas !== undefined ? datos.entradas : (datos.in || 0),
            out: datos.salidas !== undefined ? datos.salidas : (datos.out || 0),
            act: datos.actuales !== undefined ? datos.actuales : (datos.act || 0)
          },
          // Celdas de Carga (HX711)
          celdas: datos.celdas || [],
          // Configuración actual (si el ESP32 la reporta)
          config: {
            capacidad_maxima: datos.capacidad_maxima || null,
            factor_calibracion: datos.factor_calibracion || null,
            action: datos.action || null
          },
          // Código de estado/error de Arduino
          st: datos.st !== undefined ? datos.st : -1,
          err: datos.err || null,
          fecha: new Date().toISOString()
        };

        // Caso: Tópico de Validación/Debug (xanani/debug/...)
        if (topic.includes('/debug')) {
          emitirEvento('datos_debug_esp32', payloadNormalizado, idHardware);
        }

        // Emitir a la sala privada del dispositivo (Aislamiento)
        emitirEvento('datos_esp32', {
          tema: topic,
          payload: payloadNormalizado,
          fecha: payloadNormalizado.fecha
        }, idHardware);

        // Emitir también de forma global para permitir el "Descubrimiento" en el panel de pruebas
        emitirEvento('datos_esp32', {
          tema: topic,
          payload: payloadNormalizado,
          fecha: payloadNormalizado.fecha
        }, null);

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

module.exports = {
  conectarMQTT,
  reconfigurarMQTT,
  desconectarMQTT,
  enviarComando,
  enviarPingTest
};
