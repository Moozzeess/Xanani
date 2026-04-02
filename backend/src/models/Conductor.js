const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    telefono: {
      type: String,
      required: true,
      trim: true
    },

    unidadAsignadaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad',
      default: null
    },
    unidad: {
      type: String,
      trim: true,
      default: 'Por asignar'
    },
    rutaAsignadaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      default: null
    },
    ruta: {
      type: String,
      trim: true,
      default: 'Sin ruta'
    },
    licencia: {
      type: String,
      trim: true,
      default: ''
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