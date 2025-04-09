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

// Admin dashboard - accessible by admins, 1. linje and 2. linje
router.get('/admin', roleCheck(['admin', '1. linje', '2. linje']), ticketController.adminDashboard);

// Create new ticket
router.get('/create', ticketController.createTicketForm);
router.post('/create', apiLimiter, sanitizeTicket, ticketController.createTicket);

// View ticket
router.get('/view/:id', sanitizeParams, ticketController.viewTicket);

// Edit ticket - accessible by admins, 1. linje and 2. linje
router.get('/edit/:id', roleCheck(['admin', '1. linje', '2. linje']), sanitizeParams, ticketController.editTicketForm);
router.post('/update/:id', roleCheck(['admin', '1. linje', '2. linje']), sanitizeParams, apiLimiter, sanitizeTicket, ticketController.updateTicket);

// Add comment to ticket
router.post('/comment/:id', apiLimiter, sanitizeParams, sanitizeComment, ticketController.addComment);

// Debug endpoint to check ticket data (temporary, should be removed in production)
router.get('/debug/:id', (req, res) => {
  const Ticket = require('../models/Ticket');
  Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .then(ticket => {
      if (!ticket) {
        return res.json({ error: 'Ticket not found' });
      }
      // Return sanitized ticket data for debugging
      const debugData = {
        id: ticket._id,
        title: ticket.title,
        status: ticket.status,
        hasFeedback: ticket.hasFeedback || false,
        feedbackExists: ticket.feedback ? true : false,
        feedbackRating: ticket.feedback ? ticket.feedback.rating : null,
        userId: ticket.user ? ticket.user._id : null,
        userEmail: ticket.user ? ticket.user.email : null,
        currentUserId: req.user._id
      };
      res.json(debugData);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Add feedback to solved ticket
router.post('/feedback/:id', apiLimiter, sanitizeParams, ticketController.addFeedback);

module.exports = router;
