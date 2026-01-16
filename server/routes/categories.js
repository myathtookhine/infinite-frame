const express = require('express');
const router = express.Router();
const pool = require('../db');

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

// 1. GET ALL CATEGORIES
router.get('/', async (req, res) => {
  try {
    let query;
    let params = [];
    const targetUserId = req.query.target_user_id;

    if (req.user.role === 'super_admin') {
      if (targetUserId && targetUserId !== 'all') {
        // Super Admin viewing SPECIFIC admin's categories
        query = "SELECT * FROM categories WHERE admin_id = $1 ORDER BY name";
        params = [targetUserId];
      } else {
        // Super Admin viewing ALL categories (with owner info)
        query = `
          SELECT c.id, c.name, c.is_active, c.created_at, c.updated_at, 
                 adm.email as owner_email, adm.username as owner_name, c.admin_id
          FROM categories c
          JOIN admins adm ON c.admin_id = adm.id
          ORDER BY c.name
        `;
      }
    } else {
      // Individual sees ONLY their categories
      query = "SELECT * FROM categories WHERE admin_id = $1 ORDER BY name";
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 2. CREATE CATEGORY (Admin & Super Admin)
router.post('/', async (req, res) => {
  const { name, admin_id } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Category name is required." });
  }

  // Super admin can create categories for any admin, regular admin can only create for themselves
  const targetAdminId = req.user.role === 'super_admin' && admin_id ? admin_id : req.user.id;

  try {
    const newCategory = await pool.query(
      "INSERT INTO categories (admin_id, name) VALUES ($1, $2) RETURNING *",
      [targetAdminId, name.trim()]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: "This category already exists in the list!" });
    }
    res.status(500).send("Server Error");
  }
});

// 3. UPDATE CATEGORY (Admin & Super Admin)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  try {
    let updateCategory;
    
    if (req.user.role === 'super_admin') {
      // Super admin can update any category
      updateCategory = await pool.query(
        "UPDATE categories SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *",
        [name, is_active, id]
      );
    } else {
      // Regular admin can only update their own categories
      updateCategory = await pool.query(
        "UPDATE categories SET name = COALESCE($1, name), is_active = COALESCE($2, is_active) WHERE id = $3 AND admin_id = $4 RETURNING *",
        [name, is_active, id, req.user.id]
      );
    }

    if (updateCategory.rows.length === 0) {
      return res.status(404).json({ message: "Category not found or unauthorized." });
    }

    res.json(updateCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: "This category name already exists!" });
    }
    res.status(500).send("Server Error");
  }
});

// 4. DELETE CATEGORY (Admin & Super Admin)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Check if category exists and ownership (for regular admins)
    if (req.user.role !== 'super_admin') {
      const checkOwner = await pool.query("SELECT * FROM categories WHERE id = $1 AND admin_id = $2", [id, req.user.id]);
      if (checkOwner.rows.length === 0) {
        return res.status(404).json({ message: "Category not found or unauthorized." });
      }
    } else {
      // Super admin - just check if category exists
      const checkExists = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
      if (checkExists.rows.length === 0) {
        return res.status(404).json({ message: "Category not found." });
      }
    }

    // 2. Delete (foreign key constraints will prevent if linked to artworks)
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err.message);
    // Postgres Foreign Key Violation Code: 23503
    if (err.code === '23503') {
      return res.status(400).json({ message: "Cannot delete: This category is linked to existing artworks." });
    }
    res.status(500).send("Server Error");
  }
});

module.exports = router;
