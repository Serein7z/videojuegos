require('dotenv').config();

const mongoose = require('mongoose');
const conectarDB = require('../config/db');
const Juego = require('../models/Juego');

// Agrega reseñas de EJEMPLO a algunos juegos para que la pestaña
// "Reseñas recientes" tenga contenido. Son datos ficticios.
// Ojo: primero borra las reseñas que ya existan, así que se puede correr varias veces.

const CANTIDAD_DE_JUEGOS = 70;

const usuarios = [
  'Carlos', 'Lucía', 'Diego', 'Valeria', 'Mateo', 'Camila',
  'Sebastián', 'Andrea', 'Joaquín', 'Fernanda', 'Renzo', 'Daniela'
];

const comentarios = {
  5: [
    'Una obra maestra, lo recomiendo muchísimo.',
    'De lo mejor que he jugado en años.',
    'Lo terminé en una semana y me quedé con ganas de más.'
  ],
  4: [
    'Muy bueno, solo le faltan algunos detalles por pulir.',
    'Me gustó bastante, vale la pena.',
    'Divertido y con una ambientación genial.'
  ],
  3: [
    'Cumple, pero se me hizo algo repetitivo.',
    'Está bien, aunque esperaba más.',
    'Tiene buenas ideas pero no me enganchó del todo.'
  ],
  2: [
    'No logró engancharme, la historia es floja.',
    'Los controles me parecieron incómodos.'
  ]
};

// Hay más 5 y 4 que 2 y 3, como pasa en la vida real
const puntuaciones = [5, 5, 5, 4, 4, 4, 3, 3, 2];

function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

// Una fecha al azar dentro de los últimos 20 días
function fechaReciente() {
  const veinteDias = 20 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - Math.random() * veinteDias);
}

function crearResena() {
  const puntuacion = elegir(puntuaciones);
  return {
    usuario: elegir(usuarios),
    puntuacion,
    comentario: elegir(comentarios[puntuacion]),
    fecha: fechaReciente()
  };
}

async function sembrar() {
  await conectarDB();

  await Juego.updateMany({}, { $set: { resenas: [] } });

  // $sample elige juegos al azar directamente en la base
  const elegidos = await Juego.aggregate([
    { $sample: { size: CANTIDAD_DE_JUEGOS } },
    { $project: { _id: 1 } }
  ]);

  let total = 0;
  for (const { _id } of elegidos) {
    const cuantas = 1 + Math.floor(Math.random() * 3); // 1 a 3 reseñas por juego
    const resenas = Array.from({ length: cuantas }, crearResena);

    await Juego.updateOne({ _id }, { $push: { resenas: { $each: resenas } } });
    total += cuantas;
  }

  console.log(`Se agregaron ${total} reseñas a ${elegidos.length} juegos`);
  await mongoose.disconnect();
}

sembrar().catch((error) => {
  console.error('Falló la siembra de reseñas:', error.message);
  process.exit(1);
});