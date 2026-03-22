const { Server } = require('socket.io');

/**
 * Servicio de WebSockets para Xanani.
 * Gestiona la conexión con los clientes (frontend) y la emisión de datos en tiempo real.
 */
let io;

/**
 * Inicializa el servidor de Socket.io coincidiendo con el servidor HTTP.
 * @param {Object} server - Instancia del servidor HTTP de Node.js.
 */
const inicializarSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    // console.log(`Cliente conectado al socket: ${socket.id}`);

    // Escuchar peticiones de reconfiguración MQTT desde el superusuario
    socket.on('configurar_mqtt', (configuracion) => {
      console.log(`Petición para reconfigurar MQTT recibida de ${socket.id}:`, configuracion);
      const { reconfigurarMQTT } = require('./mqttService');
      
      try {
        reconfigurarMQTT(configuracion);
      } catch (error) {
        console.error('Error al intentar reconfigurar MQTT:', error);
        socket.emit('estado_mqtt', { conectado: false, error: 'Fallo al iniciar reconfiguración' });
      }
    });

    // Escuchar petición explícita de desconexión
    socket.on('desconectar_mqtt', () => {
      console.log(`Petición de desconexión explícita de MQTT recibida de ${socket.id}`);
      const { desconectarMQTT } = require('./mqttService');
      try {
        desconectarMQTT();
      } catch (error) {
        console.error('Error al intentar desconectar MQTT:', error);
      }
    });

    // Escuchar comandos interactivos para el hardware
    socket.on('enviar_comando_hardware', async (payload) => {
      console.log(`Comando para hardware recibido de ${socket.id}:`, payload);
      const { enviarComando } = require('./mqttService');
      
      try {
        await enviarComando(payload);
        // Confirmar al frontend que se envió correctamente
        socket.emit('comando_enviado', { exito: true, payload });
      } catch (error) {
        console.error('Error al enviar comando al hardware:', error);
        socket.emit('comando_enviado', { exito: false, error: error.message });
      }
    });

    // Escuchar peticion de prueba de latencia/conectividad de mosquitto
    socket.on('ping_mqtt', () => {
      console.log(`Petición Ping a Mosquitto desde ${socket.id}`);
      const { enviarPingTest } = require('./mqttService');
      enviarPingTest();
    });

    socket.on('disconnect', () => {
      // console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emite un evento a todos los clientes conectados.
 * @param {string} evento - Nombre del evento.
 * @param {Object} datos - Datos a enviar.
 */
const emitirEvento = (evento, datos) => {
  if (io) {
    io.emit(evento, datos);
  } else {
    console.warn('Socket.io no ha sido inicializado aún.');
  }
};

module.exports = {
  inicializarSocket,
  emitirEvento
};
