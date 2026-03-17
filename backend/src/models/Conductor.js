const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    edad: {
      type: Number,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = {
  Conductor: mongoose.model('Conductor', conductorSchema),
};
