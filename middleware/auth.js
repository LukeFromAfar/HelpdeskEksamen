const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).redirect('/api/auth/login');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      return res.status(401).redirect('/api/auth/login');
    }
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.clearCookie('token');
      return res.status(401).redirect('/api/auth/login');
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.clearCookie('token');
    res.status(401).redirect('/api/auth/login');
  }
};

module.exports = auth;
