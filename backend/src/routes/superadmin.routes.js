/**
 * Intención: Expone los endpoints de la API relacionados al recurso [superadmin].
 * Controladores asociados: `superadmin.controller`.
 * Reglas de negocio:
 *  - Todos los endpoints requieren JWT válido + rol SUPERUSUARIO.
 *  - Ningún otro rol puede alcanzar estas rutas.
 */
const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { USER_ROLES } = require('../models/Usuario');

// Proteger todas las rutas de este router
router.use(requireAuth, requireRole([USER_ROLES.SUPERUSUARIO]));

// ── Analítica global ──────────────────────────────────────────────────────────
router.get('/stats',   superadminController.obtenerStats);
router.get('/demanda', superadminController.obtenerDemanda);

// ── Health / Estado del sistema ───────────────────────────────────────────────
router.get('/health',  superadminController.obtenerHealth);

// ── CRUD Administradores ──────────────────────────────────────────────────────
router.get   ('/admins',              superadminController.listarAdmins);
router.post  ('/admins',              superadminController.crearAdmin);
router.put   ('/admins/:id',          superadminController.editarAdmin);
router.patch ('/admins/:id/estado',   superadminController.cambiarEstadoAdmin);
router.patch ('/admins/:id/password', superadminController.restablecerPassword);
router.delete('/admins/:id',          superadminController.eliminarAdmin);

module.exports = router;
