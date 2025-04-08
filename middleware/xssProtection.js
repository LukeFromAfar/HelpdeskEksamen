/**
 * Simplified XSS Protection middleware
 * Just passes through for HTTP compatibility
 */
const xssProtection = (req, res, next) => {
  next();
};

module.exports = xssProtection;
