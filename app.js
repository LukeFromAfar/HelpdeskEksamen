require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
connectDB();

// Simplified Helmet configuration for HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for HTTP compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  xssFilter: true,
  hidePoweredBy: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Add path to all rendered views
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Main route with auth check
app.get('/', (req, res) => {
  const token = req.cookies.token;
  
  // If user has a token (is logged in), redirect to their dashboard
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/api/tickets/mydashboard');
    } catch (error) {
      // If token is invalid, clear it and show the homepage
      res.clearCookie('token');
    }
  }
  
  // Show homepage for non-authenticated users
  res.render('index', { title: 'Velkommen til Helpdesk' });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
  
  // Join room based on user ID
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  // Admin joins admin room
  socket.on('joinAdminRoom', () => {
    socket.join('admin_room');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err : {},
    title: 'Feil' 
  });
});

// 404 handling
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found', error: {}, title: 'Ikke funnet' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
