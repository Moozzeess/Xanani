const { Server } = require('socket.io');
const Incidencia = require('../models/Incidencia');

/**
 * Servicio de WebSockets para Xanani.
 * Gestiona la conexión con los clientes (frontend) y la emisión de datos en tiempo real.
 */
let io;
const rutasNotificadas = new Set(); // Cache para evitar spam de notificaciones

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

    // Unirse a una sala específica de dispositivo para evitar interferencias
    socket.on('suscribir_dispositivo', (idHardware) => {
      if (idHardware) {
        socket.join(`device_${idHardware}`);
        console.log(`Socket ${socket.id} unido a sala: device_${idHardware}`);
      }
    });

    // Salir de la sala del dispositivo
    socket.on('desuscribir_dispositivo', (idHardware) => {
      if (idHardware) {
        socket.leave(`device_${idHardware}`);
        console.log(`Socket ${socket.id} salió de sala: device_${idHardware}`);
      }
    });

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

    // Suscribir usuario a su sala privada (para notificaciones personales)
    socket.on('suscribir_usuario', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        // console.log(`Socket ${socket.id} unido a sala privada: user_${userId}`);
      }
    });

    // 1. Ubicación en tiempo real de los conductores
    socket.on('ubicacion_conductor', async (datos) => {
      // Retransmitir al panel de administración y pasajeros
      socket.broadcast.emit('ubicacion_conductor', datos);

      // Si es una ruta que no hemos marcado como activa en esta sesión
      const { rutaId, rutaNombre } = datos;
      if (rutaId && !rutasNotificadas.has(rutaId.toString())) {
        rutasNotificadas.add(rutaId.toString());

        const notificacionController = require('../controllers/notificacion.controller');
        await notificacionController.crearNotificacionInterna({
          titulo: '¡Ruta en Movimiento!',
          mensaje: `Unidades reales han comenzado a circular en la ruta "${rutaNombre || 'Suscrita'}".`,
          tipo: 'INFO',
          rolDestino: 'PASAJERO',
          data: { rutaId }
        });

        // Opcional: Avisar por socket de forma inmediata incluyendo la posición inicial
        io.emit('ruta_activa', { 
          rutaId, 
          rutaNombre, 
          pos: datos.pos, 
          unidadId: datos.id 
        });
      }
    });

    // 2. Avisos globales o específicos desde Admin hacia Conductores y Pasajeros
    socket.on('aviso_conductor', (datos) => {
      // datos = { mensaje, severidad, conductorId? }
      socket.broadcast.emit('aviso_conductor', datos);
    });

    socket.on('aviso_pasajero', (datos) => {
      // Si el aviso tiene un destinatario específico, enviarlo solo a su sala
      if (datos.usuarioDestino) {
        io.to(`user_${datos.usuarioDestino}`).emit('aviso_pasajero', datos);
      } else {
        // De lo contrario, retransmitir a todos los pasajeros (Aviso Global)
        socket.broadcast.emit('aviso_pasajero', datos);
      }
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
 *  - {string} idHardware - Opcional. ID para sala de dispositivo.
 *  - {string} usuarioId - Opcional. ID para sala privada de usuario.
 * Retorno:
 *  - {void} Fuego y olvido (Broadcast).
 */
const emitirEvento = (evento, datos, idHardware = null, usuarioId = null) => {
  if (io) {
    if (idHardware) {
      // Emitir solo a los interesados en este dispositivo específico (Aislamiento)
      io.to(`device_${idHardware}`).emit(evento, datos);
    } else if (usuarioId) {
      // Emitir solo al usuario específico (Sala Privada)
      io.to(`user_${usuarioId}`).emit(evento, datos);
    } else {
      // Emitir globalmente si no hay ID específico
      io.emit(evento, datos);
    }
  } else {
    console.warn('Socket.io no ha sido inicializado aún.');
  }
};

module.exports = {
  inicializarSocket,
  emitirEvento
};
