const Ticket = require('../models/Ticket');
const User = require('../models/User');

const ticketController = {
  // User dashboard - show user's tickets
  userDashboard: async (req, res) => {
    try {
      // Only show non-closed tickets by default for users
      const tickets = await Ticket.find({ 
        user: req.user._id,
        status: { $ne: 'Lukket' } 
      }).sort({ createdAt: -1 });
      
      res.render('dashboard/user', { 
        title: 'Mitt dashbord', 
        user: req.user, 
        tickets 
      });
    } catch (error) {
      console.error('Error fetching user dashboard:', error);
      res.status(500).render('error', { 
        message: 'Error fetching dashboard data', 
        error: {} 
      });
    }
  },
  
  // Admin dashboard - show all tickets with stats
  adminDashboard: async (req, res) => {
    try {
      // Get all tickets for admin view
      const allTickets = await Ticket.find()
        .sort({ createdAt: -1 })
        .populate('user', 'name email');
      
      // Filter out closed tickets for statistics and default view
      const activeTickets = allTickets.filter(ticket => ticket.status !== 'Lukket');
      const closedTickets = allTickets.filter(ticket => ticket.status === 'Lukket');
      
      // Calculate stats - only for active tickets
      const openCount = activeTickets.filter(ticket => ticket.status === 'Åpen').length;
      const inProgressCount = activeTickets.filter(ticket => ticket.status === 'Under arbeid').length;
      const solvedCount = activeTickets.filter(ticket => ticket.status === 'Løst').length;
      
      // Priority stats - only for active tickets
      const highPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Høy').length;
      const mediumPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Medium').length;
      const lowPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Lav').length;
      
      res.render('dashboard/admin', { 
        title: 'Admin dashbord', 
        user: req.user, 
        tickets: allTickets, // Send all tickets to the view
        stats: {
          openCount,
          inProgressCount,
          solvedCount,
          highPriorityCount,
          mediumPriorityCount,
          lowPriorityCount,
          total: activeTickets.length,
          closed: closedTickets.length
        }
      });
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      res.status(500).render('error', { 
        message: 'Error fetching dashboard data', 
        error: {} 
      });
    }
  },
  
  // Render create ticket form
  createTicketForm: (req, res) => {
    res.render('tickets/create', { 
      title: 'Opprett ny henvendelse', 
      user: req.user 
    });
  },
  
  // Process new ticket
  createTicket: async (req, res) => {
    try {
      const { title, description, category } = req.body;
      
      const newTicket = new Ticket({
        title,
        description,
        category,
        user: req.user._id,
        history: [{
          action: 'Henvendelse opprettet',
          user: req.user._id,
          timestamp: new Date()
        }]
      });
      
      await newTicket.save();
      
      // Notify admins via socket.io
      req.io.to('admin_room').emit('new-ticket', {
        id: newTicket._id,
        title: newTicket.title,
        user: req.user.name
      });
      
      res.redirect('/api/tickets/mydashboard');
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).render('tickets/create', { 
        title: 'Opprett ny henvendelse', 
        user: req.user,
        error: 'Error creating ticket'
      });
    }
  },
  
  // View single ticket
  viewTicket: async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('user', 'name email')
        .populate('comments.user', 'name role')
        .populate('history.user', 'name role');
      
      if (!ticket) {
        return res.status(404).render('error', { 
          message: 'Ticket not found', 
          error: {} 
        });
      }
      
      // Check if user is allowed to view this ticket
      if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to view this ticket', 
          error: {} 
        });
      }
      
      res.render('tickets/view', { 
        title: 'Vis henvendelse', 
        user: req.user, 
        ticket 
      });
    } catch (error) {
      console.error('Error viewing ticket:', error);
      res.status(500).render('error', { 
        message: 'Error fetching ticket data', 
        error: {} 
      });
    }
  },
  
  // Render edit ticket form (admin only)
  editTicketForm: async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate('user', 'name email');
      
      if (!ticket) {
        return res.status(404).render('error', { 
          message: 'Ticket not found', 
          error: {} 
        });
      }
      
      res.render('tickets/edit', {
        title: 'Rediger henvendelse',
        user: req.user,
        ticket
      });
    } catch (error) {
      console.error('Error fetching ticket for edit:', error);
      res.status(500).render('error', { 
        message: 'Error fetching ticket data', 
        error: {} 
      });
    }
  },
  
  // Update ticket (admin only)
  updateTicket: async (req, res) => {
    try {
      const { status, priority } = req.body;
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).render('error', { 
          message: 'Ticket not found', 
          error: {} 
        });
      }
      
      // Add history entry for status change if status has changed
      if (ticket.status !== status) {
        ticket.history.push({
          action: `Status endret fra ${ticket.status} til ${status}`,
          user: req.user._id,
          timestamp: new Date()
        });
      }
      
      // Add history entry for priority change if priority has changed
      if (ticket.priority !== priority) {
        ticket.history.push({
          action: `Prioritet endret fra ${ticket.priority} til ${priority}`,
          user: req.user._id,
          timestamp: new Date()
        });
      }
      
      // Update ticket fields
      ticket.status = status;
      ticket.priority = priority;
      ticket.updatedAt = Date.now();
      
      await ticket.save();
      
      // Notify ticket owner via socket.io
      req.io.to(`user_${ticket.user}`).emit('ticket-updated', {
        id: ticket._id,
        status: ticket.status
      });
      
      res.redirect(`/api/tickets/view/${req.params.id}`);
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).render('error', { 
        message: 'Error updating ticket', 
        error: {} 
      });
    }
  },
  
  // Add comment to ticket
  addComment: async (req, res) => {
    try {
      const { text } = req.body;
      
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).render('error', { 
          message: 'Ticket not found', 
          error: {} 
        });
      }
      
      // Check if user is allowed to add comments
      if (req.user.role !== 'admin' && ticket.user.toString() !== req.user._id.toString()) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to comment on this ticket', 
          error: {} 
        });
      }
      
      // Add comment
      ticket.comments.push({
        text,
        user: req.user._id
      });
      
      // Add history entry for comment
      ticket.history.push({
        action: `Kommentar lagt til av ${req.user.role === 'admin' ? 'administrator' : 'bruker'}`,
        user: req.user._id,
        timestamp: new Date()
      });
      
      ticket.updatedAt = Date.now();
      
      await ticket.save();
      
      // Notify users via socket.io
      if (req.user.role === 'admin') {
        req.io.to(`user_${ticket.user}`).emit('new-comment', {
          ticketId: ticket._id,
          message: 'En admin har kommentert på henvendelsen din'
        });
      } else {
        req.io.to('admin_room').emit('new-comment', {
          ticketId: ticket._id,
          message: 'En bruker har kommentert på en henvendelse'
        });
      }
      
      res.redirect(`/api/tickets/view/${req.params.id}`);
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).render('error', { 
        message: 'Error adding comment', 
        error: {} 
      });
    }
  }
};

module.exports = ticketController;
