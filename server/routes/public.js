const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/public/visit
// Increments page views for Super Admin (global site visits)
router.post('/visit', async (req, res) => {
  try {
    // Find ID of Super Admin
    const adminResult = await pool.query(
      "SELECT id FROM admins WHERE role = 'super_admin' LIMIT 1"
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    const superAdminId = adminResult.rows[0].id;

    // Increment page_views
    await pool.query(
      "UPDATE admins SET page_views = page_views + 1 WHERE id = $1",
      [superAdminId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error tracking visit:', err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST /api/public/gallery/:slug/visit
// Increments page views for specific Gallery Admin
router.post('/gallery/:slug/visit', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      "UPDATE admins SET page_views = page_views + 1 WHERE slug = $1 RETURNING id",
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error tracking gallery visit:', err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
