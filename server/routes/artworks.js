const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for storage
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for memory storage
// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit (matches frontend 8MB + buffer)
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

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

// 1. GET ALL ARTWORKS
router.get('/', async (req, res) => {
  const { search, category, status, is_active, target_user_id } = req.query;

  try {
    let query;
    let params = [];
    let paramIndex = 1;

    if (req.user.role === 'super_admin') {
      // Superadmin sees all artworks (with owner info)
      query = `
        SELECT a.*, 
               c.name as category_name,
               u.name as unit_name, u.symbol as unit_symbol,
               adm.username as owner_name,
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
        WHERE 1=1
      `;

      // Filter by specific admin if provided
      if (target_user_id && target_user_id !== 'all') {
        query += ` AND a.admin_id = $${paramIndex}`;
        params.push(target_user_id);
        paramIndex++;
      }
    } else {
      // Regular admin sees only their artworks
      query = `
        SELECT a.*, 
               c.name as category_name,
               u.name as unit_name, u.symbol as unit_symbol,
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
        WHERE a.admin_id = $${paramIndex}
      `;
      params.push(req.user.id);
      paramIndex++;
    }

    // Search filter
    if (search) {
      query += ` AND a.name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      query += ` AND a.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Status filter
    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Active filter
    if (is_active !== undefined) {
      query += ` AND a.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching artworks:', err.message);
    res.status(500).send("Server Error");
  }
});

// 2. GET SINGLE ARTWORK
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT a.*, 
             c.name as category_name,
             u.name as unit_name, u.symbol as unit_symbol,
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
      WHERE a.id = $1 AND (a.admin_id = $2 OR $3 = true)
    `;

    const result = await pool.query(query, [id, req.user.id, req.user.role === 'super_admin']);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Artwork not found or unauthorized" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching artwork:', err.message);
    res.status(500).send("Server Error");
  }
});

// 3. CREATE ARTWORK (Admin only)
router.post('/', async (req, res) => {
  if (req.user.role === 'super_admin') {
    return res.status(403).json({ message: "Superadmin cannot create artworks" });
  }

  const {
    name, is_untitled, description,
    main_image, additional_images,
    category_id, created_year, created_month,
    width, height, depth, unit_id,
    status, is_framed, edition_info, has_signature, has_coa,
    price, currency, show_price, show_additional_details,
    attribute_ids
  } = req.body;

  // Validation
  if (!is_untitled && (!name || !name.trim())) {
    return res.status(400).json({ message: "Artwork name is required unless marked as untitled" });
  }

  if (!created_year) {
    return res.status(400).json({ message: "Creation year is required" });
  }

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    // Begin transaction
    await pool.query('BEGIN');

    const artworkQuery = `
      INSERT INTO artworks (
        admin_id, name, is_untitled, description,
        main_image, additional_images,
        category_id, created_year, created_month,
        width, height, depth, unit_id,
        status, is_framed, edition_info, has_signature, has_coa,
        price, currency, show_price, show_additional_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const artworkValues = [
      req.user.id,
      is_untitled ? 'Untitled' : name,
      is_untitled || false,
      description || null,
      main_image || null,
      additional_images || [],
      category_id || null,
      created_year,
      created_month || null,
      width || null,
      height || null,
      depth || null,
      unit_id || null,
      status,
      is_framed || false,
      edition_info || null,
      has_signature || false,
      has_coa || false,
      price || null,
      currency || 'MMK',
      show_price !== undefined ? show_price : true,
      show_additional_details !== undefined ? show_additional_details : true
    ];

    const artworkResult = await pool.query(artworkQuery, artworkValues);
    const newArtwork = artworkResult.rows[0];

    // Insert attributes if provided
    if (attribute_ids && attribute_ids.length > 0) {
      const attributeQuery = `
        INSERT INTO artwork_attributes (artwork_id, attribute_id)
        SELECT $1, unnest($2::uuid[])
      `;
      await pool.query(attributeQuery, [newArtwork.id, attribute_ids]);
    }

    await pool.query('COMMIT');

    res.status(201).json(newArtwork);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating artwork:', err.message);
    
    if (err.code === '23503') {
      return res.status(400).json({ message: "Invalid category, unit, or attribute reference" });
    }
    
    res.status(500).send("Server Error");
  }
});

// 4. UPDATE ARTWORK (Admin only - own artworks)
router.put('/:id', async (req, res) => {
  if (req.user.role === 'super_admin') {
    return res.status(403).json({ message: "Superadmin cannot edit artworks" });
  }

  const { id } = req.params;
  const {
    name, is_untitled, description,
    main_image, additional_images,
    category_id, created_year, created_month,
    width, height, depth, unit_id,
    status, is_framed, edition_info, has_signature, has_coa,
    price, currency, is_active, show_price, show_additional_details,
    attribute_ids
  } = req.body;

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Check ownership
    const checkOwnership = await pool.query(
      "SELECT * FROM artworks WHERE id = $1 AND admin_id = $2",
      [id, req.user.id]
    );

    if (checkOwnership.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: "Artwork not found or unauthorized" });
    }

    // Update artwork - Build dynamic query to handle null vs undefined
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const addUpdate = (column, value) => {
      if (value !== undefined) {
        updates.push(`${column} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    };

    addUpdate('name', name);
    addUpdate('is_untitled', is_untitled);
    addUpdate('description', description);
    addUpdate('main_image', main_image); // Allow null to delete
    addUpdate('additional_images', additional_images); // Allow null/empty to delete
    addUpdate('category_id', category_id);
    addUpdate('created_year', created_year);
    addUpdate('created_month', created_month);
    addUpdate('width', width);
    addUpdate('height', height);
    addUpdate('depth', depth);
    addUpdate('unit_id', unit_id);
    addUpdate('status', status);
    addUpdate('is_framed', is_framed);
    addUpdate('edition_info', edition_info);
    addUpdate('has_signature', has_signature);
    addUpdate('has_coa', has_coa);
    addUpdate('price', price);
    addUpdate('currency', currency);
    addUpdate('is_active', is_active);
    addUpdate('show_price', show_price);
    addUpdate('show_additional_details', show_additional_details);

    // Always update timestamp
    updates.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE artworks SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND admin_id = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id, req.user.id);

    const updateResult = await pool.query(updateQuery, values);

    // Update attributes if provided
    if (attribute_ids !== undefined) {
      // Delete existing attributes
      await pool.query("DELETE FROM artwork_attributes WHERE artwork_id = $1", [id]);
      
      // Insert new attributes
      if (attribute_ids.length > 0) {
        await pool.query(
          "INSERT INTO artwork_attributes (artwork_id, attribute_id) SELECT $1, unnest($2::uuid[])",
          [id, attribute_ids]
        );
      }
    }

    await pool.query('COMMIT');

    res.json(updateResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error updating artwork:', err.message);
    
    if (err.code === '23503') {
      return res.status(400).json({ message: "Invalid category, unit, or attribute reference" });
    }
    
    res.status(500).send("Server Error");
  }
});

// 5. DELETE ARTWORK (Admin only - own artworks)
router.delete('/:id', async (req, res) => {
  if (req.user.role === 'super_admin') {
    return res.status(403).json({ message: "Superadmin cannot delete artworks" });
  }

  const { id } = req.params;

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // First, get the artwork to delete (check ownership and get image URLs)
    const artworkResult = await pool.query(
      "SELECT id, admin_id, main_image, additional_images FROM artworks WHERE id = $1 AND admin_id = $2",
      [id, req.user.id]
    );

    if (artworkResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: "Artwork not found or unauthorized" });
    }

    const artwork = artworkResult.rows[0];

    // Delete artwork_attributes first (manual cascade)
    await pool.query("DELETE FROM artwork_attributes WHERE artwork_id = $1", [id]);

    // Delete the artwork
    await pool.query("DELETE FROM artworks WHERE id = $1", [id]);

    // Commit transaction
    await pool.query('COMMIT');

    // Delete images from Supabase Storage (after successful DB deletion)
    try {
      const deletePromises = [];
      const folderPath = `${req.user.id}/${id}`;

      // Delete entire folder for this artwork
      const { data: files, error: listError } = await supabase.storage
        .from('artworks')
        .list(folderPath);

      if (!listError && files && files.length > 0) {
        const filePaths = files.map(file => `${folderPath}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
          .from('artworks')
          .remove(filePaths);

        if (deleteError) {
          console.error('Error deleting storage files:', deleteError);
          // Don't fail the request if storage deletion fails
        }
      }
    } catch (storageErr) {
      console.error('Storage cleanup error:', storageErr);
      // Continue - artwork already deleted from DB
    }

    res.json({ message: "Artwork deleted successfully", id: artwork.id });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting artwork:', err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 6. UPLOAD IMAGES
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  const { artwork_id } = req.body;

  if (!artwork_id) {
    return res.status(400).json({ message: "Artwork ID is required" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No images provided" });
  }

  try {
    const uploadedUrls = [];
    let mainImageUrl = null;
    let additionalImageUrls = [];

    // 1. Upload to Supabase Storage
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileExt = file.originalname.split('.').pop();
      // Use originalname to check if it's main (set by frontend as 'main.jpg')
      const isMain = file.originalname.toLowerCase().includes('main');
      
      const fileName = isMain ? `main-${Date.now()}` : `additional-${Date.now()}-${i}`;
      const filePath = `${req.user.id}/${artwork_id}/${fileName}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('artworks')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);

      if (isMain) {
        mainImageUrl = publicUrl;
      } else {
        additionalImageUrls.push(publicUrl);
      }
    }

    // 2. Update Database
    // Fetch current additional images first to append to them, or just replace? 
    // For now, let's append if there are existing ones, or just set.
    // Given the simple flow, user probably expects new images to be added.
    
    // However, if we are doing a fresh upload for a new artwork, it's simple.
    // If editing, we might want to preserve old ones.
    
    // Let's get current state
    const currentResult = await pool.query("SELECT main_image, additional_images FROM artworks WHERE id = $1", [artwork_id]);
    const currentArtwork = currentResult.rows[0];
    
    let dbMainImage = currentArtwork.main_image;
    // Ensure additional_images is always an array (handle NULL)
    let dbAdditionalImages = Array.isArray(currentArtwork.additional_images) 
      ? currentArtwork.additional_images 
      : [];

    if (mainImageUrl) {
      dbMainImage = mainImageUrl;
    }
    
    if (additionalImageUrls.length > 0) {
      // Append new additional images
      dbAdditionalImages = [...dbAdditionalImages, ...additionalImageUrls];
    }

    const updateQuery = `
      UPDATE artworks 
      SET main_image = $1, additional_images = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    await pool.query(updateQuery, [dbMainImage, dbAdditionalImages.length > 0 ? dbAdditionalImages : null, artwork_id]);

    res.json({ 
      urls: uploadedUrls,
      mainImage: dbMainImage,
      additionalImages: dbAdditionalImages
    });
  } catch (err) {
    console.error('Error uploading images:', err);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

module.exports = router;
