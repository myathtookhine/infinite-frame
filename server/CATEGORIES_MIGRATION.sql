-- ==========================================
-- CATEGORIES MIGRATION SCRIPT
-- ==========================================
-- This script migrates Category type from attributes table to dedicated categories table
-- Run this AFTER the main DATABASE.SQL has been executed
-- ==========================================

-- Step 1: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(admin_id, name)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_admin_id ON categories(admin_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Step 3: Migrate existing Category data from attributes to categories
INSERT INTO categories (id, admin_id, name, is_active, created_at, updated_at)
SELECT id, admin_id, name, is_active, created_at, updated_at
FROM attributes
WHERE type = 'Category'
ON CONFLICT (admin_id, name) DO NOTHING;

-- Step 4: Delete Category entries from attributes table (BEFORE adding constraint)
DELETE FROM attributes WHERE type = 'Category';

-- Step 5: Add CHECK constraint to attributes table to prevent Category type
ALTER TABLE attributes DROP CONSTRAINT IF EXISTS chk_no_category_type;
ALTER TABLE attributes ADD CONSTRAINT chk_no_category_type 
    CHECK (type != 'Category');

-- Step 6: Add updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policy for backend access
CREATE POLICY "Backend full access on categories" ON categories
    FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Summary:
-- ✓ Created categories table with admin_id
-- ✓ Migrated all Category data from attributes
-- ✓ Added constraint to prevent future Category entries in attributes
-- ✓ Cleaned up old Category records
-- ==========================================
