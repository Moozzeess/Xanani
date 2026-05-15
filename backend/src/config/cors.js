const { FRONTEND_URL } = require('./env');

/**
 * Whitelist de orígenes permitidos.
 * Incluye la URL de producción y puertos comunes de desarrollo local.
 */
const whitelist = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

/**
 * Configuración dinámica de CORS.
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Si no hay origen (como en Postman o peticiones entre servidores)
    // O si el origen está en la whitelist, permitimos el acceso.
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado origen no permitido: ${origin}`);
      callback(new Error('Acceso denegado por políticas de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  whitelist,
  corsOptions
};