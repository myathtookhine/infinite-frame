const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getUserContext } = require('../middleware/userContext');
const multer = require('multer');
const sharp = require('sharp');
const supabase = require('../utils/supabase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WebP files are allowed'), false);
    }
  }
});

// Middleware to ensure only super_admin can access certain routes
const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Super Admin access required" });
    }
};

// =====================================================
// 1. PUBLIC/ADMIN: Get Payment Info
// =====================================================
router.get('/payment-info', getUserContext, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM payment_info WHERE is_active = TRUE");
        res.json(result.rows);
    } catch (err) {
        console.error('[GET-PAYMENT-INFO ERROR]', err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// =====================================================
// 2. ADMIN: Submit Subscription Request
// =====================================================
router.post('/submit', getUserContext, upload.single('receipt'), async (req, res) => {
    const { plan_type, billing_cycle, amount, notes } = req.body;
    const admin_id = req.user.id;

    if (!plan_type || !billing_cycle || !req.file) {
        return res.status(400).json({ message: "Missing required fields or receipt image" });
    }

    try {
        const imageBuffer = req.file.buffer;
        
        const processedImage = await sharp(imageBuffer)
          .webp({ quality: 85 })
          .toBuffer();

        const timestamp = Date.now();
        const fileName = `receipts/receipt-${admin_id}-${timestamp}.webp`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipt-images')
          .upload(fileName, processedImage, {
            contentType: 'image/webp',
            upsert: false
          });

        if (uploadError) {
            console.error('[RECEIPT UPLOAD ERROR]', uploadError);
            return res.status(500).json({ message: "Failed to upload receipt image", error: uploadError.message });
        }

        const { data: { publicUrl } } = supabase.storage
          .from('receipt-images')
          .getPublicUrl(fileName);

        const receipt_url = publicUrl;

        const result = await pool.query(
            "INSERT INTO subscriptions (admin_id, plan_type, billing_cycle, amount, receipt_url, notes, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *",
            [admin_id, plan_type, billing_cycle, amount, receipt_url, notes]
        );
        res.status(201).json({ message: "Subscription request submitted successfully", subscription: result.rows[0] });
    } catch (err) {
        console.error('[SUBMIT-SUBSCRIPTION ERROR]', err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// =====================================================
// 3. ADMIN: Get My Subscription History
// =====================================================
router.get('/my-subscriptions', getUserContext, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM subscriptions WHERE admin_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('[GET-MY-SUBSCRIPTIONS ERROR]', err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// =====================================================
// 4. SUPERADMIN: List All Subscriptions (with filtering)
// =====================================================
router.get('/admin/list', getUserContext, isSuperAdmin, async (req, res) => {
    const { status } = req.query;
    let query = `
        SELECT s.*, a.username, a.email 
        FROM subscriptions s 
        JOIN admins a ON s.admin_id = a.id
    `;
    const values = [];

    if (status) {
        query += " WHERE s.status = $1";
        values.push(status);
    }

    query += " ORDER BY s.created_at DESC";

    try {
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('[ADMIN-LIST-SUBSCRIPTIONS ERROR]', err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// =====================================================
// 5. SUPERADMIN: Verify Subscription (Approve/Reject)
// =====================================================
router.post('/admin/verify', getUserContext, isSuperAdmin, async (req, res) => {
    const { subscription_id, status, notes, expiry_date } = req.body;

    if (!subscription_id || !['active', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid request parameters" });
    }

    try {
        await pool.query('BEGIN');

        // Update Subscription record
        const subUpdate = await pool.query(
            "UPDATE subscriptions SET status = $1, notes = $2, start_date = CASE WHEN $1 = 'active' THEN NOW() ELSE start_date END, expiry_date = $3 WHERE id = $4 RETURNING admin_id, plan_type",
            [status, notes, expiry_date, subscription_id]
        );

        if (subUpdate.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: "Subscription not found" });
        }

        const { admin_id, plan_type } = subUpdate.rows[0];

        // If approved, update admin's current plan
        if (status === 'active') {
            await pool.query(
                "UPDATE admins SET subscription_plan = $1, subscription_expiry = $2 WHERE id = $3",
                [plan_type, expiry_date, admin_id]
            );
        }

        await pool.query('COMMIT');
        res.json({ message: `Subscription ${status} successfully` });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('[VERIFY-SUBSCRIPTION ERROR]', err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// =====================================================
// 6. SUPERADMIN: Manage Payment Info
// =====================================================
router.post('/admin/payment-info', getUserContext, isSuperAdmin, async (req, res) => {
    const { provider, account_name, account_number, is_active } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO payment_info (provider, account_name, account_number, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
            [provider, account_name, account_number, is_active]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[MANAGE-PAYMENT-INFO ERROR]', err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
