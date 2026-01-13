# 🧪 REGISTRATION ERROR MESSAGES - Testing Guide

## Updated: January 13, 2026

---

## ✅ NEW: Specific Error Messages

Registration now shows **clear, specific error messages** instead of generic ones.

---

## 📋 All Registration Error Messages

### **1. Email Already Used**
```json
{
  "message": "This email is already used. Please try with another!"
}
```

**When:**
- Email already registered and verified
- User tries to register with existing email

**Test:**
```bash
# Register first time
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"user1\",\"email\":\"test@example.com\",\"password\":\"Test1234\"}"

# Verify with OTP (assuming you got 123456)
curl -X POST http://localhost:5000/api/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"otp\":\"123456\"}"

# Try to register again with same email
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"user2\",\"email\":\"test@example.com\",\"password\":\"Test1234\"}"
```

**Result:** ✅ "This email is already used. Please try with another!"

---

### **2. Username Already Taken**
```json
{
  "message": "This username is already taken. Please choose another!"
}
```

**When:**
- Username already exists and verified
- User tries to register with existing username

**Test:**
```bash
# After first user is verified, try registering with same username
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"user1\",\"email\":\"another@example.com\",\"password\":\"Test1234\"}"
```

**Result:** ✅ "This username is already taken. Please choose another!"

---

### **3. Invalid Email Format**
```json
{
  "message": "Invalid email format."
}
```

**When:** Email format is incorrect

**Test:**
```bash
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"not-an-email\",\"password\":\"Test1234\"}"
```

---

### **4. Weak Password**
```json
{
  "message": "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number."
}
```

**When:** Password doesn't meet requirements

**Test:**
```bash
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@test.com\",\"password\":\"weak\"}"
```

---

### **5. Username Too Short/Invalid**
```json
{
  "message": "Username must be 3-30 alphanumeric characters."
}
```

**When:** Username < 3 characters or contains special characters

**Test:**
```bash
# Too short
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"ab\",\"email\":\"test@test.com\",\"password\":\"Test1234\"}"

# Special characters
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"user@123\",\"email\":\"test@test.com\",\"password\":\"Test1234\"}"
```

---

### **6. Rate Limit Exceeded (Registration)**
```json
{
  "message": "Too many registration attempts. Please try again later."
}
```

**When:** More than 10 registration attempts in 1 hour from same IP

**Test:**
```bash
# Try registering 11 times rapidly
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"email\":\"test$i@example.com\",\"password\":\"Test1234\"}"
done
```

---

### **7. Email Sending Failed**
```json
{
  "message": "Failed to send verification email. Please try again."
}
```

**When:** 
- RESEND_API_KEY is missing or invalid
- Email service is down

---

### **8. Server Error**
```json
{
  "message": "Server error during registration. Please try again later."
}
```

**When:** Unexpected database or server error

---

## 🎯 Complete Registration Flow

### **Scenario 1: Successful Registration**

```bash
# 1. Register
POST /api/register
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "NewPass123"
}

# Response:
{
  "message": "OTP sent successfully! Please check your email."
}

# 2. Verify OTP (from email)
POST /api/verify-otp
{
  "email": "newuser@example.com",
  "otp": "123456"
}

# Response:
{
  "message": "Registration successful! You can now login.",
  "user": {
    "id": "uuid",
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "individual"
  }
}
```

---

### **Scenario 2: Duplicate Email**

```bash
# Try registering with existing email
POST /api/register
{
  "username": "anotheruser",
  "email": "newuser@example.com",  # Already exists!
  "password": "Test1234"
}

# Response:
{
  "message": "This email is already used. Please try with another!"
}
```

---

### **Scenario 3: Duplicate Username**

```bash
# Try registering with existing username
POST /api/register
{
  "username": "newuser",  # Already exists!
  "email": "different@example.com",
  "password": "Test1234"
}

# Response:
{
  "message": "This username is already taken. Please choose another!"
}
```

---

## 🔍 Behind The Scenes

### **How It Works:**

```javascript
// Step 1: Check Email
const checkEmail = await pool.query(
  "SELECT * FROM admins WHERE email = $1", 
  [email]
);

if (checkEmail.rows.length > 0 && checkEmail.rows[0].is_verified) {
  return res.status(400).json({ 
    message: "This email is already used. Please try with another!" 
  });
}

// Step 2: Check Username
const checkUsername = await pool.query(
  "SELECT * FROM admins WHERE username = $1", 
  [username]
);

if (checkUsername.rows.length > 0 && checkUsername.rows[0].is_verified) {
  return res.status(400).json({ 
    message: "This username is already taken. Please choose another!" 
  });
}

// Step 3: If both are unique, proceed with registration
```

---

## 📊 Error Response Structure

All errors follow this format:

```javascript
{
  "message": "Specific error message here"
}
```

**HTTP Status Codes:**
- `400` - Validation error (email/username exists, weak password, etc.)
- `429` - Rate limit exceeded
- `500` - Server error

---

## ✅ User Experience Improvement

### **Before:**
```json
{
  "message": "Registration failed. Please check your details."
}
```
❌ User doesn't know what's wrong

### **After:**
```json
{
  "message": "This email is already used. Please try with another!"
}
```
✅ User knows exactly what to fix!

---

## 🧪 Complete Test Sequence

```bash
# Test 1: Valid Registration
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser1\",\"email\":\"test1@example.com\",\"password\":\"Test1234\"}"
# Expected: "OTP sent successfully!"

# Test 2: Duplicate Email
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser2\",\"email\":\"test1@example.com\",\"password\":\"Test1234\"}"
# Expected: "This email is already used. Please try with another!"

# Test 3: Duplicate Username
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser1\",\"email\":\"test2@example.com\",\"password\":\"Test1234\"}"
# Expected: "This username is already taken. Please choose another!"

# Test 4: Weak Password
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser3\",\"email\":\"test3@example.com\",\"password\":\"weak\"}"
# Expected: "Password must be at least 8 characters..."

# Test 5: Invalid Email
curl -X POST http://localhost:5000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser4\",\"email\":\"not-email\",\"password\":\"Test1234\"}"
# Expected: "Invalid email format."
```

---

## 📝 Summary

**Improved Error Messages:**
✅ "This email is already used. Please try with another!"  
✅ "This username is already taken. Please choose another!"  
✅ Clear, actionable feedback for users  
✅ Better user experience  
✅ Helps users fix issues quickly  

**Security Note:**
- This reveals if email/username exists (trade-off for UX)
- Still secure because:
  - Rate limiting prevents enumeration attacks
  - Account lockout after failed attempts
  - Generic errors for login (security-critical)

---

**All tests ready!** 🚀
