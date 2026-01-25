-- ==========================================
-- COMPLETE STORAGE POLICIES
-- ==========================================
-- Copy each policy definition below into Supabase Dashboard
-- Storage → [Bucket] → Policies → New Policy → For full customization
-- ==========================================

-- -------------------------------------------------------------------------
-- ARTWORKS BUCKET - Policy 1: Public Read
-- -------------------------------------------------------------------------
-- Policy Name: Public can view artworks
-- Allowed operations: SELECT
-- Target roles: public (or anon, authenticated)
-- Definition:

CREATE POLICY "Public can view artworks"
ON storage.objects FOR SELECT
USING ( bucket_id = 'artworks' );

-- -------------------------------------------------------------------------
-- ARTWORKS BUCKET - Policy 2: Admin CRUD
-- -------------------------------------------------------------------------
-- Policy Name: Admin can manage artworks
-- Allowed operations: INSERT, UPDATE, DELETE
-- Target roles: authenticated
-- Definition:

CREATE POLICY "Admin can manage artworks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artworks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin can update artworks"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'artworks' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'artworks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin can delete artworks"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'artworks' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------------------
-- GALLERY-BANNER-IMAGES BUCKET - Policy 1: Public Read
-- -------------------------------------------------------------------------
-- Policy Name: Public can view banners
-- Allowed operations: SELECT
-- Target roles: public (or anon, authenticated)
-- Definition:

CREATE POLICY "Public can view banners"
ON storage.objects FOR SELECT
USING ( bucket_id = 'gallery-banner-images' );

-- -------------------------------------------------------------------------
-- GALLERY-BANNER-IMAGES BUCKET - Policy 2: Admin CRUD
-- -------------------------------------------------------------------------
-- Policy Name: Admin can manage banners
-- Allowed operations: INSERT, UPDATE, DELETE
-- Target roles: authenticated
-- Definition:

CREATE POLICY "Admin can manage banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-banner-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-banner-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'gallery-banner-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-banner-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- POLICY DEFINITIONS SUMMARY
-- ==========================================
-- 
-- ARTWORKS:
-- 1. Public Read: bucket_id = 'artworks'
-- 2. Admin Insert: bucket_id = 'artworks' AND folder = uid
-- 3. Admin Update: bucket_id = 'artworks' AND folder = uid
-- 4. Admin Delete: bucket_id = 'artworks' AND folder = uid
--
-- GALLERY-BANNER-IMAGES:
-- 1. Public Read: bucket_id = 'gallery-banner-images'
-- 2. Admin Insert: bucket_id = 'gallery-banner-images' AND folder = uid
-- 3. Admin Update: bucket_id = 'gallery-banner-images' AND folder = uid
-- 4. Admin Delete: bucket_id = 'gallery-banner-images' AND folder = uid
--
-- ==========================================
