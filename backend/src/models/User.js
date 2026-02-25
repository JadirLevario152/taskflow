const pool = require('../../server').pool;

const User = {
    // Crear un nuevo usuario
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

    // Buscar usuario por email
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    },

    // Buscar usuario por ID
    async findById(id) {
        const query = 'SELECT id, name, email, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = User;