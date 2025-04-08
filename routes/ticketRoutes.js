const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeTicket, sanitizeComment, sanitizeParams } = require('../middleware/sanitizer');

// Apply auth middleware to all routes
router.use(auth);

// User dashboard
router.get('/mydashboard', ticketController.userDashboard);

// Admin dashboard - only accessible by admins
router.get('/admin', roleCheck('admin'), ticketController.adminDashboard);

// Create new ticket
router.get('/create', ticketController.createTicketForm);
router.post('/create', apiLimiter, sanitizeTicket, ticketController.createTicket);

// View ticket
router.get('/view/:id', sanitizeParams, ticketController.viewTicket);

// Edit ticket - only accessible by admins
router.get('/edit/:id', roleCheck('admin'), sanitizeParams, ticketController.editTicketForm);
router.post('/update/:id', roleCheck('admin'), apiLimiter, sanitizeParams, sanitizeTicket, ticketController.updateTicket);

// Add comment to ticket
router.post('/comment/:id', apiLimiter, sanitizeParams, sanitizeComment, ticketController.addComment);

module.exports = router;
