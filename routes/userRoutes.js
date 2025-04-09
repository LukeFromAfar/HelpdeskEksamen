const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeParams } = require('../middleware/sanitizer');

// Apply auth middleware to all routes
router.use(auth);

// Admin user dashboard - only accessible by admins (not 1. linje or 2. linje)
router.get('/admin', roleCheck('admin'), userManagementController.adminUserDashboard);

// Edit user - only accessible by admins
router.get('/edit/:id', roleCheck('admin'), sanitizeParams, userManagementController.editUserForm);
router.post('/update/:id', roleCheck('admin'), sanitizeParams, apiLimiter, userManagementController.updateUser);

// Delete user - only accessible by admins
router.post('/delete/:id', roleCheck('admin'), sanitizeParams, apiLimiter, userManagementController.deleteUser);

module.exports = router;
