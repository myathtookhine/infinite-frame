const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');
const {
  loginLimiter,
  registerLimiter,
  otpLimiter,
  passwordChangeLimiter,
  validateRegistration,
  validateLogin,
  validateOTP,
  trackFailedLogin,
  resetFailedLogin,
  isAccountLocked
} = require('../middleware/security');

// Resend SMTP Config (Port 2465 bypasses Render Free Tier block)
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 2465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

// Middleware to check User Role & ID (Matches logic in artworks.js)
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

// =====================================================
// HELPER: Send OTP Email
// =====================================================
const sendOTP = async (email, otp) => {
  // ✅ SECURITY: Escape OTP (although it's numeric, good practice)
  const sanitizedOTP = String(otp).replace(/[^0-9]/g, '');
  
  const mailOptions = {
    from: 'Infinite Frame Admin Portal <onboarding@infiniteframe.online>',
    to: email,
    subject: 'Infinite Frame Registration - OTP Code',
    html: `
      <div style="background-color: #ffffff; padding: 50px 20px; font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif; color: #000000; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; border: 3px solid #000000; padding: 50px 30px; box-shadow: 12px 12px 0px #000000; background-color: #ffffff;">
          <h1 style="font-size: 22px; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 40px; font-weight: 700;">
            Infinite Frame
          </h1>
          <div style="height: 1px; background-color: #e0e0e0; margin-bottom: 40px;"></div>
          <p style="font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 25px; color: #555555;">
            Your Verification Code
          </p>
          <div style="background-color: #000000; color: #ffffff; padding: 25px; font-size: 36px; font-weight: 700; letter-spacing: 15px; margin-bottom: 40px; border: 1px solid #000000;">
            ${sanitizedOTP}
          </div>
          <p style="font-size: 11px; letter-spacing: 2px; color: #888888; text-transform: uppercase; margin-bottom: 40px;">
            This code will expire in 10 minutes
          </p>
          <div style="border-top: 1px solid #e0e0e0; padding-top: 30px;">
            <p style="font-size: 10px; letter-spacing: 3px; color: #aaaaaa; text-transform: uppercase;">
              © 2026 Infinite Frame Admin Portal System
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully via Resend SMTP:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Email Sending Failed:", error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// 1. REGISTER - with Rate Limiting & Validation
// =====================================================
router.post('/register', registerLimiter, validateRegistration, async (req, res) => {
  const { username, email, password } = req.body; // Already sanitized by middleware

  try {
    // Check if Email already exists
    const checkEmail = await pool.query(
      "SELECT * FROM admins WHERE email = $1", 
      [email]
    );

    if (checkEmail.rows.length > 0) {
      const existingEmail = checkEmail.rows[0];
      if (existingEmail.is_verified) {
        return res.status(400).json({ 
          message: "This email is already used. Please try with another!" 
        });
      }
      // If unverified, delete old attempt and allow re-registration
      await pool.query("DELETE FROM admins WHERE email = $1", [email]);
    }

    // Check if Username already exists
    const checkUsername = await pool.query(
      "SELECT * FROM admins WHERE username = $1", 
      [username]
    );

    if (checkUsername.rows.length > 0) {
      const existingUsername = checkUsername.rows[0];
      if (existingUsername.is_verified) {
        return res.status(400).json({ 
          message: "This username is already taken. Please choose another!" 
        });
      }
      // If unverified, delete old attempt
      await pool.query("DELETE FROM admins WHERE username = $1", [username]);
    }


    const hashedPassword = await bcrypt.hash(password, 12); // ✅ Increased salt rounds from 10 to 12
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // ✅ 10 minutes expiry

    // Insert with OTP expiry
    await pool.query(
      "INSERT INTO admins (username, email, password_hash, role, otp_code, otp_expiry) VALUES ($1, $2, $3, 'individual', $4, $5)",
      [username, email, hashedPassword, otpCode, otpExpiry]
    );

    const emailResult = await sendOTP(email, otpCode);
    
    if (!emailResult.success) {
      await pool.query("DELETE FROM admins WHERE email = $1", [email]);
      return res.status(500).json({ 
        message: "Failed to send verification email. Please try again." 
      });
    }

    res.status(201).json({ 
      message: "OTP sent successfully! Please check your email." 
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err.message);
    res.status(500).json({ 
      message: "Server error during registration. Please try again later." 
    });
  }
});

// =====================================================
// 2. VERIFY OTP - with Rate Limiting & Validation
// =====================================================
router.post('/verify-otp', otpLimiter, validateOTP, async (req, res) => {
  const { email, otp } = req.body; // Already sanitized

  try {
    const userResult = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );

    // ✅ SECURITY: Generic error message
    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        message: "Invalid verification code or email." 
      });
    }

    const user = userResult.rows[0];

    // ✅ Check OTP expiry
    if (user.otp_expiry && new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ 
        message: "OTP has expired. Please request a new one." 
      });
    }

    // ✅ Check OTP match
    if (user.otp_code !== otp) {
      return res.status(400).json({ 
        message: "Invalid verification code or email." 
      });
    }
    
    // Finalize registration
    await pool.query(
      'UPDATE admins SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ 
      message: "Registration successful! You can now login.", 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('[VERIFY-OTP ERROR]', err.message);
    res.status(500).json({ 
      message: "Server error during verification. Please try again." 
    });
  }
});

// =====================================================
// 3. LOGIN - with Rate Limiting, Validation & Account Lockout
// =====================================================
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  const { username, password } = req.body; // Already sanitized

  try {
    // ✅ SECURITY: Check account lockout FIRST (before DB query)
    if (isAccountLocked(username)) {
      return res.status(429).json({ 
        message: "Account temporarily locked due to multiple failed attempts. Please try again in 30 minutes." 
      });
    }

    const userResult = await pool.query(
      'SELECT * FROM admins WHERE username = $1', 
      [username]
    );

    // ✅ SECURITY: Generic error message (don't reveal if username exists)
    if (userResult.rows.length === 0) {
      trackFailedLogin(username); // Track failed attempt
      return res.status(401).json({ 
        message: "Invalid username or password." 
      });
    }

    const user = userResult.rows[0];

    // ✅ Check if email verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in." 
      });
    }

    // ✅ Check account status
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: "Your account has been suspended. Please contact support." 
      });
    }

    // ✅ Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      // ✅ SECURITY: Track failed login attempt
      const attempts = trackFailedLogin(username);
      
      const remainingAttempts = 5 - attempts.count;
      
      if (remainingAttempts <= 0) {
        return res.status(429).json({ 
          message: "Account locked due to multiple failed attempts. Please try again in 30 minutes." 
        });
      }
      
      return res.status(401).json({ 
        message: `Invalid username or password. ${remainingAttempts} attempts remaining.`
      });
    }


    // ✅ SUCCESS: Reset failed login counter
    resetFailedLogin(username);

    // ✅ LOG ACTIVITY: LOGIN
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await pool.query(
      "INSERT INTO activity_logs (admin_id, action, ip_address, details) VALUES ($1, 'LOGIN', $2, 'User logged in successfully')",
      [user.id, clientIp]
    );

    // ✅ GENERATE JWT TOKEN
    const token = jwt.sign(
      {
        sub: user.id,           // Subject (user's UUID)
        role: user.role,        // User's role (super_admin or admin)
        email: user.email,      // User's email
        username: user.username // User's username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // ✅ SECURITY: Don't send password_hash or sensitive data
    res.json({ 
      message: "Login successful!",
      token: token, // ← JWT Token for authentication
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role,
        slug: user.slug,
        gallery_name: user.gallery_name,
        description: user.description,
        address: user.address,
        phone_numbers: user.phone_numbers,
        social_links: user.social_links,
        banner_image_url: user.banner_image_url,
        banner_enabled: user.banner_enabled
      } 
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
});

// =====================================================
// 3.5 GET ME (with Stats)
// =====================================================
// =====================================================
// 3.5 GET ME (with Stats)
// =====================================================
router.get('/me', getUserContext, async (req, res) => {

  try {
    // 1. Get Basic User Info & Page Views
    const userResult = await pool.query(
      "SELECT id, username, email, role, page_views FROM admins WHERE id = $1",
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];
    let artworkCount = 0;

    // 2. Get Artwork Count based on Role
    if (user.role === 'super_admin') {
      // Super Admin: Count ALL artworks
      const countResult = await pool.query("SELECT COUNT(*) FROM artworks");
      artworkCount = parseInt(countResult.rows[0].count);
    } else {
      // Regular Admin: Count OWN artworks
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM artworks WHERE admin_id = $1",
        [user.id]
      );
      artworkCount = parseInt(countResult.rows[0].count);
    }

    res.json({
      user: {
        ...user,
        artwork_count: artworkCount
      }
    });

  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =====================================================
// 4. LOGOUT - Activity Logging
// =====================================================
router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(200).json({ message: "Logged out" });
  }

  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await pool.query(
      "INSERT INTO activity_logs (admin_id, action, ip_address, details) VALUES ($1, 'LOGOUT', $2, 'User logged out')",
      [userId, clientIp]
    );
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error('[LOGOUT ERROR]', err.message);
    // Don't block logout on error
    res.status(200).json({ message: "Logged out" });
  }
});

// =====================================================
// 5. UPDATE PROFILE - with Validation
// =====================================================
router.post('/update-profile', async (req, res) => {
  const { userId, newUsername } = req.body;

  // ✅ Input validation
  if (!userId || !newUsername) {
    return res.status(400).json({ 
      message: "User ID and new username are required." 
    });
  }

  // ✅ Username validation (same as registration)
  const validator = require('validator');
  if (!validator.isAlphanumeric(newUsername.replace(/_/g, '')) || 
      newUsername.length < 3 || newUsername.length > 30) {
    return res.status(400).json({ 
      message: "Username must be 3-30 alphanumeric characters." 
    });
  }

  const sanitizedUsername = validator.escape(newUsername.trim());

  try {
    const updatedUser = await pool.query(
      'UPDATE admins SET username = $1 WHERE id = $2 RETURNING id, username, email, role',
      [sanitizedUsername, userId]
    );
    
    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    
    res.json({ 
      message: "Username updated successfully!", 
      user: updatedUser.rows[0] 
    });
  } catch (err) {
    console.error('[UPDATE-PROFILE ERROR]', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ 
        message: "Username already exists. Please choose another." 
      });
    }
    res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
});

// =====================================================
// 6. CHANGE PASSWORD - with Rate Limiting & Validation
// =====================================================
router.post('/change-password', passwordChangeLimiter, async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  // ✅ Input validation
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ 
      message: "All fields are required." 
    });
  }

  // ✅ Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      message: "New password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number." 
    });
  }

  // ✅ Prevent reusing same password
  if (currentPassword === newPassword) {
    return res.status(400).json({ 
      message: "New password must be different from current password." 
    });
  }

  try {
    const userResult = await pool.query(
      'SELECT * FROM admins WHERE id = $1', 
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!validPassword) {
      return res.status(400).json({ 
        message: "Current password is incorrect." 
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12); // ✅ Salt rounds 12
    await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2', 
      [hashedNewPassword, userId]
    );
    
    res.json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error('[CHANGE-PASSWORD ERROR]', err.message);
    res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
});

// =====================================================
// 7. UPDATE GALLERY INFO
// =====================================================
router.post('/update-gallery-info', async (req, res) => {
  const { userId, slug, gallery_name, description, address, phone_numbers, social_links } = req.body;

  // ✅ Input validation
  if (!userId) {
    return res.status(400).json({ 
      message: "User ID is required." 
    });
  }

  const validator = require('validator');
  const updates = {};
  
  // ✅ Validate and sanitize slug (optional)
  if (slug !== undefined) {
    if (slug && slug.trim() !== '') {
      const slugPattern = /^[a-z0-9-]+$/;
      const trimmedSlug = slug.trim().toLowerCase();
      
      if (!slugPattern.test(trimmedSlug) || trimmedSlug.length < 3 || trimmedSlug.length > 50) {
        return res.status(400).json({ 
          message: "Slug must be 3-50 characters, lowercase, alphanumeric and hyphens only." 
        });
      }
      
      updates.slug = trimmedSlug;
    } else {
      updates.slug = null;
    }
  }
  
  // ✅ Validate gallery_name (optional)
  if (gallery_name !== undefined) {
    if (gallery_name && gallery_name.trim() !== '') {
      const trimmedName = gallery_name.trim();
      if (trimmedName.length < 3 || trimmedName.length > 255) {
        return res.status(400).json({ 
          message: "Gallery name must be 3-255 characters." 
        });
      }
      updates.gallery_name = validator.escape(trimmedName);
    } else {
      updates.gallery_name = null;
    }
  }
  
  // ✅ Validate description (optional)
  if (description !== undefined) {
    if (description && description.trim() !== '') {
      const trimmedDesc = description.trim();
      if (trimmedDesc.length > 2000) {
        return res.status(400).json({ 
          message: "Description must not exceed 2000 characters." 
        });
      }
      updates.description = validator.escape(trimmedDesc);
    } else {
      updates.description = null;
    }
  }
  
  // ✅ Validate address (optional)
  if (address !== undefined) {
    if (address && address.trim() !== '') {
      const trimmedAddress = address.trim();
      if (trimmedAddress.length > 500) {
        return res.status(400).json({ 
          message: "Address must not exceed 500 characters." 
        });
      }
      updates.address = validator.escape(trimmedAddress);
    } else {
      updates.address = null;
    }
  }
  
  // ✅ Validate phone_numbers (optional JSON array)
  if (phone_numbers !== undefined) {
    if (Array.isArray(phone_numbers)) {
      // Filter out empty values
      const validPhones = phone_numbers
        .filter(p => p && p.trim() !== '')
        .map(p => p.trim());
      
      if (validPhones.length > 10) {
        return res.status(400).json({ 
          message: "Maximum 10 phone numbers allowed." 
        });
      }
      
      updates.phone_numbers = JSON.stringify(validPhones);
    } else {
      updates.phone_numbers = '[]';
    }
  }
  
  // ✅ Validate social_links (optional JSON object)
  if (social_links !== undefined) {
    if (typeof social_links === 'object' && social_links !== null && !Array.isArray(social_links)) {
      // Validate URLs
      const validLinks = {};
      for (const [platform, url] of Object.entries(social_links)) {
        if (url && url.trim() !== '') {
          if (!validator.isURL(url.trim())) {
            return res.status(400).json({ 
              message: `Invalid URL for ${platform}` 
            });
          }
          validLinks[platform.trim()] = url.trim();
        }
      }
      updates.social_links = JSON.stringify(validLinks);
    } else {
      updates.social_links = '{}';
    }
  }

  try {
    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return res.status(400).json({ 
        message: "No fields to update." 
      });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = [...fields.map(f => updates[f]), userId];
    
    const query = `
      UPDATE admins 
      SET ${setClause}
      WHERE id = $${fields.length + 1}
      RETURNING id, username, email, role, slug, gallery_name, description, address, phone_numbers, social_links, banner_image_url, banner_enabled
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    
    res.json({ 
      message: "Gallery information updated successfully!", 
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('[UPDATE-GALLERY-INFO ERROR]', err.message);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ 
        message: "This slug is already taken. Please choose another." 
      });
    }
    res.status(500).json({ 
      message: "Server error. Please try again later." 
    });
  }
});

module.exports = router;
