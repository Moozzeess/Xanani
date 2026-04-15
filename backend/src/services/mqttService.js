const mqtt = require('mqtt');
const { MQTT_BROKER_URL, MQTT_TOPIC } = require('../config/env');
const { emitirEvento } = require('./socketService');

// Mantener la instancia del cliente para poder desconectarlo al reconfigurar
let clienteActual = null;
let currentBroker = MQTT_BROKER_URL;
let currentTopic = MQTT_TOPIC;

/**
 * Conecta al bróker MQTT usando la configuración actual o la proporcionada,
 * desconectando primero cualquier conexión previa.
 * 
 * @param {string} brokerUrl - URL del broker (opcional)
 * @param {string} topic - Tema a suscribirse (opcional)
 * @param {Object} options - Opciones extras (username, password) (opcional)
 */
const conectarMQTT = (brokerUrl = currentBroker, topic = currentTopic, options = {}) => {
  // Desconectar cliente previo si existe
  if (clienteActual) {
    console.log('Desconectando cliente MQTT anterior...');
    clienteActual.end(true); // Forzar desconexión
  }

  currentBroker = brokerUrl;
  currentTopic = topic;

  const cliente = mqtt.connect(currentBroker, options);
  clienteActual = cliente;

  cliente.on('connect', () => {
    console.log('Conexión MQTT establecida exitosamente.');
    emitirEvento('estado_mqtt', { conectado: true, broker: currentBroker, error: null });

    cliente.subscribe(currentTopic, (err) => {
      if (err) {
        console.error(`Error al suscribirse al tema ${currentTopic}:`, err);
      }
    });
  });

  cliente.on('message', (topic, message) => {
    // El mensaje llega como Buffer, lo convertimos a string
    const mensajeTexto = message.toString();

    try {
      // Intentamos parsear si es JSON, sino enviamos como texto
      const datos = JSON.parse(mensajeTexto);

      // Si es un ping loopback de prueba, calcular latencia y rebotar como ping
      if (datos.xanani_ping_request) {
        const tiempoMs = Date.now() - datos.xanani_ping_request;
        return emitirEvento('ping_recibido', { exito: true, tiempo_ms: tiempoMs });
      }

      // Reenviamos al frontend vía Socket.io
      emitirEvento('datos_esp32', {
        tema: topic,
        payload: datos,
        fecha: new Date().toISOString()
      });
    } catch (e) {
      emitirEvento('datos_esp32', {
        tema: topic,
        payload: mensajeTexto,
        fecha: new Date().toISOString()
      });
    }
  });

  cliente.on('error', (error) => {
    console.error('Error en la conexión MQTT:', error);
    emitirEvento('estado_mqtt', { conectado: false, broker: currentBroker, error: error.message });
  });

  cliente.on('close', () => {
    console.log('Conexión MQTT cerrada.');
    emitirEvento('estado_mqtt', { conectado: false, broker: currentBroker, error: null });
  });

  return cliente;
};

/**
 * Función exportable para ser llamada desde los eventos de Socket.io para reiniciar credenciales de conexion
 */
const reconfigurarMQTT = (nuevaConfig) => {
  const { broker, port, topic, username, password } = nuevaConfig;

  // Construir la URL completa si no tiene protocolo
  let urlFormateada = broker;
  if (!urlFormateada.startsWith('mqtt://') && !urlFormateada.startsWith('mqtts://')) {
    urlFormateada = `mqtt://${broker}`;
  }
  if (port) {
    // Asegurar que si ya tiene puerto en la URL no lo duplique o manejarlo cautelosamente
    if (!urlFormateada.includes(':', 6)) {
      urlFormateada = `${urlFormateada}:${port}`;
    }
  }

  const opciones = {};
  if (username) opciones.username = username;
  if (password) opciones.password = password;

  conectarMQTT(urlFormateada, topic || currentTopic, opciones);
};


/**
 * Envia comandos remotos hacia el dispotivo ESP32 publicando bajo un tema configurado (Ej: xanani/telemetria/config)
 */
const enviarComando = (payloadJSON, topicComandos = null) => {
  return new Promise((resolve, reject) => {
    if (!clienteActual || !clienteActual.connected) {
      return reject(new Error('Cliente MQTT no conectado. No se puede enviar comando.'));
    }

    // Si no se provee topic específico, asumimos una convención (ejemplo si el topic base es xanani/telemetria, le agreamos /config)
    const topicFinal = topicComandos || (currentTopic.replace('#', 'config') || `${currentTopic}/config`);
    const mensajeString = typeof payloadJSON === 'string' ? payloadJSON : JSON.stringify(payloadJSON);

    clienteActual.publish(topicFinal, mensajeString, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Error al publicar comando MQTT en ${topicFinal}:`, err);
        reject(err);
      } else {
        console.log(`Comando MQTT publicado exitosamente en ${topicFinal}:`, mensajeString);
        resolve(true);
      }
    });
  });
};

/**
 * Método para probar la conectividad bidireccional de Mosquitto
 * Publica un mensaje con TimeStamp en el canal de ping
 */
const enviarPingTest = () => {
  if (!clienteActual || !clienteActual.connected) {
    emitirEvento('ping_recibido', { exito: false, error: 'El broker Mosquitto no está conectado.' });
    return;
  }
  const topicPing = currentTopic.replace('#', 'ping') || `${currentTopic}/ping`;
  const payload = JSON.stringify({ xanani_ping_request: Date.now() });

  clienteActual.publish(topicPing, payload, { qos: 0 }, (err) => {
    if (err) emitirEvento('ping_recibido', { exito: false, error: 'No se pudo publicar hacia el broker.' });
  });
};

/**
 * Desconecta explícitamente el cliente MQTT y detiene la reconexión automática.
 */
const desconectarMQTT = () => {
  if (clienteActual) {
    console.log('Desconexión explícita solicitada por el usuario.');
    clienteActual.end(true); // Forzar desconexión y parar reconexiones
    clienteActual = null;
    // Emitir estado de desconexión
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
