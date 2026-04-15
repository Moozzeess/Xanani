module.exports = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user || !rolesPermitidos.includes(user.role)) {
                return res.status(403).json({
                    mensaje: 'No tienes permisos para realizar esta acción'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                mensaje: 'Error en autorización',
                error: error.message
            });
        }
    };
};