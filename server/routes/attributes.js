const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to checking User Role & ID
const getUserContext = async (req, res, next) => {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(401).json({ message: "Unauthorized: No Admin ID" });

  try {
    const userResult = await pool.query("SELECT id, role FROM admins WHERE id = $1", [adminId]);
    if (userResult.rows.length === 0) return res.status(401).json({ message: "User not found" });
    
    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

router.use(getUserContext);

// 0. GET ALL ARTISTS (For Super Admin Dropdown)
router.get('/users', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Access Denied" });
  }
  try {
    const users = await pool.query("SELECT id, username, email FROM admins WHERE role = 'individual' ORDER BY username");
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// 1. GET ALL TYPES
router.get('/types', async (req, res) => {
  try {
    let query;
    let params = [];
    const targetUserId = req.query.target_user_id; // For Super Admin filtering

    if (req.user.role === 'super_admin') {
      if (targetUserId && targetUserId !== 'all') {
        // Super Admin viewing SPECIFIC Artist
        query = "SELECT DISTINCT type FROM attributes WHERE admin_id = $1 ORDER BY type";
        params = [targetUserId];
      } else {
        // Super Admin viewing ALL - Show all unique types globally
        query = "SELECT DISTINCT type FROM attributes ORDER BY type";
      }
    } else {
      // Individual sees ONLY their types
      query = "SELECT DISTINCT type FROM attributes WHERE admin_id = $1 ORDER BY type";
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    
    // Return objects: [{ type: 'Style' }]
    res.json(result.rows.map(r => ({ type: r.type })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET ATTRIBUTES BY TYPE
router.get('/:type', async (req, res) => {
  const { type } = req.params;
  const targetUserId = req.query.target_user_id;

  try {
    let query;
    let params = [type];

    if (req.user.role === 'super_admin') {
      if (targetUserId && targetUserId !== 'all') {
         // View Specific Artist
         query = "SELECT * FROM attributes WHERE type = $1 AND admin_id = $2 ORDER BY name";
         params.push(targetUserId);
      } else {
         // View ALL (with owner info)
         query = `
            SELECT a.id, a.name, a.type, a.is_active, adm.email as owner_email, adm.username as owner_name
            FROM attributes a
            JOIN admins adm ON a.admin_id = adm.id
            WHERE a.type = $1
            ORDER BY a.name
         `;
      }
    } else {
      // Individual: Get ONLY theirs
      query = "SELECT * FROM attributes WHERE type = $1 AND admin_id = $2 ORDER BY name";
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 3. CREATE ATTRIBUTE (Individual Only)
router.post('/', async (req, res) => {
  const { type, name } = req.body;

  if (req.user.role === 'super_admin') {
    return res.status(403).json({ message: "Super Admin is Read-Only." });
  }

  try {
    const newAttrib = await pool.query(
      "INSERT INTO attributes (admin_id, type, name) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, type, name]
    );
    res.json(newAttrib.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
        return res.status(400).json({ message: "This item already exists in your list!" });
    }
    res.status(500).send("Server Error");
  }
});

// 4. UPDATE ATTRIBUTE (Individual Only - Own Data)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  if (req.user.role === 'super_admin') {
    return res.status(403).json({ message: "Super Admin is Read-Only." });
  }

  try {
    const updateAttrib = await pool.query(
      "UPDATE attributes SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE id = $3 AND admin_id = $4 RETURNING *",
      [name, is_active, id, req.user.id]
    );

    if (updateAttrib.rows.length === 0) {
      return res.status(404).json({ message: "Item not found or unauthorized." });
    }

    res.json(updateAttrib.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 5. DELETE ATTRIBUTE (Individual Only - Own Data + Dependency Check)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'super_admin') {
    return res.status(403).json({ message: "Super Admin is Read-Only." });
  }

  try {
    // 1. Check Ownership
    const checkOwner = await pool.query("SELECT * FROM attributes WHERE id = $1 AND admin_id = $2", [id, req.user.id]);
    if (checkOwner.rows.length === 0) {
        return res.status(404).json({ message: "Item not found or unauthorized." });
    }

    // 2. Delete
    await pool.query("DELETE FROM attributes WHERE id = $1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err.message);
    // Postgres Foreign Key Violation Code: 23503
    if (err.code === '23503') {
        return res.status(400).json({ message: "Cannot delete: This item is linked to existing artworks." });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router;
