const { FRONTEND_URL, NODE_ENV } = require('./env');

/**
 * Whitelist de orígenes permitidos.
 */
const whitelist = [FRONTEND_URL];

if (NODE_ENV === 'development') {
  whitelist.push('http://localhost:5173');
  whitelist.push('http://localhost:5174');
  whitelist.push('http://localhost:3000'); // Por si se usa otro puerto común
}

const corsOptions = {
  origin: function (origin, callback) {
    // Si no hay origen (como en Postman o peticiones entre servidores)
    // O si el origen está en la whitelist, permitimos el acceso.
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado origen no permitido: ${origin}`);
      callback(new Error('Acceso denegado por políticas de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

module.exports = {
  whitelist,
  corsOptions
};
