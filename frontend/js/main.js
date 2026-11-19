// Punto de entrada del frontend: conecta los eventos con la API y con la pantalla.

// Lo que el usuario tiene elegido en los filtros
const filtros = {
  buscar: '',
  genero: '',
  orden: 'titulo'
};

async function cargarCatalogo() {
  try {
    mostrarMensaje('Cargando...');
    const juegos = await obtenerJuegos(filtros);
    mostrarMensaje('');
    pintarCatalogo(juegos, abrirDetalle);
  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
  }
}

async function abrirDetalle(id) {
  try {
    const juego = await obtenerJuego(id);

    mostrarModal(juego, async (resena) => {
      await enviarResena(id, resena);
      abrirDetalle(id); // volvemos a pedir el juego para ver la reseña nueva
    });
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message);
  }
}

// ---------- Eventos ----------

// Esperamos 300 ms después de que deja de escribir para no llamar a la API en cada letra
let temporizador;
document.getElementById('buscador').addEventListener('input', (evento) => {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    filtros.buscar = evento.target.value.trim();
    cargarCatalogo();
  }, 300);
});

document.getElementById('filtro-genero').addEventListener('change', (evento) => {
  filtros.genero = evento.target.value;
  cargarCatalogo();
});

document.getElementById('filtro-orden').addEventListener('change', (evento) => {
  filtros.orden = evento.target.value;
  cargarCatalogo();
});

document.getElementById('modal-cerrar').addEventListener('click', cerrarModal);

document.getElementById('modal').addEventListener('click', (evento) => {
  // solo cierra si hicieron clic en el fondo oscuro, no dentro de la caja
  if (evento.target.id === 'modal') cerrarModal();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') cerrarModal();
});

// ---------- Inicio ----------

async function iniciar() {
  try {
    const estadisticas = await obtenerEstadisticas();
    pintarEstadisticas(estadisticas.resumen);
    llenarGeneros(estadisticas.porGenero);
  } catch (error) {
    console.error('No se pudieron cargar las estadísticas:', error);
  }

  cargarCatalogo();
}

iniciar();
