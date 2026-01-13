const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * PUBLIC ENDPOINT - No authentication required
 * GET /api/public/gallery/:slug
 * Fetches public gallery profile by slug
 */
router.get('/gallery/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Validate slug parameter
    if (!slug || slug.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Slug parameter is required' 
      });
    }

    // Query admin by slug - only return public fields
    const result = await pool.query(
      `SELECT id, username, gallery_name, description, address, phone_numbers, email, social_links
       FROM admins 
       WHERE slug = $1 AND status = 'active'`,
      [slug.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gallery not found' 
      });
    }

    const gallery = result.rows[0];

    res.json({
      success: true,
      data: {
        id: gallery.id,
        username: gallery.username,
        gallery_name: gallery.gallery_name,
        description: gallery.description,
        address: gallery.address,
        phone_numbers: gallery.phone_numbers,
        email: gallery.email,
        social_links: gallery.social_links
      }
    });

  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
