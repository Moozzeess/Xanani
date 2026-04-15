const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./src/models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a DB');
    
    const users = await User.find({}, 'username email role');
    console.log('Usuarios encontrados:', JSON.stringify(users, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
