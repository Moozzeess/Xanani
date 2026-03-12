/**
 * Envoltorio para controladores asíncronos que elimina la necesidad de try/catch repetitivos.
 * Cualquier error capturado es enviado automáticamente al middleware de errores mediante next().
 */
const catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
