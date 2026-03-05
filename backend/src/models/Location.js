const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  speed: Number
},
{ timestamps: true });

module.exports = mongoose.model('Location', locationSchema);