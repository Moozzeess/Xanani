const authService = require('../services/auth.service');

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email y password son requeridos.' });
    }

    const result = await authService.register({ username, email, password });
    return res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Error interno.' });
  }
}

async function login(req, res) {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res
        .status(400)
        .json({ message: 'usernameOrEmail y password son requeridos.' });
    }

    const result = await authService.login({ usernameOrEmail, password });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Error interno.' });
  }
}

module.exports = {
  register,
  login
};
