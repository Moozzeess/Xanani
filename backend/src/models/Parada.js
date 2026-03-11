const mongoose = require('mongoose');

const paradaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    ruta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      required: true
    },

    latitud: {
      type: Number,
      required: true
    },

    longitud: {
      type: Number,
      required: true
    },

    orden: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Parada', paradaSchema);