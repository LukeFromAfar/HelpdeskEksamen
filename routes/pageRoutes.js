const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to get the current user (if authenticated)
const getCurrentUser = async (req) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.userId) {
        return await User.findById(decoded.userId);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Route for the FAQ page
router.get('/faq', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    res.render('faq', { 
      title: 'FAQ - Ofte stilte spørsmål',
      user: user, // Will be null if not logged in
      path: req.path
    });
  } catch (error) {
    console.error('Error rendering FAQ page:', error);
    res.status(500).render('error', { 
      message: 'Error loading FAQ page',
      error: {},
      title: 'Feil',
      user: null 
    });
  }
});

// Route for the manual page
router.get('/manual', async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    res.render('manual', { 
      title: 'Brukerveiledning',
      user: user, // Will be null if not logged in
      path: req.path
    });
  } catch (error) {
    console.error('Error rendering Manual page:', error);
    res.status(500).render('error', { 
      message: 'Error loading Manual page',
      error: {},
      title: 'Feil',
      user: null 
    });
  }
});

module.exports = router;
