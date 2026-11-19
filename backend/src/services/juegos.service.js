const Juego = require('../models/Juego');

// Los services son la capa que habla con la base de datos.
// Aquí NO se usa req ni res: solo reciben datos y devuelven datos.

const ordenes = {
  titulo: { titulo: 1 },
  rating: { rating: -1 },
  nuevo: { fechaLanzamiento: -1 },
  'precio-asc': { precio: 1 },
  'precio-desc': { precio: -1 }
};

// Escapa símbolos raros para que el buscador no rompa la expresión regular
function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listar({ genero, buscar, orden }) {
  const filtro = {};

  if (genero) {
    filtro.generos = genero; // Mongo busca dentro del arreglo
  }
  if (buscar) {
    filtro.titulo = { $regex: escapar(buscar), $options: 'i' };
  }

  return Juego.find(filtro).sort(ordenes[orden] || ordenes.titulo);
}

function obtenerPorId(id) {
  return Juego.findById(id);
}

function crear(datos) {
  return Juego.create(datos);
}

function actualizar(id, datos) {
  // new: true -> devuelve el documento ya actualizado
  return Juego.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
}

function eliminar(id) {
  return Juego.findByIdAndDelete(id);
}

async function agregarResena(id, resena) {
  const juego = await Juego.findById(id);
  if (!juego) return null;

  juego.resenas.push(resena);
  await juego.save();
  return juego;
}

// Datos para el resumen del catálogo (parte "BI" del proyecto)
async function estadisticas() {
  const [resumen] = await Juego.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        precioPromedio: { $avg: '$precio' },
        ratingPromedio: { $avg: '$rating' }
      }
    }
  ]);

  // $unwind separa cada género del arreglo para poder contarlos
  const porGenero = await Juego.aggregate([
    { $unwind: '$generos' },
    {
      $group: {
        _id: '$generos',
        cantidad: { $sum: 1 },
        ratingPromedio: { $avg: '$rating' }
      }
    },
    { $sort: { cantidad: -1 } }
  ]);

  return {
    resumen: resumen || { total: 0, precioPromedio: 0, ratingPromedio: 0 },
    porGenero
  };
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  agregarResena,
  estadisticas
};
