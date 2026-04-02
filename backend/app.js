const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const ErrorApp = require('./src/utils/ErrorApp');

const app = express();
const routeRoutes = require('./src/routes/route.routes');
const stopRoutes = require('./src/routes/stop.routes');
const locationRoutes = require('./src/routes/location.routes');
const unitRoutes = require('./src/routes/unit.routes');
const hardwareRoutes = require('./src/routes/hardware.routes');

app.use(cors());
app.use(express.json());

// Rutas principales
app.use('/api', routes);
app.use('/api/locations', locationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/hardware', hardwareRoutes);

// Captura de rutas no encontradas (404)
app.all('*', (req, res, next) => {
  next(new ErrorApp(`No se pudo encontrar ${req.originalUrl} en este servidor.`, 404));
});

// Middleware global de errores
app.use(errorMiddleware);

module.exports = app;
