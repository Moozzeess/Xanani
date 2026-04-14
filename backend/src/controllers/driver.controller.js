const Conductor = require('../models/Conductor');
const autenticacionService = require('../services/autenticacion.service');
const { ROLES_USUARIO } = require('../models/Usuario');

exports.createDriver = async (req, res) => {
    try {
        const { nombreUsuario, correoElectronico, contrasena, numeroLicencia, unidadAsignadaId } = req.body;

        // 1. Crear la cuenta de Usuario con rol CONDUCTOR
        const nuevoUsuario = await autenticacionService.registrarCuentaInterna({
            nombreUsuario,
            correoElectronico,
            contrasena,
            rolAsignado: ROLES_USUARIO.CONDUCTOR
        });

        // 2. Crear el expediente de Conductor vinculado
        const conductor = await Conductor.create({
            usuarioId: nuevoUsuario.id,
            numeroLicencia,
            unidadAsignadaId: unidadAsignadaId || null
        });

        res.status(201).json({
            mensaje: 'Conductor creado exitosamente',
            usuario: nuevoUsuario,
            conductor
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            mensaje: 'Error al crear conductor',
            error: error.message
        });
    }
};