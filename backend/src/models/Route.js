const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  origin: String,
  destination: String,
  stops: [
    {
      name: String,
      lat: Number,
      lng: Number
    }
  ]
});

module.exports = mongoose.model('Route', routeSchema);