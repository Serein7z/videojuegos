const express = require('express');
const controller = require('../controllers/juegos.controller');

const router = express.Router();


router.get('/estadisticas', controller.estadisticas);
router.get('/dashboard', controller.dashboard);
router.get('/resenas-recientes', controller.resenasRecientes);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

router.post('/:id/resenas', controller.agregarResena);

module.exports = router;