const Board = require('../models/Board');

const boardController = {
    // Crear tablero
    async create(req, res) {
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
    },

    // Obtener todos los tableros del usuario
    async getAll(req, res) {
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
    },

    // Obtener un tablero por ID
    async getOne(req, res) {
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
    },

    // Actualizar tablero
    async update(req, res) {
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
    },

    // Eliminar tablero
    async delete(req, res) {
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
    }
};

module.exports = boardController;