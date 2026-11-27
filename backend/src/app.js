const express = require('express');
const cors = require('cors');
const juegosRoutes = require('./routes/juegos.routes');
const manejarErrores = require('./middlewares/manejarErrores');

const app = express();

app.use(cors()); // permite que el frontend (otro origen) llame a la API
app.use(express.json()); // convierte el body JSON en req.body

app.get('/api/salud', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/juegos', juegosRoutes);

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.use(manejarErrores);

module.exports = app;
