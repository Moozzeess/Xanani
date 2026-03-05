const Location = require('../models/Location');

async function updateLocation(req,res){
  const { driverId, lat, lng } = req.body;

  const location = await Location.create({
    driverId,
    location:{
      lat,
      lng
    }
  });

  res.json(location);
}

module.exports = { updateLocation };