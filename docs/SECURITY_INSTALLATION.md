# 🔐 SECURITY ENHANCEMENTS - Installation Guide

## 📋 နှစ်ဆင့်ချင်း Installation လုပ်ပုံ

### **Step 1: Install New Dependencies**

```bash
cd server
npm install express-rate-limit validator
```

**Packages အကြောင်း**:
- `express-rate-limit` (v7.1.5): Rate limiting (brute force protection)
- `validator` (v13.11.0): Input validation & sanitization (XSS protection)

---

### **Step 2: Update Database Schema**

Supabase Dashboard ကို ဖွင့်ပြီး SQL Editor မှာ ဒီ query ကို run ပါ:

```bash
# File location:
server/SECURITY_SCHEMA_UPDATE.sql
```

**သို့မဟုတ်** direct run:

```sql
-- 1. Add OTP Expiry Column
ALTER TABLE admins ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMPTZ;

-- 2. Create Failed Login Attempts Table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    username VARCHAR(50) PRIMARY KEY,
    attempt_count INTEGER DEFAULT 0,
    first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ
);

-- 3. Create Cleanup Functions
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM admins 
  WHERE is_verified = FALSE 
    AND otp_expiry IS NOT NULL 
    AND otp_expiry < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
```

---

### **Step 3: Setup Supabase Cron Jobs (Recommended)**

Supabase Dashboard > Database > Cron Jobs:

**Job 1: Daily OTP Cleanup**
- Name: `cleanup_expired_otps`
- Schedule: `0 2 * * *` (daily at 2 AM)
- SQL: `SELECT cleanup_expired_otps();`

**Job 2: Daily Failed Login Cleanup**
- Name: `cleanup_failed_logins`
- Schedule: `0 3 * * *` (daily at 3 AM)
- SQL: `SELECT cleanup_failed_logins();`

---

### **Step 4: Test Security Features**

#### Test 1: Rate Limiting
```bash
# Should block after 5 attempts in 15 minutes
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong'$i'"}'
  echo ""
done
```

Expected: 6th request ထဲမှာ `429 Too Many Requests` error

#### Test 2: Input Validation
```bash
# Invalid email
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"invalid-email","password":"Test1234"}'
```

Expected: `400 Invalid email format`

#### Test 3: Weak Password
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"weak"}'
```

Expected: `400 Password must be at least 8 characters...`

#### Test 4: Account Lockout
```bash
# Try wrong password 5 times with same username
# 6th attempt should return "Account locked"
```

#### Test 5: OTP Expiry
```bash
# Register → Wait 11 minutes → Try to verify OTP
# Should fail with "OTP expired"
```

---

### **Step 5: Monitor Security Events**

#### Check Activity Logs:
```sql
SELECT * FROM activity_logs 
WHERE action IN ('LOGIN', 'LOGOUT')
ORDER BY created_at DESC 
LIMIT 50;
```

#### Check Failed Login Attempts:
```sql
SELECT * FROM failed_login_attempts 
WHERE attempt_count >= 3
ORDER BY last_attempt_at DESC;
```

---

## 🎯 အောင်မြင်မှု အတည်ပြုချက်

✅ Dependencies များ install ပြီး  
✅ Database schema update ပြီး  
✅ Rate limiting အလုပ်လုပ်  
✅ Input validation အလုပ်လုပ်  
✅ Account lockout အလုပ်လုပ်  
✅ OTP expiry အလုပ်လုပ်  

---

## 🚨 Troubleshooting

### Issue 1: "Cannot find module 'express-rate-limit'"
**Solution**:
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Database column already exists
**Solution**: The SQL uses `IF NOT EXISTS` - safe to re-run

### Issue 3: Rate limiter not working
**Debug**:
```javascript
// Check headers in response
console.log(response.headers['x-ratelimit-remaining']);
```

---

## 📊 Security Monitoring Dashboard (Optional)

Create a simple monitoring query:

```sql
-- Daily Security Report
SELECT 
  COUNT(*) FILTER (WHERE action = 'LOGIN') as successful_logins,
  COUNT(*) FILTER (WHERE action = 'LOGOUT') as logouts,
  COUNT(DISTINCT admin_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM activity_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';
```

---

ဒါဆို Security Enhancements အားလုံး ready ပါပြီ! 🎉
