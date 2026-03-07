const pool = require('../db');

/**
 * Middleware to get user context from x-admin-id header
 * Attaches user ID and role to req.user
 */
const getUserContext = async (req, res, next) => {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(401).json({ message: "Unauthorized: No Admin ID" });

  try {
    const userResult = await pool.query(
      "SELECT id, role, subscription_plan, subscription_expiry FROM admins WHERE id = $1", 
      [adminId]
    );
    if (userResult.rows.length === 0) return res.status(401).json({ message: "User not found" });
    
    let user = userResult.rows[0];

    // --- Subscription Expiry Logic ---
    if (user.subscription_plan !== 'free' && user.subscription_expiry) {
      const now = new Date();
      const expiry = new Date(user.subscription_expiry);
      
      if (now > expiry) {
        // Auto-downgrade to free
        await pool.query(
          "UPDATE admins SET subscription_plan = 'free', subscription_expiry = NULL WHERE id = $1",
          [adminId]
        );
        user.subscription_plan = 'free';
        user.subscription_expiry = null;
        console.log(`[Auto-Downgrade] User ${adminId} downgraded to free (expired)`);
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Middleware to require super admin role (header-based auth)
 * Must be used for routes that need super admin access via x-admin-id header
 */
const requireSuperAdminHeader = async (req, res, next) => {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const result = await pool.query("SELECT role FROM admins WHERE id = $1", [adminId]);
    if (result.rows.length === 0 || result.rows[0].role !== 'super_admin') {
      return res.status(403).json({ message: "Access Denied: Super Admin only" });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getUserContext,
  requireSuperAdminHeader
};
