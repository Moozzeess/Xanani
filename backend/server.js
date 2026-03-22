const http = require('http');
const app = require('./app');
const connectDB = require('./src/config/db');
const { PORT, MONGO_URI } = require('./src/config/env');
const { inicializarSocket } = require('./src/services/socketService');
const { conectarMQTT } = require('./src/services/mqttService');

const server = http.createServer(app);

(async () => {
  await connectDB(MONGO_URI);

  // Inicializar WebSockets
  inicializarSocket(server);

  // Inicializar Conexión MQTT
  conectarMQTT();

  server.listen(PORT, () =>
    console.log(`Servidor corriendo en el puerto: ${PORT}`)
  );
})();