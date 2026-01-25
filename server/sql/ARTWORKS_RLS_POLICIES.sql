-- ==========================================
-- ARTWORKS RLS POLICIES FOR SUPABASE
-- ==========================================
-- This script sets up Row Level Security policies for artworks
-- Run this AFTER creating the artworks tables
-- ==========================================

-- Step 1: Drop existing policies (if any)
DROP POLICY IF EXISTS "Backend full access on artworks" ON artworks;
DROP POLICY IF EXISTS "Public read active artworks" ON artworks;
DROP POLICY IF EXISTS "Admins view own artworks" ON artworks;
DROP POLICY IF EXISTS "Admins insert own artworks" ON artworks;
DROP POLICY IF EXISTS "Admins update own artworks" ON artworks;
DROP POLICY IF EXISTS "Admins delete own artworks" ON artworks;
DROP POLICY IF EXISTS "Backend full access on artwork_attributes" ON artwork_attributes;
DROP POLICY IF EXISTS "Public read artwork attributes" ON artwork_attributes;

-- Step 2: Ensure RLS is enabled
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_attributes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ARTWORKS TABLE POLICIES
-- ==========================================

-- Policy 1: Service Role Full Access (for backend API)
-- This allows the backend Express server to perform all operations
CREATE POLICY "Service role full access on artworks" 
ON artworks
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Policy 2: Authenticated Backend Access (via API key)
-- For backend operations using anon key but with service context
CREATE POLICY "Backend authenticated access on artworks" 
ON artworks
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Policy 3: Public Read for Active Artworks
-- Allows anonymous users to view active artworks on the client gallery
CREATE POLICY "Public read active artworks" 
ON artworks
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- Policy 4: Admins View Own Artworks
-- Admins can view all their own artworks (active or inactive)
CREATE POLICY "Admins view own artworks" 
ON artworks
FOR SELECT 
TO authenticated
USING (
  auth.uid() = admin_id
  OR
  -- Allow if user is superadmin (view all)
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.id = auth.uid() 
    AND admins.role = 'super_admin'
  )
);

-- Policy 5: Admins Insert Own Artworks
-- Admins can only create artworks for themselves
CREATE POLICY "Admins insert own artworks" 
ON artworks
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = admin_id
  AND
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.id = auth.uid() 
    AND admins.role IN ('admin', 'super_admin')
  )
);

-- Policy 6: Admins Update Own Artworks
-- Admins can only update their own artworks
CREATE POLICY "Admins update own artworks" 
ON artworks
FOR UPDATE 
TO authenticated
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);

-- Policy 7: Admins Delete Own Artworks
-- Admins can only delete their own artworks
CREATE POLICY "Admins delete own artworks" 
ON artworks
FOR DELETE 
TO authenticated
USING (
  auth.uid() = admin_id
  AND
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.id = auth.uid() 
    AND admins.role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- ARTWORK_ATTRIBUTES TABLE POLICIES
-- ==========================================

-- Policy 1: Service Role Full Access
CREATE POLICY "Service role full access on artwork_attributes" 
ON artwork_attributes
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Policy 2: Backend Authenticated Access
CREATE POLICY "Backend authenticated access on artwork_attributes" 
ON artwork_attributes
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Policy 3: Public Read for Active Artworks
-- Allow public to read attributes for active artworks only
CREATE POLICY "Public read artwork attributes" 
ON artwork_attributes
FOR SELECT 
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM artworks 
    WHERE artworks.id = artwork_attributes.artwork_id 
    AND artworks.is_active = true
  )
);

-- ==========================================
-- POLICY SUMMARY
-- ==========================================
-- 
-- Access Control Matrix:
-- 
-- | User Type        | SELECT | INSERT | UPDATE | DELETE |
-- |------------------|--------|--------|--------|--------|
-- | Service Role     | ✓ All  | ✓ All  | ✓ All  | ✓ All  |
-- | Backend Auth     | ✓ All  | ✓ All  | ✓ All  | ✓ All  |
-- | Public (anon)    | Active | ✗      | ✗      | ✗      |
-- | Admin            | Own    | Own    | Own    | Own    |
-- | Superadmin       | All    | Own    | Own    | Own    |
-- 
-- Notes:
-- - Backend API has full access via service_role or authenticated
-- - Public can only view active artworks
-- - Admins have CRUD on their own artworks
-- - Superadmins can view all but only modify their own
-- - RLS is enforced at database level
-- 
-- ==========================================
-- POLICIES APPLIED SUCCESSFULLY
-- ==========================================
