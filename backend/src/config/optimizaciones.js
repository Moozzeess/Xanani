module.exports = {
  // Configuraciones generales de optimizacion
  server: {
    timeout: 30000,          // 30 segundos
    keepAliveTimeout: 65000, // 65 segundos
    headersTimeout: 66000    // 66 segundos
  },
  
  // Opciones base de la base de datos
  db: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 120000,      // Subido de 45s a 120s para conexiones Atlas
    heartbeatFrequencyMS: 10000,  // Ping cada 10s para mantener la conexión viva
  }
};