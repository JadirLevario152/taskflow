const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Ruta de registro
router.post('/register', validateRegister, authController.register);

// Ruta de login
router.post('/login', validateLogin, authController.login);

module.exports = router;