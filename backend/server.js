const http = require('http');
const cluster = require('cluster');
const os = require('os');
const app = require('./app');
const connectDB = require('./src/config/db');
const { PORT, MONGO_URI, NODE_ENV } = require('./src/config/env');
const { inicializarSocket } = require('./src/services/socketService');
const { conectarMQTT } = require('./src/services/mqttService');

const optimizaciones = require('./src/config/optimizaciones');

// Determinamos si debemos usar cluster (Solo en producción y si no es desarrollo)
const USE_CLUSTER = NODE_ENV === 'production';
const numCPUs = os.cpus().length;

if (USE_CLUSTER && cluster.isPrimary) {
  console.log(`[MASTER] Proceso primario ${process.pid} inicializado`);
  console.log(`[MASTER] Iniciando ${numCPUs} workers para balanceo de carga...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`[MASTER] Worker ${worker.process.pid} ha muerto (código: ${code}, señal: ${signal}). Reiniciando...`);
    cluster.fork();
  });
} else {
  // Configuración del servidor (Single process o Worker)
  const server = http.createServer(app);
  
  server.timeout = optimizaciones.server.timeout;
  server.keepAliveTimeout = optimizaciones.server.keepAliveTimeout;
  server.headersTimeout = optimizaciones.server.headersTimeout;

  (async () => {
    try {
      await connectDB(MONGO_URI);
      
      // Inicializar WebSockets
      inicializarSocket(server);
    
      // Inicializar Conexión MQTT
      conectarMQTT();
    
      server.listen(PORT, () => {
        const mode = USE_CLUSTER ? `WORKER ${process.pid}` : 'SINGLE PROCESS';
        console.log(`[${mode}] Servidor Xanani corriendo en el puerto: ${PORT}`);
      });
    } catch (error) {
      console.error(`[ERROR FATAL] Fallo al iniciar el servidor:`, error);
      process.exit(1);
    }
  })();
}