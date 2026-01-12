const express = require('express');
const router = express.Router();
const pool = require('../db');

// Supported types in the attributes table
const ALLOWED_TYPES = ['categories', 'styles', 'themes', 'mediums', 'units'];

// Middleware to get admin context (Required for ownership)
const getAdminId = (req) => req.headers['x-admin-id'];

// GET all entries for a specific type
router.get('/:table', async (req, res) => {
  const { table } = req.params;
  const adminId = getAdminId(req);

  if (!ALLOWED_TYPES.includes(table)) {
    return res.status(400).json({ success: false, message: 'Invalid configuration type' });
  }

  try {
    // If adminId is provided, filter by it, otherwise show all active for that type
    let query = `SELECT id, name, is_active FROM attributes WHERE type = $1`;
    let params = [table];

    if (adminId) {
      query += ` AND admin_id = $2`;
      params.push(adminId);
    }

    query += ` ORDER BY name ASC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching config:', err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST a new entry
router.post('/:table', async (req, res) => {
  const { table } = req.params;
  const { name } = req.body;
  const adminId = getAdminId(req);

  if (!ALLOWED_TYPES.includes(table)) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
  }

  if (!name || !adminId) {
    return res.status(400).json({ success: false, message: 'Name and Admin ID are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO attributes (admin_id, type, name) VALUES ($1, $2, $3) RETURNING *`,
      [adminId, table, name]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error adding config:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Entry already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE an entry
router.delete('/:table/:id', async (req, res) => {
  const { id } = req.params;
  const adminId = getAdminId(req);

  if (!adminId) return res.status(401).json({ message: "Admin ID required" });

  try {
    const result = await pool.query(
      `DELETE FROM attributes WHERE id = $1 AND admin_id = $2 RETURNING *`, 
      [id, adminId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found or unauthorized' });
    }
    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting config:', err.message);
    if (err.code === '23503') {
        return res.status(400).json({ success: false, message: 'Cannot delete: Item is in use' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
