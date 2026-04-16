const mongoose = require('mongoose');

/**
 * Modelo de Incidencia
 * Intención: Almacenar los reportes reportados por conductores (SOS, Mecánica, etc).
 * Reglas de negocio:
 * - Contiene un índice TTL de 30 días (2592000 segundos) para que la BD los elimine automáticamente.
 */
const incidenciaSchema = new mongoose.Schema(
  {
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    unidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unidad'
    },
    tipo: {
      type: String,
      required: true,
      enum: [
        'SOS',
        'FALLA_MECANICA',
        'TRAFICO',
        'ACCIDENTE',
        'OTRO'
      ]
    },
    descripcion: {
      type: String,
      trim: true
    },
    estado: {
      type: String,
      enum: ['ACTIVO', 'ATENDIDO', 'FALSO_POSITIVO'],
      default: 'ACTIVO'
    },
    ubicacion: {
      latitud: Number,
      longitud: Number
    }
  },
  { timestamps: true }
);

// Índice TTL: MongoDB eliminará el documento automáticamente 30 días (2592000 s) después de su 'createdAt'
incidenciaSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Incidencia', incidenciaSchema);
