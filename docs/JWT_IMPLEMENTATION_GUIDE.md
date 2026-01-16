# JWT Authentication Implementation Guide

## 📋 Overview

JWT (JSON Web Token) authentication has been successfully implemented in the Infinite Frame project. This provides secure, stateless authentication with automatic token management.

---

## 🔧 What Changed

### **Backend (server/)**

1. **New Package:** `jsonwebtoken` installed
2. **New File:** `middleware/auth.js` - JWT verification middleware
3. **Updated:** `routes/auth.js` - Login endpoint now generates JWT tokens
4. **Updated:** `.env` - Added `JWT_SECRET` and `JWT_EXPIRES_IN`

### **Frontend (admin/)**

1. **New File:** `utils/axios.js` - Axios client with JWT interceptors
2. **Updated:** `context/AuthContext.jsx` - Now stores real JWT tokens

---

## 🚀 How to Use

### **Option 1: Use Axios Interceptor (Recommended for New Code)**

Import the configured axios client instead of regular axios:

```javascript
// ❌ OLD WAY (Don't use for authenticated requests)
import axios from 'axios';

// ✅ NEW WAY (Automatically includes JWT token)
import apiClient from '../utils/axios';

// Example usage
const fetchData = async () => {
  try {
    // Token is automatically attached to Authorization header
    const response = await apiClient.get('/your-endpoint');
    console.log(response.data);
  } catch (error) {
    // 401 errors automatically redirect to login
    console.error(error);
  }
};
```

### **Option 2: Keep Using Regular Axios (Existing Code)**

Your existing code will continue to work! The AuthContext already handles token storage:

```javascript
import axios from 'axios';

const fetchData = async () => {
  const token = localStorage.getItem('adminToken');
  
  const response = await axios.get('http://localhost:5000/api/your-endpoint', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
```

---

## 🔒 Backend Route Protection

### **Protect All Routes in a File:**

```javascript
// Example: server/routes/artworks.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireSuperAdmin } = require('../middleware/auth');

// Protect ALL routes in this file
router.use(verifyToken);

// Now all routes below require valid JWT token
router.get('/', async (req, res) => {
  // Access user data from token
  const userId = req.user.sub;
  const userRole = req.user.role;
  
  // Your logic here...
});

module.exports = router;
```

### **Protect Individual Routes:**

```javascript
// Example: Only protect specific routes
router.get('/public-data', (req, res) => {
  // No authentication required
});

router.get('/protected-data', verifyToken, (req, res) => {
  // Requires valid JWT token
  const userId = req.user.sub;
});

router.delete('/admin-only', verifyToken, requireSuperAdmin, (req, res) => {
  // Requires super_admin role
});
```

### **Check Ownership:**

```javascript
const { verifyToken, requireOwnership } = require('../middleware/auth');

// User can only access their own artworks
router.get('/:adminId/artworks', verifyToken, requireOwnership, (req, res) => {
  // req.params.adminId must match req.user.sub
  // Super admins bypass this check
});
```

---

## 📦 What's in the JWT Token

When decoded, the JWT contains:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User's UUID
  "role": "admin",                                  // User's role
  "email": "user@example.com",                      // User's email
  "username": "johndoe",                            // Username
  "iat": 1705453189,                                // Issued at (timestamp)
  "exp": 1706062989                                 // Expires at (timestamp)
}
```

**Access in Backend:**
```javascript
router.get('/my-data', verifyToken, (req, res) => {
  const userId = req.user.sub;
  const userRole = req.user.role;
  const userEmail = req.user.email;
  const username = req.user.username;
  
  // Use these values...
});
```

---

## ⏰ Token Expiration

- **Default:** Tokens expire after **7 days**
- **Configured in:** `server/.env` → `JWT_EXPIRES_IN=7d`
- **What happens:** Axios interceptor automatically redirects to login page

**To change expiration:**
```env
# .env file
JWT_EXPIRES_IN=1d   # 1 day
JWT_EXPIRES_IN=12h  # 12 hours
JWT_EXPIRES_IN=30d  # 30 days
```

---

## 🧪 Testing JWT

### **1. Test Login Flow:**

```javascript
// Login with credentials
const response = await axios.post('http://localhost:5000/api/login', {
  username: 'testuser',
  password: 'password123'
});

console.log(response.data);
// {
//   message: "Login successful!",
//   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   user: { ... }
// }
```

### **2. Decode JWT (for testing):**

Visit [jwt.io](https://jwt.io) and paste your token to see its contents.

### **3. Test Protected Route:**

```javascript
const token = localStorage.getItem('adminToken');

// With token
const response = await axios.get('http://localhost:5000/api/protected-route', {
  headers: { Authorization: `Bearer ${token}` }
});

// Without token (will get 401 error)
const response = await axios.get('http://localhost:5000/api/protected-route');
```

---

## 🔐 Security Best Practices

### **1. Never Expose JWT_SECRET**

```env
# ✅ GOOD - Strong, random secret
JWT_SECRET=8f3k9s0d8f0s9duf09sd8f0s9d8f0s9d8fsd

# ❌ BAD - Weak secret
JWT_SECRET=123456
```

### **2. Use HTTPS in Production**

JWTs should only be transmitted over HTTPS to prevent interception.

### **3. Store Tokens Securely**

Currently using `localStorage`. Consider `httpOnly` cookies for enhanced security in future.

### **4. Validate Tokens on Every Request**

Always use `verifyToken` middleware on protected routes.

---

## 🐛 Troubleshooting

### **"Invalid or expired token" Error**

**Causes:**
1. Token expired (after 7 days)
2. JWT_SECRET changed
3. Token manually modified

**Solution:**
- Clear localStorage and login again
- Check `.env` file has correct `JWT_SECRET`

### **"Access denied. No token provided" Error**

**Causes:**
1. Token not sent in request
2. Using regular axios instead of apiClient

**Solution:**
```javascript
// Option 1: Use apiClient
import apiClient from '../utils/axios';
await apiClient.get('/endpoint');

// Option 2: Manually add token
const token = localStorage.getItem('adminToken');
await axios.get('/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **Token Not Refreshing After Login**

**Solution:**
- Hard refresh browser (Ctrl + Shift + R)
- Clear localStorage manually
- Check Network tab to verify token in response

---

## 📝 Migration Checklist

If you want to migrate existing code to use JWT properly:

- [ ] Replace `axios` imports with `apiClient` in components
- [ ] Add `verifyToken` middleware to backend routes
- [ ] Test all authenticated endpoints
- [ ] Update API documentation
- [ ] Test token expiration flow
- [ ] Add refresh token logic (optional, future improvement)

---

## 🎯 Next Steps (Optional Enhancements)

1. **Refresh Tokens:** Implement refresh tokens for better UX
2. **Token Blacklist:** Add token revocation on logout
3. **Role-based UI:** Hide features based on user role
4. **Activity Logging:** Log all JWT-authenticated actions
5. **Rate Limiting:** Add rate limiting per user (using JWT claims)

---

**Created:** 2026-01-17  
**Project:** Infinite Frame  
**Version:** 1.0
