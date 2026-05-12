const mongoose = require('mongoose');
require('dotenv').config();

const checkUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Colecciones:', collections.map(c => c.name));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments({ email: email.toLowerCase() });
      if (count > 0) {
        console.log(`¡Encontrado! ${count} documento(s) con el email ${email} en la colección [${collection.name}]`);
        const docs = await mongoose.connection.db.collection(collection.name).find({ email: email.toLowerCase() }).toArray();
        console.log('Documentos:', JSON.stringify(docs, null, 2));
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

const emailToCheck = process.argv[2];
if (!emailToCheck) {
  console.log('Uso: node check_user.js <email>');
  process.exit(1);
}

checkUser(emailToCheck);
