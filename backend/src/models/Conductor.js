const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    numeroLicencia: {
      type: String,
      required: true,
      trim: true
    },

    unidadAsignadaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad',
      default: null
    },

    estaEnLinea: {
      type: Boolean,
      default: false
    },

    disponible: {
      type: Boolean,
      default: true
    },

    estado: {
      type: String,
      enum: ['activo', 'inactivo', 'suspendido'],
      default: 'activo'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conductor', conductorSchema);