// Punto de entrada del frontend: conecta los eventos con la API y con la pantalla.

const JUEGOS_POR_PAGINA = 24;

// Lo que el usuario tiene elegido en los filtros
const filtros = {
  buscar: '',
  genero: '',
  orden: 'titulo'
};

// En qué página del catálogo vamos
const paginacion = {
  pagina: 1,
  totalPaginas: 1
};

let peticion = 0; // numera cada petición para ignorar respuestas que llegan tarde
let datosDashboard = null;
let dashboardPintado = false;
let vistaActual = 'catalogo';

// ---------- Pestaña Catálogo ----------

// reiniciar = true  -> empieza de cero (primera carga o cambio de filtro)
// reiniciar = false -> "Cargar más": trae la página siguiente y la suma a lo que ya hay
async function cargarCatalogo(reiniciar) {
  const numero = ++peticion;
  const botonMas = document.getElementById('boton-mas');

  botonMas.disabled = true;
  mostrarMensaje('');

  if (reiniciar) {
    paginacion.pagina = 1;
    botonMas.hidden = true;
    pintarEsqueletos(8);
  } else {
    paginacion.pagina += 1;
  }

  try {
    const datos = await obtenerJuegos({
      ...filtros,
      pagina: paginacion.pagina,
      limite: JUEGOS_POR_PAGINA
    });

    // Si el usuario cambió un filtro mientras esperábamos, esta respuesta ya no sirve
    if (numero !== peticion) return;

    if (reiniciar) limpiarCatalogo();
    agregarTarjetas(datos.juegos, abrirDetalle);

    paginacion.totalPaginas = datos.totalPaginas;
    actualizarResultados(datos.total);
    botonMas.hidden = paginacion.pagina >= paginacion.totalPaginas;

    if (datos.total === 0) {
      mostrarMensaje('No encontramos juegos con esos filtros. Prueba con otro título o género.');
    }
  } catch (error) {
    if (numero !== peticion) return;
    console.error(error);

    if (reiniciar) limpiarCatalogo();
    else paginacion.pagina -= 1; // la página no llegó, así que seguimos en la anterior

    mostrarMensaje('No se pudo conectar con el servidor. Revisa que el backend esté corriendo.');
  } finally {
    if (numero === peticion) botonMas.disabled = false;
  }
}

async function abrirDetalle(id) {
  try {
    const juego = await obtenerJuego(id);

    mostrarModal(juego, async (resena) => {
      await enviarResena(id, resena);

      // El dashboard (total de reseñas) quedó desactualizado: se vuelve a pedir al abrirlo
      datosDashboard = null;
      dashboardPintado = false;

      abrirDetalle(id); // volvemos a pedir el juego para ver la reseña nueva
      if (vistaActual === 'resenas') cargarResenas();
    });
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message);
  }
}

// ---------- Pestaña Dashboard ----------

async function mostrarDashboard() {
  if (dashboardPintado) return;

  try {
    mostrarMensaje('', 'mensaje-dashboard');
    if (!datosDashboard) datosDashboard = await obtenerDashboard();

    pintarKpis(datosDashboard.resumen);
    pintarGraficos(datosDashboard);
    pintarTop10(datosDashboard.top10, abrirDetalle);
    dashboardPintado = true;
  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudo cargar el dashboard. Revisa que el backend esté corriendo.', 'mensaje-dashboard');
  }
}

// ---------- Pestaña Reseñas recientes ----------

async function cargarResenas() {
  try {
    const resenas = await obtenerResenasRecientes();
    pintarResenasRecientes(resenas, abrirDetalle);
  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudieron cargar las reseñas.', 'mensaje-resenas');
  }
}

// ---------- Pestañas ----------

function cambiarVista(nombre) {
  vistaActual = nombre;

  document.querySelectorAll('.tab').forEach((boton) => {
    const activa = boton.dataset.vista === nombre;
    boton.classList.toggle('activa', activa);
    boton.setAttribute('aria-selected', String(activa));
  });

  document.querySelectorAll('.vista').forEach((vista) => {
    vista.hidden = vista.id !== 'vista-' + nombre;
  });

  // Los gráficos se dibujan recién cuando su pestaña es visible (Chart.js necesita ver el tamaño)
  if (nombre === 'dashboard') mostrarDashboard();
  if (nombre === 'resenas') cargarResenas();
}

document.querySelectorAll('.tab').forEach((boton) => {
  boton.addEventListener('click', () => cambiarVista(boton.dataset.vista));
});

// ---------- Eventos del catálogo ----------

// Esperamos 300 ms después de que deja de escribir para no llamar a la API en cada letra
let temporizador;
document.getElementById('buscador').addEventListener('input', (evento) => {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    filtros.buscar = evento.target.value.trim();
    cargarCatalogo(true);
  }, 300);
});

document.getElementById('filtro-genero').addEventListener('change', (evento) => {
  filtros.genero = evento.target.value;
  cargarCatalogo(true);
});

document.getElementById('filtro-orden').addEventListener('change', (evento) => {
  filtros.orden = evento.target.value;
  cargarCatalogo(true);
});

document.getElementById('boton-mas').addEventListener('click', () => cargarCatalogo(false));

// ---------- Eventos de la ventana de detalle ----------

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
  cargarCatalogo(true);

  // Con la respuesta del dashboard llenamos el filtro de géneros y el juego destacado
  try {
    datosDashboard = await obtenerDashboard();
    llenarGeneros(datosDashboard.porGenero);

    if (datosDashboard.top10.length > 0) {
      pintarDestacado(datosDashboard.top10[0], abrirDetalle);
    }
  } catch (error) {
    console.error('No se pudo cargar el dashboard:', error);
  }
}

iniciar();