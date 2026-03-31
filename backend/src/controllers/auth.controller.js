const servicioAutenticacion = require('../services/autenticacion.service');

async function register(req, res) {
  try {
    const { nombreUsuario, correoElectronico, contrasena } = req.body;

    if (!nombreUsuario || !correoElectronico || !contrasena) {
      return res.status(400).json({
        mensaje: 'nombreUsuario, correoElectronico y contrasena son requeridos.'
      });
    }

    const resultado = await servicioAutenticacion.registrar({
      nombreUsuario,
      correoElectronico,
      contrasena
    });

    return res.status(201).json(resultado);
  } catch (error) {
    const estado = error.statusCode || 500;
    return res.status(estado).json({ mensaje: error.message || 'Error interno.' });
  }
}

async function login(req, res) {
  try {
    const { nombreUsuarioOCorreo, contrasena } = req.body;

    if (!nombreUsuarioOCorreo || !contrasena) {
      return res.status(400).json({
        mensaje: 'nombreUsuarioOCorreo y contrasena son requeridos.'
      });
    }

    const resultado = await servicioAutenticacion.iniciarSesion({
      nombreUsuarioOCorreo,
      contrasena
    });

    return res.status(200).json(resultado);
  } catch (error) {
    const estado = error.statusCode || 500;
    return res.status(estado).json({ mensaje: error.message || 'Error interno.' });
  }
}

module.exports = {
  register,
  login
};
