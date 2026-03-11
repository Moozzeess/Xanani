const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

module.exports = app;
const rutaRoutes = require('./src/routes/ruta.routes');
const paradaRoutes = require('./src/routes/parada.routes');
const ubicacionRoutes = require('./src/routes/ubicacion.routes');
const unidadRoutes = require('./src/routes/unidad.routes');

app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/rutas', rutaRoutes);
app.use('/api/paradas', paradaRoutes);
app.use('/api/unidades', unidadRoutes);