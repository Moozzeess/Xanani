const Recorrido = require('../models/Recorrido');
const Conductor = require('../models/Conductor');
const Unidad = require('../models/Unidad');

/**
 * Intención: Inicia y registra un nuevo recorrido para un conductor y una unidad asignada.
 * Parámetros:
 *  - {Object} req - Body espera (conductorId, unidadId, rutaId).
 *  - {Object} res - Objeto Respuesta Express.
 * Retorno:
 *  - {Object} Estado 201 indicando el éxito del inicio y la copia del documento guardado.
 * Reglas de negocio:
 *  - Un conductor no puede tener dos viajes en estado "en_curso" simultáneamente.
 * Casos límite (edge cases):
 *  - Retorna HTTP 400 si falta un campo vital o si el backend encuentra otro viaje del usuario actualmente sin finalizar.
 */
exports.iniciarRecorrido = async (req, res) => {
  try {
    const { conductorId, unidadId, rutaId } = req.body;

    if (!conductorId || !unidadId || !rutaId) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios para iniciar el recorrido' });
    }

    // Verificar si ya tiene un recorrido en curso
    const recorridoActivo = await Recorrido.findOne({
      conductorId,
      estado: 'en_curso'
    });

    if (recorridoActivo) {
      return res.status(400).json({
        mensaje: 'Ya tienes un recorrido en curso',
        recorrido: recorridoActivo
      });
    }

    const nuevoRecorrido = new Recorrido({
      conductorId,
      unidadId,
      rutaId,
      estado: 'en_curso',
      horaInicio: Date.now()
    });

    await nuevoRecorrido.save();

    res.status(201).json({
      mensaje: 'Recorrido iniciado correctamente',
      recorrido: nuevoRecorrido
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al iniciar el recorrido',
      error: error.message
    });
  }
};

/**
 * Intención: Cierra un recorrido marcándolo como finalizado y guardando sus analíticas.
 * Parámetros:
 *  - {Object} req - Params: `id` del recorrido. Body: estadísticas del viaje (pasajeros, ganancias, km, etc.)
 *  - {Object} res - Objeto Respuesta Express.
 * Retorno:
 *  - {Object} Estado 200 y el documento final.
 * Reglas de negocio:
 *  - Los campos de métricas admiten cero o fallbacks a datos por defecto.
 * Casos límite (edge cases):
 *  - Retorna HTTP 400 si el recorrido ya figura como "finalizado", para impedir sobreescritura errónea.
 */
exports.finalizarRecorrido = async (req, res) => {
  try {
    const { id } = req.params;
    const { pasajerosTotales, ganancias, kmRecorridos, calificacion, observaciones } = req.body;

    const recorrido = await Recorrido.findById(id);

    if (!recorrido) {
      return res.status(404).json({ mensaje: 'Recorrido no encontrado' });
    }

    if (recorrido.estado === 'finalizado') {
      return res.status(400).json({ mensaje: 'Este recorrido ya ha sido finalizado' });
    }

    recorrido.estado = 'finalizado';
    recorrido.horaFin = Date.now();
    recorrido.pasajerosTotales = pasajerosTotales || 0;
    recorrido.ganancias = ganancias || 0;
    recorrido.kmRecorridos = kmRecorridos || 0;
    recorrido.calificacion = calificacion || 5.0;
    recorrido.observaciones = observaciones || '';

    await recorrido.save();

    res.status(200).json({
      mensaje: 'Recorrido finalizado y guardado en el historial',
      recorrido
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al finalizar el recorrido',
      error: error.message
    });
  }
};

/**
 * Intención: Obtiene todo el registro histórico de los recorridos completados por un perfil conductor.
 * Parámetros:
 *  - {Object} req - Parámetro de URL `userId` (Referencia al schema de Mongoose `Usuario`).
 *  - {Object} res - Express HTTP Response.
 * Retorno:
 *  - {Array} Lista descendente de recorridos.
 * Reglas de negocio:
 *  - Omite recorridos inconclusos (`en_curso`).
 *  - Populate embebe información legible de `rutaId` y `unidadId`.
 * Casos límite (edge cases):
 *  - Devuelve Error 404 si el usuario proveído no posee perfil de Conductor.
 */
exports.obtenerHistorialConductor = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar el perfil de conductor asociado al usuario
    const conductor = await Conductor.findOne({ user: userId });
    if (!conductor) {
      return res.status(404).json({ mensaje: 'No se encontró el perfil de conductor para este usuario' });
    }

    const historial = await Recorrido.find({
      conductorId: conductor._id,
      estado: 'finalizado'
    })
      .populate('rutaId', 'nombre')
      .populate('unidadId', 'placa')
      .sort({ horaInicio: -1 });

    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el historial del conductor',
      error: error.message
    });
  }
};/**
 * Intención: Devuelve la sesión o viaje activo actual para reanudar el estado visual del Conductor (persistencia).
 * Parámetros:
 *  - {Object} req - ID de Usuario mediante params `userId`.
 *  - {Object} res - Respuesta.
 * Retorno:
 *  - {Object|null} El documento `en_curso` asociado, o nulo.
 * Reglas de negocio:
 *  - Si el Frontend se recarga o cierra, utiliza este endpoint para recuperar el mapa en tiempo real.
 * Casos límite (edge cases):
 *  - Devuelve vacío si el viaje ya paró, no rompe, solo carga la sala de "espera" en front.
 */
exports.obtenerRecorridoActivo = async (req, res) => {
  try {
    const { userId } = req.params;

    const conductor = await Conductor.findOne({ user: userId });
    if (!conductor) {
      return res.status(404).json({ mensaje: 'No se encontró el perfil de conductor' });
    }

    const recorridoActivo = await Recorrido.findOne({
      conductorId: conductor._id,
      estado: 'en_curso'
    }).populate('rutaId');

    res.status(200).json(recorridoActivo);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener el recorrido activo',
      error: error.message
    });
  }
};

/**
 * Intención: Eliminar físicamente un recorrido de la base de datos.
 * Parámetros:
 *  - {Object} req - Objeto Request. Espera el id del recorrido en la URL (params).
 *  - {Object} res - Objeto Respuesta Express.
 * Retorno:
 *  - {Object} Estado 200 indicando éxito.
 * Reglas de negocio:
 *  - Se utiliza para descartar recorridos que hayan sido identificados como simulaciones o pruebas y no deben afectar las estadísticas reales ni persistir en el historial.
 * Casos límite (edge cases):
 *  - Si el id de recorrido no existe, devuelve Error 404.
 */
exports.cancelarRecorrido = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recorridoEliminado = await Recorrido.findByIdAndDelete(id);

    if (!recorridoEliminado) {
      return res.status(404).json({ mensaje: 'Recorrido no encontrado para cancelar' });
    }

    res.status(200).json({
      mensaje: 'Recorrido simulado cancelado y eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al cancelar el recorrido',
      error: error.message
    });
  }
};

/**
 * Intención: Obtiene el historial global de todos los recorridos para el administrador.
 * Soporta filtros por conductor, unidad y estado.
 */
exports.obtenerHistorialAdmin = async (req, res) => {
    try {
        const { conductorId, unidadId, estado, limit = 100 } = req.query;
        const filtro = {};

        if (conductorId) filtro.conductorId = conductorId;
        if (unidadId) filtro.unidadId = unidadId;
        if (estado) filtro.estado = estado;

        const historial = await Recorrido.find(filtro)
            .populate({
                path: 'conductorId',
                populate: { path: 'user', select: 'username email' }
            })
            .populate('unidadId', 'placa')
            .populate('rutaId', 'nombre')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ 
            mensaje: 'Error al obtener historial administrativo', 
            error: error.message 
        });
    }
};
