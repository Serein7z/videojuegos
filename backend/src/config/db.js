const mongoose = require('mongoose');

// Se conecta a MongoDB Atlas usando la URI que está en el archivo .env
async function conectarDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Falta MONGODB_URI en el archivo .env');
  }

  await mongoose.connect(uri);
  console.log('Conectado a MongoDB Atlas');
}

module.exports = conectarDB;
