const mongoose = require('mongoose');

const ConductorSchema = new mongoose.Schema(
{
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  numeroLicencia: {
    type: String,
    required: true
  },
  placaVehiculo: {
    type: String,
    required: true
  },
  modeloVehiculo: {
    type: String
  },
  estaEnLinea: {
    type: Boolean,
    default: false
  }
},
{ timestamps: true }
);

module.exports = mongoose.model('Conductor', ConductorSchema);