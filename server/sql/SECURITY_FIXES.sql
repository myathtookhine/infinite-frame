-- ==========================================
-- SECURITY FIXES FOR SUPABASE WARNINGS
-- ==========================================
-- This script addresses:
-- 1. Function Search Path Mutable warnings
-- 2. RLS Policy Always True warnings
-- Run this in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- PART 1: FIX FUNCTION SEARCH PATH ISSUES
-- ==========================================
-- Adding SET search_path to all functions to prevent
-- search path manipulation attacks

-- Fix: get_current_admin_role function
CREATE OR REPLACE FUNCTION get_current_admin_role()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix: get_current_admin_id function
CREATE OR REPLACE FUNCTION get_current_admin_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix: cleanup_expired_otps function
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM admins 
  WHERE is_verified = FALSE 
    AND otp_expiry IS NOT NULL 
    AND otp_expiry < NOW() - INTERVAL '24 hours';
    
  RAISE NOTICE 'Cleaned up expired unverified accounts';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix: cleanup_failed_logins function
CREATE OR REPLACE FUNCTION cleanup_failed_logins()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts 
  WHERE last_attempt_at < NOW() - INTERVAL '24 hours';
    
  RAISE NOTICE 'Cleaned up old failed login attempts';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix: update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ==========================================
-- PART 2: FIX RLS POLICY ALWAYS TRUE ISSUES
-- ==========================================
-- Replacing overly permissive "Backend full access" policies
-- with proper row-level security based on admin ownership

-- ==========================================
-- 2.1 FIX artwork_attributes TABLE
-- ==========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Backend full access on artwork_attributes" ON artwork_attributes;
DROP POLICY IF EXISTS "Backend authenticated access on artwork_attributes" ON artwork_attributes;

-- Create proper policies
-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_artwork_attributes"
    ON artwork_attributes
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

-- Admin: Can manage only for their own artworks
CREATE POLICY "admin_manage_own_artwork_attributes"
    ON artwork_attributes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM artworks
            WHERE artworks.id = artwork_attributes.artwork_id
            AND artworks.admin_id = get_current_admin_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM artworks
            WHERE artworks.id = artwork_attributes.artwork_id
            AND artworks.admin_id = get_current_admin_id()
        )
    );

-- Public: Read-only for active artworks
CREATE POLICY "public_read_artwork_attributes"
    ON artwork_attributes
    FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM artworks
            WHERE artworks.id = artwork_attributes.artwork_id
            AND artworks.is_active = true
        )
    );

-- ==========================================
-- 2.2 FIX artworks TABLE
-- ==========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Backend full access on artworks" ON artworks;
DROP POLICY IF EXISTS "Backend authenticated access on artworks" ON artworks;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "super_admin_all_access_artworks" ON artworks;
DROP POLICY IF EXISTS "admin_select_own_artworks" ON artworks;
DROP POLICY IF EXISTS "admin_insert_own_artworks" ON artworks;
DROP POLICY IF EXISTS "admin_update_own_artworks" ON artworks;
DROP POLICY IF EXISTS "admin_delete_own_artworks" ON artworks;
DROP POLICY IF EXISTS "public_read_artworks" ON artworks;

-- Create proper policies
CREATE POLICY "super_admin_all_access_artworks"
    ON artworks
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

CREATE POLICY "admin_select_own_artworks"
    ON artworks
    FOR SELECT
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

CREATE POLICY "admin_insert_own_artworks"
    ON artworks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

CREATE POLICY "admin_update_own_artworks"
    ON artworks
    FOR UPDATE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    )
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

CREATE POLICY "admin_delete_own_artworks"
    ON artworks
    FOR DELETE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

CREATE POLICY "public_read_artworks"
    ON artworks
    FOR SELECT
    TO anon
    USING (
        is_active = true
    );

-- ==========================================
-- 2.3 FIX failed_login_attempts TABLE
-- ==========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Backend full access on failed_login_attempts" ON failed_login_attempts;

-- Create service role only policy (backend API handles this table)
-- Since this is purely backend-managed data, we keep it service_role only
CREATE POLICY "service_role_full_access_failed_login_attempts"
    ON failed_login_attempts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- No policies for authenticated or anon users
-- This table should only be accessed through backend API

-- ==========================================
-- 2.4 FIX password_history TABLE
-- ==========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Backend full access on password_history" ON password_history;

-- Create proper policies
-- Super Admin: Can view all password histories
CREATE POLICY "super_admin_read_password_history"
    ON password_history
    FOR SELECT
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    );

-- Admin: Can only view their own password history
CREATE POLICY "admin_read_own_password_history"
    ON password_history
    FOR SELECT
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Service role: Can insert password history (for password change operations)
CREATE POLICY "service_role_insert_password_history"
    ON password_history
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ==========================================
-- 2.5 FIX units TABLE
-- ==========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Backend full access on units" ON units;

-- Create proper policies
-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_units"
    ON units
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

-- All authenticated users: Read-only access to active units
CREATE POLICY "authenticated_read_active_units"
    ON units
    FOR SELECT
    TO authenticated
    USING (
        is_active = true
    );

-- Public: Read-only access to active units
CREATE POLICY "public_read_active_units"
    ON units
    FOR SELECT
    TO anon
    USING (
        is_active = true
    );

-- Service role: Can manage units (for seeding/maintenance)
CREATE POLICY "service_role_manage_units"
    ON units
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the fixes:

-- 1. Check functions have search_path set:
-- SELECT 
--     p.proname as function_name,
--     pg_get_function_identity_arguments(p.oid) as arguments,
--     p.prosecdef as is_security_definer,
--     p.proconfig as config_settings
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname IN (
--     'get_current_admin_role',
--     'get_current_admin_id', 
--     'cleanup_expired_otps',
--     'cleanup_failed_logins',
--     'update_updated_at_column'
-- );

-- 2. Check RLS policies are properly configured:
-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN (
--     'artwork_attributes',
--     'artworks',
--     'failed_login_attempts',
--     'password_history',
--     'units'
-- )
-- ORDER BY tablename, policyname;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Summary of fixes:
-- ✓ Fixed 5 functions with mutable search_path
--   - get_current_admin_role
--   - get_current_admin_id
--   - cleanup_expired_otps
--   - cleanup_failed_logins
--   - update_updated_at_column
--
-- ✓ Fixed 5 tables with RLS Policy Always True
--   - artwork_attributes
--   - artworks
--   - failed_login_attempts
--   - password_history
--   - units
--
-- All policies now properly restrict access based on:
-- - User role (super_admin vs admin)
-- - Data ownership (admin_id)
-- - Active status (is_active)
-- ==========================================
