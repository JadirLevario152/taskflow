const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const authController = {
    // REGISTRO de usuario
    async register(req, res) {
        try {
            // Validar datos de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    message: 'Datos inválidos', 
                    errors: errors.array() 
                });
            }

            const { name, email, password } = req.body;

            // Verificar si el usuario ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'El email ya está registrado' 
                });
            }

            // Encriptar contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Crear usuario
            const newUser = await User.create(name, email, hashedPassword);

            // Crear token JWT
            const token = jwt.sign(
                { id: newUser.id, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Responder
            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                user: newUser,
                token
            });

        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ 
                message: 'Error en el servidor', 
                error: error.message 
            });
        }
    },

    // LOGIN de usuario
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    message: 'Datos inválidos', 
                    errors: errors.array() 
                });
            }

            const { email, password } = req.body;

            // Buscar usuario
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ 
                    message: 'Credenciales inválidas' 
                });
            }

            // Verificar contraseña
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ 
                    message: 'Credenciales inválidas' 
                });
            }

            // Crear token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // No enviar la contraseña
            delete user.password;

            res.json({
                message: 'Login exitoso',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                token
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ 
                message: 'Error en el servidor' 
            });
        }
    }
};

module.exports = authController;