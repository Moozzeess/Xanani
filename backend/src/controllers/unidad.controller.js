const Unidad = require('../models/Unidad');

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

        res.status(500).json({
            mensaje: 'Error al obtener unidades'
        });

    }

};