const ErrorApp = require('../utils/ErrorApp');

/**
 * Middleware global de manejo de errores para Express.
 * Captura cualquier error lanzado en la cadena de ejecución y devuelve
 * una respuesta JSON estandarizada.
 */
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Configuración para diferentes entornos
  if (process.env.NODE_ENV === 'development') {
    enviarErrorDev(err, res);
  } else {
    enviarErrorProd(err, res);
  }
};

/**
 * Respuesta detallada para el desarrollador en entorno de desarrollo.
 */
const enviarErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    mensaje: err.message,
    error: err,
    stack: err.stack,
    errorTecnico: err.errorTecnico || 'No se proporcionaron detalles técnicos.'
  });
};

/**
 * Respuesta simplificada y amigable para el usuario en entorno de producción.
 */
const enviarErrorProd = (err, res) => {
  // Errores operacionales (validaciones, autenticación, etc)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      mensaje: err.message
    });
  } 
  // Errores de programación o desconocidos (no filtran detalles técnicos)
  else {
    console.error('ERROR CRÍTICO 💥:', err);
    res.status(500).json({
      status: 'error',
      mensaje: 'Algo salió muy mal en el servidor. Por favor intenta más tarde.'
    });
  }
};

module.exports = errorMiddleware;
