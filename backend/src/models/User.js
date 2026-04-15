const mongoose = require('mongoose');

/**
 * Roles del sistema.
 * Nota: Se usan valores normalizados (sin acentos) para evitar errores.
 */
const ROLES_USUARIO = Object.freeze({
  SUPERUSUARIO: 'SUPERUSUARIO',
  ADMINISTRADOR: 'ADMINISTRADOR',
  CONDUCTOR: 'CONDUCTOR',
  PASAJERO: 'PASAJERO'
});

const usuarioSchema = new mongoose.Schema(
  {
    nombreUsuario: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    correoElectronico: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    hashContrasena: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: Object.values(ROLES_USUARIO),
      default: ROLES_USUARIO.PASAJERO,
      required: true
    },
    estaActivo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = {
  Usuario: mongoose.model('Usuario', usuarioSchema),
  ROLES_USUARIO
};
