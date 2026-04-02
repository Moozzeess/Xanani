const mongoose = require('mongoose');

const rutaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true
    },

    paradas: [
      {
        nombre: { type: String, required: true },
        latitud: { type: Number, required: true },
        longitud: { type: Number, required: true }
      }
    ],

    geometria: [
      {
        latitud: { type: Number, required: true },
        longitud: { type: Number, required: true }
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
      ref: 'Usuario'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ruta', rutaSchema);
