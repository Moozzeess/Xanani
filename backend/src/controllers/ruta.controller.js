const Ruta = require('../models/Ruta');
const notificacionController = require('./notificacion.controller');

/**
 * Intención: Crea una nueva ruta geométrica de transporte y la almacena.
 * Parámetros:
 *  - {Object} req - Body (nombre de ruta, coordenadas/geometría).
 *  - {Object} res - Respuesta de Express.
 * Retorno:
 *  - {Object} Confirma la alta en la flotilla (HTTP 201).
 * Reglas de negocio:
 *  - Su estructura será el molde por donde se guían las Paradas.
 *  - Dispara una notificación global de RUTA_NUEVA.
 * Casos límite (edge cases):
 *  - Reporta HTTP 500 en fallas de parseo geográfico en Mongoose.
 */
exports.crearRuta = async (req, res) => {
    try {
        const nuevaRuta = new Ruta(req.body);

        const rutaGuardada = await nuevaRuta.save();

        // Disparar notificación de nueva ruta
        await notificacionController.crearNotificacionInterna({
            titulo: '¡Nueva Ruta Disponible!',
            mensaje: `Se ha habilitado la ruta "${rutaGuardada.nombre}". Suscríbete para recibir actualizaciones.`,
            tipo: 'RUTA_NUEVA',
            rolDestino: 'PASAJERO',
            data: { rutaId: rutaGuardada._id }
        });

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
 * Intención: Cargar todas las rutas existentes en el sistema para la super-administración.
 * Parámetros:
 *  - {Object} req - Petición vacía.
 *  - {Object} res - Objeto de respuesta.
 * Retorno:
 *  - {Array} Un arreglo de objetos Ruta.
 * Reglas de negocio:
 *  - Listado público (protegido por middleware global) apto para combos selectores.
 * Casos límite (edge cases):
 *  - Devuelve `[]` si no existen documentos.
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
 * Intención: Lee un documento específico de la ruta en la base de datos a base de UUID/MongoID.
 * Parámetros:
 *  - {Object} req - Parámetro `id`.
 *  - {Object} res - Objeto Respuesta.
 * Retorno:
 *  - {Object} El detalle completo de la ruta solicitada.
 * Reglas de negocio:
 *  - Extraer información de trazado para ser renderizada en Leaflet.
 * Casos límite (edge cases):
 *  - Arroja HTTP 404 explícito si es que fue borrada o no se encontró el `id`.
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
 * Intención: Actualiza los detalles, nombre o trazado geográfico de la ruta en caliente.
 * Parámetros:
 *  - {Object} req - Params `id` y Body con atributos actualizables.
 *  - {Object} res - Objeto Respuesta.
 * Retorno:
 *  - {Object} Confirmación de actualización.
 * Reglas de negocio:
 *  - Utiliza `findByIdAndUpdate` con opción `new: true` para pre-visualizar cómo queda.
 * Casos límite (edge cases):
 *  - Dispara 500 si la estructura geométrica cargada choca con validadores.
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
 * Intención: Deshabilita o elimina contundentemente un trazo obsoleto del sistema.
 * Parámetros:
 *  - {Object} req - Params: `id`.
 *  - {Object} res - Objeto de respuesta.
 * Retorno:
 *  - {Object} Respuesta vacía con confirmación general.
 * Reglas de negocio:
 *  - OJO: Destrucción permanente, puede des-referenciar Paradas asociadas.
 * Casos límite (edge cases):
 *  - Retorna HTTP 500 ante errores de restricción de base de datos.
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