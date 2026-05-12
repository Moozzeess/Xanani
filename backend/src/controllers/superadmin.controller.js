const bcrypt = require('bcryptjs');
const os = require('os');
const mongoose = require('mongoose');
const { Usuario, USER_ROLES } = require('../models/Usuario');
const Conductor = require('../models/Conductor');
const Unidad = require('../models/Unidad');
const DispositivoHardware = require('../models/DispositivoHardware');
const catchAsync = require('../utils/catchAsync');
const ErrorApp = require('../utils/ErrorApp');

// ─────────────────────────────────────────────────────────────────────────────
// ANALÍTICA GLOBAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/stats
 * KPIs globales: admins activos, conductores, unidades y pasajeros registrados.
 */
const obtenerStats = catchAsync(async (req, res) => {
  const [
    totalAdmins,
    adminsActivos,
    totalConductores,
    totalPasajeros,
    totalUnidades,
    unidadesActivas,
  ] = await Promise.all([
    Usuario.countDocuments({ role: USER_ROLES.ADMINISTRADOR }),
    Usuario.countDocuments({ role: USER_ROLES.ADMINISTRADOR, isActive: true }),
    Usuario.countDocuments({ role: USER_ROLES.CONDUCTOR }),
    Usuario.countDocuments({ role: USER_ROLES.PASAJERO }),
    Unidad.countDocuments(),
    Unidad.countDocuments({ activa: true }),
  ]);

  res.status(200).json({
    totalAdmins,
    adminsActivos,
    totalConductores,
    totalPasajeros,
    totalUnidades,
    unidadesActivas,
  });
});

/**
 * GET /api/superadmin/demanda
 * Agrupa registros de conductores creados por hora del día (últimas 24 h) para
 * aproximar la curva de demanda. Cuando tengas un modelo de "viaje" o "sesión"
 * puedes reemplazar la colección aquí sin cambiar el contrato de respuesta.
 */
const obtenerDemanda = catchAsync(async (req, res) => {
  // Construimos los 24 buckets con aggregation de Mongoose
  const ahora = new Date();
  const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  const resultado = await Unidad.aggregate([
    { $match: { updatedAt: { $gte: hace24h } } },
    {
      $group: {
        _id: { $hour: { date: '$updatedAt', timezone: 'America/Mexico_City' } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Rellenar las 24 horas aunque no haya datos en alguna
  const porHora = Array.from({ length: 24 }, (_, h) => {
    const encontrado = resultado.find((r) => r._id === h);
    return { hour: String(h).padStart(2, '0'), value: encontrado ? encontrado.total : 0 };
  });

  res.status(200).json({ porHora });
});

// ─────────────────────────────────────────────────────────────────────────────
// GESTIÓN DE ADMINISTRADORES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/admins
 * Lista todos los usuarios con rol ADMINISTRADOR.
 */
const listarAdmins = catchAsync(async (req, res) => {
  const admins = await Usuario.find({ role: USER_ROLES.ADMINISTRADOR })
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean();

  // Enriquecer con cantidad de conductores bajo cada admin (si aplica en tu modelo)
  res.status(200).json({ admins });
});

/**
 * POST /api/superadmin/admins
 * Crea un nuevo administrador.
 * Body: { username, email, password, flotilla? }
 */
const crearAdmin = catchAsync(async (req, res) => {
  const { username, email, password, flotilla } = req.body;

  if (!username || !email || !password) {
    throw new ErrorApp('Datos incompletos: username, email y password son obligatorios.', 400);
  }

  const existente = await Usuario.findOne({
    $or: [{ username }, { email: email.toLowerCase() }],
  });
  if (existente) {
    const campo = existente.username === username ? 'Nombre de usuario' : 'Correo electrónico';
    throw new ErrorApp(`${campo} ya está en uso.`, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const nuevoAdmin = await Usuario.create({
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: USER_ROLES.ADMINISTRADOR,
    // Guardamos la flotilla en nacionalidad como campo auxiliar hasta que
    // exista un modelo Administrador dedicado. Cámbialo cuando lo tengas.
    nacionalidad: flotilla || '',
  });

  res.status(201).json({
    admin: {
      id: nuevoAdmin._id,
      username: nuevoAdmin.username,
      email: nuevoAdmin.email,
      role: nuevoAdmin.role,
      flotilla: nuevoAdmin.nacionalidad,
      isActive: nuevoAdmin.isActive,
      createdAt: nuevoAdmin.createdAt,
    },
  });
});

/**
 * PUT /api/superadmin/admins/:id
 * Actualiza nombre de usuario, email y flotilla de un administrador.
 * Body: { username?, email?, flotilla? }
 */
const editarAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { username, email, flotilla } = req.body;

  const admin = await Usuario.findOne({ _id: id, role: USER_ROLES.ADMINISTRADOR });
  if (!admin) throw new ErrorApp('Administrador no encontrado.', 404);

  if (username) admin.username = username;
  if (email) admin.email = email.toLowerCase();
  if (flotilla !== undefined) admin.nacionalidad = flotilla;

  await admin.save();

  res.status(200).json({
    admin: {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      flotilla: admin.nacionalidad,
      isActive: admin.isActive,
    },
  });
});

/**
 * PATCH /api/superadmin/admins/:id/estado
 * Activa o suspende el acceso de un administrador.
 * Body: { isActive: boolean }
 */
const cambiarEstadoAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new ErrorApp('El campo isActive debe ser un booleano.', 400);
  }

  const admin = await Usuario.findOneAndUpdate(
    { _id: id, role: USER_ROLES.ADMINISTRADOR },
    { isActive },
    { new: true, select: '-passwordHash' }
  );
  if (!admin) throw new ErrorApp('Administrador no encontrado.', 404);

  res.status(200).json({ admin });
});

/**
 * PATCH /api/superadmin/admins/:id/password
 * Restablece la contraseña de un administrador.
 * Body: { nuevaPassword: string }
 */
const restablecerPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { nuevaPassword } = req.body;

  if (!nuevaPassword || nuevaPassword.length < 8) {
    throw new ErrorApp('La nueva contraseña debe tener al menos 8 caracteres.', 400);
  }

  const admin = await Usuario.findOne({ _id: id, role: USER_ROLES.ADMINISTRADOR });
  if (!admin) throw new ErrorApp('Administrador no encontrado.', 404);

  admin.passwordHash = await bcrypt.hash(nuevaPassword, 10);
  await admin.save();

  res.status(200).json({ mensaje: 'Contraseña restablecida correctamente.' });
});

/**
 * DELETE /api/superadmin/admins/:id
 * Elimina permanentemente un administrador.
 */
const eliminarAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;

  const admin = await Usuario.findOneAndDelete({ _id: id, role: USER_ROLES.ADMINISTRADOR });
  if (!admin) throw new ErrorApp('Administrador no encontrado.', 404);

  res.status(200).json({ mensaje: 'Administrador eliminado correctamente.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH / ESTADO DEL SISTEMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/health
 * Métricas del servidor Node.js, MongoDB y dispositivos IoT.
 */
const obtenerHealth = catchAsync(async (req, res) => {
  // ── Node.js ──────────────────────────────────────────────────────────────
  const memTotal = os.totalmem();
  const memLibre = os.freemem();
  const memUsada = memTotal - memLibre;
  const uptimeSegundos = process.uptime();

  // ── MongoDB ───────────────────────────────────────────────────────────────
  const estadoMongo = mongoose.connection.readyState;
  // 0: disconnected | 1: connected | 2: connecting | 3: disconnecting
  const estadoMongoTexto = ['disconnected', 'connected', 'connecting', 'disconnecting'][estadoMongo] || 'unknown';

  // ── IoT / Dispositivos ────────────────────────────────────────────────────
  const ahora = new Date();
  const hace5seg = new Date(ahora.getTime() - 5_000);
  const hace15seg = new Date(ahora.getTime() - 15_000);

  const [
    totalDispositivos,
    dispositivosActivos,
    gpsAlDia,      // ultimaConexion <= 5 s
    gpsLento,      // 5 s < ultimaConexion <= 15 s
    sinSenal,      // ultimaConexion > 15 s o null
  ] = await Promise.all([
    DispositivoHardware.countDocuments(),
    DispositivoHardware.countDocuments({ estado: 'activo' }),
    DispositivoHardware.countDocuments({ ultimaConexion: { $gte: hace5seg } }),
    DispositivoHardware.countDocuments({
      ultimaConexion: { $gte: hace15seg, $lt: hace5seg },
    }),
    DispositivoHardware.countDocuments({
      $or: [
        { ultimaConexion: { $lt: hace15seg } },
        { ultimaConexion: null },
      ],
    }),
  ]);

  res.status(200).json({
    nodejs: {
      uptime: uptimeSegundos,
      memoria: {
        totalMB: Math.round(memTotal / 1024 / 1024),
        usadaMB: Math.round(memUsada / 1024 / 1024),
        libreMB: Math.round(memLibre / 1024 / 1024),
        porcentaje: Math.round((memUsada / memTotal) * 100),
      },
      pid: process.pid,
      version: process.version,
    },
    mongodb: {
      estado: estadoMongoTexto,
      host: mongoose.connection.host || null,
      nombre: mongoose.connection.name || null,
    },
    iot: {
      totalDispositivos,
      dispositivosActivos,
      gpsAlDia,
      gpsLento,
      sinSenal,
    },
  });
});

module.exports = {
  obtenerStats,
  obtenerDemanda,
  listarAdmins,
  crearAdmin,
  editarAdmin,
  cambiarEstadoAdmin,
  restablecerPassword,
  eliminarAdmin,
  obtenerHealth,
};
