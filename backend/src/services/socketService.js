const { Server } = require('socket.io');
const Incidencia = require('../models/Incidencia');

/**
 * Servicio de WebSockets para Xanani.
 * Gestiona la conexión con los clientes (frontend) y la emisión de datos en tiempo real.
 */
let io;

/**
 * Intención: Instanciar y encender el motor de Socket.io emparejado al puerto del backend.
 * Parámetros:
 *  - {Object} server - Servidor Node/Express levantado en `app.js`.
 * Retorno:
 *  - {Object} Referencia viva del pool `io`.
 * Reglas de negocio:
 *  - Políticas CORS abiertas `*` para tolerar PWA y diferentes orígenes.
 *  - Suscríbe listeners primarios que exponen de forma delegada métodos críticos de `mqttService.js`.
 * Casos límite (edge cases):
 *  - Fallas subyacentes o de parseo en callbacks emiten evento cautelar de error a la sala (`estado_mqtt` o `comando_enviado`).
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

    // --- NUEVA LÓGICA DE GESTIÓN DE FLOTILLA ---

    // 1. Ubicación en tiempo real de los conductores
    socket.on('ubicacion_conductor', (datos) => {
      // Retransmitir al panel de administración (y a otros interesados si aplica)
      socket.broadcast.emit('ubicacion_conductor', datos);
    });

    // 2. Avisos globales o específicos desde Admin hacia Conductores
    socket.on('aviso_conductor', (datos) => {
      // datos = { mensaje, severidad, conductorId? }
      socket.broadcast.emit('aviso_conductor', datos);
    });

    // 3. Reportes de incidencias desde Conductores hacia Admin
    socket.on('reporte_incidencia', async (datos) => {
      try {
        console.log(`Reporte de incidencia recibido:`, datos);
        // Guardar de forma persistente con TTL
        const nuevaIncidencia = new Incidencia({
          conductor: datos.conductorId,
          unidad: datos.unidadId,
          tipo: datos.tipo, // Ej: SOS, FALLA_MECANICA
          descripcion: datos.descripcion,
          ubicacion: datos.ubicacion
        });
        await nuevaIncidencia.save();

        // Enriquecer datos con el ID generado para el frontend
        const payload = { ...datos, _id: nuevaIncidencia._id };
        
        // Propagar al administrador
        socket.broadcast.emit('reporte_incidencia', payload);
      } catch (error) {
        console.error('Error al guardar incidencia:', error);
      }
    });

    // --- LÓGICA DE SIMULACIÓN PARA PASAJEROS ---
    
    // El frontend de pasajero/landing solicita simulación si no hay unidades reales
    socket.on('solicitar_simulacion', () => {
      const { iniciarSimulacionPasajeros } = require('./simulacionService');
      iniciarSimulacionPasajeros();
    });

    socket.on('disconnect', () => {
      // console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Intención: Diseminar telemetría o paquetes en tiempo real al frontend.
 * Parámetros:
 *  - {string} evento - Topic del socket (e.g. `datos_esp32`).
 *  - {Object} datos - Carga útil (Payload JSON).
 * Retorno:
 *  - {void} Fuego y olvido (Broadcast).
 * Reglas de negocio:
 *  - Herramienta genérica de transmisión unilateral Backend -> Cliente.
 * Casos límite (edge cases):
 *  - Si el pool `io` no inicializó (por race condition), ataja con consola de advertencia y desecha el paquete en vez de detener la aplicación.
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
