const mongoose = require('mongoose');

/**
 * Roles del sistema.
 * Nota: Se usan valores normalizados (sin acentos) para evitar errores.
 */
const USER_ROLES = Object.freeze({
  SUPERUSUARIO: 'SUPERUSUARIO',
  ADMINISTRADOR: 'ADMINISTRADOR',
  CONDUCTOR: 'CONDUCTOR',
  PASAJERO: 'PASAJERO'
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.PASAJERO,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Nuevos campos para validación y recuperación de contraseñas
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    // Campos opcionales para perfil del pasajero (Fines estadísticos)
    foto: {
      type: String, // Base64 o URL (por ahora no se implementa subida)
      default: null
    },
    fechaNacimiento: {
      type: Date,
      default: null
    },
    genero: {
      type: String,
      enum: ['Hombre', 'Mujer', 'Otro', 'Prefiero no decirlo', null],
      default: null
    },
    nacionalidad: {
      type: String,
      default: null
    },
    rutasFavoritas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ruta'
      }
    ]
  },
  { timestamps: true }
);

module.exports = {
  Usuario: mongoose.model('Usuario', userSchema),
  USER_ROLES
};
