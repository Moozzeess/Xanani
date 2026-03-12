/**
 * Clase personalizada para manejar errores de la aplicación.
 * Permite capturar el código de estado HTTP y distinguir entre errores
 * operacionales y errores de programación (bugs).
 */
class ErrorApp extends Error {
  /**
   * Crea una instancia de ErrorApp.
   * @param {string} mensaje - Mensaje amigable para el usuario.
   * @param {number} statusCode - Código de estado HTTP (400, 401, 404, 500, etc).
   * @param {string} errorTecnico - Detalles técnicos opcionales para el desarrollador.
   */
  constructor(mensaje, statusCode, errorTecnico = null) {
    super(mensaje);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fallo' : 'error';
    this.isOperational = true; // Indica que es un error previsto (validaciones, etc)
    this.errorTecnico = errorTecnico;

    // Captura la pila de llamadas para debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorApp;
