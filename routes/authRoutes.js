const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const { sanitizeUserRegistration, sanitizeLogin } = require('../middleware/sanitizer');

// GET routes for rendering pages
router.get('/login', authController.loginPage);
router.get('/register', authController.registerPage);

// POST routes for form submissions - apply rate limiting to login
router.post('/login', loginLimiter, sanitizeLogin, authController.login);
router.post('/register', sanitizeUserRegistration, authController.register);
router.post('/logout', authController.logout);

module.exports = router;
