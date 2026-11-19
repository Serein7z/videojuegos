// Aquí están TODAS las llamadas al backend. El resto del frontend
// no usa fetch directamente, solo estas funciones.

async function pedir(ruta, opciones) {
  const respuesta = await fetch(API_URL + ruta, opciones);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Error en la petición');
  }
  return datos;
}

function obtenerJuegos(filtros) {
  const params = new URLSearchParams();

  if (filtros.buscar) params.set('buscar', filtros.buscar);
  if (filtros.genero) params.set('genero', filtros.genero);
  if (filtros.orden) params.set('orden', filtros.orden);

  return pedir('/juegos?' + params.toString());
}

function obtenerJuego(id) {
  return pedir('/juegos/' + id);
}

function obtenerEstadisticas() {
  return pedir('/juegos/estadisticas');
}

function enviarResena(id, resena) {
  return pedir('/juegos/' + id + '/resenas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resena)
  });
}
