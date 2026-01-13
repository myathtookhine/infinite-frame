const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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
    // Check if Email or Username already exists
    const checkUser = await pool.query(
      "SELECT * FROM admins WHERE email = $1 OR username = $2", 
      [email, username]
    );

    if (checkUser.rows.length > 0) {
      const existing = checkUser.rows[0];
      if (existing.is_verified) {
        // ⚠️ SECURITY: Generic message to prevent user enumeration
        return res.status(400).json({ 
          message: "Registration failed. Please check your details." 
        });
      }
      // If unverified, delete and allow re-registration
      await pool.query("DELETE FROM admins WHERE email = $1", [email]);
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

    // ✅ SECURITY: Don't send password_hash or sensitive data
    res.json({ 
      message: "Login successful!", 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role
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

module.exports = router;
