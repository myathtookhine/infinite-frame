# 🎯 CURRENT RATE LIMITING CONFIGURATION

## Updated: January 13, 2026

---

## 📊 Rate Limits Per Endpoint

| Endpoint | Window | Max Attempts | Lockout Duration | Notes |
|----------|--------|--------------|------------------|-------|
| **Login** | 15 minutes | 5 | 15 minutes | IP-based blocking |
| **Register** | 1 hour | **10** | 1 hour | **Updated from 3** ✅ |
| **Verify OTP** | 10 minutes | 5 | 10 minutes | Prevent brute force OTP |
| **Change Password** | 1 hour | 3 | 1 hour | Security-critical operation |

---

## 🔐 Account-Level Protection

**Failed Login Tracking:**
- **Max Failed Attempts**: 5 per username
- **Lockout Duration**: 30 minutes
- **Storage**: In-memory Map (Production: Use Redis)

**Example:**
```
Username "john" tries wrong password 5 times
→ Account "john" locked for 30 minutes
→ Even with correct password, login blocked
```

---

## ⚙️ Configuration File

**Location:** `server/middleware/security.js`

### Registration Rate Limiter:
```javascript
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // 10 attempts (UPDATED) ✅
  message: { 
    message: "Too many registration attempts. Please try again later." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

---

## 🧪 Testing

### Test Registration Rate Limit:
```bash
# Should block after 10 attempts in 1 hour
for i in {1..12}; do
  echo "Attempt $i"
  curl -X POST http://localhost:5000/api/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"test$i\",\"email\":\"test$i@example.com\",\"password\":\"Test1234\"}"
  sleep 1
done
```

**Expected:**
- Attempts 1-10: Success or validation errors
- **Attempt 11**: `429 Too many registration attempts...`

---

## 📝 Why These Numbers?

### Login (5 attempts / 15 min):
- Strict to prevent brute force attacks
- 5 attempts enough for typos
- 15 min cooldown discourages attackers

### Register (10 attempts / hour):
- **More lenient for legitimate users** ✅
- Allows multiple signup attempts (email typos, etc.)
- Still blocks spam/bot registrations
- 1 hour window prevents abuse

### OTP Verify (5 attempts / 10 min):
- 6-digit OTP = limited guesses needed
- 5 attempts reasonable for real users
- 10 min matches OTP expiry window

### Change Password (3 attempts / hour):
- Highly sensitive operation
- Strict limit prevents account takeover
- Forces users to be careful

---

## 🚀 Production Recommendations

### Current (Development):
```javascript
// In-memory storage
const failedLoginAttempts = new Map();
```

### Production (Recommended):
```javascript
// Redis for distributed rate limiting
const Redis = require('ioredis');
const RedisStore = require('rate-limit-redis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

const registerLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:register:'
  }),
  windowMs: 60 * 60 * 1000,
  max: 10
});
```

**Benefits:**
- Shared across multiple servers
- Persistent (survives server restart)
- Scalable for high traffic

---

## 📈 Monitoring

### Check Rate Limit Headers:
```bash
curl -i -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test1234"}'
```

**Response Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1705147200
```

### Track Violations:
```javascript
// Add to rate limiter config
handler: (req, res) => {
  console.log(`[RATE LIMIT] IP: ${req.ip}, Endpoint: ${req.path}`);
  res.status(429).json({ 
    message: "Too many attempts..." 
  });
}
```

---

## ✅ Changes Summary

**What Changed:**
- Registration rate limit: `3` → `10` attempts per hour

**Files Updated:**
1. ✅ `server/middleware/security.js` (Line 28: max: 10)
2. ✅ `server/SECURITY_AUDIT_REPORT.md` (Documentation table)
3. ✅ `RATE_LIMIT_CONFIG.md` (This file)

**Why:**
- More user-friendly for legitimate registrations
- Reduces friction during signup
- Still protects against spam and bots

---

**Last Updated:** January 13, 2026  
**Configuration Status:** ✅ Active
