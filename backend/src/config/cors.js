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
    // Definimos los orígenes permitidos
    const cleanFrontendUrl = FRONTEND_URL ? FRONTEND_URL.replace(/\/$/, '') : null;
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : null;

    console.log(`[CORS DEBUG] Intento de conexión desde: "${origin}"`);

    // Regla de validación:
    // 1. No hay origen (Postman, Server-side)
    // 2. Coincide exactamente con la whitelist
    // 3. Es un origen local (localhost o 127.0.0.1) para facilitar desarrollo
    const esLocal = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    const enWhitelist = cleanFrontendUrl && cleanOrigin === cleanFrontendUrl;

    if (!origin || esLocal || enWhitelist) {
      console.log(`[CORS OK] Permitido origen: ${origin || 'Sin Origen'}`);
      callback(null, true);
    } else {
      console.warn(`[CORS BLOQUEADO] Origen no permitido: "${origin}"`);
      callback(new Error('No permitido por políticas de seguridad CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  whitelist,
  corsOptions
};