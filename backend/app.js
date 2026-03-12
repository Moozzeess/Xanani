const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const ErrorApp = require('./src/utils/ErrorApp');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales
app.use('/api', routes);

// Captura de rutas no encontradas (404)
app.all('*', (req, res, next) => {
  next(new ErrorApp(`No se pudo encontrar ${req.originalUrl} en este servidor.`, 404));
});

// Middleware global de errores
app.use(errorMiddleware);

module.exports = app;
