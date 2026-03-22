const mongoose = require('mongoose');

const ubicacionSchema = new mongoose.Schema(
    {
        unidadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unidad',
            required: true,
            index: true
        },

        conductorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conductor',
            default: null
        },

        rutaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ruta',
            default: null
        },

        recorridoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recorrido',
            default: null
        },

        ubicacion: {
            latitud: {
                type: Number,
                required: true
            },
            longitud: {
                type: Number,
                required: true
            }
        },

        velocidad: {
            type: Number,
            default: 0
        },

        direccion: {
            type: Number,
            default: null
        },

        precisionGps: {
            type: Number,
            default: null
        },

        fechaRegistro: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ubicacion', ubicacionSchema);