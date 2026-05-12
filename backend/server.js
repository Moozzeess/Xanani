const http = require('http');
const cluster = require('cluster');
const os = require('os');
const app = require('./app');
const connectDB = require('./src/config/db');
const { PORT, MONGO_URI, NODE_ENV } = require('./src/config/env');
const { inicializarSocket } = require('./src/services/socketService');
const { conectarMQTT } = require('./src/services/mqttService');
const mongoose = require('mongoose');
const { desconectarMQTT } = require('./src/services/mqttService');
const logger = require('./src/utils/logger');

const optimizaciones = require('./src/config/optimizaciones');

// Determinamos si debemos usar cluster (Solo en producción)
const USE_CLUSTER = NODE_ENV === 'production';
// Intentar usar availableParallelism (Node 19.4+) o fallback a cpus().length
const getWorkerCount = () => {
    if (os.availableParallelism) return os.availableParallelism();
    return os.cpus().length;
};

const numCPUs = getWorkerCount();

/**
 * Función centralizada para cierre ordenado del servidor
 * @param {string} signal - Señal recibida (SIGINT/SIGTERM)
 * @param {Object} server - Instancia del servidor HTTP (opcional)
 */
const gracefulShutdown = async (signal, server = null) => {
  const processType = cluster.isPrimary ? 'MASTER' : `WORKER ${process.pid}`;
  logger.info(`[${processType}] Recibida señal ${signal}. Iniciando cierre ordenado...`);

  try {
    // 1. Cerrar conexión MQTT
    desconectarMQTT();
    logger.info(`[${processType}] Conexión MQTT cerrada.`);

    // 2. Cerrar servidor HTTP (detener nuevas peticiones)
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info(`[${processType}] Servidor HTTP detenido.`);
    }

    // 3. Cerrar conexión MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info(`[${processType}] Conexión a MongoDB cerrada.`);
    }

    logger.info(`[${processType}] Cierre finalizado con éxito. ¡Adiós!`);
    process.exit(0);
  } catch (error) {
    logger.error(`[${processType}] Error durante el cierre: ${error.message}`);
    process.exit(1);
  }
};

if (USE_CLUSTER && cluster.isPrimary) {
  logger.info(`[MASTER] Proceso primario ${process.pid} inicializado`);
  logger.info(`[MASTER] Iniciando ${numCPUs} workers para balanceo de carga...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      logger.warn(`[MASTER] Worker ${worker.process.pid} ha muerto (código: ${code}, señal: ${signal}). Reiniciando...`);
      cluster.fork();
    }
  });

  // El Master también debe manejar señales de terminación
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

} else {
  const server = http.createServer(app);
  
  server.timeout = optimizaciones.server.timeout;
  server.keepAliveTimeout = optimizaciones.server.keepAliveTimeout;
  server.headersTimeout = optimizaciones.server.headersTimeout;

  (async () => {
    try {
      await connectDB(MONGO_URI);
      
      inicializarSocket(server);
      conectarMQTT();
    
      server.listen(PORT, () => {
        const mode = USE_CLUSTER ? `WORKER ${process.pid}` : 'SINGLE PROCESS';
        logger.info(`[${mode}] Servidor Xanani corriendo en el puerto: ${PORT}`);
      });

      // Manejo de terminación para el Worker o Single Process
      process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));

    } catch (error) {
      logger.error(`[ERROR FATAL] Fallo al iniciar el servidor: ${error.message}`);
      process.exit(1);
    }
  })();
}