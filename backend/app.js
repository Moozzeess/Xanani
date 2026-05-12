const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const rutasPrincipales = require('./src/routes/index');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const ErrorApp = require('./src/utils/ErrorApp');
const { corsOptions } = require('./src/config/cors');
const logger = require('./src/utils/logger');
const { NODE_ENV } = require('./src/config/env');

const app = express();

// Limitador de velocidad global para evitar abusos
// En desarrollo se usa un límite alto para no interferir con el trabajo
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: NODE_ENV === 'production' ? 100 : 1000, // 1000 en dev, 100 en producción
  message: { mensaje: 'Demasiadas peticiones desde esta IP, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar limitador global
app.use('/api/', globalLimiter);

// Protección de encabezados con Helmet
app.use(helmet());

// Saneamiento contra Inyecciones NoSQL
app.use(mongoSanitize());

// Configuración de logs de peticiones HTTP con Morgan y Winston
app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: { write: (message) => logger.http(message.trim()) } }
));

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression()); // Optimizacion de payload

// Rutas principales centralizadas (Gateway)
app.use('/api', rutasPrincipales);


// Captura de rutas no encontradas (404)
app.all('*', (req, res, next) => {
  next(new ErrorApp(`No se pudo encontrar ${req.originalUrl} en este servidor.`, 404));
});

// Middleware global de errores
app.use(errorMiddleware);

module.exports = app;