# GameVault — Catálogo de videojuegos

Proyecto académico del curso de **Inteligencia de Negocios**: una página web (cliente) que consume una API REST en JSON (servidor), la cual guarda y consulta los datos en una base de datos **no relacional** (MongoDB Atlas).

## Qué hace

- **Catálogo:** 500 juegos con portada, géneros, rating y precio. Tiene buscador, filtro por género, orden y botón **"Cargar más"** (paginación desde el servidor).
- **Detalle de un juego:** descripción, plataformas y reseñas, con un formulario para publicar una nueva.
- **Dashboard:** indicadores generales y gráficos de juegos por género, lanzamientos por año, rangos de precio y el top 10 mejor valorados.
- **Reseñas recientes:** las últimas reseñas de todo el catálogo, ordenadas por fecha.

## Tecnologías

| Parte | Tecnología |
|-------|------------|
| Frontend | HTML, CSS y JavaScript puro, Chart.js para los gráficos |
| Backend | Node.js, Express, Mongoose |
| Base de datos | MongoDB Atlas (no relacional) |
| Datos de origen | API de [RAWG](https://rawg.io/apidocs) |

---

## 1. Arquitectura: cliente-servidor

```
┌────────────────────┐   HTTP + JSON    ┌─────────────────────────────┐        ┌──────────────┐
│     FRONTEND       │ ───────────────► │          BACKEND            │ ─────► │   MongoDB    │
│  HTML + CSS + JS   │ ◄─────────────── │  Node + Express + Mongoose  │ ◄───── │    Atlas     │
│  (el navegador)    │                  │  (la API REST)              │        │ colección    │
└────────────────────┘                  └─────────────────────────────┘        │   "juegos"   │
                                                                               └──────────────┘
```

- El **frontend** nunca toca la base de datos: solo pide datos a la API con `fetch`.
- El **backend** es el único que conoce la base de datos y sus credenciales.
- Se comunican solo por **JSON**. Mientras ese formato no cambie, cada parte se puede modificar por separado.

### Capas dentro del backend

El backend sigue una organización por capas, inspirada en MVC (el modelo y el controlador están en el backend; la vista es el frontend, que va aparte como cliente).

```
Petición ─► routes ─► controllers ─► services ─► models ─► MongoDB
            (URL)     (req / res)    (lógica y   (forma de
                                      consultas)  los datos)
```

| Capa | Responsabilidad | Qué NO hace |
|------|-----------------|-------------|
| `routes` | Dice qué URL y método atiende cada controller | No tiene lógica |
| `controllers` | Lee `req`, llama al service y responde con `res` y el código HTTP | No consulta la base |
| `services` | Hace las consultas a la base y la lógica | No sabe qué es `req` ni `res` |
| `models` | Define cómo es un juego y valida los datos | — |

---

## 2. Estructura de carpetas

```
videojuegos-bi/
├── README.md
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env.example               ← plantilla; copiar como .env
│   ├── data/
│   │   ├── juegos-en.json         ← descargado de RAWG (descripciones en inglés)
│   │   ├── traducciones.json      ← caché de traducciones
│   │   └── juegos.json            ← archivo final que se carga a la base
│   └── src/
│       ├── server.js              ← conecta a la base y abre el puerto
│       ├── app.js                 ← arma Express (cors, json, rutas, errores)
│       ├── config/
│       │   └── db.js              ← conexión a Atlas
│       ├── models/
│       │   └── Juego.js           ← esquema del juego (con reseñas embebidas)
│       ├── services/
│       │   └── juegos.service.js  ← consultas: listar, dashboard, reseñas recientes...
│       ├── controllers/
│       │   └── juegos.controller.js
│       ├── routes/
│       │   └── juegos.routes.js
│       ├── middlewares/
│       │   └── manejarErrores.js  ← respuestas de error en un solo lugar
│       └── scripts/
│           ├── descargar-rawg.js  ← RAWG → juegos-en.json
│           ├── traducir.js        ← juegos-en.json → juegos.json (en español)
│           ├── importar.js        ← juegos.json → MongoDB
│           └── sembrar-resenas.js ← reseñas de ejemplo para la demo
│
└── frontend/
    ├── index.html                 ← estructura de la página y las 3 pestañas
    ├── css/
    │   └── styles.css
    └── js/
        ├── config.js              ← URL del backend
        ├── api.js                 ← todas las llamadas fetch
        ├── ui.js                  ← funciones que dibujan en pantalla
        ├── graficos.js            ← gráficos del dashboard y top 10
        └── main.js                ← pestañas, eventos y arranque
```

El orden de los `<script>` en `index.html` importa: `config → api → ui → graficos → main`.

---

## 3. Endpoints de la API

Base: `http://localhost:3000/api`

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/juegos?buscar=&genero=&orden=&pagina=&limite=` | Lista paginada de juegos (todos los parámetros son opcionales) |
| GET | `/juegos/:id` | Un juego completo, con sus reseñas |
| POST | `/juegos` | Crea un juego |
| PUT | `/juegos/:id` | Actualiza un juego |
| DELETE | `/juegos/:id` | Elimina un juego |
| POST | `/juegos/:id/resenas` | Agrega una reseña al juego |
| GET | `/juegos/dashboard` | Todo lo que usa la pestaña Dashboard |
| GET | `/juegos/resenas-recientes?limite=` | Últimas reseñas de todo el catálogo |
| GET | `/juegos/estadisticas` | Total, promedios y conteo por género |
| GET | `/salud` | Prueba rápida: responde `{ "ok": true }` |

Detalles de los parámetros:

- `orden`: `titulo` (por defecto), `rating`, `nuevo`, `precio-asc`, `precio-desc`.
- `pagina`: empieza en 1. `limite`: 24 por defecto, máximo 60.
- `/resenas-recientes`: `limite` 20 por defecto, máximo 50.
- Las rutas fijas (`dashboard`, `resenas-recientes`, `estadisticas`) van **antes** de `/:id`; si no, Express confundiría el nombre con un id.

### Respuesta de `GET /juegos`

```json
{
  "juegos": [ { "_id": "…", "titulo": "…", "generos": ["…"], "rating": 4.4, "precio": 19.99, "imagen": "https://…", "fechaLanzamiento": "…" } ],
  "total": 500,
  "pagina": 1,
  "totalPaginas": 21
}
```

La lista solo trae los campos que necesita la tarjeta (sin descripción ni reseñas), para que la respuesta pese poco.

### Respuesta de `GET /juegos/dashboard`

```json
{
  "resumen": { "total": 500, "precioPromedio": 0, "ratingPromedio": 0, "gratuitos": 0, "totalResenas": 0 },
  "porGenero": [ { "_id": "Action", "cantidad": 0 } ],
  "porAnio": [ { "anio": 2017, "cantidad": 0 } ],
  "rangosPrecio": [ { "rango": "Gratis", "cantidad": 0 } ],
  "top10": [ { "_id": "…", "titulo": "…", "rating": 4.8 } ]
}
```

### Respuesta de `GET /juegos/resenas-recientes`

```json
[
  { "juegoId": "…", "titulo": "…", "imagen": "https://…", "usuario": "Lucía", "puntuacion": 5, "comentario": "…", "fecha": "…" }
]
```

---

## 4. Modelo de datos

Cada juego es un **documento** de la colección `juegos`. Las reseñas y los géneros van **dentro del mismo documento** (documentos embebidos y arreglos), sin tablas intermedias ni JOIN.

```json
{
  "_id": "…",
  "titulo": "Hollow Knight",
  "descripcion": "…",
  "generos": ["Action", "Adventure", "Indie"],
  "plataformas": ["PC", "Nintendo Switch"],
  "precio": 14.99,
  "rating": 4.38,
  "imagen": "https://…",
  "fechaLanzamiento": "2017-02-24T00:00:00.000Z",
  "resenas": [
    { "usuario": "Lucía", "puntuacion": 5, "comentario": "…", "fecha": "…" }
  ]
}
```

### Consultas de agregación

El dashboard se calcula dentro de MongoDB con pipelines de agregación (el equivalente a `GROUP BY` en SQL):

| Operador | Dónde se usa |
|----------|--------------|
| `$group`, `$sum`, `$avg` | Totales, promedios y conteo por género |
| `$unwind` | Separar el arreglo de géneros (para contarlos) y el de reseñas (para ordenarlas por fecha) |
| `$year` | Lanzamientos por año |
| `$bucket` | Rangos de precio |

Ejemplo, las reseñas recientes. Como las reseñas viven dentro de cada juego, `$unwind` convierte cada una en su propio documento para poder ordenarlas:

```js
Juego.aggregate([
  { $unwind: '$resenas' },
  { $sort: { 'resenas.fecha': -1 } },
  { $limit: 20 },
  { $project: { titulo: 1, imagen: 1, usuario: '$resenas.usuario', puntuacion: '$resenas.puntuacion' } }
]);
```

---

## 5. Cómo correrlo

Necesitas Node.js y una cuenta gratuita de [MongoDB Atlas](https://www.mongodb.com/atlas). En Atlas, permite tu IP en *Network Access*.

**Backend**

```bash
cd backend
npm install
cp .env.example .env        # y completa MONGODB_URI con tu cadena de conexión
npm run importar            # carga data/juegos.json a Atlas (500 juegos)
npm run resenas             # opcional: agrega reseñas de ejemplo
npm run dev                 # servidor en http://localhost:3000
```

Prueba en el navegador: `http://localhost:3000/api/juegos`

> En PowerShell de Windows, si `npm` da un error de scripts deshabilitados, usa `npm.cmd` en su lugar (por ejemplo, `npm.cmd run dev`).

**Frontend**

Abre `frontend/index.html` con la extensión Live Server de VS Code (o con doble clic en el archivo). El backend debe estar corriendo.

### Variables de entorno (`backend/.env`)

| Variable | Para qué sirve |
|----------|----------------|
| `MONGODB_URI` | Cadena de conexión a Atlas |
| `PORT` | Puerto del servidor (3000 por defecto) |
| `RAWG_API_KEY` | Solo si vas a volver a descargar juegos de RAWG |

El archivo `.env` está en `.gitignore`: nunca se sube al repositorio.

### Scripts de npm

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor que se reinicia solo al guardar cambios |
| `npm start` | Servidor normal |
| `npm run importar` | Carga `data/juegos.json` a MongoDB (borra lo que había) |
| `npm run resenas` | Agrega reseñas de ejemplo a 70 juegos al azar (borra las anteriores) |
| `npm run rawg` | Descarga juegos de RAWG a `data/juegos-en.json` |
| `npm run traducir` | Traduce las descripciones y genera `data/juegos.json` |

Ojo: `npm run importar` borra la colección y la vuelve a cargar, así que las reseñas desaparecen. Si las quieres, corre `npm run resenas` después.

---

## 6. De dónde salen los datos

El repositorio ya trae el catálogo listo en `backend/data/`, así que para usar el proyecto basta con `npm run importar`. Si quieres regenerarlo desde cero:

```
RAWG (API) ─► juegos-en.json ─► juegos.json (en español) ─► MongoDB ─► API propia ─► página
   rawg           rawg             traducir                  importar    npm run dev
```

```bash
# 1. Saca tu API key gratis en https://rawg.io/apidocs y ponla en .env (RAWG_API_KEY)
npm run rawg        # descarga ~500 juegos → data/juegos-en.json
npm run traducir    # descripciones al español → data/juegos.json
npm run importar    # los sube a Atlas
```

Detalles importantes:

- **RAWG no trae precios.** El script los genera al azar; son valores de ejemplo.
- **Las reseñas iniciales son de ejemplo.** Las genera `sembrar-resenas.js`. Las que se publican desde la página sí se guardan de verdad.
- El script de descarga se salta juegos repetidos, sin imagen, sin rating o solo para adultos, y recorta la descripción a unos 400 caracteres.
- `npm run rawg` gasta unas 500 a 600 peticiones del cupo mensual de RAWG (la cuenta gratuita da 20 000).
- `npm run traducir` usa el traductor gratuito de Google, que **no es oficial**: si pone un límite o falla, el script se detiene y lo que falte queda en inglés. Al volver a correrlo continúa donde se quedó, porque guarda cada traducción en `traducciones.json`.
- La API de RAWG se usa una sola vez. La página funciona con los datos de nuestra propia base, y la API key nunca llega al navegador.

---

## 7. Decisiones de diseño

- **Cliente-servidor:** separa la interfaz de los datos y la lógica. El navegador no se conecta directo a la base, porque expondría las credenciales.
- **Base NoSQL:** un juego tiene listas (géneros, plataformas, reseñas) que caben en un solo documento JSON, y el formato coincide con el que usa la API.
- **Paginación en el servidor:** el backend manda 24 juegos por vez con `skip` y `limit`, en lugar de los 500 de golpe.
- **`textContent` en lugar de `innerHTML`:** las reseñas las escriben usuarios; así su texto nunca se ejecuta como HTML (evita inyección de código).
- **Backend por capas:** si se cambiara la base de datos, solo se tocarían `services` y `models`.

## Posibles mejoras

- Formulario en la página para agregar, editar y eliminar juegos (el backend ya lo soporta).
- Autenticación de usuarios para las reseñas.
- Precios reales desde otra fuente.

---

## Créditos

Datos e imágenes: [RAWG](https://rawg.io). Los precios y las reseñas iniciales son datos de ejemplo.