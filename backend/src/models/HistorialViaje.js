const mongoose = require('mongoose');

/**
 * Modelo de Historial de Viajes para el Pasajero.
 * Registra los viajes reales que realiza un pasajero en una unidad.
 */
const historialViajeSchema = new mongoose.Schema(
  {
    pasajero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    unidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad',
      required: true
    },
    ruta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      required: true
    },
    origen: {
      latitud: Number,
      longitud: Number,
      nombreParada: String
    },
    destino: {
      latitud: Number,
      longitud: Number,
      nombreParada: String
    },
    horaInicio: {
      type: Date,
      default: Date.now
    },
    horaFin: {
      type: Date
    },
    calificacion: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comentario: {
      type: String,
      trim: true
    },
    esSimulacion: {
      type: Boolean,
      default: false // Solo guardaremos reales por defecto, pero el campo permite flexibilidad
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HistorialViaje', historialViajeSchema);
