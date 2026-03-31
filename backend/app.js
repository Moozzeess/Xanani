const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

module.exports = app;

const driverRoutes = require('./src/routes/driver.routes');
const routeRoutes = require('./src/routes/route.routes');
const stopRoutes = require('./src/routes/stop.routes');
const locationRoutes = require('./src/routes/location.routes');
const unitRoutes = require('./src/routes/unit.routes');

app.use('/api/drivers', driverRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/stops', stopRoutes);
app.use('/api/units', unitRoutes);