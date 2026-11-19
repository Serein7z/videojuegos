# GameVault — Catálogo de videojuegos

Mini proyecto de Inteligencia de Negocios: una página web (cliente) que consume una API REST en JSON (servidor), la cual guarda y consulta los datos en una base **no relacional** (MongoDB Atlas).

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

```
Petición ─► routes ─► controllers ─► services ─► models ─► MongoDB
            (URL)     (req / res)    (lógica y   (forma de
                                      consultas)  los datos)
```

| Capa | Responsabilidad | Qué NO hace |
|------|-----------------|-------------|
| `routes` | Dice qué URL + método atiende cada controller | No tiene lógica |
| `controllers` | Lee `req`, llama al service, responde con `res` y el código HTTP | No consulta la base |
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
│   │   ├── traducciones.json      ← caché de traducciones (se genera solo)
│   │   └── juegos.json            ← archivo final que se carga a la base
│   └── src/
│       ├── server.js              ← conecta a la base y abre el puerto
│       ├── app.js                 ← arma Express (cors, json, rutas, errores)
│       ├── config/
│       │   └── db.js              ← conexión a Atlas
│       ├── models/
│       │   └── Juego.js           ← esquema del juego (con reseñas embebidas)
│       ├── services/
│       │   └── juegos.service.js  ← consultas: listar, crear, estadísticas...
│       ├── controllers/
│       │   └── juegos.controller.js
│       ├── routes/
│       │   └── juegos.routes.js
│       ├── middlewares/
│       │   └── manejarErrores.js  ← respuestas de error en un solo lugar
│       └── scripts/
│           ├── descargar-rawg.js  ← RAWG → juegos-en.json
│           ├── traducir.js        ← juegos-en.json → juegos.json (en español)
│           └── importar.js        ← juegos.json → MongoDB
│
└── frontend/
    ├── index.html                 ← estructura de la página
    ├── css/
    │   └── styles.css
    └── js/
        ├── config.js              ← URL del backend
        ├── api.js                 ← todas las llamadas fetch
        ├── ui.js                  ← funciones que dibujan en pantalla
        └── main.js                ← eventos y arranque
```

El orden de los `<script>` en `index.html` importa: `config → api → ui → main`.

---

## 3. Endpoints de la API

Base: `http://localhost:3000/api`

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/juegos?buscar=&genero=&orden=` | Lista juegos (filtros opcionales) |
| GET | `/juegos/:id` | Un juego con sus reseñas |
| POST | `/juegos` | Crea un juego |
| PUT | `/juegos/:id` | Actualiza un juego |
| DELETE | `/juegos/:id` | Elimina un juego |
| POST | `/juegos/:id/resenas` | Agrega una reseña al juego |
| GET | `/juegos/estadisticas` | Total, promedios y conteo por género |
| GET | `/salud` | Prueba rápida: responde `{ "ok": true }` |

Valores de `orden`: `titulo`, `rating`, `nuevo`, `precio-asc`, `precio-desc`.

Forma de un juego (este es el "contrato" entre backend y frontend):

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
    { "usuario": "dani_sys", "puntuacion": 5, "comentario": "…", "fecha": "…" }
  ]
}
```

---

## 4. Cómo correrlo

**Backend**

```bash
cd backend
npm install
cp .env.example .env        # y pon tu MONGODB_URI real
npm run importar            # carga data/juegos.json a Atlas
npm run dev                 # servidor en http://localhost:3000
```

Prueba en el navegador: `http://localhost:3000/api/juegos`

**Frontend**

Abre `frontend/index.html` con la extensión Live Server de VS Code (o doble clic en el archivo). El backend debe estar corriendo.

En Atlas, recuerda permitir tu IP en *Network Access*.

---

## 5. Datos: ejemplo y RAWG

El proyecto trae un `data/juegos.json` de ejemplo con 10 juegos **sin imágenes** (la tarjeta muestra la inicial del título), solo para probar. Precios y ratings de ese archivo son ilustrativos.

Para el catálogo real, usa la API de RAWG **una sola vez**:

```
RAWG (API) ─► juegos-en.json ─► juegos.json (en español) ─► MongoDB ─► tu API ─► tu página
   rawg           rawg             traducir                   importar    npm run dev
```

```bash
# 1. Saca tu API key gratis en https://rawg.io/apidocs y ponla en .env (RAWG_API_KEY)
npm run rawg        # descarga ~500 juegos → data/juegos-en.json
npm run traducir    # descripciones al español → data/juegos.json
npm run importar    # los sube a Atlas
```

Detalles importantes:
- RAWG **no trae precios**, así que el script los simula con valores al azar. Dilo en la exposición.
- El script de descarga se salta juegos repetidos, sin imagen, sin rating o solo para adultos, y recorta la descripción a unos 400 caracteres.
- `npm run rawg` gasta unas 500 a 600 peticiones de tu cupo mensual de RAWG (la cuenta gratis da 20 000).
- `npm run traducir` usa el traductor gratuito de Google, que **no es oficial**: si pone un límite o falla, el script se detiene y lo que falte queda en inglés. Vuelve a correrlo más tarde; continúa donde se quedó (guarda cada traducción en `traducciones.json`).
- Las reseñas empiezan vacías; se crean desde la página.
- Revisa los términos de RAWG: creo que piden mencionar/enlazar RAWG como fuente en el sitio.

---

## 6. Reparto de trabajo

El contrato es la tabla de endpoints y la forma del JSON de arriba. Con eso, cada uno trabaja sin esperar al otro.

| Parte | Archivos | Cómo probarla sola |
|-------|----------|--------------------|
| **Backend** | todo `backend/src/` y `data/` | Navegador o Thunder Client / Postman |
| **Frontend** | todo `frontend/` | Con el backend corriendo |

Si lo haces tú solo, estudia en este orden: `models → services → controllers → routes → app.js → server.js`, y luego `api.js → ui.js → main.js`.

---

## 7. Preguntas que te pueden hacer

**¿Por qué cliente-servidor?**
Separa responsabilidades: la interfaz por un lado, los datos y la lógica por otro. El navegador no puede (ni debe) conectarse directo a la base, porque expondría las credenciales.

**¿Por qué una base NoSQL?**
Un juego tiene géneros, plataformas y reseñas, que son listas. En MongoDB todo eso vive dentro de un solo documento JSON, sin tablas intermedias ni JOIN. Además, el formato coincide con el que usa la API.

**¿Qué es un documento embebido?**
Las reseñas están dentro del juego (`resenas: [...]`), no en otra colección. Conviene cuando siempre se leen junto con el padre.

**¿Para qué sirve cada capa?**
Ver tabla de la sección 1. Idea clave: si mañana cambias de MongoDB a otra base, solo se toca `services` y `models`.

**¿Por qué el frontend no llama directo a RAWG?**
Porque la API key quedaría visible en el navegador, y dependeríamos de que RAWG esté disponible. Así, RAWG se usa una vez y nuestros datos viven en nuestra base.

**¿Qué es CORS y por qué `app.use(cors())`?**
El navegador bloquea peticiones entre orígenes distintos (frontend y backend están en puertos diferentes). `cors()` le dice que está permitido.

**¿Qué hace `aggregate` en `/estadisticas`?**
Es un pipeline: agrupa documentos y calcula totales y promedios dentro de la base. `$unwind` separa el arreglo de géneros para poder contar cada uno.

**¿Por qué `/estadisticas` va antes de `/:id`?**
Express revisa las rutas en orden. Si `/:id` fuera primero, tomaría "estadisticas" como si fuera un id.

**¿Qué pasa si mandan un id inválido?**
Mongoose lanza un `CastError`; el middleware `manejarErrores` lo convierte en un 400 con un mensaje claro.

**¿Por qué `textContent` y no `innerHTML`?**
Las reseñas las escriben usuarios. Con `textContent` el texto nunca se ejecuta como HTML, lo que evita inyección de código (XSS).

---

## 8. Ideas si sobra tiempo

- Formulario para agregar/editar/eliminar juegos desde la página (el backend ya lo soporta).
- Gráfico de juegos por género usando `/juegos/estadisticas`.
- Paginación en `GET /juegos` con `limit` y `skip`.