const mongoose = require('mongoose');

/**
 * Modelo exclusivo para Administradores de Flotilla.
 * Intención: Almacenar información específica del rol administrativo, 
 * principalmente la flotilla a la que pertenecen para segregación de datos.
 */
const administradorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true
    },
    flotilla: {
      type: String,
      required: true,
      trim: true,
      index: true // Indexado para búsquedas rápidas de filtrado
    },
    descripcion: {
      type: String,
      trim: true,
      default: ''
    },
    // Posibilidad de expandir con permisos granulares en el futuro
    permisos: {
      type: [String],
      default: ['BASICO']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Administrador', administradorSchema);
