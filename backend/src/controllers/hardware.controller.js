const DispositivoHardware = require('../models/DispositivoHardware');
const ErrorApp = require('../utils/ErrorApp');

exports.createHardware = async (req, res, next) => {
    try {
        const { 
            Direccion_Mac, Id_Dispositivo_Hardware, 
            broker, puerto, usuario_mqtt, password_mqtt, 
            capacidadMaxima, umbralPeso, topico, estado 
        } = req.body;

        if (!Direccion_Mac || !Id_Dispositivo_Hardware) {
            return next(new ErrorApp('Mac y Hardware ID son obligatorios', 400));
        }

        const existe = await DispositivoHardware.findOne({ Direccion_Mac });
        if (existe) {
            return next(new ErrorApp('El dispositivo con esta MAC ya existe', 400));
        }

        const nuevoDispositivo = await DispositivoHardware.create({
            Direccion_Mac,
            Id_Dispositivo_Hardware,
            broker, puerto, usuario_mqtt, password_mqtt, capacidadMaxima, umbralPeso, topico,
            estado: estado || 'activo'
        });

        res.status(201).json({
            status: 'success',
            data: nuevoDispositivo
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllHardware = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const dispositivos = await DispositivoHardware.find()
            .populate('administrador', 'username email')
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await DispositivoHardware.countDocuments();

        res.status(200).json({
            status: 'success',
            results: dispositivos.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: dispositivos
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminHardware = async (req, res, next) => {
    try {
        // Asumiendo que req.user tiene el ID del admin autenticado
        const adminId = req.user.id;

        const dispositivos = await DispositivoHardware.find({ administrador: adminId });

        res.status(200).json({
            status: 'success',
            results: dispositivos.length,
            data: dispositivos
        });
    } catch (error) {
        next(error);
    }
};

exports.assignAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { adminId, topico, broker, puerto, usuario_mqtt, password_mqtt, capacidadMaxima, umbralPeso, estado, Id_Dispositivo_Hardware } = req.body;

        const dispositivo = await DispositivoHardware.findById(id);

        if (!dispositivo) {
            return next(new ErrorApp('Dispositivo no encontrado', 404));
        }

        if (adminId !== undefined) dispositivo.administrador = adminId || null;
        if (topico !== undefined) dispositivo.topico = topico;
        if (broker !== undefined) dispositivo.broker = broker;
        if (puerto !== undefined) dispositivo.puerto = puerto;
        if (usuario_mqtt !== undefined) dispositivo.usuario_mqtt = usuario_mqtt;
        if (password_mqtt !== undefined) dispositivo.password_mqtt = password_mqtt;
        if (capacidadMaxima !== undefined) dispositivo.capacidadMaxima = capacidadMaxima;
        if (umbralPeso !== undefined) dispositivo.umbralPeso = umbralPeso;
        if (estado !== undefined) dispositivo.estado = estado;
        if (Id_Dispositivo_Hardware !== undefined) dispositivo.Id_Dispositivo_Hardware = Id_Dispositivo_Hardware;
        
        await dispositivo.save();

        res.status(200).json({
            status: 'success',
            data: dispositivo
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteHardware = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dispositivo = await DispositivoHardware.findByIdAndDelete(id);

        if (!dispositivo) {
            return next(new ErrorApp('Dispositivo no encontrado', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Dispositivo eliminado correctamente'
        });
    } catch (error) {
        next(error);
    }
};
