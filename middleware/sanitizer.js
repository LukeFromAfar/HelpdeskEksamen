const { body, param, validationResult } = require('express-validator');

// Simplified middleware to sanitize and validate ticket inputs
const sanitizeTicket = [
  body('title').trim(),
  body('description').trim(),
  body('category').trim(),
  body('priority').trim(),
  body('status').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

// Simplified middleware to sanitize comment inputs
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

// Simplified middleware to sanitize user registration inputs
const sanitizeUserRegistration = [
  body('name').trim(),
  body('email').trim().normalizeEmail({ lowercase: true }),
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

// Simplified middleware to sanitize login inputs
const sanitizeLogin = [
  body('email').trim().normalizeEmail({ lowercase: true }),
  body('password').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
    }
    next();
  }
];

// Simplified middleware to sanitize URL parameters
const sanitizeParams = [
  param('*').trim(),
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
