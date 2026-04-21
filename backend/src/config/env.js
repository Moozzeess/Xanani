/**
 * @file env.js
 * @description Gestión centralizada y validación de variables de entorno.
 */
require('dotenv').config();

const requiredEnv = [
  'MONGO_URI',
  'JWT_SECRET',
  //'MQTT_BROKER_URL',
  'FRONTEND_URL' // Crítico para CORS de Sockets
];

// Validar presencia de variables obligatorias
requiredEnv.forEach((variable) => {
  if (!process.env[variable]) {
    console.error(`[ERROR CRÍTICO] La variable de entorno ${variable} no está definida.`);
    process.exit(1);
  }
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  //MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
  //MQTT_TOPIC: process.env.MQTT_TOPIC',
  FRONTEND_URL: process.env.FRONTEND_URL,
};