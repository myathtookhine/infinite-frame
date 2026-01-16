# 🔐 JWT Claims & RLS Policies - Detailed Explanation

## 📖 Table of Contents
1. [What is JWT?](#what-is-jwt)
2. [What are JWT Claims?](#what-are-jwt-claims)
3. [How Supabase Auth Uses JWT](#how-supabase-auth-uses-jwt)
4. [The `sub` and `role` Claims](#the-sub-and-role-claims)
5. [Your Current Setup vs RLS Requirements](#your-current-setup-vs-rls-requirements)
6. [Two Approaches to Implement RLS](#two-approaches-to-implement-rls)
7. [Recommended Solution for Your Project](#recommended-solution-for-your-project)

---

## 1. What is JWT?

**JWT (JSON Web Token)** is a **secure, compact, and self-contained** way to transmit information between parties as a JSON object. It's commonly used for **authentication and authorization**.

### Structure of a JWT:
A JWT consists of three parts separated by dots (`.`):

```
header.payload.signature
```

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

When decoded, this reveals:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims):**
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

**Signature:** 
A cryptographic signature that verifies the token hasn't been tampered with.

---

## 2. What are JWT Claims?

**Claims** are the **key-value pairs** stored in the JWT payload. They contain information about:
- **Who the user is** (identity)
- **What permissions they have** (authorization)
- **Token metadata** (expiration, issuer, etc.)

### Types of Claims:

#### **Registered Claims** (Standard/Reserved):
- `iss` (issuer) - Who created the token
- `sub` (subject) - **The user's unique ID** ⭐
- `aud` (audience) - Who the token is intended for
- `exp` (expiration) - When the token expires
- `iat` (issued at) - When the token was created
- `nbf` (not before) - Token is not valid before this time
- `jti` (JWT ID) - Unique identifier for the token

#### **Public Claims** (Custom):
You can add any custom data:
- `role` - User's role (e.g., `super_admin`, `admin`) ⭐
- `email` - User's email
- `permissions` - Array of permissions
- `org_id` - Organization ID
- etc.

---

## 3. How Supabase Auth Uses JWT

When you authenticate with **Supabase Auth** (not your custom Node.js backend), Supabase generates a JWT token that contains claims about the authenticated user.

### Typical Supabase JWT Payload:

```json
{
  "aud": "authenticated",
  "exp": 1705456789,
  "iat": 1705453189,
  "iss": "https://your-project.supabase.co/auth/v1",
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User's UUID
  "email": "admin@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "name": "John Doe"
  },
  "role": "authenticated",  // or custom role like "super_admin"
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1705453189
    }
  ],
  "session_id": "abc123..."
}
```

### Key Points:
- **`sub` (Subject):** Contains the **user's unique UUID** from `auth.users` table
- **`role`:** Can be `authenticated`, `anon`, or **custom roles** like `super_admin`, `admin`
- **`email`:** The user's email address
- **This token is sent with every request** in the `Authorization: Bearer <token>` header

---

## 4. The `sub` and `role` Claims

### `sub` (Subject) - The User's UUID

The `sub` claim **uniquely identifies the user**. In Supabase:
- It's the user's UUID from the `auth.users` table
- Example: `"550e8400-e29b-41d4-a716-446655440000"`

**In RLS policies**, we use `sub` to check:
> "Is this user accessing their own data?"

```sql
-- Check if the current user is accessing their own record
auth.uid() = admin_id
```

The helper function in the RLS script does this:
```sql
CREATE OR REPLACE FUNCTION get_current_admin_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

This function **extracts the UUID from the JWT's `sub` claim**.

---

### `role` - The User's Permission Level

The `role` claim defines **what permissions the user has**.

**Standard Supabase Roles:**
- `anon` - Unauthenticated/Public users
- `authenticated` - Any logged-in user

**Custom Roles (Your Project):**
- `super_admin` - Full access to everything
- `admin` - Limited access to own data only

**In RLS policies**, we use `role` to determine:
> "What level of access does this user have?"

```sql
-- Check if the user is a super admin
get_current_admin_role() = 'super_admin'
```

The helper function extracts this:
```sql
CREATE OR REPLACE FUNCTION get_current_admin_role()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 5. Your Current Setup vs RLS Requirements

### ❌ **Your Current Authentication System**

You're using a **custom Node.js backend** with:
- **No JWT tokens** issued to the client
- **Session-based authentication** (user object stored in localStorage/state)
- **Backend validates credentials** and returns user data
- **All database operations go through your Node.js API**

**Login response:**
```json
{
  "message": "Login successful!",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "admin",
    "slug": "johndoe-gallery"
  }
}
```

**Problem:** 
- No JWT token is sent to the client
- Client-side Supabase requests won't have JWT claims
- RLS policies can't extract `sub` or `role` from non-existent JWT

---

### ✅ **What RLS Expects**

RLS policies expect **every request to Supabase** to include:
1. An `Authorization: Bearer <JWT>` header
2. The JWT must contain:
   - `sub`: User's UUID
   - `role`: User's role (e.g., `super_admin`, `admin`)

**How RLS reads these:**
```sql
-- This reads from the JWT token
current_setting('request.jwt.claims', true)::json->>'sub'
current_setting('request.jwt.claims', true)::json->>'role'
```

---

## 6. Two Approaches to Implement RLS

### **Approach 1: Keep Node.js Backend (Backend-Only RLS)**

Since you're using a **service_role key** on your Node.js backend, you can:

**✅ Keep your current auth system**
**✅ Make all Supabase queries through your backend**
**✅ Backend bypasses RLS** (service_role has full access)
**✅ Implement authorization logic in your Node.js API**

**How it works:**
```
Client → Node.js API → Supabase (service_role) → Database
         ↑
    Authorization happens here
```

**Pros:**
- ✅ No need to change your auth system
- ✅ Backend handles all authorization logic
- ✅ Easier to debug

**Cons:**
- ❌ RLS policies are not used (service_role bypasses them)
- ❌ All queries must go through your backend
- ❌ Can't make direct Supabase queries from client

**Implementation:**
Keep using your current system. RLS is **not enforced** because your backend uses `service_role`.

---

### **Approach 2: Migrate to Supabase Auth (Client-Side RLS)**

Fully adopt **Supabase's authentication system**:

**How it works:**
```
Client → Supabase Auth → JWT Token → Direct Supabase Queries
                         ↑
                    Contains sub + role
```

**Changes Required:**

#### 1. **Replace custom auth with Supabase Auth**
```javascript
// OLD: Your custom Node.js login
const response = await axios.post('/api/auth/login', { username, password });

// NEW: Supabase Auth login
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

#### 2. **Store custom claims in `auth.users` metadata**
```javascript
// During registration, set custom role
const { data, error } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'password123',
  options: {
    data: {
      role: 'admin',  // Custom claim
      username: 'johndoe'
    }
  }
});
```

#### 3. **Create a trigger to sync `auth.users` → `public.admins`**
```sql
-- Automatically copy auth.users → admins table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admins (id, email, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    (NEW.raw_user_meta_data->>'role')::text,
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### 4. **Modify RLS to use Supabase Auth**
```sql
-- Now RLS can read JWT claims
CREATE POLICY "admin_access_own_data"
  ON artworks
  FOR SELECT
  TO authenticated
  USING (
    admin_id = auth.uid()  -- auth.uid() reads from JWT's "sub"
  );
```

**Pros:**
- ✅ RLS policies are enforced
- ✅ Direct client-to-Supabase queries (faster)
- ✅ Supabase handles auth complexity

**Cons:**
- ❌ Requires major refactoring
- ❌ Must migrate all auth logic to Supabase
- ❌ Lose custom OTP system

---

## 7. Recommended Solution for Your Project

### **🎯 Stick with Approach 1 (Backend-Only)**

**Why?**
1. ✅ You've already built a robust Node.js auth system
2. ✅ Custom OTP verification via Resend SMTP
3. ✅ Advanced security features (rate limiting, account lockout)
4. ✅ No need for complex migration

**What to do with the RLS script?**

The RLS policies in `RLS_POLICIES_MIGRATION.sql` **will not be enforced** because:
- Your backend uses `service_role` key (bypasses RLS)
- Client never directly queries Supabase

**However**, you should still run the script because:
1. **Defense in depth** - If service_role key is ever leaked, RLS provides a backup
2. **Future-proofing** - If you ever add direct client queries
3. **Public access** - The `anon` policies enable public read access for your gallery

**Add your current user data to JWT (optional but recommended):**

Modify your login to include a simple JWT for client-side state:

```javascript
// Install jsonwebtoken
npm install jsonwebtoken

// In routes/auth.js - login endpoint
const jwt = require('jsonwebtoken');

// After successful login
const token = jwt.sign(
  {
    sub: user.id,              // User's UUID
    role: user.role,           // 'super_admin' or 'admin'
    email: user.email,
    username: user.username
  },
  process.env.JWT_SECRET,      // Add to .env
  { expiresIn: '7d' }
);

res.json({
  message: "Login successful!",
  token: token,  // Send JWT to client
  user: { ... }
});
```

Then on subsequent requests, verify the token:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Now you can access req.user.role, req.user.sub
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = verifyToken;
```

---

## 🎯 Summary

| Aspect | Your Current System | What RLS Expects |
|--------|-------------------|------------------|
| **Auth Provider** | Custom Node.js | Supabase Auth |
| **Token Format** | User object in response | JWT with claims |
| **Database Access** | Backend with service_role | Client with JWT |
| **Authorization** | Node.js API logic | RLS policies |
| **`sub` claim** | ❌ Not used | ✅ User's UUID from JWT |
| **`role` claim** | ❌ Not used | ✅ User's role from JWT |

**Recommendation:** 
- ✅ Keep your current auth system
- ✅ Run the RLS script for defense-in-depth
- ✅ Optionally add JWT tokens for client-side validation
- ✅ Backend authorization in Node.js API
- ✅ RLS as a safety net

---

## 📚 Additional Resources

- [JWT.io - Introduction to JWT](https://jwt.io/introduction)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Created:** 2026-01-17  
**Project:** Infinite Frame  
**Author:** Antigravity AI
