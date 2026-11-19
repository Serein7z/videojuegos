const juegosService = require('../services/juegos.service');

// Los controllers reciben la petición (req), llaman al service
// y arman la respuesta (res). No tocan la base de datos directamente.

async function listar(req, res, next) {
  try {
    const juegos = await juegosService.listar(req.query);
    res.json(juegos);
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const juego = await juegosService.obtenerPorId(req.params.id);
    if (!juego) {
      return res.status(404).json({ mensaje: 'Juego no encontrado' });
    }
    res.json(juego);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const juego = await juegosService.crear(req.body);
    res.status(201).json(juego);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const juego = await juegosService.actualizar(req.params.id, req.body);
    if (!juego) {
      return res.status(404).json({ mensaje: 'Juego no encontrado' });
    }
    res.json(juego);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const juego = await juegosService.eliminar(req.params.id);
    if (!juego) {
      return res.status(404).json({ mensaje: 'Juego no encontrado' });
    }
    res.json({ mensaje: 'Juego eliminado' });
  } catch (error) {
    next(error);
  }
}

async function agregarResena(req, res, next) {
  try {
    const juego = await juegosService.agregarResena(req.params.id, req.body);
    if (!juego) {
      return res.status(404).json({ mensaje: 'Juego no encontrado' });
    }
    res.status(201).json(juego);
  } catch (error) {
    next(error);
  }
}

async function estadisticas(req, res, next) {
  try {
    const datos = await juegosService.estadisticas();
    res.json(datos);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  eliminar,
  agregarResena,
  estadisticas
};
