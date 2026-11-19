const mongoose = require('mongoose');

// Las reseñas van DENTRO del documento del juego (documento embebido).
// En una base relacional esto sería otra tabla con una llave foránea;
// en MongoDB lo guardamos junto y nos ahorramos el JOIN.
const resenaSchema = new mongoose.Schema({
  usuario: { type: String, required: true, trim: true },
  puntuacion: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, trim: true, default: '' },
  fecha: { type: Date, default: Date.now }
});

const juegoSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    generos: { type: [String], default: [] },
    plataformas: { type: [String], default: [] },
    precio: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    imagen: { type: String, default: '' },
    fechaLanzamiento: { type: Date },
    resenas: { type: [resenaSchema], default: [] }
  },
  { timestamps: true } // agrega createdAt y updatedAt solos
);

// Mongoose crea la colección "juegos" a partir del nombre "Juego"
module.exports = mongoose.model('Juego', juegoSchema);
