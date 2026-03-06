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
      enum: ['activo', 'inactivo', 'mantenimiento'],
      default: 'activo'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Unidad', unidadSchema);
