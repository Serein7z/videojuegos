const juegosService = require('../services/juegos.service');


async function listar(req, res, next) {
  try {
    // Ahora responde { juegos, total, pagina, totalPaginas }
    const resultado = await juegosService.listar(req.query);
    res.json(resultado);
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

async function dashboard(req, res, next) {
  try {
    const datos = await juegosService.dashboard();
    res.json(datos);
  } catch (error) {
    next(error);
  }
}

async function resenasRecientes(req, res, next) {
  try {
    // ?limite=20 (máximo 50)
    const limite = Math.min(Number(req.query.limite) || 20, 50);
    const resenas = await juegosService.resenasRecientes(limite);
    res.json(resenas);
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
  estadisticas,
  dashboard,
  resenasRecientes
};