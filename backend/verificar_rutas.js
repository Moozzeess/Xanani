const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function verificarRutas() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xanani';
    console.log('Conectando a:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    
    const RutaSchema = new mongoose.Schema({}, { strict: false });
    const Ruta = mongoose.model('Ruta', RutaSchema, 'rutas');
    
    const count = await Ruta.countDocuments();
    const countConGeo = await Ruta.countDocuments({ geometria: { $exists: true, $not: { $size: 0 } } });
    console.log(`Total rutas: ${count}`);
    console.log(`Rutas con geometria: ${countConGeo}`);
    
    if (countConGeo === 0) {
        console.log('ADVERTENCIA: Ninguna ruta tiene geometria.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verificarRutas();
