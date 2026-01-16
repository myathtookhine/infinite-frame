const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from Authorization header
 * Attaches decoded user data to req.user
 */
const verifyToken = (req, res, next) => {
  // Extract token from Authorization header (format: "Bearer TOKEN")
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request object
    // decoded contains: { sub, role, email, username, iat, exp }
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (err) {
    // Token is invalid or expired
    return res.status(401).json({ 
      message: 'Invalid or expired token. Please login again.' 
    });
  }
};

/**
 * Middleware to check if user is a super_admin
 * Must be used AFTER verifyToken middleware
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }
  
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Access denied. Super admin privileges required.' 
    });
  }
  
  next();
};

/**
 * Middleware to check if user owns the resource they're trying to access
 * Must be used AFTER verifyToken middleware
 * Allows super_admin to bypass ownership check
 */
const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.' 
    });
  }
  
  // Super admins can access any resource
  if (req.user.role === 'super_admin') {
    return next();
  }
  
  // Get the admin_id from request (could be in params, body, or query)
  const resourceAdminId = req.params.adminId || req.body.adminId || req.query.adminId;
  
  // Check if the user is trying to access their own resource
  if (req.user.sub !== resourceAdminId) {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your own resources.' 
    });
  }
  
  next();
};

/**
 * Optional middleware to verify token but don't fail if missing
 * Useful for public routes that want to know if user is authenticated
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, but we don't block the request
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
};

module.exports = {
  verifyToken,
  requireSuperAdmin,
  requireOwnership,
  optionalAuth
};
