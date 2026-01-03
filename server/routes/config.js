const express = require('express');
const router = express.Router();
const pool = require('../db');

const ALLOWED_TABLES = ['categories', 'styles', 'themes', 'mediums', 'units'];

// Middleware to validate table name
const validateTable = (req, res, next) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ success: false, message: 'Invalid configuration table' });
  }
  next();
};

// GET all entries from a table
router.get('/:table', validateTable, async (req, res) => {
  const { table } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY id ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST a new entry
router.post('/:table', validateTable, async (req, res) => {
  const { table } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO ${table} (name) VALUES ($1) RETURNING *`,
      [name]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Entry already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE an entry
router.delete('/:table/:id', validateTable, async (req, res) => {
  const { table, id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// UPDATE an entry
router.put('/:table/:id', validateTable, async (req, res) => {
  const { table, id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE ${table} SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Entry already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
