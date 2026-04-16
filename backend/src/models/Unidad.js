const mongoose = require('mongoose');

const unidadSchema = new mongoose.Schema(
    {
        placa: {
            type: String,
            required: true,
            unique: true
        },

        conductor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario'
        },

        ruta: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ruta'
        },

        capacidad: {
            type: Number,
            default: 15
        },

        estado: {
            type: String,
            enum: ['activa', 'inactiva', 'llena', 'en_ruta', 'base'],
            default: 'activa'
        },

        capacidadMaxima: {
            type: Number,
            default: 15
        },

        ocupacionActual: {
            type: Number,
            default: 0
        },


        activa: {
            type: Boolean,
            default: true
        },
        dispositivoHardware: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DispositivoHardware'
        }



    },
    { timestamps: true }
);

module.exports = mongoose.model('Unidad', unidadSchema);