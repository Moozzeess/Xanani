const mongoose = require('mongoose');

const ubicacionSchema = new mongoose.Schema(
  {
    conductorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conductor',
      required: true
    },
    ubicacion: {
      latitud: Number,
      longitud: Number
    },
    velocidad: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ubicacion', ubicacionSchema);
