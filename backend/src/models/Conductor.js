const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true
    },
    telefono: {
      type: String,
      trim: true,
      default: ''
    },
    licencia: {
      type: String,
      trim: true,
      default: ''
    },
    unidad: {
      type: String,
      trim: true,
      default: ''
    },
    fechaNacimiento: {
      type: Date,
      default: null
    },
    ruta: {
      type: String,
      default: ''
    },
    rutaAsignadaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conductor', conductorSchema);
