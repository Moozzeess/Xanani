const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const ErrorApp = require('./src/utils/ErrorApp');

const app = express();

// Importar rutas específicas
const driverRoutes = require('./src/routes/driver.routes');
const routeRoutes = require('./src/routes/route.routes');
const stopRoutes = require('./src/routes/stop.routes');
const locationRoutes = require('./src/routes/location.routes');
const unitRoutes = require('./src/routes/unit.routes');
const hardwareRoutes = require('./src/routes/hardware.routes');

app.use(cors());
app.use(express.json());

// Montar Rutas Principales
app.use('/api', routes); // Auth, Users, etc.

// Montar Rutas de Recursos
app.use('/api/drivers', driverRoutes);
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