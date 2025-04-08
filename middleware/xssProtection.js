/**
 * XSS Protection middleware
 * Sanitizes request body, query, and params to prevent XSS attacks
 */
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeObject = (obj) => {
  if (!obj) return obj;
  
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      // Sanitize string values
      obj[key] = DOMPurify.sanitize(obj[key], {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [] // No attributes allowed
      }).trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively sanitize nested objects
      sanitizeObject(obj[key]);
    }
  });
  
  return obj;
};

const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

module.exports = xssProtection;
