require('dotenv').config();

const app = require('./app');
const conectarDB = require('./config/db');

const PUERTO = process.env.PORT || 3000;

// Primero nos conectamos a la base, y recién ahí abrimos el servidor
conectarDB()
  .then(() => {
    app.listen(PUERTO, () => {
      console.log(`Servidor listo en http://localhost:${PUERTO}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar:', error.message);
    process.exit(1);
  });
