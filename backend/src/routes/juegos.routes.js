const express = require('express');
const controller = require('../controllers/juegos.controller');

const router = express.Router();

// Las rutas solo dicen "esta URL con este método la atiende este controller".
// OJO: /estadisticas va antes de /:id, si no Express pensaría que "estadisticas" es un id.
router.get('/estadisticas', controller.estadisticas);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

router.post('/:id/resenas', controller.agregarResena);

module.exports = router;
