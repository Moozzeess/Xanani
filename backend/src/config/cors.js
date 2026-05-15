const { FRONTEND_URL } = require('./env');

/**
 * Whitelist de orígenes permitidos.
 */
const whitelist = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];


const corsOptions = {
  origin: true,
  credentials: true
};

module.exports = {
  corsOptions
};
/*
const corsOptions = {
  origin: function (origin, callback) {
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
};*/