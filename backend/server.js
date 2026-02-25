const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

// Conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD),
    port: process.env.DB_PORT,
});

// Probar conexión a la BD
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error conectando a PostgreSQL:', err);
    } else {
        console.log('✅ Conectado a PostgreSQL');
        release();
    }
});

// Exportar pool para usarlo en otros archivos
module.exports.pool = pool;

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// MODELOS
// ============================================
const User = {
    async create(name, email, hashedPassword) {
        const query = `
            INSERT INTO users (name, email, password) 
            VALUES ($1, $2, $3) 
            RETURNING id, name, email, created_at
        `;
        const values = [name, email, hashedPassword];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    async findById(id) {
        const query = 'SELECT id, name, email, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

const Board = {
    async create(name, description, userId) {
        const query = `
            INSERT INTO boards (name, description, user_id) 
            VALUES ($1, $2, $3) 
            RETURNING id, name, description, user_id, created_at
        `;
        const values = [name, description, userId];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async findByUser(userId) {
        const query = `
            SELECT * FROM boards 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    async findById(id, userId) {
        const query = `
            SELECT * FROM boards 
            WHERE id = $1 AND user_id = $2
        `;
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    },

    async update(id, name, description, userId) {
        const query = `
            UPDATE boards 
            SET name = $1, description = $2 
            WHERE id = $3 AND user_id = $4
            RETURNING *
        `;
        const values = [name, description, id, userId];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async delete(id, userId) {
        const query = 'DELETE FROM boards WHERE id = $1 AND user_id = $2 RETURNING id';
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    }
};

// ============================================
// MIDDLEWARES
// ============================================
const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado' });
        }

        const jwt = require('jsonwebtoken');
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// ============================================
// CONTROLADORES DE AUTENTICACIÓN
// ============================================
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = await User.create(name, email, hashedPassword);

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: newUser,
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

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
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ============================================
// CONTROLADORES DE BOARDS
// ============================================

// Crear tablero
app.post('/api/boards', authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ message: 'El nombre del tablero es obligatorio' });
        }

        const newBoard = await Board.create(name, description, userId);
        
        res.status(201).json({
            message: 'Tablero creado exitosamente',
            board: newBoard
        });
    } catch (error) {
        console.error('Error creando tablero:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener todos los tableros
app.get('/api/boards', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const boards = await Board.findByUser(userId);
        
        res.json({
            message: 'Tableros obtenidos',
            boards
        });
    } catch (error) {
        console.error('Error obteniendo tableros:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener un tablero por ID
app.get('/api/boards/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const board = await Board.findById(id, userId);
        
        if (!board) {
            return res.status(404).json({ message: 'Tablero no encontrado' });
        }

        res.json({ board });
    } catch (error) {
        console.error('Error obteniendo tablero:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar tablero
app.put('/api/boards/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ message: 'El nombre del tablero es obligatorio' });
        }

        const updatedBoard = await Board.update(id, name, description, userId);
        
        if (!updatedBoard) {
            return res.status(404).json({ message: 'Tablero no encontrado' });
        }

        res.json({
            message: 'Tablero actualizado',
            board: updatedBoard
        });
    } catch (error) {
        console.error('Error actualizando tablero:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar tablero
app.delete('/api/boards/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const deletedBoard = await Board.delete(id, userId);
        
        if (!deletedBoard) {
            return res.status(404).json({ message: 'Tablero no encontrado' });
        }

        res.json({ message: 'Tablero eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando tablero:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ============================================
// RUTAS DE PRUEBA
// ============================================
app.get('/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            message: '✅ Base de datos conectada', 
            time: result.rows[0].now 
        });
    } catch (error) {
        res.status(500).json({ 
            message: '❌ Error en base de datos', 
            error: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 TaskFlow API',
        version: '1.0.0',
        endpoints: {
            registro: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            boards: {
                crear: 'POST /api/boards (token requerido)',
                listar: 'GET /api/boards (token requerido)',
                obtener: 'GET /api/boards/:id (token requerido)',
                actualizar: 'PUT /api/boards/:id (token requerido)',
                eliminar: 'DELETE /api/boards/:id (token requerido)'
            },
            test: 'GET /test'
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});