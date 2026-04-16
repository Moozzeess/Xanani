const DispositivoHardware = require('../models/DispositivoHardware');
const ErrorApp = require('../utils/ErrorApp');

/**
 * Intención: Crea un nuevo dispositivo de hardware (ESP32/sensores).
 * Parámetros:
 *  - {Object} req - Objeto Express Request. Body: Direccion_Mac, Id_Dispositivo_Hardware, etc.
 *  - {Object} res - Objeto Express Response.
 *  - {Function} next - Middleware para manejo de errores.
 * Retorno:
 *  - {Object} Objeto JSON con estado y datos del nuevo dispositivo (HTTP 201).
 * Reglas de negocio:
 *  - Direccion_Mac y Id_Dispositivo_Hardware son estrictamente obligatorios.
 * Casos límite (edge cases):
 *  - Retorna HTTP 400 si Direccion_Mac ya está registrado en DB.
 *  - Retorna HTTP 400 si faltan campos requeridos.
 */
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

/**
 * Intención: Obtiene una lista paginada de todos los dispositivos de hardware.
 * Parámetros:
 *  - {Object} req - Objeto Express Request con query params `page` y `limit`.
 *  - {Object} res - Objeto Express Response.
 *  - {Function} next - Middleware para manejo de errores.
 * Retorno:
 *  - {Object} Objeto JSON con lista de dispositivos, variables de paginación y cuenta total (HTTP 200).
 * Reglas de negocio:
 *  - Hace populate del campo 'administrador'.
 *  - Limit default es de 10 dispositivos por página.
 * Casos límite (edge cases):
 *  - Retorna arreglo vacío en `data` si se excede la página máxima (sin error HTTP crítico).
 */
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

        // Calcular estado dinámico basado en la última conexión (30 segundos de umbral)
        const dispositivosConEstado = dispositivos.map(disp => {
            const esReciente = disp.ultimaConexion && 
                (Date.now() - new Date(disp.ultimaConexion).getTime()) < 30000;
            return {
                ...disp,
                estado: esReciente ? 'activo' : 'inactivo'
            };
        });

        const total = await DispositivoHardware.countDocuments();

        res.status(200).json({
            status: 'success',
            results: dispositivosConEstado.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: dispositivosConEstado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Intención: Obtiene lista de hardware específicamente asignado a un administrador.
 * Parámetros:
 *  - {Object} req - Objeto Express Request. Requiere req.user poblado por JWT.
 *  - {Object} res - Objeto Express Response.
 *  - {Function} next - Middleware para manejo de errores.
 * Retorno:
 *  - {Object} Lista JSON de dispositivos asociados a dicho `adminId`.
 * Reglas de negocio:
 *  - Restringe la visibilidad del HW únicamente a los pertenecientes al administrador que hace la consulta.
 * Casos límite (edge cases):
 *  - Retorna `data: []` si no posee dispositivos asignados.
 */
exports.getAdminHardware = async (req, res, next) => {
    try {
        // Asumiendo que req.user tiene el ID del admin autenticado
        const adminId = req.user.id;

        const dispositivos = await DispositivoHardware.find({ administrador: adminId }).lean();

        // Calcular estado dinámico basado en la última conexión
        const dispositivosConEstado = dispositivos.map(disp => {
            const esReciente = disp.ultimaConexion && 
                (Date.now() - new Date(disp.ultimaConexion).getTime()) < 30000;
            return {
                ...disp,
                estado: esReciente ? 'activo' : 'inactivo'
            };
        });

        res.status(200).json({
            status: 'success',
            results: dispositivosConEstado.length,
            data: dispositivosConEstado
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Intención: Modifica un dispositivo de hardware para asignarle campos u otorgarlo a un Administrador.
 * Parámetros:
 *  - {Object} req - Petición con parámetro de ruta `id` y cuerpo con atributos editables (adminId, topico, etc.).
 *  - {Object} res - Respuesta HTTP.
 *  - {Function} next - Pasa errores al capturador de excepciones de Express.
 * Retorno:
 *  - {Object} Objeto hardware modificado con su nuevo estado (HTTP 200).
 * Reglas de negocio:
 *  - Permite actualización parcial (solo lo recibido en el body es reemplazado).
 * Casos límite (edge cases):
 *  - Lanza error 404 si el formato de ID es válido pero el equipo no existe en DB.
 */
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

/**
 * Intención: Elimina definitivamente de la base de datos un recurso de Hardware.
 * Parámetros:
 *  - {Object} req - Petición Express, contiene parámetro de ruta `id`.
 *  - {Object} res - Respuesta Express.
 *  - {Function} next - Envía error al middleware central.
 * Retorno:
 *  - {Object} Objeto validando el éxito de la operación (HTTP 200).
 * Reglas de negocio:
 *  - Borrado físico de la colección.
 * Casos límite (edge cases):
 *  - Lanza 404 si el dispositivo no existe en el momento de invocar el método.
 */
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
