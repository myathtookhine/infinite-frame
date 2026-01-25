-- ==========================================
-- UNITS MIGRATION SCRIPT
-- ==========================================
-- This script creates the units table for measurement units
-- Run this in Supabase SQL Editor AFTER main DATABASE.SQL
-- ==========================================

-- Step 1: Create units table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    symbol VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_units_is_active ON units(is_active);
CREATE INDEX IF NOT EXISTS idx_units_name ON units(name);

-- Step 3: Add updated_at trigger
CREATE TRIGGER update_units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy for backend access
CREATE POLICY "Backend full access on units" ON units
    FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Seed common measurement units
INSERT INTO units (name, symbol, is_active) VALUES
    ('Centimeter', 'cm', TRUE),
    ('Meter', 'm', TRUE),
    ('Inch', 'in', TRUE),
    ('Foot', 'ft', TRUE),
    ('Millimeter', 'mm', TRUE),
    ('Kilometer', 'km', TRUE),
    ('Yard', 'yd', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Summary:
-- ✓ Created units table
-- ✓ Added indexes for performance
-- ✓ Added updated_at trigger
-- ✓ Enabled RLS with backend access policy
-- ✓ Seeded common measurement units
-- ==========================================
