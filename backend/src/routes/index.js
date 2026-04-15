/**
 * Intención: Enrutador Global (Main API Gateway).
 * Función: Despliega y consolida los ruteadores individuales en URIs formales (`/api/usuarios`, `/api/unidades`, etc.).
 * Reglas de negocio:
 *  - Ninguna ruta se define directamente aquí, solo se delega (`export.use()`).
 * Casos límite (edge cases):
 *  - Posee un endpoint `/salud` básico libre de JWT para que servicios como UptimeRobot puedan hacer Ping al servidor vivo.
 */
const express = require('express');
const router = express.Router();

const autenticacionRoutes = require('./autenticacion.routes');
const conductorRoutes = require('./conductor.routes');
const usuarioRoutes = require('./usuario.routes');
const rutaRoutes = require('./ruta.routes');
const paradaRoutes = require('./parada.routes');
const ubicacionRoutes = require('./ubicacion.routes');
const unidadRoutes = require('./unidad.routes');
const hardwareRoutes = require('./hardware.routes');
const recorridoRoutes = require('./recorrido.routes');
const reporteRoutes = require('./reporte.routes');
const incidenteRoutes = require('./incidente.routes');
const adminRoutes = require('./admin.routes');
const estadisticasRoutes = require('./estadisticas.routes');

router.get('/salud', (_, res) => {
  res.json({ status: 'ok', mensaje: 'Servidor operativo' });
});

router.use('/autenticacion', autenticacionRoutes);
router.use('/conductores', conductorRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/rutas', rutaRoutes);
router.use('/paradas', paradaRoutes);
router.use('/ubicaciones', ubicacionRoutes);
router.use('/unidades', unidadRoutes);
router.use('/hardware', hardwareRoutes);
router.use('/recorridos', recorridoRoutes);
router.use('/reportes', reporteRoutes);
router.use('/incidentes', incidenteRoutes);
router.use('/admin', adminRoutes);
router.use('/estadisticas', estadisticasRoutes);

module.exports = router;
