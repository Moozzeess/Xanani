const Parada = require('../models/Parada');

/**
 * Intención: Registra una nueva parada o terminal asiganda a una ruta existente.
 * Parámetros:
 *  - {Object} req - Contiene body con valores de Parada (nombre, latitud, longitud, ruta, etc).
 *  - {Object} res - Objeto Respuesta HTTP.
 * Retorno:
 *  - {Object} JSON reportando creación exitosa (HTTP 201) y la entidad creada.
 * Reglas de negocio:
 *  - Una parada es la unidad granular por donde viajará la unidad vinculada a una Ruta superior.
 * Casos límite (edge cases):
 *  - Errores de validación de modelo o fallos en BD retornan 500 informando al cliente.
 */
exports.crearParada = async (req, res) => {
    try {
        const nuevaParada = new Parada(req.body);

        const paradaGuardada = await nuevaParada.save();

        res.status(201).json({
            mensaje: 'Parada creada correctamente',
            parada: paradaGuardada
        });

    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al crear la parada',
            error: error.message
        });
    }
};


/**
 * Intención: Extraer el catálogo global de todas las paradas en el sistema.
 * Parámetros:
 *  - {Object} req - Petición HTTP vacía de argumentos requeridos.
 *  - {Object} res - Respuesta HTTP.
 * Retorno:
 *  - {Array} Lista de paradas estructuradas en un JSON array.
 * Reglas de negocio:
 *  - Aplica población (`populate`) automática del Id de su `ruta` respectiva referenciando a la instancia de Ruta.
 * Casos límite (edge cases):
 *  - Un fallo de conexión en DB arroja el error puro en JSON con código 500.
 */
exports.obtenerParadas = async (req, res) => {
    try {

        const paradas = await Parada.find().populate('ruta');

        res.json(paradas);

    } catch (error) {

        res.status(500).json({
            mensaje: 'Error al obtener las paradas',
            error: error.message
        });

    }
};


/**
 * Intención: Filtra paradas para conformar el esqueleto y trazo de una ruta específica.
 * Parámetros:
 *  - {Object} req - Su parámetro `rutaId` indica el ObjectId a filtrar.
 *  - {Object} res - Respuesta asíncrona HTTP.
 * Retorno:
 *  - {Array} Lista de paradas localizadas con orden jerárquico.
 * Reglas de negocio:
 *  - Siempre devuelve el listado asegurando ordenamiento ascendente (`orden: 1`) para fines de diseño de UI y simuladores en Frontend.
 * Casos límite (edge cases):
 *  - Lanza error 500 generalizado si la sintaxis del MongoID no funciona o hay error de driver.
 */
exports.obtenerParadasPorRuta = async (req, res) => {

    try {

        const paradas = await Parada.find({
            ruta: req.params.rutaId
        }).sort({ orden: 1 });

        res.json(paradas);

    } catch (error) {

        res.status(500).json({
            mensaje: 'Error al obtener las paradas de la ruta',
            error: error.message
        });

    }

};