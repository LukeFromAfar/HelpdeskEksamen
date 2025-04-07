const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply auth middleware to all routes
router.use(auth);

// User dashboard
router.get('/mydashboard', ticketController.userDashboard);

// Admin dashboard - only accessible by admins
router.get('/admin', roleCheck('admin'), ticketController.adminDashboard);

// Create new ticket
router.get('/create', ticketController.createTicketForm);
router.post('/create', apiLimiter, ticketController.createTicket);

// View ticket
router.get('/view/:id', ticketController.viewTicket);

// Edit ticket - only accessible by admins
router.get('/edit/:id', roleCheck('admin'), ticketController.editTicketForm);
router.post('/update/:id', roleCheck('admin'), apiLimiter, ticketController.updateTicket);

// Add comment to ticket
router.post('/comment/:id', apiLimiter, ticketController.addComment);

module.exports = router;
