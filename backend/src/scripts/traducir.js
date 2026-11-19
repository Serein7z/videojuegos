const fs = require('fs');
const path = require('path');

// Toma data/juegos-en.json, traduce las descripciones al español y genera data/juegos.json
// (que es el archivo que lee "npm run importar").
//
// Usa el traductor gratuito de Google, sin API key. OJO: es un servicio no oficial,
// así que puede fallar o limitar las peticiones. Si pasa, el script se detiene y los
// juegos que falten se quedan en inglés.
//
// Cada traducción se guarda en data/traducciones.json. Si el script se corta,
// lo vuelves a correr y continúa donde se quedó, sin repetir lo ya traducido.

const ORIGEN = path.join(__dirname, '../../data/juegos-en.json');
const CACHE = path.join(__dirname, '../../data/traducciones.json');
const SALIDA = path.join(__dirname, '../../data/juegos.json');
const PAUSA_MS = 300; // pausa entre peticiones para no saturar el servicio

async function traducir(texto) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', 'es');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', texto);

  const respuesta = await fetch(url);

  if (respuesta.status === 429) throw new Error('CUPO_AGOTADO');
  if (!respuesta.ok) throw new Error(`El traductor respondió ${respuesta.status}`);

  // La respuesta llega en pedazos: [[ ["texto traducido", "texto original"], ... ], ...]
  const datos = await respuesta.json();
  return datos[0].map((pedazo) => pedazo[0] || '').join('');
}

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function main() {
  if (!fs.existsSync(ORIGEN)) {
    console.error('No existe data/juegos-en.json. Primero corre: npm run rawg');
    process.exit(1);
  }

  const juegos = JSON.parse(fs.readFileSync(ORIGEN, 'utf-8'));
  const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf-8')) : {};

  // La caché guarda: texto en inglés -> texto en español
  const pendientes = juegos.filter((j) => j.descripcion && !cache[j.descripcion]);
  console.log(`${pendientes.length} descripciones por traducir\n`);

  for (const [i, juego] of pendientes.entries()) {
    try {
      cache[juego.descripcion] = await traducir(juego.descripcion);
      fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2)); // guardamos en cada paso
      console.log(`(${i + 1}/${pendientes.length}) ${juego.titulo}`);
    } catch (error) {
      if (error.message === 'CUPO_AGOTADO') {
        console.log('\nEl traductor puso un límite de peticiones. Me detengo aquí.');
        break;
      }
      console.log(`No se pudo traducir "${juego.titulo}": ${error.message}`);
    }
    await esperar(PAUSA_MS);
  }

  // Armamos el archivo final: español donde hay traducción, inglés donde no
  const finales = juegos.map((j) => ({
    ...j,
    descripcion: cache[j.descripcion] || j.descripcion
  }));
  fs.writeFileSync(SALIDA, JSON.stringify(finales, null, 2));

  const faltan = juegos.filter((j) => j.descripcion && !cache[j.descripcion]).length;
  console.log(`\nListo: data/juegos.json tiene ${juegos.length} juegos (${faltan} descripciones siguen en inglés)`);

  if (faltan > 0) {
    console.log('Vuelve a correr "npm run traducir" más tarde para traducir las que faltan.');
  } else {
    console.log('Siguiente paso: npm run importar');
  }
}

main().catch((error) => {
  console.error('Falló la traducción:', error.message);
  process.exit(1);
});