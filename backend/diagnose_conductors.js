const mongoose = require('mongoose');
require('dotenv').config();

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a DB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('conductors');
    
    // 1. Ver Índices
    const indexes = await collection.indexes();
    console.log('ÍNDICES ACTUALES EN conductors:', JSON.stringify(indexes, null, 2));
    
    // 2. Ver Documentos (breve)
    const docs = await collection.find({}).limit(5).toArray();
    console.log('PRIMEROS 5 DOCUMENTOS:', JSON.stringify(docs, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

diagnose();
