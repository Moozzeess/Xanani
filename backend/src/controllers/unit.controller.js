const Unidad = require('../models/Unidad');
const Conductor = require('../models/Conductor');

exports.createUnit = async (req, res) => {
  try {
    const nuevaUnidad = new Unidad(req.body);
    await nuevaUnidad.save();

    // Sincronización bidireccional si hay conductor
    if (nuevaUnidad.conductor) {
       await Conductor.findOneAndUpdate(
         { user: nuevaUnidad.conductor },
         { unidad: nuevaUnidad.placa },
         { upsert: true }
       );
    }

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

exports.getUnits = async (req, res) => {

  try {

    const unidades = await Unidad.find().populate('dispositivoHardware');

    res.json(unidades);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener unidades'
    });
  }
};

exports.assignHardware = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardwareId } = req.body;

    const unidad = await Unidad.findById(id);
    if (!unidad) {
      return res.status(404).json({ mensaje: 'Unidad no encontrada' });
    }

    unidad.dispositivoHardware = hardwareId || null;
    await unidad.save();

    res.status(200).json({
      mensaje: 'Hardware asignado a la unidad exitosamente',
      unidad
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al asignar hardware a la unidad',
      error: error.message
    });
  }
};

exports.getUnitByDriver = async (req, res) => {
  try {
    const driverId = req.user?.id || req.headers['driver-id'];
    if (!driverId) return res.status(401).json({ mensaje: 'No autorizado' });

    // Buscar el perfil de Conductor para obtener la ruta y poblarla
    const perfilConductor = await Conductor.findOne({ user: driverId }).populate('rutaAsignadaId');
    if (!perfilConductor) return res.status(404).json({ mensaje: 'No tienes perfil de conductor asignado' });

    const unidadReal = await Unidad.findOne({ conductor: driverId }).populate('dispositivoHardware');
    
    let rutaInfo = 'Sin ruta asignada';
    let routeLine = null;
    let paradas = [];
    
    if (perfilConductor.rutaAsignadaId) {
      rutaInfo = perfilConductor.rutaAsignadaId.nombre;
      routeLine = perfilConductor.rutaAsignadaId.geometria;
      paradas = perfilConductor.rutaAsignadaId.paradas;
    } else if (perfilConductor.ruta) {
      rutaInfo = perfilConductor.ruta;
    }

    const unidad = unidadReal || { placa: perfilConductor.unidad || 'Por asignar' };

    res.json({ 
      unidad, 
      ruta: rutaInfo, 
      capacidad: unidadReal ? unidadReal.capacidad : 15,
      routeLine,
      paradas
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tu unidad', error: error.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { placa, capacidad, conductor, dispositivoHardware } = req.body;

    const unidad = await Unidad.findById(id);
    if (!unidad) return res.status(404).json({ mensaje: 'Unidad no encontrada' });

    // Sincronización cuando se remueve o se cambia el conductor
    if (conductor !== undefined) {
       if (unidad.conductor && unidad.conductor.toString() !== conductor) {
          await Conductor.findOneAndUpdate({ user: unidad.conductor }, { unidad: 'Por asignar' });
       }
       unidad.conductor = conductor || null;
    }

    if (placa !== undefined) unidad.placa = placa;
    if (capacidad !== undefined) unidad.capacidad = capacidad;
    if (dispositivoHardware !== undefined) unidad.dispositivoHardware = dispositivoHardware || null;

    await unidad.save();

    // Sincronización del nuevo conductor
    if (unidad.conductor) {
       await Conductor.findOneAndUpdate(
         { user: unidad.conductor },
         { unidad: unidad.placa },
         { upsert: true }
       );
    }

    res.status(200).json({
      mensaje: 'Unidad actualizada',
      unidad
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar unidad', error: error.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unidad = await Unidad.findByIdAndDelete(id);

    if (!unidad) return res.status(404).json({ mensaje: 'Unidad no encontrada' });

    // Limpiar el subdocumento del conductor
    if (unidad.conductor) {
       await Conductor.findOneAndUpdate({ user: unidad.conductor }, { unidad: 'Por asignar' });
    }

    res.status(200).json({ mensaje: 'Unidad eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar unidad', error: error.message });
  }
};