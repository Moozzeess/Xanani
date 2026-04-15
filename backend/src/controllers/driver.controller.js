const Conductor = require('../models/Conductor');
const autenticacionService = require('../services/autenticacion.service');
const { ROLES_USUARIO } = require('../models/User');

exports.createDriver = async (req, res) => {
    try {
        const { username, email, password, numeroLicencia, unidadAsignadaId } = req.body;

        // 1. Crear la cuenta de User con role CONDUCTOR
        const nuevoUsuario = await autenticacionService.registrarCuentaInterna({
            username,
            email,
            password,
            roleAsignado: ROLES_USUARIO.CONDUCTOR
        });

        // 2. Crear el expediente de Conductor vinculado
        const conductor = await Conductor.create({
            userId: nuevoUsuario.id,
            numeroLicencia,
            unidadAsignadaId: unidadAsignadaId || null
        });

        res.status(201).json({
            mensaje: 'Conductor creado exitosamente',
            user: nuevoUsuario,
            conductor
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            mensaje: 'Error al crear conductor',
            error: error.message
        });
    }
};