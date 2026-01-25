-- ==========================================
-- INFINITE FRAME - RLS POLICIES MIGRATION
-- ==========================================
-- Run this in Supabase SQL Editor
-- This script implements Row Level Security policies for:
-- - super_admin: Full access to all tables
-- - admin: CRUD access only to their own data
-- - anon/public: Read-only access to public data
-- ==========================================

-- ==========================================
-- 0. CREATE activity_logs TABLE (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ==========================================
-- 1. DROP EXISTING RLS POLICIES
-- ==========================================
-- This ensures a clean slate for new policies

-- Drop existing backend policies (these are the only ones that exist currently)
DROP POLICY IF EXISTS "Backend full access on admins" ON admins;
DROP POLICY IF EXISTS "Backend full access on attributes" ON attributes;
DROP POLICY IF EXISTS "Backend full access on categories" ON categories;
DROP POLICY IF EXISTS "Backend full access on artworks" ON artworks;
DROP POLICY IF EXISTS "Backend full access on artwork_attributes" ON artwork_attributes;


-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. HELPER FUNCTION: Get current admin role and ID
-- ==========================================
-- This function checks the JWT claims to get admin role and ID
CREATE OR REPLACE FUNCTION get_current_admin_role()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')::text;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_admin_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- 4. RLS POLICIES FOR "admins" TABLE
-- ==========================================

-- Super Admin: Full access to all admin records
CREATE POLICY "super_admin_all_access_admins"
    ON admins
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

-- Admin: Can read and update only their own record
CREATE POLICY "admin_read_own_admins"
    ON admins
    FOR SELECT
    TO authenticated
    USING (
        id = get_current_admin_id()
    );

CREATE POLICY "admin_update_own_admins"
    ON admins
    FOR UPDATE
    TO authenticated
    USING (
        id = get_current_admin_id()
    )
    WITH CHECK (
        id = get_current_admin_id()
    );

-- Public: Can read only basic public fields (for gallery display)
-- Note: You may want to create a view for this instead to limit columns
CREATE POLICY "public_read_admins"
    ON admins
    FOR SELECT
    TO anon
    USING (
        status = 'active' AND is_verified = true
    );

-- ==========================================
-- 5. RLS POLICIES FOR "categories" TABLE
-- ==========================================

-- Super Admin: Full access to all categories
CREATE POLICY "super_admin_all_access_categories"
    ON categories
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

-- Admin: SELECT only their own categories
CREATE POLICY "admin_select_own_categories"
    ON categories
    FOR SELECT
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Admin: INSERT only with their own admin_id
CREATE POLICY "admin_insert_own_categories"
    ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

-- Admin: UPDATE only their own categories
CREATE POLICY "admin_update_own_categories"
    ON categories
    FOR UPDATE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    )
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

-- Admin: DELETE only their own categories
CREATE POLICY "admin_delete_own_categories"
    ON categories
    FOR DELETE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Public: Can read all active categories
CREATE POLICY "public_read_categories"
    ON categories
    FOR SELECT
    TO anon
    USING (
        is_active = true
    );

-- ==========================================
-- 6. RLS POLICIES FOR "attributes" TABLE
-- ==========================================

-- Super Admin: Full access to all attributes
CREATE POLICY "super_admin_all_access_attributes"
    ON attributes
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

-- Admin: SELECT only their own attributes
CREATE POLICY "admin_select_own_attributes"
    ON attributes
    FOR SELECT
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Admin: INSERT only with their own admin_id
CREATE POLICY "admin_insert_own_attributes"
    ON attributes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

-- Admin: UPDATE only their own attributes
CREATE POLICY "admin_update_own_attributes"
    ON attributes
    FOR UPDATE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    )
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

-- Admin: DELETE only their own attributes
CREATE POLICY "admin_delete_own_attributes"
    ON attributes
    FOR DELETE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Public: Can read all active attributes
CREATE POLICY "public_read_attributes"
    ON attributes
    FOR SELECT
    TO anon
    USING (
        is_active = true
    );

-- ==========================================
-- 7. RLS POLICIES FOR "artworks" TABLE
-- ==========================================

-- Super Admin: Full access to all artworks
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

-- Admin: SELECT only their own artworks
CREATE POLICY "admin_select_own_artworks"
    ON artworks
    FOR SELECT
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Admin: INSERT only with their own admin_id
CREATE POLICY "admin_insert_own_artworks"
    ON artworks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

-- Admin: UPDATE only their own artworks
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

-- Admin: DELETE only their own artworks
CREATE POLICY "admin_delete_own_artworks"
    ON artworks
    FOR DELETE
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Public: Can read all active artworks
CREATE POLICY "public_read_artworks"
    ON artworks
    FOR SELECT
    TO anon
    USING (
        is_active = true
    );

-- ==========================================
-- 8. RLS POLICIES FOR "artwork_attributes" TABLE
-- ==========================================

-- Super Admin: Full access to all artwork_attributes
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

-- Admin: Can manage artwork_attributes only for their own artworks
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

-- Public: Can read artwork_attributes for active artworks
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
-- 9. RLS POLICIES FOR "activity_logs" TABLE
-- ==========================================

-- Super Admin: Full access to all activity logs
CREATE POLICY "super_admin_all_access_activity_logs"
    ON activity_logs
    FOR ALL
    TO authenticated
    USING (
        get_current_admin_role() = 'super_admin'
    )
    WITH CHECK (
        get_current_admin_role() = 'super_admin'
    );

-- Admin: Can only read their own activity logs
CREATE POLICY "admin_read_own_activity_logs"
    ON activity_logs
    FOR SELECT
    TO authenticated
    USING (
        admin_id = get_current_admin_id()
    );

-- Admin: Can insert their own activity logs
CREATE POLICY "admin_insert_own_activity_logs"
    ON activity_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        admin_id = get_current_admin_id()
    );

-- ==========================================
-- 10. GRANT PERMISSIONS
-- ==========================================
-- Grant necessary permissions for authenticated and anon users

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON admins TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON attributes TO anon;
GRANT SELECT ON artworks TO anon;
GRANT SELECT ON artwork_attributes TO anon;

GRANT ALL ON admins TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON attributes TO authenticated;
GRANT ALL ON artworks TO authenticated;
GRANT ALL ON artwork_attributes TO authenticated;
GRANT ALL ON activity_logs TO authenticated;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Verify RLS is enabled by running:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- Test policies by running queries with different roles:
-- SET request.jwt.claims = '{"sub": "your-admin-id", "role": "admin"}';
-- SELECT * FROM artworks; -- Should only see own artworks
-- ==========================================
