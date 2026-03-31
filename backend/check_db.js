require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const { Usuario } = require('./src/models/Usuario');
  const Conductor = require('./src/models/Conductor');
  
  const usuarios = await Usuario.find({}, 'nombreUsuario rol').lean();
  console.log("Usuarios en BD:\n", JSON.stringify(usuarios, null, 2));
  
  const conductores = await Conductor.find({}, 'usuarioId numeroLicencia').lean();
  console.log("\nConductores en BD:\n", JSON.stringify(conductores, null, 2));
  
  process.exit(0);
}
check().catch(console.error);
