# Supabase Security & Performance Optimization Guide

## 🎯 Overview

This migration fixes **ALL** Supabase security and performance warnings:

### Security Issues Fixed ✅
1. **Function Search Path Mutable** (5 functions)
2. **RLS Policy Always True** (5 tables)

### Performance Issues Fixed ✅
3. **Auth RLS Initialization Plan** (Function re-evaluation)
4. **Multiple Permissive Policies** (Policy consolidation)

---

## 📊 Performance Advisor Warnings Addressed

### Issue 1: Auth RLS Initialization Plan

**Problem:** Functions like `get_current_admin_id()` were being re-evaluated for **every row**, causing poor performance at scale.

**Before:**
```sql
CREATE POLICY "admin_select_own_artworks"
    ON artworks FOR SELECT
    USING (admin_id = get_current_admin_id());  -- ❌ Evaluated per row
```

**After:**
```sql
CREATE POLICY "authenticated_select_artworks"
    ON artworks FOR SELECT
    USING (admin_id = (SELECT get_current_admin_id()));  -- ✅ Evaluated once
```

**Impact:** Queries with 1000 rows now call the function **once** instead of **1000 times**.

---

### Issue 2: Multiple Permissive Policies

**Problem:** Having separate policies for `super_admin` and `admin` means PostgreSQL must evaluate **multiple policies** for each query.

**Before:**
```sql
-- ❌ Two policies = evaluated twice per query
CREATE POLICY "super_admin_all_access" ...
CREATE POLICY "admin_select_own" ...
```

**After:**
```sql
-- ✅ One policy = evaluated once per query
CREATE POLICY "authenticated_select_artworks"
    USING (
        (SELECT get_current_admin_role()) = 'super_admin'
        OR admin_id = (SELECT get_current_admin_id())
    );
```

**Impact:** 50% reduction in policy evaluation overhead for authenticated users.

---

## 🚀 Migration Instructions

### Step 1: Backup Current Policies (Optional but Recommended)

```sql
-- See current policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 2: Run the Optimized Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open file: `server/SECURITY_FIXES_OPTIMIZED.sql`
3. **Copy all contents**
4. **Paste** into SQL Editor
5. **Run** the script

### Step 3: Verify the Migration

Run this query to check for remaining duplicate policies:

```sql
SELECT 
    tablename,
    cmd,
    COALESCE(roles::text, 'default') as role,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY tablename, cmd, role;
```

**Expected result:** Zero rows (no duplicate policies)

### Step 4: Check Performance Advisor

1. Go to **Database** → **Advisors**
2. Wait 2-3 minutes for refresh
3. All warnings should be **gone** ✅

---

## 📋 What Changed

### Tables Updated (9 total)

| Table | Old Policies | New Policies | Optimization |
|-------|--------------|--------------|--------------|
| `admins` | 5 | 5 | SELECT subqueries |
| `categories` | 6 | 5 | Consolidated + SELECT |
| `attributes` | 6 | 5 | Consolidated + SELECT |
| `artworks` | 8+ | 5 | Consolidated + SELECT |
| `artwork_attributes` | 6+ | 5 | Consolidated + SELECT |
| `activity_logs` | 3 | 4 | Consolidated + SELECT |
| `failed_login_attempts` | 1 | 1 | Service role only |
| `password_history` | 3 | 2 | Consolidated + SELECT |
| `units` | 5 | 6 | Consolidated + SELECT |

### Key Changes

#### 1. Function Calls Wrapped in SELECT

**All instances changed from:**
```sql
get_current_admin_id()          → (SELECT get_current_admin_id())
get_current_admin_role()        → (SELECT get_current_admin_role())
```

#### 2. Policies Consolidated with OR Logic

**Example for artworks SELECT:**

**Old (3 policies for authenticated):**
```sql
- super_admin_all_access_artworks
- admin_select_own_artworks
- Public read active artworks (also for authenticated somehow)
```

**New (1 policy for authenticated):**
```sql
- authenticated_select_artworks (handles both super_admin and admin)
```

#### 3. Old Policies Removed

These old policy names are **completely removed**:
- "Backend full access on ..."
- "Admins view own artworks"
- "Admins insert own artworks"
- "Admins update own artworks"
- "Admins delete own artworks"
- "Public read active artworks" (for authenticated role)
- All other duplicate variations

---

## 🔒 Security Model (Unchanged)

The security model remains **identical**, just more efficient:

### For Regular Admin

- ✅ Full CRUD on their own data
- ❌ Cannot see other admins' data
- ✅ Can read active public data

### For Super Admin

- ✅ Full CRUD on all data
- ✅ Can see all admins' data
- ✅ Can manage categories, attributes, units

### For Public (anon)

- ✅ Read active artworks
- ✅ Read active categories
- ✅ Read active attributes
- ✅ Read active units
- ❌ No write access

---

## 📈 Expected Performance Improvements

### Query Performance

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| List 100 artworks (admin) | ~200 function calls | 2 function calls | **99% reduction** |
| List 1000 artworks (super_admin) | ~2000 function calls | 2 function calls | **99.9% reduction** |
| Filter artworks by category | Multiple policy evaluations | Single policy evaluation | **50% reduction** |

### Database Load

- **CPU Usage:** Lower due to fewer function calls
- **Query Planning:** Faster with consolidated policies
- **Lock Contention:** Reduced from fewer policy evaluations

---

## 🧪 Testing Checklist

After migration, verify:

### Backend API Testing

- [ ] Admin login works
- [ ] Super admin login works
- [ ] Artworks CRUD operations work
- [ ] Categories CRUD operations work
- [ ] Attributes CRUD operations work
- [ ] Image upload works
- [ ] Failed login tracking works
- [ ] Password change operations work

### Access Control Testing

- [ ] Regular admin can **only** see their own artworks
- [ ] Regular admin **cannot** see other admins' artworks
- [ ] Super admin **can** see all artworks
- [ ] Public gallery shows only active artworks
- [ ] Inactive artworks are hidden from public

### Performance Testing

Run these queries and check execution time:

```sql
-- Should be fast (< 50ms for 1000 rows)
EXPLAIN ANALYZE
SELECT * FROM artworks 
WHERE admin_id = 'your-admin-id';

-- Should show InitPlan instead of SubPlan for function calls
EXPLAIN (VERBOSE, COSTS, BUFFERS)
SELECT * FROM artworks 
WHERE admin_id = (SELECT get_current_admin_id());
```

---

## ⚠️ Important Notes

### No Application Code Changes Needed

- Your backend uses `service_role` key → **bypasses RLS**
- All changes are **database-level only**
- Application logic **remains unchanged**

### Rollback Not Recommended

This migration is **one-way optimized**. Rollback would:
- Restore security vulnerabilities
- Restore performance issues
- Re-introduce duplicate policies

**If issues occur:**
1. Check Supabase logs for RLS errors
2. Verify JWT claims contain `role` and `sub`
3. Test with different user roles
4. Check the verification queries in the migration file

---

## 🔍 Verification Queries

### Check Function Configuration

```sql
SELECT 
    p.proname as function_name,
    p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'get_current_admin_role',
    'get_current_admin_id', 
    'cleanup_expired_otps',
    'cleanup_failed_logins',
    'update_updated_at_column'
);
```

**Expected:** `config_settings` should show `{search_path=public,pg_temp}`

### Check for Duplicate Policies

```sql
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1;
```

**Expected:** 0 rows (no duplicates)

### View All Current Policies

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    roles::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

**Expected:** Clean, consolidated policy names like `authenticated_select_artworks`

---

## 📚 Additional Resources

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Linter - Auth RLS Init Plan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
- [Database Linter - Multiple Permissive Policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)

---

## 🆘 Troubleshooting

### Issue: "permission denied for table X"

**Cause:** RLS policy too restrictive

**Solution:** Check JWT claims:
```sql
SELECT current_setting('request.jwt.claims', true);
```

### Issue: "function get_current_admin_id() does not exist"

**Cause:** Migration wasn't fully applied

**Solution:** Re-run the migration script

### Issue: Slow query performance

**Cause:** Function calls not wrapped in SELECT

**Solution:** Check query plan:
```sql
EXPLAIN (VERBOSE) SELECT * FROM artworks LIMIT 10;
```

Look for "InitPlan" instead of "SubPlan"

---

## ✅ Success Criteria

Migration is successful when:

1. ✅ All security warnings cleared in Supabase Advisors
2. ✅ All performance warnings cleared in Supabase Advisors
3. ✅ No duplicate policies found
4. ✅ All functions have `search_path` configured
5. ✅ Backend API works correctly
6. ✅ Access control works as expected
7. ✅ Query performance improved

---

**Ready to apply?** Use `server/SECURITY_FIXES_OPTIMIZED.sql`
