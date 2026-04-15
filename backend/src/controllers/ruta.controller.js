const Ruta = require('../models/Ruta');

/**
 * Crear una nueva ruta
 */
exports.crearRuta = async (req, res) => {
    try {
        const nuevaRuta = new Ruta(req.body);

        const rutaGuardada = await nuevaRuta.save();

        res.status(201).json({
            mensaje: 'Ruta creada correctamente',
            ruta: rutaGuardada
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al crear la ruta',
            error: error.message
        });
    }
};

/**
 * Obtener todas las rutas
 */
exports.obtenerRutas = async (req, res) => {
    try {
        const rutas = await Ruta.find();

        res.json(rutas);
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener las rutas',
            error: error.message
        });
    }
};

/**
 * Obtener una ruta por ID
 */
exports.obtenerRutaPorId = async (req, res) => {
    try {
        const ruta = await Ruta.findById(req.params.id);

        if (!ruta) {
            return res.status(404).json({
                mensaje: 'Ruta no encontrada'
            });
        }

        res.json(ruta);
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al buscar la ruta',
            error: error.message
        });
    }
};

/**
 * Actualizar una ruta
 */
exports.actualizarRuta = async (req, res) => {
    try {
        const rutaActualizada = await Ruta.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({
            mensaje: 'Ruta actualizada',
            ruta: rutaActualizada
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al actualizar la ruta',
            error: error.message
        });
    }
};

/**
 * Eliminar una ruta
 */
exports.eliminarRuta = async (req, res) => {
    try {
        await Ruta.findByIdAndDelete(req.params.id);

        res.json({
            mensaje: 'Ruta eliminada correctamente'
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al eliminar la ruta',
            error: error.message
        });
    }
};