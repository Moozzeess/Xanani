const Unidad = require('../models/Unidad');
const Ubicacion = require('../models/Ubicacion');
const Ruta = require('../models/Ruta');
const Conductor = require('../models/Conductor');
const DispositivoHardware = require('../models/DispositivoHardware');
const { Usuario } = require('../models/Usuario');

/** Calcula la distancia en metros entre dos coordenadas (Haversine). */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.crearUnidad = async (req, res) => {
  try {
    const nuevaUnidad = new Unidad(req.body);
    await nuevaUnidad.save();

    if (nuevaUnidad.conductor) {
       await Conductor.findOneAndUpdate(
         { user: nuevaUnidad.conductor },
         { unidad: nuevaUnidad.placa },
         { upsert: true }
       );
    }

    res.status(201).json({ mensaje: 'Unidad creada', unidad: nuevaUnidad });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear unidad', error: error.message });
  }
};

exports.obtenerUnidades = async (req, res) => {
    try {
        const unidades = await Unidad.find()
            .populate('conductor', 'username email')
            .populate('dispositivoHardware')
            .lean();
        res.json(unidades);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener unidades' });
    }
};

exports.obtenerMasCercana = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ mensaje: 'Se requieren lat y lng' });

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const unidades = await Unidad.find({ estado: { $ne: 'inactiva' } }).lean();
    if (!unidades.length) return res.json(null);

    const conPosicion = await Promise.all(
      unidades.map(async (u) => {
        const ultimaUbicacion = await Ubicacion.findOne({ unidadId: u._id })
          .sort({ fechaRegistro: -1 })
          .select('ubicacion velocidad')
          .lean();
        if (!ultimaUbicacion) return null;
        return { ...u, posicion: ultimaUbicacion.ubicacion, velocidad: ultimaUbicacion.velocidad };
      })
    );

    const activas = conPosicion.filter(Boolean);
    if (!activas.length) return res.json(null);

    activas.sort((a, b) => {
      const dA = haversine(latNum, lngNum, a.posicion.latitud, a.posicion.longitud);
      const dB = haversine(latNum, lngNum, b.posicion.latitud, b.posicion.longitud);
      return dA - dB;
    });

    const cercana = activas[0];
    res.json({
      placa: cercana.placa,
      estado: cercana.estado,
      ocupacionActual: cercana.ocupacionActual,
      capacidadMaxima: cercana.capacidadMaxima,
      rutaId: cercana.ruta || null,
      posicion: cercana.posicion,
      distanciaMetros: Math.round(haversine(latNum, lngNum, cercana.posicion.latitud, cercana.posicion.longitud))
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar unidad cercana', error: error.message });
  }
};

exports.obtenerRutaDemo = async (req, res) => {
  try {
    const rutaConMasPuntos = await Ubicacion.aggregate([
      { $match: { rutaId: { $ne: null } } },
      { $group: { _id: '$rutaId', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);
    if (!rutaConMasPuntos.length) return res.json(null);

    const rutaId = rutaConMasPuntos[0]._id;
    const ruta = await Ruta.findById(rutaId).lean();
    const puntos = await Ubicacion.find({ rutaId }).sort({ fechaRegistro: 1 }).select('ubicacion').limit(100).lean();

    res.json({ 
        ruta, 
        geometria: puntos.map(p => ({ latitud: p.ubicacion.latitud, longitud: p.ubicacion.longitud })) 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ruta demo', error: error.message });
  }
};

exports.obtenerUnidadPorConductor = async (req, res) => {
  try {
    const userId = req.auth?.userId; // Corregido a req.auth.userId
    if (!userId) return res.status(401).json({ mensaje: 'No autenticado' });

    const unidad = await Unidad.findOne({ conductor: userId })
      .populate('ruta')
      .populate('dispositivoHardware')
      .lean();

    if (!unidad) return res.status(404).json({ mensaje: 'No tienes una unidad asignada' });
    res.json(unidad);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener unidad del conductor', error: error.message });
  }
};

exports.asignarHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardwareId } = req.body;
    const unidad = await Unidad.findByIdAndUpdate(id, { dispositivoHardware: hardwareId }, { new: true }).populate('dispositivoHardware');
    res.json({ mensaje: 'Hardware asignado con éxito', unidad });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al asignar hardware', error: error.message });
  }
};

exports.actualizarUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const unidad = await Unidad.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ mensaje: 'Unidad actualizada', unidad });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar unidad', error: error.message });
  }
};

exports.eliminarUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    await Unidad.findByIdAndDelete(id);
    res.json({ mensaje: 'Unidad eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar unidad', error: error.message });
  }
};
