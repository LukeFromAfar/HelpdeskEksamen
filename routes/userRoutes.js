const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { apiLimiter } = require('../middleware/rateLimiter');

// This file is for future user management functionality
// No routes implemented yet

module.exports = router;
