const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a DB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('conductors');
    
    console.log('Eliminando índices antiguos...');
    
    try {
      await collection.dropIndex('usuarioId_1');
      console.log('✓ Índice usuarioId_1 eliminado con éxito.');
    } catch (e) {
      console.log('! El índice usuarioId_1 no existía o ya fue eliminado.');
    }
    
    try {
      await collection.dropIndex('userId_1');
      console.log('✓ Índice userId_1 eliminado con éxito.');
    } catch (e) {
      console.log('! El índice userId_1 no existía o ya fue eliminado.');
    }
    
    console.log('Limpieza completada.');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error crítico durante la limpieza:', err);
  }
}

cleanup();
