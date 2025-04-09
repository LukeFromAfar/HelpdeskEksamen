const User = require('../models/User');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

// Special ID for deleted users
const DELETED_USER_ID = '000000000000000000000000'; // 24 zeros - valid MongoDB ObjectId format

const userManagementController = {
  // Admin user dashboard - show all users with stats and filters
  adminUserDashboard: async (req, res) => {
    try {
      // Get pagination parameters from query string
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Number of users per page
      const skip = (page - 1) * limit;
      
      // Get sorting parameters
      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      // Get filter parameters
      const roleFilter = req.query.role || '';
      const searchQuery = req.query.search || '';
      
      // Set up filter conditions
      const filterConditions = {};
      if (roleFilter) {
        filterConditions.role = roleFilter;
      }
      
      // Add search query handling
      if (searchQuery) {
        // Create a case-insensitive regex for search
        const searchRegex = new RegExp(searchQuery, 'i');
        
        // Search by name, email, or ID
        filterConditions.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
        
        // If search query looks like MongoDB ID, add that to the search
        if (searchQuery.match(/^[0-9a-fA-F]{24}$/)) {
          filterConditions.$or.push({ _id: searchQuery });
        }
      }
      
      // Get total count for pagination based on filters
      const totalUsers = await User.countDocuments(filterConditions);
      const totalPages = Math.ceil(totalUsers / limit);
      
      // Set up sorting
      const sortObj = {};
      sortObj[sortField] = sortOrder;
      
      // Get all users for admin view with pagination and sorting
      const users = await User.find(filterConditions)
        .sort(sortObj)
        .skip(skip)
        .limit(limit);
      
      // Get user role statistics
      const allUsers = await User.find({});
      const adminCount = allUsers.filter(user => user.role === 'admin').length;
      const firstLineCount = allUsers.filter(user => user.role === '1. linje').length;
      const secondLineCount = allUsers.filter(user => user.role === '2. linje').length;
      const userCount = allUsers.filter(user => user.role === 'user').length;
      
      res.render('dashboard/userAdmin', { 
        title: 'Brukeradministrasjon', 
        user: req.user, 
        users,
        currentPage: page,
        totalPages: totalPages,
        totalUsers: totalUsers,
        sortField: sortField,
        sortOrder: req.query.sortOrder || 'desc',
        roleFilter,
        search: searchQuery,
        query: req.query, // Pass query parameters to template
        stats: {
          adminCount,
          firstLineCount,
          secondLineCount,
          userCount,
          total: allUsers.length
        }
      });
    } catch (error) {
      console.error('Error fetching user admin dashboard:', error);
      res.status(500).render('error', { 
        message: 'Error fetching user data', 
        error: {} 
      });
    }
  },
  
  // Render edit user form (admin only)
  editUserForm: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).render('error', { 
          message: 'User not found', 
          error: {} 
        });
      }
      
      res.render('users/edit', {
        title: 'Rediger bruker',
        user: req.user,
        editUser: user
      });
    } catch (error) {
      console.error('Error fetching user for edit:', error);
      res.status(500).render('error', { 
        message: 'Error fetching user data', 
        error: {} 
      });
    }
  },
  
  // Update user (admin only)
  updateUser: async (req, res) => {
    try {
      const { name, email, role } = req.body;
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).render('error', { 
          message: 'User not found', 
          error: {} 
        });
      }
      
      // Update user fields
      user.name = name;
      user.email = email;
      user.role = role;
      
      await user.save();
      
      // Instead of using req.session which is undefined, just redirect
      return res.redirect('/api/users/admin?success=true');
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).render('error', { 
        message: 'Error updating user', 
        error: {} 
      });
    }
  },
  
  // Delete user but keep their tickets (admin only)
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Prevent deleting the currently logged in user
      if (userId === req.user._id.toString()) {
        return res.status(400).render('error', { 
          message: 'Du kan ikke slette din egen brukerkonto', 
          error: {} 
        });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).render('error', { 
          message: 'Bruker ikke funnet', 
          error: {} 
        });
      }
      
      console.log(`Attempting to delete user: ${user.email}`);
      
      // Check if we need to create a placeholder deleted user
      let deletedUser = await User.findById(DELETED_USER_ID).lean();
      
      if (!deletedUser) {
        try {
          // Create a placeholder user for deleted accounts if it doesn't exist
          // Fix: Use new mongoose.Types.ObjectId() instead of mongoose.Types.ObjectId()
          deletedUser = new User({
            _id: new mongoose.Types.ObjectId(DELETED_USER_ID),
            name: '[Slettet bruker]',
            email: 'deleted@system.internal',
            password: await require('argon2').hash(Math.random().toString(36).substring(2)),
            role: 'user',
            createdAt: new Date()
          });
          
          await deletedUser.save();
          console.log('Created placeholder for deleted users');
        } catch (err) {
          // Handle potential duplicate key error, but continue with the deletion
          console.error('Error creating deleted user placeholder:', err);
          
          // If we couldn't create the deleted user, fetch it again (might have been created in parallel)
          deletedUser = await User.findById(DELETED_USER_ID);
          
          if (!deletedUser) {
            throw new Error('Could not create or find deleted user placeholder');
          }
        }
      }
      
      console.log('Updating tickets to reference deleted user');
      
      // Update all tickets owned by this user to reference the deleted user
      const ticketUpdateResult = await Ticket.updateMany(
        { user: userId },
        { $set: { user: DELETED_USER_ID } }
      );
      
      console.log(`Updated ${ticketUpdateResult.modifiedCount} tickets`);
      
      // Update all comments by this user to reference the deleted user
      const commentUpdateResult = await Ticket.updateMany(
        { 'comments.user': userId },
        { $set: { 'comments.$[elem].user': DELETED_USER_ID } },
        { arrayFilters: [{ 'elem.user': userId }] }
      );
      
      console.log(`Updated comments in ${commentUpdateResult.modifiedCount} tickets`);
      
      // Update all history entries by this user
      const historyUpdateResult = await Ticket.updateMany(
        { 'history.user': userId },
        { $set: { 'history.$[elem].user': DELETED_USER_ID } },
        { arrayFilters: [{ 'elem.user': userId }] }
      );
      
      console.log(`Updated history in ${historyUpdateResult.modifiedCount} tickets`);
      
      // Finally, delete the user
      const deleteResult = await User.findByIdAndDelete(userId);
      
      console.log(`User deleted: ${deleteResult ? 'Yes' : 'No'}`);
      
      // Redirect to user admin page with success message
      return res.redirect('/api/users/admin?deleted=true');
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).render('error', { 
        message: 'Feil ved sletting av bruker', 
        error: {} 
      });
    }
  }
};

module.exports = userManagementController;
