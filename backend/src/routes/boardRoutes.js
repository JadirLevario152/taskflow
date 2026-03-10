const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const authMiddleware = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD de tableros
router.post('/', boardController.create);
router.get('/', boardController.getAll);
router.get('/:id', boardController.getOne);
router.put('/:id', boardController.update);
router.delete('/:id', boardController.delete);

module.exports = router;