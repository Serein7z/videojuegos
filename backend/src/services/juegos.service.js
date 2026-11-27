const Juego = require('../models/Juego');

// Los services son la capa que habla con la base de datos.
// Aquí NO se usa req ni res: solo reciben datos y devuelven datos.

// El segundo campo (_id) desempata: sin él, los juegos con el mismo rating
// podrían repetirse o saltarse entre una página y otra.
const ordenes = {
  titulo: { titulo: 1, _id: 1 },
  rating: { rating: -1, _id: 1 },
  nuevo: { fechaLanzamiento: -1, _id: 1 },
  'precio-asc': { precio: 1, _id: 1 },
  'precio-desc': { precio: -1, _id: 1 }
};

// Escapa símbolos raros para que el buscador no rompa la expresión regular
function escapar(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Devuelve una página de juegos (no los 500 de golpe) y cuántos hay en total
async function listar({ genero, buscar, orden, pagina, limite }) {
  const filtro = {};

  if (genero) {
    filtro.generos = genero; // Mongo busca dentro del arreglo
  }
  if (buscar) {
    filtro.titulo = { $regex: escapar(buscar), $options: 'i' };
  }

  const paginaActual = Math.max(parseInt(pagina) || 1, 1);
  const porPagina = Math.min(Math.max(parseInt(limite) || 24, 1), 60);

  const [juegos, total] = await Promise.all([
    Juego.find(filtro)
      .sort(ordenes[orden] || ordenes.titulo)
      .skip((paginaActual - 1) * porPagina)
      .limit(porPagina)
      // Solo los campos que usa la tarjeta (sin descripción ni reseñas): la respuesta pesa mucho menos
      .select('titulo generos rating precio imagen fechaLanzamiento'),
    Juego.countDocuments(filtro)
  ]);

  return {
    juegos,
    total,
    pagina: paginaActual,
    totalPaginas: Math.ceil(total / porPagina)
  };
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

// Nombre de cada rango, según el límite inferior que devuelve $bucket
const etiquetasPrecio = {
  0: 'Gratis',
  0.01: 'Menos de $10',
  10: '$10 a $20',
  20: '$20 a $40',
  40: '$40 o más'
};

// Todo lo que necesita la pestaña Dashboard, en una sola respuesta
async function dashboard() {
  const [resumen, porGenero, porAnio, rangos, top10] = await Promise.all([
    // 1) Totales generales
    Juego.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          precioPromedio: { $avg: '$precio' },
          ratingPromedio: { $avg: '$rating' },
          gratuitos: { $sum: { $cond: [{ $eq: ['$precio', 0] }, 1, 0] } },
          totalResenas: { $sum: { $size: { $ifNull: ['$resenas', []] } } }
        }
      }
    ]),

    // 2) Juegos por género ($unwind: un juego con 3 géneros cuenta en los 3)
    Juego.aggregate([
      { $unwind: '$generos' },
      { $group: { _id: '$generos', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } }
    ]),

    // 3) Lanzamientos por año ($year saca el año de la fecha)
    Juego.aggregate([
      { $match: { fechaLanzamiento: { $ne: null } } },
      { $group: { _id: { $year: '$fechaLanzamiento' }, cantidad: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),

    // 4) Rangos de precio ($bucket: reparte cada juego en su rango)
    Juego.aggregate([
      {
        $bucket: {
          groupBy: '$precio',
          boundaries: [0, 0.01, 10, 20, 40, 100],
          default: 'Otros',
          output: { cantidad: { $sum: 1 } }
        }
      }
    ]),

    // 5) Los 10 mejor valorados
    Juego.find()
      .sort({ rating: -1, _id: 1 })
      .limit(10)
      .select('titulo generos rating precio imagen')
  ]);

  return {
    resumen: resumen[0] || {
      total: 0,
      precioPromedio: 0,
      ratingPromedio: 0,
      gratuitos: 0,
      totalResenas: 0
    },
    porGenero,
    porAnio: porAnio.map((fila) => ({ anio: fila._id, cantidad: fila.cantidad })),
    rangosPrecio: rangos.map((fila) => ({
      rango: etiquetasPrecio[fila._id] || 'Otros',
      cantidad: fila.cantidad
    })),
    top10
  };
}

// Las reseñas más nuevas de TODO el catálogo.
// Están guardadas dentro de cada juego (un arreglo por juego), así que usamos
// $unwind: "desarma" el arreglo y convierte cada reseña en su propio documento.
// Un juego con 3 reseñas pasa a ser 3 filas, y ahí sí podemos ordenarlas por fecha.
async function resenasRecientes(limite) {
  return Juego.aggregate([
    { $unwind: '$resenas' },
    { $sort: { 'resenas.fecha': -1 } },
    { $limit: limite },
    {
      $project: {
        _id: 0,
        juegoId: '$_id',
        titulo: 1,
        imagen: 1,
        usuario: '$resenas.usuario',
        puntuacion: '$resenas.puntuacion',
        comentario: '$resenas.comentario',
        fecha: '$resenas.fecha'
      }
    }
  ]);
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  agregarResena,
  estadisticas,
  dashboard,
  resenasRecientes
};