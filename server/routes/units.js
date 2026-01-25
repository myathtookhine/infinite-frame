const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to check User Role & ID
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

// 1. GET ALL UNITS
router.get('/', async (req, res) => {
  try {
    let query;
    
    if (req.user.role === 'super_admin') {
      // Super admin sees all units with full details
      query = "SELECT * FROM units ORDER BY name";
    } else {
      // Regular admin sees only active units with minimal fields (for selection)
      query = "SELECT id, name, symbol FROM units WHERE is_active = TRUE ORDER BY name";
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. CREATE UNIT (Super Admin Only)
router.post('/', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Access Denied: Super Admin only" });
  }

  const { name, symbol } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Unit name is required." });
  }

  if (!symbol || !symbol.trim()) {
    return res.status(400).json({ message: "Unit symbol is required." });
  }

  try {
    const newUnit = await pool.query(
      "INSERT INTO units (name, symbol) VALUES ($1, $2) RETURNING *",
      [name.trim(), symbol.trim()]
    );
    res.json(newUnit.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: "This unit already exists!" });
    }
    res.status(500).send("Server Error");
  }
});

// 3. UPDATE UNIT (Super Admin Only)
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Access Denied: Super Admin only" });
  }

  const { id } = req.params;
  const { name, symbol, is_active } = req.body;

  try {
    const updateUnit = await pool.query(
      "UPDATE units SET name = COALESCE($1, name), symbol = COALESCE($2, symbol), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *",
      [name, symbol, is_active, id]
    );

    if (updateUnit.rows.length === 0) {
      return res.status(404).json({ message: "Unit not found." });
    }

    res.json(updateUnit.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: "This unit name already exists!" });
    }
    res.status(500).send("Server Error");
  }
});

// 4. DELETE UNIT (Super Admin Only)
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: "Access Denied: Super Admin only" });
  }

  const { id } = req.params;

  try {
    // Check if unit exists
    const checkExists = await pool.query("SELECT * FROM units WHERE id = $1", [id]);
    if (checkExists.rows.length === 0) {
      return res.status(404).json({ message: "Unit not found." });
    }

    // Delete
    await pool.query("DELETE FROM units WHERE id = $1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err.message);
    // Postgres Foreign Key Violation Code: 23503
    if (err.code === '23503') {
      return res.status(400).json({ message: "Cannot delete: This unit is linked to existing artworks." });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router;
