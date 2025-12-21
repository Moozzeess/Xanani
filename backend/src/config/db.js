const mongoose = require('mongoose');

module.exports = async (uri) => {
  await mongoose.connect(uri);
  console.log('Base de datos conectada correctamente.');
};
