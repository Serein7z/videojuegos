require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const conectarDB = require('../config/db');
const Juego = require('../models/Juego');

// Lee data/juegos.json y lo carga en la colección "juegos" de Atlas.
// Ojo: borra lo que hubiera antes, así que se puede correr las veces que quieras.
async function importar() {
  const ruta = path.join(__dirname, '../../data/juegos.json');
  const juegos = JSON.parse(fs.readFileSync(ruta, 'utf-8'));

  await conectarDB();
  await Juego.deleteMany({});
  const insertados = await Juego.insertMany(juegos);

  console.log(`Se importaron ${insertados.length} juegos`);
  await mongoose.disconnect();
}

importar().catch((error) => {
  console.error('Falló la importación:', error.message);
  process.exit(1);
});
