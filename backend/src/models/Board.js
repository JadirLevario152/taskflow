const pool = require('../../server').pool;

const Board = {
    // Crear un nuevo tablero
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

    // Obtener todos los tableros de un usuario
    async findByUser(userId) {
        const query = `
            SELECT * FROM boards 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    // Obtener un tablero por ID
    async findById(id, userId) {
        const query = `
            SELECT * FROM boards 
            WHERE id = $1 AND user_id = $2
        `;
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    },

    // Actualizar un tablero
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

    // Eliminar un tablero
    async delete(id, userId) {
        const query = 'DELETE FROM boards WHERE id = $1 AND user_id = $2 RETURNING id';
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    }
};

module.exports = Board;