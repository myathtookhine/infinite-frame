const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const pool = require('../db');

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send OTP email
const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
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
            ${otp}
          </div>
          <p style="font-size: 11px; letter-spacing: 2px; color: #888888; text-transform: uppercase; margin-bottom: 40px;">
            This code will expire in 5 minutes
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
  await transporter.sendMail(mailOptions);
};

// 1. INITIATE REGISTER (Renamed from /send-otp or /register)
router.post('/register', async (req, res) => {
  const { username, email, password, account_type, slug } = req.body;

  try {
    // Check if Email or Slug (URL) or Username already exists
    const checkUser = await pool.query(
      "SELECT * FROM admins WHERE email = $1 OR slug = $2 OR username = $3", 
      [email, slug, username]
    );

    if (checkUser.rows.length > 0) {
      const existing = checkUser.rows[0];
      if (existing.is_verified) {
        return res.status(400).json({ message: "Email, Username or URL already exists!" });
      }
      // If unverified, we'll just update it (or delete and re-insert)
      await pool.query("DELETE FROM admins WHERE email = $1", [email]);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      "INSERT INTO admins (username, email, password_hash, account_type, slug, otp_code) VALUES ($1, $2, $3, $4, $5, $6)",
      [username, email, hashedPassword, account_type, slug, otpCode]
    );

    await sendOTP(email, otpCode);
    res.status(201).json({ message: "OTP sent successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error during registration!" });
  }
});

// 2. VERIFY OTP API
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND otp_code = $2',
      [email, otp]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP or Email!" });
    }

    const user = userResult.rows[0];
    
    // Finalize registration
    await pool.query(
      'UPDATE admins SET is_verified = TRUE, otp_code = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ 
      message: "Registration Successful!", 
      user: { id: user.id, username: user.username, email: user.email } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error during verification!" });
  }
});

// 3. LOGIN API
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Username is not correct!" });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (validPassword) {
      res.json({ 
        message: "Login Success", 
        user: { id: user.id, username: user.username, email: user.email } 
      });
    } else {
      res.status(400).json({ message: "Password is not correct!" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

// 4. UPDATE USERNAME API
router.post('/update-profile', async (req, res) => {
  const { userId, newUsername } = req.body;
  try {
    const updatedUser = await pool.query(
      'UPDATE admins SET username = $1 WHERE id = $2 RETURNING id, username, email',
      [newUsername, userId]
    );
    if (updatedUser.rows.length === 0) return res.status(404).json({ message: "User not found!" });
    res.json({ message: "Username updated successfully!", user: updatedUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') return res.status(400).json({ message: "Username already exists!" });
    res.status(500).json({ message: "Server Error!" });
  }
});

// 5. CHANGE PASSWORD API
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM admins WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: "User not found!" });

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) return res.status(400).json({ message: "Current password is incorrect!" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hashedNewPassword, userId]);
    res.json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error!" });
  }
});

module.exports = router;
