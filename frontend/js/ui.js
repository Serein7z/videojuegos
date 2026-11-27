// Funciones que dibujan cosas en la pantalla. No hablan con el backend.

// Crea un elemento HTML. Usamos textContent (y no innerHTML) para que
// lo que escriba un usuario en una reseña nunca se interprete como código.
function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

// ---------- Géneros: nombre en español y un color fijo para cada uno ----------
// El mismo color se usa en las tarjetas y en el gráfico, así se reconocen de un vistazo.

const NOMBRES_GENERO = {
  Action: 'Acción',
  Adventure: 'Aventura',
  RPG: 'RPG',
  Shooter: 'Disparos',
  Strategy: 'Estrategia',
  Platformer: 'Plataformas',
  Indie: 'Indie',
  Puzzle: 'Puzles',
  Racing: 'Carreras',
  Arcade: 'Arcade',
  Simulation: 'Simulación',
  Sports: 'Deportes',
  Casual: 'Casual',
  Fighting: 'Lucha',
  'Massively Multiplayer': 'Multijugador masivo',
  Family: 'Familiar',
  Card: 'Cartas',
  Educational: 'Educativo',
  'Board Games': 'Juegos de mesa'
};

const COLORES_GENERO = {
  Action: '#ff8a5c',
  Adventure: '#ffc857',
  RPG: '#a78bfa',
  Shooter: '#ff5f6d',
  Strategy: '#4cc9f0',
  Platformer: '#5eead4',
  Indie: '#f472b6',
  Puzzle: '#e9d758',
  Racing: '#fb923c',
  Arcade: '#38bdf8',
  Simulation: '#86efac',
  Sports: '#4ade80',
  Casual: '#c4b5fd',
  Fighting: '#f87171',
  'Massively Multiplayer': '#60a5fa',
  Family: '#fda4af',
  Card: '#fcd34d',
  Educational: '#99f6e4',
  'Board Games': '#d6d3d1'
};

// El filtro y la base de datos usan el nombre original (en inglés); esto es solo para mostrar
function nombreGenero(genero) {
  return NOMBRES_GENERO[genero] || genero;
}

function colorGenero(genero) {
  return COLORES_GENERO[genero] || '#9aa0c0';
}

// ---------- Formatos ----------

function formatearPrecio(precio) {
  return precio === 0 ? 'Gratis' : '$' + precio.toFixed(2);
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  // timeZone UTC: si no, en Perú (UTC-5) la fecha se muestra un día antes
  return new Date(fecha).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

function anioDe(fecha) {
  return fecha ? new Date(fecha).getUTCFullYear() : 'Sin fecha';
}

// 4 -> ★★★★☆
function estrellas(cantidad) {
  return '★'.repeat(cantidad) + '☆'.repeat(5 - cantidad);
}

function tiempoRelativo(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return 'hace ' + dias + ' días';
}

// ---------- Piezas reutilizables ----------

// Si el juego no tiene imagen (o el link falla) mostramos un cuadro con la inicial
function crearImagen(juego, clase) {
  const crearPlaceholder = () => el('div', clase + ' sin-imagen', juego.titulo.charAt(0));

  if (!juego.imagen) return crearPlaceholder();

  const img = el('img', clase);
  img.src = juego.imagen;
  img.alt = juego.titulo;
  img.loading = 'lazy';
  img.onerror = () => img.replaceWith(crearPlaceholder());
  return img;
}

// Chips de género: un punto del color del género + su nombre
function crearGeneros(generos, maximo) {
  const contenedor = el('div', 'generos');

  generos.slice(0, maximo).forEach((genero) => {
    const chip = el('span', 'genero');
    const punto = el('i', 'genero-punto');
    punto.style.background = colorGenero(genero);
    chip.append(punto, nombreGenero(genero));
    contenedor.appendChild(chip);
  });

  return contenedor;
}

function mostrarMensaje(texto, id = 'mensaje') {
  const mensaje = document.getElementById(id);
  mensaje.textContent = texto;
  mensaje.hidden = !texto;
}

// ---------- Catálogo ----------

function crearTarjeta(juego, alHacerClick) {
  const tarjeta = el('article', 'tarjeta');
  tarjeta.tabIndex = 0;

  const media = el('div', 'tarjeta-media');
  media.appendChild(crearImagen(juego, 'tarjeta-img'));
  media.appendChild(el('span', 'insignia', '★ ' + juego.rating.toFixed(1)));
  tarjeta.appendChild(media);

  const cuerpo = el('div', 'tarjeta-cuerpo');
  cuerpo.appendChild(el('h3', 'tarjeta-titulo', juego.titulo));
  cuerpo.appendChild(crearGeneros(juego.generos, 2));

  const pie = el('div', 'tarjeta-pie');
  pie.appendChild(el('span', 'tarjeta-anio', String(anioDe(juego.fechaLanzamiento))));
  pie.appendChild(el('span', juego.precio === 0 ? 'precio gratis' : 'precio', formatearPrecio(juego.precio)));
  cuerpo.appendChild(pie);

  tarjeta.appendChild(cuerpo);

  tarjeta.addEventListener('click', () => alHacerClick(juego._id));
  tarjeta.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') alHacerClick(juego._id);
  });

  return tarjeta;
}

// Mientras llegan los datos mostramos cuadros grises en lugar de una pantalla vacía
function pintarEsqueletos(cantidad) {
  const catalogo = document.getElementById('catalogo');
  catalogo.replaceChildren();

  for (let i = 0; i < cantidad; i++) {
    const esqueleto = el('div', 'tarjeta esqueleto');
    esqueleto.appendChild(el('div', 'esqueleto-img'));
    esqueleto.appendChild(el('div', 'esqueleto-linea'));
    esqueleto.appendChild(el('div', 'esqueleto-linea corta'));
    catalogo.appendChild(esqueleto);
  }
}

function limpiarCatalogo() {
  document.getElementById('catalogo').replaceChildren();
}

// Agrega tarjetas al final (así "Cargar más" no borra lo que ya estaba)
function agregarTarjetas(juegos, alHacerClick) {
  const catalogo = document.getElementById('catalogo');
  juegos.forEach((juego, i) => {
    const tarjeta = crearTarjeta(juego, alHacerClick);
    tarjeta.classList.add('nueva');
    // cada tarjeta entra un poquito después de la anterior (máximo 10 escalones)
    tarjeta.style.setProperty('--retraso', Math.min(i, 10) * 40 + 'ms');
    catalogo.appendChild(tarjeta);
  });
}

function actualizarResultados(total) {
  const mostrados = document.getElementById('catalogo').children.length;
  const texto = total === 0 ? '' : 'Mostrando ' + mostrados + ' de ' + total + ' juegos';
  document.getElementById('resultados').textContent = texto;
}

function llenarGeneros(porGenero) {
  const select = document.getElementById('filtro-genero');

  porGenero.forEach((genero) => {
    const opcion = el('option', '', nombreGenero(genero._id) + ' (' + genero.cantidad + ')');
    opcion.value = genero._id; // al backend le mandamos el nombre original
    select.appendChild(opcion);
  });
}

// El juego mejor valorado, en grande, arriba del catálogo
function pintarDestacado(juego, alHacerClick) {
  const caja = document.getElementById('destacado');
  caja.replaceChildren();

  const texto = el('div', 'destacado-texto');

  const etiqueta = el('div', 'destacado-etiqueta');
  etiqueta.appendChild(el('span', 'insignia', '★ ' + juego.rating.toFixed(1)));
  etiqueta.appendChild(el('span', '', 'Mejor valorado del catálogo'));
  texto.appendChild(etiqueta);

  texto.appendChild(el('h2', 'destacado-titulo', juego.titulo));
  texto.appendChild(crearGeneros(juego.generos, 3));

  const boton = el('button', 'boton', 'Ver detalle');
  boton.type = 'button';
  boton.addEventListener('click', () => alHacerClick(juego._id));
  texto.appendChild(boton);

  caja.append(crearImagen(juego, 'destacado-img'), el('div', 'destacado-velo'), texto);
  caja.hidden = false;
}

// ---------- Dashboard: indicadores ----------

// Hace que un número "suba" desde 0 hasta su valor final
function animarNumero(nodo, final, formato) {
  const sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sinMovimiento || !window.requestAnimationFrame) {
    nodo.textContent = formato(final);
    return;
  }

  const duracion = 900;
  const inicio = performance.now();

  function paso(ahora) {
    const avance = Math.min((ahora - inicio) / duracion, 1);
    const suave = 1 - Math.pow(1 - avance, 3); // arranca rápido y frena al final
    nodo.textContent = formato(final * suave);
    if (avance < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

function pintarKpis(resumen) {
  const contenedor = document.getElementById('kpis');
  contenedor.replaceChildren();

  const entero = (n) => String(Math.round(n));
  const dinero = (n) => '$' + n.toFixed(2);
  const decimales = (n) => n.toFixed(2);

  const datos = [
    ['Juegos en el catálogo', resumen.total, entero],
    ['Precio promedio', resumen.precioPromedio, dinero],
    ['Rating promedio', resumen.ratingPromedio, decimales],
    ['Juegos gratuitos', resumen.gratuitos, entero],
    ['Reseñas publicadas', resumen.totalResenas, entero]
  ];

  datos.forEach(([etiqueta, valor, formato]) => {
    const caja = el('div', 'kpi');
    const numero = el('strong');
    animarNumero(numero, valor, formato);
    caja.append(numero, el('span', '', etiqueta));
    contenedor.appendChild(caja);
  });
}

// ---------- Pestaña Reseñas recientes ----------

function crearTarjetaResena(resena, alHacerClick) {
  const tarjeta = el('article', 'resena-card');

  const portada = el('button', 'resena-portada');
  portada.type = 'button';
  portada.setAttribute('aria-label', 'Abrir ' + resena.titulo);
  portada.appendChild(crearImagen({ titulo: resena.titulo, imagen: resena.imagen }, 'resena-img'));
  portada.addEventListener('click', () => alHacerClick(resena.juegoId));

  const cuerpo = el('div', 'resena-cuerpo');

  const titulo = el('button', 'resena-titulo', resena.titulo);
  titulo.type = 'button';
  titulo.addEventListener('click', () => alHacerClick(resena.juegoId));
  cuerpo.appendChild(titulo);

  const linea = el('div', 'resena-linea');
  linea.appendChild(el('span', 'estrellas', estrellas(resena.puntuacion)));
  linea.appendChild(el('span', 'resena-fecha', tiempoRelativo(resena.fecha)));
  cuerpo.appendChild(linea);

  if (resena.comentario) {
    cuerpo.appendChild(el('p', 'resena-comentario', resena.comentario));
  }
  cuerpo.appendChild(el('p', 'resena-autor', 'por ' + resena.usuario));

  tarjeta.append(portada, cuerpo);
  return tarjeta;
}

function pintarResenasRecientes(resenas, alHacerClick) {
  const lista = document.getElementById('lista-resenas');
  lista.replaceChildren();

  if (resenas.length === 0) {
    mostrarMensaje('Todavía no hay reseñas. Abre un juego del catálogo y escribe la primera.', 'mensaje-resenas');
    return;
  }

  mostrarMensaje('', 'mensaje-resenas');
  resenas.forEach((resena) => lista.appendChild(crearTarjetaResena(resena, alHacerClick)));
}

// ---------- Ventana de detalle ----------

function crearListaResenas(resenas) {
  const lista = el('div', 'resenas');

  if (resenas.length === 0) {
    lista.appendChild(el('p', 'resenas-vacio', 'Todavía no hay reseñas. ¡Sé el primero!'));
    return lista;
  }

  resenas.forEach((resena) => {
    const item = el('div', 'resena-item');
    const cabecera = el('div', 'resena-cabecera');
    cabecera.appendChild(el('strong', '', resena.usuario));
    cabecera.appendChild(el('span', 'estrellas', estrellas(resena.puntuacion)));
    item.appendChild(cabecera);

    if (resena.comentario) {
      item.appendChild(el('p', '', resena.comentario));
    }
    lista.appendChild(item);
  });

  return lista;
}

function crearFormularioResena(alEnviar) {
  const form = el('form', 'form-resena');

  const usuario = el('input');
  usuario.placeholder = 'Tu nombre';
  usuario.required = true;
  usuario.maxLength = 30;

  const puntuacion = el('select');
  [5, 4, 3, 2, 1].forEach((n) => {
    const opcion = el('option', '', estrellas(n));
    opcion.value = n;
    puntuacion.appendChild(opcion);
  });

  const comentario = el('textarea');
  comentario.placeholder = 'Escribe tu reseña (opcional)';
  comentario.rows = 3;
  comentario.maxLength = 300;

  const boton = el('button', 'boton', 'Publicar reseña');
  boton.type = 'submit';

  const error = el('p', 'form-error');

  form.append(usuario, puntuacion, comentario, boton, error);

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    error.textContent = '';
    boton.disabled = true;

    try {
      await alEnviar({
        usuario: usuario.value,
        puntuacion: Number(puntuacion.value),
        comentario: comentario.value
      });
    } catch (e) {
      error.textContent = e.message;
      boton.disabled = false;
    }
  });

  return form;
}

function mostrarModal(juego, alEnviarResena) {
  const contenido = document.getElementById('modal-contenido');
  contenido.replaceChildren();

  contenido.appendChild(crearImagen(juego, 'modal-img'));

  const info = el('div', 'modal-info');
  info.appendChild(el('h2', '', juego.titulo));

  const meta = el('div', 'modal-meta');
  meta.appendChild(el('span', 'insignia', '★ ' + juego.rating.toFixed(1)));
  meta.appendChild(el('span', 'precio-grande', formatearPrecio(juego.precio)));
  meta.appendChild(el('span', '', formatearFecha(juego.fechaLanzamiento)));
  info.appendChild(meta);

  info.appendChild(crearGeneros(juego.generos, juego.generos.length));

  if (juego.plataformas.length > 0) {
    info.appendChild(el('p', 'plataformas', 'Plataformas: ' + juego.plataformas.join(', ')));
  }
  if (juego.descripcion) {
    info.appendChild(el('p', 'descripcion', juego.descripcion));
  }

  info.appendChild(el('h3', '', 'Reseñas (' + juego.resenas.length + ')'));
  info.appendChild(crearListaResenas(juego.resenas));
  info.appendChild(crearFormularioResena(alEnviarResena));

  contenido.appendChild(info);
  document.getElementById('modal').hidden = false;
}

function cerrarModal() {
  document.getElementById('modal').hidden = true;
}