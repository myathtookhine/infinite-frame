const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Middleware to check if user is Super Admin
const requireSuperAdmin = async (req, res, next) => {
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

// Apply middleware to all routes
router.use(requireSuperAdmin);

// 0. GET ACTIVITY LOGS
router.get('/logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id, l.action, l.ip_address, l.created_at, a.username, a.email
      FROM activity_logs l
      JOIN admins a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 1. GET ALL ADMINS (Except self/Super Admin logic can be refined)
router.get('/', async (req, res) => {
  try {
    // Get all users (including other super admins)
    const result = await pool.query(
      "SELECT id, username, email, role, status, is_verified, created_at FROM admins ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. CREATE NEW ADMIN
router.post('/', async (req, res) => {
  const { username, email, password, isSuperAdmin } = req.body;

  // Debug logging
  console.log('=== CREATE ADMIN REQUEST ===');
  console.log('Received data:', { username, email: email || 'null', isSuperAdmin });
  console.log('isSuperAdmin type:', typeof isSuperAdmin);
  console.log('isSuperAdmin value:', isSuperAdmin);

  // Email is now optional, only Username and Password are required
  if (!username || !password) {
    return res.status(400).json({ message: "Username and Password are required" });
  }

  try {
    // Check Email (if provided)
    if (email) {
        const emailCheck = await pool.query("SELECT id FROM admins WHERE email = $1", [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: "This email is already used." });
        }
    }

    // Check Username
    const usernameCheck = await pool.query("SELECT id FROM admins WHERE username = $1", [username]);
    if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: "This username is already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = isSuperAdmin ? 'super_admin' : 'individual';
    const cleanEmail = email && email.trim() !== '' ? email : null;

    console.log('Calculated role:', role);
    console.log('Will insert with role:', role);

    // Create auto-verified admin
    const newUser = await pool.query(
      `INSERT INTO admins (username, email, password_hash, role, is_verified, status) 
       VALUES ($1, $2, $3, $4, TRUE, 'active') 
       RETURNING id, username, email, role, status, created_at`,
      [username, cleanEmail, hashedPassword, role]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. TOGGLE STATUS (Suspend/Activate)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'suspended'

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await pool.query(
      "UPDATE admins SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, id]
    );
    
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// 4. RESET PASSWORD (Optional useful feature)
router.put('/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
  
    if (!newPassword) return res.status(400).json({ message: "New password required" });
  
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE admins SET password_hash = $1 WHERE id = $2", [hashedPassword, id]);
      res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server Error" });
    }
  });

// 5. DELETE ADMIN
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM admins WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
