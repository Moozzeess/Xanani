const mongoose = require('mongoose');

/**
 * Modelo para las notificaciones del sistema.
 * Permite segmentar alertas por rol y realizar un seguimiento de lectura por usuario.
 */
const notificacionSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    mensaje: {
      type: String,
      required: true
    },
    tipo: {
      type: String,
      enum: ['INFO', 'ADVERTENCIA', 'RUTA_NUEVA', 'SISTEMA'],
      default: 'INFO'
    },
    rolDestino: {
      type: String,
      enum: ['CONDUCTOR', 'PASAJERO', 'TODOS'],
      default: 'TODOS'
    },
    usuarioDestino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null
    },
    // Datos adicionales opcionales (ej. ID de la ruta para "Ver ruta")
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Lista de usuarios que han marcado la notificación como leída
    leidaPor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notificacion', notificacionSchema);
