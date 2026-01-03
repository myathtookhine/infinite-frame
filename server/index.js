const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- API ROUTES ---

// 1. SEND OTP API
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

  try {
    // အရင်ရှိနေတဲ့ OTP အဟောင်းတွေကို ဖြတ်ထုတ်မယ် (optional)
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

    // OTP အသစ်ကို Database ထဲသိမ်းမယ် (၅ မိနစ်သက်တမ်း)
    await pool.query(
      'INSERT INTO otp_verifications (email, otp_code) VALUES ($1, $2)',
      [email, otp]
    );

    // Email ပို့မယ်
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Infinite Frame Registration - OTP Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #000;">Verification Code</h2>
          <p>Your 6-digit OTP for Infinite Frame registration is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully!" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error sending OTP!" });
  }
});

// 2. REGISTER API (Verify OTP + Create User)
app.post('/api/register', async (req, res) => {
  const { username, email, password, otp } = req.body;

  try {
    // OTP ကို စစ်မယ် (Expire မဖြစ်သေးတဲ့ code ဖြစ်ရမယ်)
    const otpResult = await pool.query(
      'SELECT * FROM otp_verifications WHERE email = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP',
      [email, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP!" });
    }

    // Password ကို Hash လုပ်မယ်
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // User အသစ်ကို Database ထဲထည့်မယ်
    const newUser = await pool.query(
      'INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    console.log("New User Created in DB:", newUser.rows[0]);

    // အောင်မြင်ရင် OTP ကို table ထဲက ဖြတ်ထုတ်မယ်
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

    res.json({ 
      message: "Registration Successful!", 
      user: newUser.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: "Username or Email already exists!" });
    }
    res.status(500).json({ message: "Server Error!" });
  }
});

// 3. LOGIN API (Update to use Bcrypt Compare)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM admins WHERE username = $1', 
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Username is not correct!" });
    }

    const user = userResult.rows[0];

    // Password တိုက်စစ်မယ် (Bcrypt)
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
app.post('/api/update-profile', async (req, res) => {
  const { userId, newUsername } = req.body;

  try {
    const updatedUser = await pool.query(
      'UPDATE admins SET username = $1 WHERE id = $2 RETURNING id, username, email',
      [newUsername, userId]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ 
      message: "Username updated successfully!", 
      user: updatedUser.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: "Username already exists!" });
    }
    res.status(500).json({ message: "Server Error!" });
  }
});

// 5. CHANGE PASSWORD API
app.post('/api/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // ၁။ User ကို အရင်ရှာမယ်
    const userResult = await pool.query('SELECT * FROM admins WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    const user = userResult.rows[0];

    // ၂။ လက်ရှိ Password မှန်မမှန် အရင်စစ်မယ်
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect!" });
    }

    // ၃။ Password အသစ်ကို Hash လုပ်မယ်
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // ၄။ Database မှာ Update လုပ်မယ်
    await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );

    res.json({ message: "Password changed successfully!" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error!" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});