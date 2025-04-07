const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  max: 20, // 5 attempts per window
  message: 'For mange påloggingsforsøk. Vennligst prøv igjen senere.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: 'For mange forespørsler. Vennligst prøv igjen senere.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  apiLimiter
};
