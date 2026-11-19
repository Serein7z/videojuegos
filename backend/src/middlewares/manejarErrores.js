// Cuando un controller hace next(error), la petición llega aquí.
// Así los errores se responden en un solo lugar, siempre con el mismo formato.
function manejarErrores(error, req, res, next) {
  // El id que llegó en la URL no tiene formato de ObjectId
  if (error.name === 'CastError') {
    return res.status(400).json({ mensaje: 'El id no es válido' });
  }

  // Falló alguna regla del modelo (campo requerido, rango, etc.)
  if (error.name === 'ValidationError') {
    return res.status(400).json({ mensaje: error.message });
  }

  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = manejarErrores;
