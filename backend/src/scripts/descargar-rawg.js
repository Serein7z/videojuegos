require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Descarga juegos de la API de RAWG y los guarda en data/juegos-en.json.
// Las descripciones vienen en inglés; después "npm run traducir" las pasa a español.
// Se corre UNA vez (npm run rawg). Así el frontend nunca habla con RAWG
// y la API key no queda expuesta en el navegador.

const API_KEY = process.env.RAWG_API_KEY;
const BASE = 'https://api.rawg.io/api';
const CANTIDAD = 500; // cuántos juegos queremos en total
const POR_PAGINA = 40; // RAWG no deja pedir más de 40 por página
const SALIDA = path.join(__dirname, '../../data/juegos-en.json');

async function pedir(ruta, params = {}) {
  const url = new URL(BASE + ruta);
  url.searchParams.set('key', API_KEY);
  for (const [clave, valor] of Object.entries(params)) {
    url.searchParams.set(clave, valor);
  }

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`RAWG respondió ${respuesta.status} en ${ruta}`);
  }
  return respuesta.json();
}

// RAWG no trae precios, así que los simulamos para tener algo que mostrar
function precioSimulado() {
  const opciones = [0, 9.99, 14.99, 19.99, 29.99, 39.99, 59.99];
  return opciones[Math.floor(Math.random() * opciones.length)];
}

// "Soulcalibur (1998)" y "Soulcalibur" cuentan como el mismo juego
function normalizar(titulo) {
  const limpio = titulo.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
  return limpio || titulo.toLowerCase();
}

// Corta la descripción en el último punto antes del límite, para que no quede a medias
function recortar(texto, max) {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  const ultimoPunto = corte.lastIndexOf('.');
  return ultimoPunto > 100 ? corte.slice(0, ultimoPunto + 1) : corte;
}

// Pide páginas de la lista hasta juntar CANTIDAD juegos "buenos"
async function elegirJuegos() {
  const elegidos = [];
  const vistos = new Set();
  let pagina = 1;

  while (elegidos.length < CANTIDAD) {
    const lista = await pedir('/games', {
      ordering: '-metacritic',
      page_size: POR_PAGINA,
      page: pagina
    });

    for (const item of lista.results) {
      const clave = normalizar(item.name);
      const sinImagen = !item.background_image;
      const sinRating = !item.rating;
      const soloAdultos = item.esrb_rating && item.esrb_rating.slug === 'adults-only';

      // nos saltamos repetidos, juegos sin imagen o sin rating, y contenido solo para adultos
      if (vistos.has(clave) || sinImagen || sinRating || soloAdultos) continue;

      vistos.add(clave);
      elegidos.push(item);
    }

    console.log(`Página ${pagina}: ${elegidos.length} juegos elegidos`);

    if (!lista.next) break; // ya no hay más páginas
    pagina++;
  }

  return elegidos.slice(0, CANTIDAD);
}

async function main() {
  if (!API_KEY) {
    console.error('Falta RAWG_API_KEY en el archivo .env');
    process.exit(1);
  }

  // 1. Lista de juegos mejor puntuados (sin repetidos)
  const elegidos = await elegirJuegos();
  console.log(`\nPidiendo el detalle de ${elegidos.length} juegos...\n`);

  const juegos = [];

  // 2. Por cada juego pedimos el detalle, que es donde viene la descripción
  for (const [i, item] of elegidos.entries()) {
    try {
      const detalle = await pedir(`/games/${item.id}`);
      const descripcion = (detalle.description_raw || '').replace(/\s+/g, ' ').trim();

      juegos.push({
        titulo: detalle.name,
        descripcion: recortar(descripcion, 400),
        generos: (detalle.genres || []).map((g) => g.name),
        plataformas: (detalle.platforms || []).map((p) => p.platform.name),
        precio: precioSimulado(),
        rating: detalle.rating || 0,
        imagen: detalle.background_image || '',
        fechaLanzamiento: detalle.released || null,
        resenas: []
      });

      console.log(`(${i + 1}/${elegidos.length}) ${detalle.name}`);
    } catch (error) {
      // si un juego falla no se pierde todo, solo se salta ese
      console.log(`Se saltó "${item.name}": ${error.message}`);
    }
  }

  fs.writeFileSync(SALIDA, JSON.stringify(juegos, null, 2));
  console.log(`\nListo: ${juegos.length} juegos guardados en data/juegos-en.json`);
  console.log('Siguiente paso: npm run traducir');
}

main().catch((error) => {
  console.error('Falló la descarga:', error.message);
  process.exit(1);
});