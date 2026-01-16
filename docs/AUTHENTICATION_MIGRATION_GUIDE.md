# Route Protection: Current vs JWT Approach

## 📋 Overview

This document compares your current custom authentication middleware with the new JWT middleware, showing how to optionally migrate routes to use JWT.

---

## 🔍 Current Approach (Working Fine)

### **Current Middleware (categories.js):**

```javascript
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
```

**How it works:**
- Frontend sends `x-admin-id` header
- Backend queries database to verify user exists
- Attaches user to `req.user`

**Pros:**
- ✅ Simple and straightforward
- ✅ Direct database lookup
- ✅ Already working

**Cons:**
- ❌ Frontend can send any admin ID (security risk)
- ❌ Database query on every request (performance)
- ❌ No token expiration
- ❌ Trust based on header value

---

## 🔐 JWT Approach (More Secure)

### **New Middleware (middleware/auth.js):**

```javascript
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);
```

**How it works:**
- Frontend sends JWT in `Authorization: Bearer <token>` header
- Backend verifies token cryptographically (no DB query!)
- Token contains user data (id, role, email, username)
- Attaches decoded data to `req.user`

**Pros:**
- ✅ Cryptographically secure (can't be forged)
- ✅ No database query needed (faster)
- ✅ Automatic expiration (7 days)
- ✅ Industry standard

**Cons:**
- ⚠️ Requires updating frontend code
- ⚠️ User data in token (not real-time from DB)

---

## 📊 Side-by-Side Comparison

| Aspect | Current (`getUserContext`) | JWT (`verifyToken`) |
|--------|---------------------------|---------------------|
| **Security** | ❌ Can be spoofed | ✅ Cryptographically secure |
| **Performance** | ❌ DB query every request | ✅ No DB query (in-memory) |
| **Expiration** | ❌ Never expires | ✅ 7 days (configurable) |
| **Header** | `x-admin-id: uuid` | `Authorization: Bearer token` |
| **Validation** | DB lookup | Signature verification |
| **User Data** | `req.user.id`, `req.user.role` | `req.user.sub`, `req.user.role` |

---

## 🔄 Migration Example

### **Option 1: Keep Current System (No Changes Needed)**

Your current system works! No need to change if you're happy with it.

**Frontend:**
```javascript
// Current approach - still works fine
const response = await axios.get('/api/categories', {
  headers: {
    'x-admin-id': user.id
  }
});
```

**Backend:**
```javascript
// Keep using your custom middleware
router.use(getUserContext);
```

---

### **Option 2: Migrate to JWT (Recommended for Production)**

#### **Backend Changes:**

**Before (Current):**
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Custom middleware
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

// Routes use req.user.id and req.user.role
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  // ...
});
```

**After (JWT):**
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// JWT middleware
router.use(verifyToken);

// Routes use req.user.sub (instead of req.user.id) and req.user.role
router.get('/', async (req, res) => {
  const userId = req.user.sub;  // ← Changed from req.user.id
  const userRole = req.user.role; // ← Same
  // ...
});
```

**Key Differences:**
- Remove `getUserContext` function
- Add `const { verifyToken } = require('../middleware/auth');`
- Replace `router.use(getUserContext);` with `router.use(verifyToken);`
- Change `req.user.id` to `req.user.sub` in route handlers

#### **Frontend Changes:**

**Before (Current):**
```javascript
const response = await axios.get('/api/categories', {
  headers: {
    'x-admin-id': user.id
  }
});
```

**After (JWT):**
```javascript
// Option A: Use axios interceptor (automatic)
import apiClient from '../utils/axios';
const response = await apiClient.get('/categories');
// Token automatically attached!

// Option B: Manual token
const token = localStorage.getItem('adminToken');
const response = await axios.get('/api/categories', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

### **Option 3: Hybrid Approach (Support Both)**

Support both authentication methods during migration:

```javascript
const { verifyToken } = require('../middleware/auth');

// Try JWT first, fallback to custom
const authenticateRequest = async (req, res, next) => {
  // Check if JWT token exists
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT authentication
    return verifyToken(req, res, next);
  }
  
  // Fallback to custom authentication
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userResult = await pool.query("SELECT id, role FROM admins WHERE id = $1", [adminId]);
    if (userResult.rows.length === 0) return res.status(401).json({ message: "User not found" });
    
    // For compatibility with JWT structure
    req.user = {
      sub: userResult.rows[0].id,
      role: userResult.rows[0].role
    };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

router.use(authenticateRequest);
```

This allows you to migrate gradually without breaking existing code.

---

## 🎯 Recommendation

### **For Your Project:**

**Keep your current system** (`getUserContext`) if:
- ✅ You're comfortable with it
- ✅ It's working fine
- ✅ Security is handled at network level (VPN, etc.)

**Migrate to JWT** if:
- ✅ You want production-grade security
- ✅ You want better performance (no DB queries)
- ✅ You want automatic token expiration
- ✅ You want industry-standard authentication

---

## 🚀 What to Do Now

### **Immediate (No Changes Required):**

Your project will continue working as-is. The JWT implementation is **optional** and **ready when you need it**.

### **Optional Migration (If/When Ready):**

1. **Choose one route file to migrate first** (e.g., `categories.js`)
2. **Update backend:** Replace `getUserContext` with `verifyToken`
3. **Update frontend:** Use `apiClient` instead of `axios`
4. **Test thoroughly**
5. **Repeat for other routes**

---

## 📝 Quick Reference

### **Current System:**

```javascript
// Backend
const adminId = req.headers['x-admin-id'];
req.user.id    // User's UUID
req.user.role  // User's role

// Frontend
headers: {
  'x-admin-id': user.id
}
```

### **JWT System:**

```javascript
// Backend
const { verifyToken } = require('../middleware/auth');
router.use(verifyToken);
req.user.sub      // User's UUID
req.user.role     // User's role
req.user.email    // User's email
req.user.username // Username

// Frontend
import apiClient from '../utils/axios';
await apiClient.get('/endpoint');
// Or manually:
headers: {
  Authorization: `Bearer ${token}`
}
```

---

## ✅ Summary

- **Current system works fine** - no need to change immediately
- **JWT is available** when you're ready to upgrade
- **Hybrid approach** allows gradual migration
- **JWT provides** better security, performance, and expiration
- **Your choice** based on project needs!

---

**Created:** 2026-01-17  
**Project:** Infinite Frame  
**Status:** Both approaches supported
