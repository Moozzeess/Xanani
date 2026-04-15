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
    }
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  USER_ROLES
};
