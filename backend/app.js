const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const ErrorApp = require('./src/utils/ErrorApp');

const unidadRoutes = require('./src/routes/unidad.routes');
const rutaRoutes = require('./src/routes/ruta.rooutes');
const paradaRoutes = require('./src/routes/parada.routes');
const ubicacionRoutes = require('./src/routes/ubicacion.routes');
const reporteRoutes = require('./src/routes/reporte.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales: auth (/api/auth) + users (/api/users)
app.use('/api', routes);

// Módulos de recursos
app.use('/api/units', unidadRoutes);
app.use('/api/routes', rutaRoutes);
app.use('/api/stops', paradaRoutes);
app.use('/api/locations', ubicacionRoutes);
app.use('/api/reportes', reporteRoutes);

// Captura de rutas no encontradas (404)
app.all('*', (req, res, next) => {
  next(new ErrorApp(`No se pudo encontrar ${req.originalUrl} en este servidor.`, 404));
});

// Middleware global de errores
app.use(errorMiddleware);

module.exports = app;
