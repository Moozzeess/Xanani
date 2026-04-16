const Ubicacion = require('../models/Ubicacion');
const Unidad = require('../models/Unidad');

/**
 * Intención: Almacenar un punto GPS (histórico o en vivo) de una unidad en un instante dado.
 * Parámetros:
 *  - {Object} req - Body (unidadId, conductorId, rutaId, recorridoId, ubicacion, velocidad, etc.).
 *  - {Object} res - Express Response.
 * Retorno:
 *  - {Object} JSON confirmando el registro HTTP 201.
 * Reglas de negocio:
 *  - Este método es clave para generar el "breadcrumb" o historial geográfico del vehículo.
 * Casos límite (edge cases):
 *  - Si fallan los campos requeridos en el Schema de Ubicacion, lanza 500 con error nativo.
 */
exports.registrarUbicacion = async (req, res) => {

    try {

        const nuevaUbicacion = new Ubicacion({
            unidadId: req.body.unidadId,
            conductorId: req.body.conductorId,
            rutaId: req.body.rutaId,
            recorridoId: req.body.recorridoId,

            ubicacion: {
                latitud: req.body.ubicacion.latitud,
                longitud: req.body.ubicacion.longitud
            },

            velocidad: req.body.velocidad,
            direccion: req.body.direccion,
            precisionGps: req.body.precisionGps
        });

        await nuevaUbicacion.save();

        res.status(201).json({
            mensaje: "Ubicación registrada",
            ubicacion: nuevaUbicacion
        });

    } catch (error) {

        res.status(500).json({
            mensaje: "Error al registrar ubicación",
            error: error.message
        });

    }

};