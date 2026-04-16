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
    socketTimeoutMS: 45000,
  }
};
