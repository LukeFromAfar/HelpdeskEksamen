// This middleware checks if a user has the required role(s) to access a route
module.exports = (requiredRole) => {
  return (req, res, next) => {
    // Only proceed if user is authenticated (should be handled by auth middleware first)
    if (!req.user) {
      return res.status(401).render('error', { 
        message: 'Authentication required', 
        error: {} 
      });
    }
    
    // Handle multiple roles (passed as array) or single role
    if (Array.isArray(requiredRole)) {
      if (requiredRole.includes(req.user.role)) {
        return next(); // User has one of the required roles
      }
    } else {
      // Handle single role requirement
      if (req.user.role === requiredRole) {
        return next(); // User has the required role
      }
    }
    
    // If we get here, the user doesn't have permission
    return res.status(403).render('error', { 
      message: 'Access denied. You do not have the required permissions.', 
      error: {} 
    });
  };
};
