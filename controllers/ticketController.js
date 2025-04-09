const Ticket = require('../models/Ticket');
const User = require('../models/User');

const ticketController = {
  // User dashboard - show user's tickets
  userDashboard: async (req, res) => {
    try {
      // Only show non-closed tickets by default for users
      const tickets = await Ticket.find({ 
        user: req.user._id
      }).sort({ createdAt: -1 });
      
      // Separate active and closed tickets
      const activeTickets = tickets.filter(ticket => ticket.status !== 'Lukket');
      const closedTickets = tickets.filter(ticket => ticket.status === 'Lukket');
      
      res.render('dashboard/user', { 
        title: 'Mitt dashbord', 
        user: req.user, 
        activeTickets,
        closedTickets,
        path: req.path // Add current path for navbar highlighting
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
      // Get pagination parameters from query string
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Number of tickets per page
      const skip = (page - 1) * limit;
      
      // Get sorting parameters
      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      // Get filter parameters
      const statusFilter = req.query.status || '';
      const priorityFilter = req.query.priority || '';
      const categoryFilter = req.query.category || '';
      const assignedToFilter = req.query.assignedTo || ''; // New filter parameter
      const searchQuery = req.query.search || '';
      
      // Set up filter conditions
      const filterConditions = {};
      if (statusFilter && statusFilter !== 'all') {
        filterConditions.status = statusFilter;
      }
      if (priorityFilter) {
        filterConditions.priority = priorityFilter;
      }
      if (categoryFilter) {
        filterConditions.category = categoryFilter;
      }

      // Handle assignedTo filter
      if (assignedToFilter) {
        if (assignedToFilter === 'none') {
          // If filter is 'none', find tickets with no assignedTo or empty assignedTo
          filterConditions.$or = [
            { assignedTo: { $exists: false } },
            { assignedTo: null },
            { assignedTo: '' }
          ];
        } else {
          // Otherwise, filter by the specific role
          filterConditions.assignedTo = assignedToFilter;
        }
      }
      
      // Add search query handling
      if (searchQuery) {
        // Create a case-insensitive regex for search
        const searchRegex = new RegExp(searchQuery, 'i');
        
        // First find users matching the search
        const matchingUsers = await User.find({ name: searchRegex }, '_id');
        const userIds = matchingUsers.map(user => user._id);
        
        // Set up $or conditions for search across multiple fields
        const searchConditions = [
          { title: searchRegex },
          { _id: searchQuery.match(/^[0-9a-fA-F]{24}$/) ? searchQuery : null }
        ];
        
        // Add user IDs to search if we found matching users
        if (userIds.length > 0) {
          searchConditions.push({ user: { $in: userIds } });
        }
        
        // If we already have $or conditions (for assignedTo: none), we need to combine them
        if (filterConditions.$or) {
          const assignedToConditions = filterConditions.$or;
          delete filterConditions.$or;
          filterConditions.$and = [
            { $or: assignedToConditions },
            { $or: searchConditions }
          ];
        } else {
          filterConditions.$or = searchConditions;
        }
      }

      // Get total count for pagination based on filters
      const totalTickets = await Ticket.countDocuments(filterConditions);
      const totalPages = Math.ceil(totalTickets / limit);
      
      // Special handling for priority field - we need a custom sort order
      if (sortField === 'priority') {
        // Correct priority sorting with custom order
        // For priority, we'll use a custom pipeline to ensure correct ordering
        const allTickets = await Ticket.aggregate([
          { $match: filterConditions },
          {
            $addFields: {
              priorityOrder: {
                $cond: { 
                  if: { $eq: ["$priority", "Lav"] }, 
                  then: 1, 
                  else: { 
                    $cond: { 
                      if: { $eq: ["$priority", "Medium"] }, 
                      then: 2, 
                      else: 3  // Høy
                    } 
                  } 
                }
              }
            }
          },
          { $sort: { priorityOrder: sortOrder } },
          { $skip: skip },
          { $limit: limit }
        ]);
        
        // Now populate the user field since aggregate doesn't support populate
        const populatedTickets = await Ticket.populate(allTickets, { path: 'user', select: 'name email' });
        
        // Get all tickets for statistics (no pagination)
        const allTicketsForStats = await Ticket.find();
        
        // Filter out closed tickets for statistics and default view
        const activeTickets = allTicketsForStats.filter(ticket => ticket.status !== 'Lukket');
        const closedTickets = allTicketsForStats.filter(ticket => ticket.status === 'Lukket');
        
        // Calculate stats - only for active tickets
        const openCount = activeTickets.filter(ticket => ticket.status === 'Åpen').length;
        const inProgressCount = activeTickets.filter(ticket => ticket.status === 'Under arbeid').length;
        const solvedCount = activeTickets.filter(ticket => ticket.status === 'Løst').length;
        
        // Priority stats - only for active tickets
        const highPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Høy').length;
        const mediumPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Medium').length;
        const lowPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Lav').length;
        
        // Calculate stats for roles
        const firstLineCount = activeTickets.filter(ticket => ticket.assignedTo === '1. linje').length;
        const secondLineCount = activeTickets.filter(ticket => ticket.assignedTo === '2. linje').length;
        const adminAssignedCount = activeTickets.filter(ticket => ticket.assignedTo === 'admin').length;
        const unassignedCount = activeTickets.filter(ticket => !ticket.assignedTo).length;
        
        // Calculate stats for solved tickets by role
        const firstLineSolved = activeTickets.filter(ticket => 
          ticket.assignedTo === '1. linje' && ticket.status === 'Løst').length;
        const secondLineSolved = activeTickets.filter(ticket => 
          ticket.assignedTo === '2. linje' && ticket.status === 'Løst').length;
        const adminSolved = activeTickets.filter(ticket => 
          ticket.assignedTo === 'admin' && ticket.status === 'Løst').length;
        
        return res.render('dashboard/admin', { 
          title: 'Admin dashbord', 
          user: req.user, 
          tickets: populatedTickets, 
          currentPage: page,
          totalPages: totalPages,
          totalTickets: totalTickets,
          sortField: sortField,
          sortOrder: req.query.sortOrder || 'desc',
          statusFilter,
          priorityFilter,
          categoryFilter,
          assignedToFilter, // Pass the filter value to the template
          search: searchQuery, // Pass search query to template
          stats: {
            openCount,
            inProgressCount,
            solvedCount,
            highPriorityCount,
            mediumPriorityCount,
            lowPriorityCount,
            // Add new role stats
            firstLineCount,
            secondLineCount,
            adminAssignedCount,
            unassignedCount,
            firstLineSolved,
            secondLineSolved,
            adminSolved,
            total: activeTickets.length,
            closed: closedTickets.length
          },
          path: req.path // Add current path for navbar highlighting
        });
      } 
      // Special handling for user name field
      else if (sortField === 'user.name') {
        // Fix user name sorting
        try {
          const allTickets = await Ticket.aggregate([
            { $match: filterConditions },
            {
              $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userObject'
              }
            },
            { $unwind: '$userObject' },
            { 
              $sort: { 'userObject.name': sortOrder } 
            },
            { $skip: skip },
            { $limit: limit }
          ]);
          
          // Populate the full user data
          const populatedTickets = await Ticket.populate(allTickets, {
            path: 'user',
            select: 'name email role'
          });
          
          // Get all tickets for statistics (no pagination)
          const allTicketsForStats = await Ticket.find();
          
          // Filter out closed tickets for statistics
          const activeTickets = allTicketsForStats.filter(ticket => ticket.status !== 'Lukket');
          const closedTickets = allTicketsForStats.filter(ticket => ticket.status === 'Lukket');
          
          // Calculate stats - only for active tickets
          const openCount = activeTickets.filter(ticket => ticket.status === 'Åpen').length;
          const inProgressCount = activeTickets.filter(ticket => ticket.status === 'Under arbeid').length;
          const solvedCount = activeTickets.filter(ticket => ticket.status === 'Løst').length;
          
          // Priority stats - only for active tickets
          const highPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Høy').length;
          const mediumPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Medium').length;
          const lowPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Lav').length;
          
          // Calculate stats for roles
          const firstLineCount = activeTickets.filter(ticket => ticket.assignedTo === '1. linje').length;
          const secondLineCount = activeTickets.filter(ticket => ticket.assignedTo === '2. linje').length;
          const adminAssignedCount = activeTickets.filter(ticket => ticket.assignedTo === 'admin').length;
          const unassignedCount = activeTickets.filter(ticket => !ticket.assignedTo).length;
          
          // Calculate stats for solved tickets by role
          const firstLineSolved = activeTickets.filter(ticket => 
            ticket.assignedTo === '1. linje' && ticket.status === 'Løst').length;
          const secondLineSolved = activeTickets.filter(ticket => 
            ticket.assignedTo === '2. linje' && ticket.status === 'Løst').length;
          const adminSolved = activeTickets.filter(ticket => 
            ticket.assignedTo === 'admin' && ticket.status === 'Løst').length;
          
          return res.render('dashboard/admin', { 
            title: 'Admin dashbord', 
            user: req.user, 
            tickets: populatedTickets, 
            currentPage: page,
            totalPages: totalPages,
            totalTickets: totalTickets,
            sortField: sortField,
            sortOrder: req.query.sortOrder || 'desc',
            statusFilter,
            priorityFilter,
            categoryFilter,
            assignedToFilter, // Pass the filter value to the template
            search: searchQuery, // Pass search query to template
            stats: {
              openCount,
              inProgressCount,
              solvedCount,
              highPriorityCount,
              mediumPriorityCount,
              lowPriorityCount,
              // Add new role stats
              firstLineCount,
              secondLineCount,
              adminAssignedCount,
              unassignedCount,
              firstLineSolved,
              secondLineSolved,
              adminSolved,
              total: activeTickets.length,
              closed: closedTickets.length
            },
            path: req.path // Add current path for navbar highlighting
          });
        } catch (error) {
          console.error('Error in user.name sorting:', error);
          // Fall back to default sorting if aggregation fails
          sortObj = { createdAt: -1 };
        }
      }
      
      // Standard handling for other fields
      const sortObj = {};
      sortObj[sortField] = sortOrder;
      
      // Get all tickets for admin view with pagination and sorting
      const allTickets = await Ticket.find(filterConditions)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email');
      
      // Get all tickets for statistics (no pagination)
      const allTicketsForStats = await Ticket.find();
      
      // Filter out closed tickets for statistics and default view
      const activeTickets = allTicketsForStats.filter(ticket => ticket.status !== 'Lukket');
      const closedTickets = allTicketsForStats.filter(ticket => ticket.status === 'Lukket');
      
      // Calculate stats - only for active tickets
      const openCount = activeTickets.filter(ticket => ticket.status === 'Åpen').length;
      const inProgressCount = activeTickets.filter(ticket => ticket.status === 'Under arbeid').length;
      const solvedCount = activeTickets.filter(ticket => ticket.status === 'Løst').length;
      
      // Priority stats - only for active tickets
      const highPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Høy').length;
      const mediumPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Medium').length;
      const lowPriorityCount = activeTickets.filter(ticket => ticket.priority === 'Lav').length;
      
      // Calculate stats for roles
      const firstLineCount = activeTickets.filter(ticket => ticket.assignedTo === '1. linje').length;
      const secondLineCount = activeTickets.filter(ticket => ticket.assignedTo === '2. linje').length;
      const adminAssignedCount = activeTickets.filter(ticket => ticket.assignedTo === 'admin').length;
      const unassignedCount = activeTickets.filter(ticket => !ticket.assignedTo).length;
      
      // Calculate stats for solved tickets by role
      const firstLineSolved = activeTickets.filter(ticket => 
        ticket.assignedTo === '1. linje' && ticket.status === 'Løst').length;
      const secondLineSolved = activeTickets.filter(ticket => 
        ticket.assignedTo === '2. linje' && ticket.status === 'Løst').length;
      const adminSolved = activeTickets.filter(ticket => 
        ticket.assignedTo === 'admin' && ticket.status === 'Løst').length;
      
      res.render('dashboard/admin', { 
        title: 'Admin dashbord', 
        user: req.user, 
        tickets: allTickets,
        currentPage: page,
        totalPages: totalPages,
        totalTickets: totalTickets,
        sortField: sortField,
        sortOrder: req.query.sortOrder || 'desc',
        statusFilter,
        priorityFilter,
        categoryFilter,
        assignedToFilter, // Pass the filter value to the template
        search: searchQuery, // Pass search query to template
        stats: {
          openCount,
          inProgressCount,
          solvedCount,
          highPriorityCount,
          mediumPriorityCount,
          lowPriorityCount,
          // Add new role stats
          firstLineCount,
          secondLineCount,
          adminAssignedCount,
          unassignedCount,
          firstLineSolved,
          secondLineSolved,
          adminSolved,
          total: activeTickets.length,
          closed: closedTickets.length
        },
        path: req.path // Add current path for navbar highlighting
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
      user: req.user,
      path: req.path // Add current path for navbar highlighting
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
      // Allow admin, 1. linje, and 2. linje roles to view all tickets
      // Regular users can only view their own tickets
      if (!['admin', '1. linje', '2. linje'].includes(req.user.role) && 
          ticket.user && 
          ticket.user._id && 
          ticket.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to view this ticket', 
          error: {} 
        });
      }
      
      res.render('tickets/view', { 
        title: 'Vis henvendelse', 
        user: req.user, 
        ticket,
        path: req.path // Add current path for navbar highlighting
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
        ticket,
        path: req.path // Add current path for navbar highlighting
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
      const { status, priority, assignedTo } = req.body;
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
      
      // Add history entry for assignment change if assignment has changed
      if (ticket.assignedTo !== assignedTo) {
        const fromText = ticket.assignedTo ? ticket.assignedTo : 'Ikke tildelt';
        const toText = assignedTo ? assignedTo : 'Ikke tildelt';
        
        ticket.history.push({
          action: `Tildeling endret fra ${fromText} til ${toText}`,
          user: req.user._id,
          timestamp: new Date()
        });
      }
      
      // Update ticket fields
      ticket.status = status;
      ticket.priority = priority;
      ticket.assignedTo = assignedTo;
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
      // Allow admin, 1. linje, and 2. linje to comment on any ticket
      // Regular users can only comment on their own tickets
      if (!['admin', '1. linje', '2. linje'].includes(req.user.role) && 
          ticket.user.toString() !== req.user._id.toString()) {
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
        action: `Kommentar lagt til av ${req.user.role === 'admin' ? 'administrator' : req.user.role === '1. linje' ? '1. linje' : req.user.role === '2. linje' ? '2. linje' : 'bruker'}`,
        user: req.user._id,
        timestamp: new Date()
      });
      
      ticket.updatedAt = Date.now();
      
      await ticket.save();
      
      // Notify users via socket.io
      if (['admin', '1. linje', '2. linje'].includes(req.user.role)) {
        req.io.to(`user_${ticket.user}`).emit('new-comment', {
          ticketId: ticket._id,
          message: `En ${req.user.role} har kommentert på henvendelsen din`
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
