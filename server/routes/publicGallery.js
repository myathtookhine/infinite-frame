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
      `SELECT id, username, gallery_name, description, address, phone_numbers, email, social_links, 
              banner_image_url, banner_enabled
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

    // Fetch Categories
    const categoriesResult = await pool.query(
      `SELECT id, name 
       FROM categories 
       WHERE admin_id = $1 AND is_active = true 
       ORDER BY name ASC`,
      [gallery.id]
    );

    // Fetch Artworks with Unit details
    // Note: Fetching active artworks.
    const artworksResult = await pool.query(
      `SELECT a.id, a.name as title, a.description, a.main_image, a.width, a.height, a.price, a.currency, 
              a.category_id, a.status, a.is_for_sale,
              u.name as unit_name, u.symbol as unit_symbol
       FROM artworks a
       LEFT JOIN units u ON a.unit_id = u.id
       WHERE a.admin_id = $1 AND a.is_active = true
       ORDER BY a.created_at DESC`,
      [gallery.id]
    );

    res.json({
      success: true,
      data: {
        ...gallery,
        banner_image_url: gallery.banner_enabled ? gallery.banner_image_url : null,
        categories: categoriesResult.rows,
        artworks: artworksResult.rows
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
