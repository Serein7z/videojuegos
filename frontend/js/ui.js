// Funciones que dibujan cosas en la pantalla. No hablan con el backend.

// Crea un elemento HTML. Usamos textContent (y no innerHTML) para que
// lo que escriba un usuario en una reseña nunca se interprete como código.
function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

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

// ---------- Catálogo ----------

function crearTarjeta(juego, alHacerClick) {
  const tarjeta = el('article', 'tarjeta');
  tarjeta.tabIndex = 0;

  tarjeta.appendChild(crearImagen(juego, 'tarjeta-img'));

  const cuerpo = el('div', 'tarjeta-cuerpo');
  cuerpo.appendChild(el('h3', 'tarjeta-titulo', juego.titulo));
  cuerpo.appendChild(el('p', 'tarjeta-generos', juego.generos.join(' · ')));

  const pie = el('div', 'tarjeta-pie');
  pie.appendChild(el('span', 'rating', '★ ' + juego.rating.toFixed(1)));
  pie.appendChild(el('span', 'precio', formatearPrecio(juego.precio)));
  cuerpo.appendChild(pie);

  tarjeta.appendChild(cuerpo);

  tarjeta.addEventListener('click', () => alHacerClick(juego._id));
  tarjeta.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') alHacerClick(juego._id);
  });

  return tarjeta;
}

function pintarCatalogo(juegos, alHacerClick) {
  const catalogo = document.getElementById('catalogo');
  catalogo.replaceChildren();

  if (juegos.length === 0) {
    mostrarMensaje('No se encontraron juegos con esos filtros.');
    return;
  }

  juegos.forEach((juego) => {
    catalogo.appendChild(crearTarjeta(juego, alHacerClick));
  });
}

function mostrarMensaje(texto) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.hidden = !texto;
}

// ---------- Resumen y filtros ----------

function pintarEstadisticas(resumen) {
  const contenedor = document.getElementById('estadisticas');
  contenedor.replaceChildren();

  const datos = [
    ['Juegos', resumen.total],
    ['Precio promedio', '$' + resumen.precioPromedio.toFixed(2)],
    ['Rating promedio', resumen.ratingPromedio.toFixed(2)]
  ];

  datos.forEach(([etiqueta, valor]) => {
    const caja = el('div', 'estadistica');
    caja.appendChild(el('strong', '', String(valor)));
    caja.appendChild(el('span', '', etiqueta));
    contenedor.appendChild(caja);
  });
}

function llenarGeneros(porGenero) {
  const select = document.getElementById('filtro-genero');

  porGenero.forEach((genero) => {
    const opcion = el('option', '', genero._id + ' (' + genero.cantidad + ')');
    opcion.value = genero._id;
    select.appendChild(opcion);
  });
}

// ---------- Ventana de detalle ----------

function crearListaResenas(resenas) {
  const lista = el('div', 'resenas');

  if (resenas.length === 0) {
    lista.appendChild(el('p', 'resenas-vacio', 'Todavía no hay reseñas. ¡Sé el primero!'));
    return lista;
  }

  resenas.forEach((resena) => {
    const item = el('div', 'resena');
    const cabecera = el('div', 'resena-cabecera');
    cabecera.appendChild(el('strong', '', resena.usuario));
    cabecera.appendChild(el('span', 'rating', '★ ' + resena.puntuacion));
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
    const opcion = el('option', '', '★ ' + n);
    opcion.value = n;
    puntuacion.appendChild(opcion);
  });

  const comentario = el('textarea');
  comentario.placeholder = 'Escribe tu reseña (opcional)';
  comentario.rows = 3;
  comentario.maxLength = 300;

  const boton = el('button', '', 'Publicar reseña');
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
  meta.appendChild(el('span', 'rating', '★ ' + juego.rating.toFixed(1)));
  meta.appendChild(el('span', 'precio', formatearPrecio(juego.precio)));
  meta.appendChild(el('span', '', formatearFecha(juego.fechaLanzamiento)));
  info.appendChild(meta);

  const chips = el('div', 'chips');
  juego.generos.forEach((g) => chips.appendChild(el('span', 'chip', g)));
  info.appendChild(chips);

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
