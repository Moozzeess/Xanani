const servicioAutenticacion = require('../services/autenticacion.service');

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        mensaje: 'username, email y password son requeridos.'
      });
    }

    const resultado = await servicioAutenticacion.registrar({
      username,
      email,
      password
    });

    return res.status(201).json(resultado);
  } catch (error) {
    const estado = error.statusCode || 500;
    return res.status(estado).json({ mensaje: error.message || 'Error interno.' });
  }
}

async function login(req, res) {
  try {
    // Compatible con master (usernameOrEmail) y cambios-estructura (usernameOCorreo)
    const usernameOCorreo = req.body.usernameOrEmail || req.body.usernameOCorreo;
    const { password } = req.body;

    if (!usernameOCorreo || !password) {
      return res.status(400).json({
        mensaje: 'username/email y password son requeridos.'
      });
    }

    const resultado = await servicioAutenticacion.iniciarSesion({
      usernameOCorreo,
      password
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
