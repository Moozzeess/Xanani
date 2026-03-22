const mongoose = require('mongoose');

const rutaSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true
        },

        paradas: [
            {
                type: String
            }
        ],

        configuracionDespacho: {
            modo: {
                type: String,
                enum: ['intervalo', 'capacidad', 'mixto', 'horario'],
                default: 'intervalo'
            },

            intervaloMinutos: {
                type: Number,
                default: null
            },

            requiereVehiculoLleno: {
                type: Boolean,
                default: false
            },

            capacidadMaxima: {
                type: Number,
                default: 15
            },

            horario: [
                {
                    type: String
                }
            ]
        },

        creadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ruta', rutaSchema);