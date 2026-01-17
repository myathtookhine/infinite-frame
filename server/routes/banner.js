const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../db');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for memory storage (we'll process the file before uploading)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept jpg and png
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'), false);
    }
  }
});

// =====================================================
// 1. UPLOAD BANNER IMAGE
// =====================================================
router.post('/upload', upload.single('banner'), async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    // Process the image with sharp
    const imageBuffer = req.file.buffer;
    
    // Get image metadata to check dimensions
    const metadata = await sharp(imageBuffer).metadata();
    
    // Validate minimum dimensions
    if (metadata.width < 1200 || metadata.height < 630) {
      return res.status(400).json({ 
        message: `Image dimensions too small. Minimum required: 1200x630px. Uploaded: ${metadata.width}x${metadata.height}px` 
      });
    }

    // Convert to WebP and resize if needed (maintain aspect ratio)
    const processedImage = await sharp(imageBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `banner-${userId}-${timestamp}.webp`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gallery-banner-images')
      .upload(fileName, processedImage, {
        contentType: 'image/webp',
        upsert: false
      });

    if (uploadError) {
      console.error('[BANNER UPLOAD ERROR]', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload image to storage',
        error: uploadError.message 
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gallery-banner-images')
      .getPublicUrl(fileName);

    // Delete old banner if exists
    const oldBannerResult = await pool.query(
      'SELECT banner_image_url FROM admins WHERE id = $1',
      [userId]
    );

    if (oldBannerResult.rows.length > 0 && oldBannerResult.rows[0].banner_image_url) {
      const oldUrl = oldBannerResult.rows[0].banner_image_url;
      const oldFileName = oldUrl.split('/').pop();
      
      // Delete old file from Supabase
      await supabase.storage
        .from('gallery-banner-images')
        .remove([oldFileName]);
    }

    // Update database with new banner URL
    const updateResult = await pool.query(
      `UPDATE admins 
       SET banner_image_url = $1, banner_uploaded_at = NOW()
       WHERE id = $2
       RETURNING id, username, banner_image_url, banner_enabled, banner_uploaded_at`,
      [publicUrl, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Banner uploaded successfully!',
      banner: updateResult.rows[0]
    });

  } catch (err) {
    console.error('[BANNER UPLOAD ERROR]', err.message);
    res.status(500).json({ 
      message: 'Server error during banner upload',
      error: err.message 
    });
  }
});

// =====================================================
// 2. TOGGLE BANNER VISIBILITY
// =====================================================
router.patch('/toggle/:userId', async (req, res) => {
  const { userId } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'Enabled status must be a boolean' });
  }

  try {
    const result = await pool.query(
      `UPDATE admins 
       SET banner_enabled = $1
       WHERE id = $2
       RETURNING id, username, banner_image_url, banner_enabled`,
      [enabled, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `Banner ${enabled ? 'enabled' : 'disabled'} successfully`,
      banner: result.rows[0]
    });

  } catch (err) {
    console.error('[BANNER TOGGLE ERROR]', err.message);
    res.status(500).json({ message: 'Server error during banner toggle' });
  }
});

// =====================================================
// 3. GET BANNER INFO
// =====================================================
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, username, banner_image_url, banner_enabled, banner_uploaded_at FROM admins WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ banner: result.rows[0] });

  } catch (err) {
    console.error('[GET BANNER ERROR]', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// =====================================================
// 4. DELETE BANNER
// =====================================================
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Get current banner URL
    const currentBanner = await pool.query(
      'SELECT banner_image_url FROM admins WHERE id = $1',
      [userId]
    );

    if (currentBanner.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bannerUrl = currentBanner.rows[0].banner_image_url;

    if (!bannerUrl) {
      return res.status(400).json({ message: 'No banner to delete' });
    }

    // Extract filename from URL
    const fileName = bannerUrl.split('/').pop();

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('gallery-banner-images')
      .remove([fileName]);

    if (deleteError) {
      console.error('[BANNER DELETE ERROR]', deleteError);
      // Continue anyway to clear database
    }

    // Update database
    await pool.query(
      `UPDATE admins 
       SET banner_image_url = NULL, banner_enabled = FALSE, banner_uploaded_at = NULL
       WHERE id = $1`,
      [userId]
    );

    res.json({ message: 'Banner deleted successfully' });

  } catch (err) {
    console.error('[BANNER DELETE ERROR]', err.message);
    res.status(500).json({ message: 'Server error during banner deletion' });
  }
});

module.exports = router;
