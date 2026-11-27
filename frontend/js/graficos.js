// Todo lo de la pestaña Dashboard: gráficos con Chart.js y la lista del top 10.
// Los datos ya vienen calculados por el backend (agregaciones de MongoDB);
// aquí solo se dibujan.

const COLOR_TEXTO = '#9aa0c0';
const COLOR_LINEA = 'rgba(154, 160, 192, 0.15)';

let graficos = [];

function configurarChart() {
  Chart.defaults.color = COLOR_TEXTO;
  Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
  Chart.defaults.borderColor = COLOR_LINEA;
  Chart.defaults.plugins.legend.display = false;
}

function pintarGraficos(datos) {
  // Si se vuelve a pintar (por ejemplo tras publicar una reseña) borramos los anteriores
  graficos.forEach((grafico) => grafico.destroy());
  graficos = [];

  configurarChart();
  graficoGeneros(datos.porGenero);
  graficoAnios(datos.porAnio);
  graficoPrecios(datos.rangosPrecio);
}

// Barras horizontales: cada género con su color
function graficoGeneros(porGenero) {
  const top = porGenero.slice(0, 10);

  graficos.push(new Chart(document.getElementById('grafico-generos'), {
    type: 'bar',
    data: {
      labels: top.map((g) => nombreGenero(g._id)),
      datasets: [{
        label: 'Juegos',
        data: top.map((g) => g.cantidad),
        backgroundColor: top.map((g) => colorGenero(g._id)),
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero: true },
        y: { grid: { display: false } }
      }
    }
  }));
}

// Línea: cuántos juegos del catálogo salieron cada año
function graficoAnios(porAnio) {
  graficos.push(new Chart(document.getElementById('grafico-anios'), {
    type: 'line',
    data: {
      labels: porAnio.map((a) => a.anio),
      datasets: [{
        label: 'Juegos',
        data: porAnio.map((a) => a.cantidad),
        borderColor: '#4cc9f0',
        backgroundColor: 'rgba(76, 201, 240, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y: { beginAtZero: true }
      }
    }
  }));
}

// Barras verticales: cuántos juegos caen en cada rango de precio
function graficoPrecios(rangos) {
  graficos.push(new Chart(document.getElementById('grafico-precios'), {
    type: 'bar',
    data: {
      labels: rangos.map((r) => r.rango),
      datasets: [{
        label: 'Juegos',
        data: rangos.map((r) => r.cantidad),
        backgroundColor: '#ff5f6d',
        borderRadius: 4
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      }
    }
  }));
}

// Lista numerada con portada, género y una barrita que muestra el rating
function pintarTop10(juegos, alHacerClick) {
  const lista = document.getElementById('top10');
  lista.replaceChildren();

  juegos.forEach((juego, i) => {
    const item = el('li', 'top-item');

    const boton = el('button', 'top-boton');
    boton.type = 'button';
    boton.addEventListener('click', () => alHacerClick(juego._id));

    const info = el('div', 'top-info');
    info.appendChild(el('strong', '', juego.titulo));
    info.appendChild(el('span', '', juego.generos.slice(0, 2).map(nombreGenero).join(', ')));

    const puntos = el('div', 'top-puntos');
    puntos.appendChild(el('span', 'rating', '★ ' + juego.rating.toFixed(2)));

    const barra = el('span', 'top-barra');
    const relleno = el('i');
    relleno.style.width = '0%';
    barra.appendChild(relleno);
    // las barras se llenan una tras otra (el CSS anima el cambio de ancho)
    setTimeout(() => { relleno.style.width = (juego.rating / 5) * 100 + '%'; }, 50 + i * 60);
    puntos.appendChild(barra);

    boton.append(el('span', 'top-puesto', String(i + 1)), crearImagen(juego, 'top-img'), info, puntos);
    item.appendChild(boton);
    lista.appendChild(item);
  });
}