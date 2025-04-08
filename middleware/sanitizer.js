const { body, param, query, validationResult } = require('express-validator');

// Middleware to sanitize and validate ticket inputs
const sanitizeTicket = [
  body('title').trim().escape(),
  body('description').trim(),
  body('category').trim().escape(),
  body('priority').trim().escape(),
  body('status').trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

// Middleware to sanitize comment inputs
const sanitizeComment = [
  body('text').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

// Middleware to sanitize user registration inputs
const sanitizeUserRegistration = [
  body('name').trim().escape(),
  body('email').trim().normalizeEmail(),
  body('password').trim(),
  body('confirmPassword').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

// Middleware to sanitize login inputs
const sanitizeLogin = [
  body('email').trim().normalizeEmail(),
  body('password').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

// Middleware to sanitize URL parameters
const sanitizeParams = [
  param('*').trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

module.exports = {
  sanitizeTicket,
  sanitizeComment,
  sanitizeUserRegistration,
  sanitizeLogin,
  sanitizeParams
};
