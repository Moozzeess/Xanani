const mongoose = require('mongoose');

const recorridoSchema = new mongoose.Schema(
  {
    conductorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conductor',
      required: true
    },

    unidadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad',
      required: true
    },

    rutaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      required: true
    },

    estado: {
      type: String,
      enum: ['programado', 'en_curso', 'finalizado', 'cancelado'],
      default: 'en_curso'
    },

    horaInicio: {
      type: Date,
      default: Date.now
    },

    horaFin: {
      type: Date,
      default: null
    },

    observaciones: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recorrido', recorridoSchema);