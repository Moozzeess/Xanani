const mongoose = require('mongoose');

const optimizaciones = require('./optimizaciones');

/**
 * Configura y gestiona la conexión a MongoDB con manejo de errores avanzado.
 * @param {string} MONGO_URI - La cadena de conexión de MongoDB.
 */
module.exports = async (MONGO_URI) => {
  const mongooseOptions = {
    autoIndex: true,
    connectTimeoutMS: 10000,
    ...optimizaciones.db
  };

  // Manejo de eventos del ciclo de vida de la conexión
  mongoose.connection.on('connected', () => {
    console.log('Conexión establecida con éxito.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`Error de conexión: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Conexión perdida. Intentando reconectar...');
  });

  // Intento de conexión inicial
  try {
    await mongoose.connect(MONGO_URI, mongooseOptions);
  } catch (error) {
    console.error('Error crítico al iniciar la base de datos:');
    console.error(error.message);
    process.exit(1);
  }
  // El cierre ordenado de MongoDB está manejado en server.js (gracefulShutdown)
};