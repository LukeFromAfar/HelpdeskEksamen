/**
 * XSS Protection middleware
 * This middleware sets custom X-XSS-Protection headers for browsers that still support it
 */
const xssProtection = (req, res, next) => {
  // Set X-XSS-Protection header
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

module.exports = xssProtection;
