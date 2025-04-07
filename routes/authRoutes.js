const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

// GET routes for rendering pages
router.get('/login', authController.loginPage);
router.get('/register', authController.registerPage);

// POST routes for form submissions - apply rate limiting to login
router.post('/login', loginLimiter, authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

module.exports = router;
