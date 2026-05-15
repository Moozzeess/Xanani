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
    // Definimos los orígenes permitidos limpiando posibles barras diagonales al final
    const cleanFrontendUrl = FRONTEND_URL ? FRONTEND_URL.replace(/\/$/, '') : null;
    const cleanWhitelist = [
      cleanFrontendUrl,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173' // A veces el navegador usa la IP en lugar de localhost
    ].filter(Boolean);

    // Limpiamos el origen de la petición también
    const cleanOrigin = origin ? origin.replace(/\/$/, '') : null;

    console.log(`[CORS DEBUG] Origen Recibido: "${origin}" -> Limpio: "${cleanOrigin}"`);
    console.log(`[CORS DEBUG] Whitelist Activa:`, cleanWhitelist);

    // Si no hay origen (Postman/Server-to-Server) o está en la whitelist
    if (!origin || cleanWhitelist.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOQUEADO] Origen no permitido: "${origin}"`);
      callback(new Error('No permitido por políticas de seguridad CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  whitelist,
  corsOptions
};