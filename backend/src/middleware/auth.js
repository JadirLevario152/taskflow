const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado' });
        }

        // Verificar token
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // Agregar usuario a la petición
        req.user = verified;
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

module.exports = authMiddleware;