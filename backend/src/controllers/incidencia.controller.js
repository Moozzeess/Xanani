const Incidencia = require('../models/Incidencia');
const Conductor = require('../models/Conductor');
const Unidad = require('../models/Unidad');

/**
 * Obtiene la lista de incidencias para el administrador.
 * Intención: Carga histórica de reportes de conductores.
 */
exports.obtenerIncidentesAdmin = async (req, res) => {
  try {
    const incidencias = await Incidencia.find()
      .populate('conductor', 'nombre apellido username email')
      .populate('unidad', 'placa numeroEconomico')
      .sort({ createdAt: -1 });

    res.json(incidencias);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener incidencias',
      error: error.message
    });
  }
};

/**
 * Gestiona el estado de una incidencia (Atendido, Falso Positivo, etc).
 */
exports.gestionarEstadoIncidente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const incidencia = await Incidencia.findByIdAndUpdate(
      id,
      { estado },
      { new: true }
    );

    if (!incidencia) {
      return res.status(404).json({ mensaje: 'Incidencia no encontrada' });
    }

    res.json({
      mensaje: 'Estado de incidencia actualizado',
      incidencia
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar incidencia',
      error: error.message
    });
  }
};

/**
 * Crea un SOS (Acción directa desde API si socket falla)
 */
exports.crearSOS = async (req, res) => {
  try {
    const { conductorId, unidadId, ubicacion, descripcion } = req.body;

    const nuevaIncidencia = new Incidencia({
      conductor: conductorId,
      unidad: unidadId,
      tipo: 'SOS',
      descripcion: descripcion || 'SOS activado vía API',
      ubicacion,
      estado: 'ACTIVO'
    });

    await nuevaIncidencia.save();
    res.status(201).json(nuevaIncidencia);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear SOS', error: error.message });
  }
};

/**
 * Crea incidencia general desde el conductor
 */
exports.crearIncidenteConductor = async (req, res) => {
  try {
    const { conductorId, unidadId, tipo, descripcion, ubicacion } = req.body;

    const nuevaIncidencia = new Incidencia({
      conductor: conductorId,
      unidad: unidadId,
      tipo,
      descripcion,
      ubicacion,
      estado: 'ACTIVO'
    });

    await nuevaIncidencia.save();
    res.status(201).json(nuevaIncidencia);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reportar incidente', error: error.message });
  }
};

/**
 * Crea un aviso/notificación global para conductores.
 */
exports.crearAvisoConductores = async (req, res) => {
  try {
    const { titulo, mensaje, nivel } = req.body;
    // Lógica mínima para evitar error de referencia
    res.status(201).json({ mensaje: 'Aviso creado (Simulado)', data: { titulo, mensaje, nivel } });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear aviso', error: error.message });
  }
};

/**
 * Obtiene avisos vigentes para el tablero del conductor.
 */
exports.obtenerAvisosVigentes = async (req, res) => {
  try {
    res.json([]); // Por ahora devolvemos lista vacía
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener avisos', error: error.message });
  }
};
