const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const authController = {
  // Render login page
  loginPage: (req, res) => {
    res.render('auth/login', { title: 'Logg inn' });
  },
  
  // Render register page
  registerPage: (req, res) => {
    res.render('auth/register', { title: 'Registrer deg' });
  },
  
  // Handle login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).render('auth/login', {
          title: 'Logg inn',
          error: 'Ugyldig e-post eller passord'
        });
      }
      
      // Check password
      const validPassword = await argon2.verify(user.password, password);
      if (!validPassword) {
        return res.status(400).render('auth/login', {
          title: 'Logg inn',
          error: 'Ugyldig e-post eller passord'
        });
      }
      
      // Create and set token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });
      
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        sameSite: 'strict'
      });
      
      // Redirect based on role
      if (user.role === 'admin') {
        return res.redirect('/api/tickets/admin');
      } else {
        return res.redirect('/api/tickets/mydashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).render('auth/login', {
        title: 'Logg inn',
        error: 'En feil oppstod. Vennligst prøv igjen.'
      });
    }
  },
  
  // Handle registration
  register: async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;
      
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).render('auth/register', {
          title: 'Registrer deg',
          error: 'Passordene stemmer ikke overens'
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).render('auth/register', {
          title: 'Registrer deg',
          error: 'E-post er allerede i bruk'
        });
      }
      
      // Hash password
      const hashedPassword = await argon2.hash(password);
      
      // Create new user
      const user = new User({
        name,
        email,
        password: hashedPassword
        // Default role is 'user' as defined in the schema
      });
      
      await user.save();
      
      res.status(201).render('auth/login', {
        title: 'Logg inn',
        success: 'Registrering vellykket! Du kan nå logge inn.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).render('auth/register', {
        title: 'Registrer deg',
        error: 'En feil oppstod. Vennligst prøv igjen.'
      });
    }
  },
  
  // Handle logout
  logout: (req, res) => {
    res.clearCookie('token');
    res.redirect('/api/auth/login');
  }
};

module.exports = authController;
