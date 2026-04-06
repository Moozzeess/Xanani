const Unidad = require('../models/Unidad');
const Ubicacion = require('../models/Ubicacion');
const Ruta = require('../models/Ruta');

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

        res.status(201).json({
            mensaje: 'Unidad creada',
            unidad: nuevaUnidad
        });

    } catch (error) {

        res.status(500).json({
            mensaje: 'Error al crear unidad',
            error: error.message
        });

    }

};

exports.obtenerUnidades = async (req, res) => {
    try {
        const unidades = await Unidad.find();
        res.json(unidades);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener unidades' });
    }
};

/**
 * Endpoint público (sin auth) para la Landing Page.
 * Devuelve la unidad activa más cercana a las coordenadas del usuario
 * junto con su última posición GPS registrada en la colección Ubicaciones.
 * Solo expone: placa, ocupacion, capacidadMaxima, rutaId y posicion.
 *
 * Query params: lat, lng (requeridos)
 */
exports.obtenerMasCercana = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ mensaje: 'Se requieren lat y lng' });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    // Obtener unidades activas
    const unidades = await Unidad.find({ estado: { $ne: 'inactiva' } }).lean();
    if (!unidades.length) return res.json(null);

    // Buscar la última posición de cada unidad en Ubicaciones
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

    // Ordenar por distancia y tomar la más cercana
    activas.sort((a, b) => {
      const dA = haversine(latNum, lngNum, a.posicion.latitud, a.posicion.longitud);
      const dB = haversine(latNum, lngNum, b.posicion.latitud, b.posicion.longitud);
      return dA - dB;
    });

    const cercana = activas[0];
    const distancia = Math.round(haversine(latNum, lngNum, cercana.posicion.latitud, cercana.posicion.longitud));

    // Devolver solo datos mínimos para el modo invitado
    res.json({
      placa: cercana.placa,
      estado: cercana.estado,
      ocupacionActual: cercana.ocupacionActual,
      capacidadMaxima: cercana.capacidadMaxima,
      rutaId: cercana.ruta || null,
      posicion: cercana.posicion,
      distanciaMetros: distancia
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar la unidad más cercana', error: error.message });
  }
};

/**
 * Endpoint público para obtener la ruta de demostración de la Landing.
 * Devuelve la primera ruta con historial de ubicaciones GPS (geometría reconstruida).
 * Usada cuando no hay unidades activas con posición real.
 */
exports.obtenerRutaDemo = async (req, res) => {
  try {
    // Buscar la ruta cuyo historial de ubicaciones tenga más registros
    const rutaConMasPuntos = await Ubicacion.aggregate([
      { $match: { rutaId: { $ne: null } } },
      { $group: { _id: '$rutaId', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);

    if (!rutaConMasPuntos.length) return res.json(null);

    const rutaId = rutaConMasPuntos[0]._id;

    // Obtener la ruta base
    const ruta = await Ruta.findById(rutaId).lean();

    // Obtener los puntos de la geometría (últimas 100 ubicaciones de esa ruta)
    const puntos = await Ubicacion.find({ rutaId })
      .sort({ fechaRegistro: 1 })
      .select('ubicacion')
      .limit(100)
      .lean();

    const geometria = puntos.map((p) => ({
      latitud: p.ubicacion.latitud,
      longitud: p.ubicacion.longitud
    }));

    res.json({ ruta, geometria });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ruta demo', error: error.message });
  }
};