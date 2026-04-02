const Conductor = require('../models/Conductor');

exports.createDriver = async (req, res) => {
    try {
        const conductor = await Conductor.create(req.body);
        res.status(201).json(conductor);
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al crear conductor',
            error: error.message
        });
    }
};