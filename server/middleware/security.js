const rateLimit = require('express-rate-limit');
const validator = require('validator');

// =====================================================
// 1. RATE LIMITING - Brute Force Protection
// =====================================================

// Login Rate Limiter: Max 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { 
    message: "Too many login attempts. Please try again after 15 minutes." 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting
  skipSuccessfulRequests: true,
  // Use IP address as key
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  }
});

// Registration Rate Limiter: Max 3 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { 
    message: "Too many registration attempts. Please try again later." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Verification Rate Limiter: Max 5 attempts per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { 
    message: "Too many OTP verification attempts. Please request a new OTP." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password Change Rate Limiter: Max 3 attempts per hour
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { 
    message: "Too many password change attempts. Please try again later." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =====================================================
// 2. INPUT VALIDATION & SANITIZATION
// =====================================================

const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  // Check required fields
  if (!username || !email || !password) {
    return res.status(400).json({ 
      message: "All fields are required." 
    });
  }

  // Validate Email
  if (!validator.isEmail(email)) {
    return res.status(400).json({ 
      message: "Invalid email format." 
    });
  }

  // Validate Username (alphanumeric, 3-30 characters)
  if (!validator.isAlphanumeric(username.replace(/_/g, '')) || 
      username.length < 3 || username.length > 30) {
    return res.status(400).json({ 
      message: "Username must be 3-30 alphanumeric characters." 
    });
  }

  // Validate Password Strength (min 8 chars, at least 1 lowercase, 1 uppercase, 1 number)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      message: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number." 
    });
  }

  // Sanitize inputs (prevent XSS)
  req.body.username = validator.escape(username.trim());
  req.body.email = validator.normalizeEmail(email).toLowerCase();
  
  next();
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      message: "Username and password are required." 
    });
  }

  // Sanitize
  req.body.username = validator.escape(username.trim());

  next();
};

const validateOTP = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ 
      message: "Email and OTP are required." 
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ 
      message: "Invalid email format." 
    });
  }

  // OTP must be 6 digits
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ 
      message: "Invalid OTP format." 
    });
  }

  req.body.email = validator.normalizeEmail(email).toLowerCase();

  next();
};

// =====================================================
// 3. ACCOUNT LOCKOUT TRACKING
// =====================================================

const failedLoginAttempts = new Map(); // In-memory storage (production မှာ Redis သုံးပါ)

const trackFailedLogin = (username) => {
  const attempts = failedLoginAttempts.get(username) || { count: 0, firstAttempt: Date.now() };
  
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  
  failedLoginAttempts.set(username, attempts);
  
  return attempts;
};

const resetFailedLogin = (username) => {
  failedLoginAttempts.delete(username);
};

const isAccountLocked = (username) => {
  const attempts = failedLoginAttempts.get(username);
  
  if (!attempts) return false;
  
  const LOCKOUT_THRESHOLD = 5; // 5 failed attempts
  const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  
  if (attempts.count >= LOCKOUT_THRESHOLD) {
    const timeSinceFirstAttempt = Date.now() - attempts.firstAttempt;
    
    if (timeSinceFirstAttempt < LOCKOUT_DURATION) {
      return true; // Account is locked
    } else {
      // Lockout period expired, reset
      resetFailedLogin(username);
      return false;
    }
  }
  
  return false;
};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const CLEANUP_AGE = 60 * 60 * 1000; // 1 hour
  
  for (const [username, attempts] of failedLoginAttempts.entries()) {
    if (now - attempts.lastAttempt > CLEANUP_AGE) {
      failedLoginAttempts.delete(username);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
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
};
