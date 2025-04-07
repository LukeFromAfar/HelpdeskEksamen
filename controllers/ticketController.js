const Ticket = require('../models/Ticket');
const User = require('../models/User');

const ticketController = {
  // User dashboard - show user's tickets
  userDashboard: async (req, res) => {
    try {
      const tickets = await Ticket.find({ user: req.user._id }).sort({ createdAt: -1 });
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
      const tickets = await Ticket.find().sort({ createdAt: -1 }).populate('user', 'name email');
      
      // Calculate stats
      const openCount = tickets.filter(ticket => ticket.status === 'Åpen').length;
      const inProgressCount = tickets.filter(ticket => ticket.status === 'Under arbeid').length;
      const solvedCount = tickets.filter(ticket => ticket.status === 'Løst').length;
      
      // Priority stats
      const highPriorityCount = tickets.filter(ticket => ticket.priority === 'Høy').length;
      const mediumPriorityCount = tickets.filter(ticket => ticket.priority === 'Medium').length;
      const lowPriorityCount = tickets.filter(ticket => ticket.priority === 'Lav').length;
      
      res.render('dashboard/admin', { 
        title: 'Admin dashbord', 
        user: req.user, 
        tickets,
        stats: {
          openCount,
          inProgressCount,
          solvedCount,
          highPriorityCount,
          mediumPriorityCount,
          lowPriorityCount,
          total: tickets.length
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
        user: req.user._id
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
        .populate('comments.user', 'name role');
      
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
      
      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        { 
          status, 
          priority,
          updatedAt: Date.now()
        },
        { new: true }
      );
      
      if (!ticket) {
        return res.status(404).render('error', { 
          message: 'Ticket not found', 
          error: {} 
        });
      }
      
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
      
      ticket.comments.push({
        text,
        user: req.user._id
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
