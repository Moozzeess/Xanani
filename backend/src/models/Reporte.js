const mongoose = require('mongoose');

/**
 * Esquema de reportes enviados por pasajeros.
 * Cubre crowdsourcing de ocupación, incidencias y calificaciones de experiencia.
 */
const reporteSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },

    unidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad',
      default: null
    },

    ruta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      default: null
    },

    tipo: {
      type: String,
      required: true,
      enum: [
        'UNIDAD_LLENA',
        'HAY_LUGARES',
        'NO_PASO',
        'CONFIRMAR_PASO',
        'CONDUCCION_PELIGROSA',
        'RETRASO',
        'EXPERIENCIA',
        'ANUNCIO',
        'OTRO'
      ]
    },

    /** Para reportes tipo ANUNCIO: CONDUCTORES, PASAJEROS, TODOS */
    destinatario: {
      type: String,
      enum: ['CONDUCTORES', 'PASAJEROS', 'TODOS'],
      default: null
    },

    descripcion: {
      type: String,
      trim: true,
      default: null
    },

    /** Calificación de 1 a 5 para reportes tipo EXPERIENCIA */
    calificacion: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },

    /** Indica si el pasajero encontró asiento (para reportes EXPERIENCIA) */
    encontroAsiento: {
      type: Boolean,
      default: null
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
