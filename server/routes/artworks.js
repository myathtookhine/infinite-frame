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
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
    price, currency,
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

    // Insert artwork
    const artworkQuery = `
      INSERT INTO artworks (
        admin_id, name, is_untitled, description,
        main_image, additional_images,
        category_id, created_year, created_month,
        width, height, depth, unit_id,
        status, is_framed, edition_info, has_signature, has_coa,
        price, currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
      currency || 'MMK'
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
    price, currency, is_active,
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

    // Update artwork
    const updateQuery = `
      UPDATE artworks SET
        name = COALESCE($1, name),
        is_untitled = COALESCE($2, is_untitled),
        description = COALESCE($3, description),
        main_image = COALESCE($4, main_image),
        additional_images = COALESCE($5, additional_images),
        category_id = COALESCE($6, category_id),
        created_year = COALESCE($7, created_year),
        created_month = COALESCE($8, created_month),
        width = COALESCE($9, width),
        height = COALESCE($10, height),
        depth = COALESCE($11, depth),
        unit_id = COALESCE($12, unit_id),
        status = COALESCE($13, status),
        is_framed = COALESCE($14, is_framed),
        edition_info = COALESCE($15, edition_info),
        has_signature = COALESCE($16, has_signature),
        has_coa = COALESCE($17, has_coa),
        price = COALESCE($18, price),
        currency = COALESCE($19, currency),
        is_active = COALESCE($20, is_active),
        updated_at = NOW()
      WHERE id = $21 AND admin_id = $22
      RETURNING *
    `;

    const updateValues = [
      name, is_untitled, description,
      main_image, additional_images,
      category_id, created_year, created_month,
      width, height, depth, unit_id,
      status, is_framed, edition_info, has_signature, has_coa,
      price, currency, is_active,
      id, req.user.id
    ];

    const updateResult = await pool.query(updateQuery, updateValues);

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

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileExt = file.originalname.split('.').pop();
      const fileName = i === 0 ? 'main' : `image-${i}`;
      const filePath = `${req.user.id}/${artwork_id}/${fileName}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('artworks')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    res.json({ urls: uploadedUrls });
  } catch (err) {
    console.error('Error uploading images:', err);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

module.exports = router;
