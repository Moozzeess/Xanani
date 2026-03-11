const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },

    ruta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta'
    },

    unidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad'
    },

    tipo: {
      type: String,
      required: true,
      enum: [
        'UNIDAD_LLENA',
        'NO_PASO',
        'CONDUCCION_PELIGROSA',
        'RETRASO',
        'OTRO'
      ]
    },

    descripcion: {
      type: String,
      trim: true
    },

    estado: {
      type: String,
      enum: ['PENDIENTE', 'REVISADO', 'RESUELTO'],
      default: 'PENDIENTE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reporte', reporteSchema);