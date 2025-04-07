const roleCheck = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).redirect('/api/auth/login');
    }
    
    if (req.user.role !== role) {
      return res.status(403).render('error', {
        message: 'Forbidden: You do not have permission to access this resource',
        error: {}
      });
    }
    
    next();
  };
};

module.exports = roleCheck;
