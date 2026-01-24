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
      `SELECT id, name, sort_order 
       FROM categories 
       WHERE admin_id = $1 AND is_active = true 
       ORDER BY sort_order ASC, name ASC`,
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

// GET /api/public/artworks/:id
// Fetches a single artwork details for public view
router.get('/artworks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT a.*, 
             c.name as category_name,
             u.name as unit_name, u.symbol as unit_symbol,
             adm.username as artist_username,
             adm.gallery_name,
             (
               SELECT json_agg(json_build_object(
                 'id', attr.id,
                 'type', attr.type,
                 'name', attr.name
               ))
               FROM artwork_attributes aa
               JOIN attributes attr ON aa.attribute_id = attr.id
               WHERE aa.artwork_id = a.id
             ) as attributes
      FROM artworks a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN units u ON a.unit_id = u.id
      JOIN admins adm ON a.admin_id = adm.id
      WHERE a.id = $1 AND a.is_active = true
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Artwork not found or not active' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching artwork details:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/public/gallery/:slug/artwork/:identifier
// Fetches a single artwork details by identifier (ID or Name) scoped to a specific gallery
router.get('/gallery/:slug/artwork/:identifier', async (req, res) => {
  const { slug, identifier } = req.params;

  try {
    // 1. Get Gallery (Admin) ID first
    const adminResult = await pool.query(
      `SELECT id FROM admins WHERE slug = $1 AND status = 'active'`,
      [slug]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery not found'
      });
    }

    const adminId = adminResult.rows[0].id;

    // 2. Fetch Artwork scoped to this admin
    // We compare identifier against ID (cast to text to avoid UUID errors) OR Name
    const query = `
      SELECT a.*, 
             c.name as category_name,
             u.name as unit_name, u.symbol as unit_symbol,
             adm.username as artist_username,
             adm.gallery_name,
             (
               SELECT json_agg(json_build_object(
                 'id', attr.id,
                 'type', attr.type,
                 'name', attr.name
               ))
               FROM artwork_attributes aa
               JOIN attributes attr ON aa.attribute_id = attr.id
               WHERE aa.artwork_id = a.id
             ) as attributes
      FROM artworks a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN units u ON a.unit_id = u.id
      JOIN admins adm ON a.admin_id = adm.id
      WHERE a.admin_id = $1 
        AND a.is_active = true
        AND (a.id::text = $2 OR a.name ILIKE $2)
    `;

    // Note: decoding identifier might be handled by Express, but good to ensure.
    // However, ILIKE handles case insensitivity.
    const result = await pool.query(query, [adminId, decodeURIComponent(identifier)]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching artwork details:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

